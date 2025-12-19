<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import Card from '$lib/components/common/Card.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import Accordion from '$lib/components/common/Accordion.svelte';
	import TeamDisplay from '$lib/components/challenge/TeamDisplay.svelte';
	import BossNavigation from '$lib/components/challenge/BossNavigation.svelte';
	import { challengeStore } from '$lib/stores/challenge';
	import { historyStore } from '$lib/stores/history';
	import {
		hasAnimationPlayed,
		markAnimationPlayed,
		resetAnimationState
	} from '$lib/stores/animation';
	import { RandomizerService } from '$lib/services/randomizer';
	import type {
		ChallengeRunState,
		TeamMember,
		DigivolutionCheckpoint,
		BossGroup,
		BossTeamSnapshot
	} from '$lib/types/challenge';
	import type { Digimon, EvolutionGeneration } from '$lib/types/digimon';
	import { filterDigimonByContent } from '$lib/utils/digimon-filters';
	import { i18n } from '$lib/i18n';

	let { data }: { data: PageData } = $props();

	let challengeState = $state<ChallengeRunState | null>(null);
	let isLoadingState = $state(true);
	let seedInput = $state('');
	let randomizer = new RandomizerService();
	let unsubscribe: (() => void) | undefined;
	let historyUnsubscribe: (() => void) | undefined;

	// Animation state - track pending reveals for new teams
	let pendingTeamReveal = $state(false);
	let animationPlayedForCurrentBoss = $state(true);

	// Digivolution pool settings
	let onlyHighestGeneration = $state(true); // Default to only highest generation
	let minGenerationOverride = $state<EvolutionGeneration | null>(null);

	// Helper to get checkpoints (supports both old and new field names for backwards compatibility)
	function getCheckpoints(): DigivolutionCheckpoint[] {
		if (!data.challenge) return [];
		return data.challenge.digivolutionCheckpoints || data.challenge.evolutionCheckpoints || [];
	}

	// Helper to get boss groups
	function getBossGroups(): BossGroup[] {
		if (!data.challenge) return [];
		return data.challenge.bossGroups || [];
	}

	// Find the boss group for a given boss order
	function getBossGroupForBoss(bossOrder: number): BossGroup | null {
		const bossGroups = getBossGroups();
		return bossGroups.find((g) => bossOrder >= g.startBoss && bossOrder <= g.endBoss) || null;
	}

	// Content filtering settings
	let includeDLC = $state(true);
	let includePostGame = $state(false);
	let includeNonStandard = $state(true); // Armor and Hybrid digimon
	let includeDLCBosses = $state(false); // DLC bosses (Omnimon Zwart Defeat, etc.)
	let rerollTeamPerBoss = $state(false); // Generate new team for every boss fight (default: only per boss group)
	let isInitializingState = $state(false); // Flag to prevent effect loops during initial load

	// Watch for content filtering setting changes to update challenge state
	$effect(() => {
		if (!isInitializingState && challengeState) {
			const hasChanges =
				challengeState.includeDLC !== includeDLC ||
				challengeState.includePostGame !== includePostGame ||
				challengeState.includeNonStandard !== includeNonStandard ||
				challengeState.includeDLCBosses !== includeDLCBosses ||
				challengeState.rerollTeamPerBoss !== rerollTeamPerBoss;

			if (hasChanges) {
				// Only update if there's an actual change to avoid infinite loops
				challengeStore.update((state) => {
					if (state) {
						return {
							...state,
							includeDLC,
							includePostGame,
							includeNonStandard,
							includeDLCBosses,
							rerollTeamPerBoss,
							updatedAt: new Date().toISOString()
						};
					}
					return state;
				});
				// Update challenge metadata with new boss count
				updateChallengeMetadata();
			}
		}
	});

	// Handle history deletion - if the current run is deleted, navigate back to home
	function handleHistoryDelete(deletedRunId: string) {
		// Check if the deleted run is the current one by comparing with the challenge state seed
		if (challengeState && data.challenge) {
			// The deletedRunId starts with the same format, so check if it's for this challenge and seed
			if (deletedRunId.startsWith(`${data.challenge.id}-${challengeState.seed}`)) {
				// The current run was deleted, navigate to home
				const base = $page.url.pathname.split('/challenge/')[0] || '';
				window.location.href = `${base}/`;
			}
		}
	}

	onMount(() => {
		// Check for seed in URL parameters
		const urlSeed = $page.url.searchParams.get('seed');
		if (urlSeed) {
			seedInput = urlSeed;
		}

		// Load existing challenge state
		if (data.challenge) {
			challengeStore.load(data.challenge.id);
			// Metadata will be updated after state loads to get correct DLC setting
		}

		// Subscribe to store changes
		unsubscribe = challengeStore.subscribe((state) => {
			challengeState = state;
			isLoadingState = false;
			isInitializingState = true; // Prevent effect from updating during load

			// Update all content filtering settings from loaded state
			if (state) {
				includeDLC = state.includeDLC ?? true;
				includePostGame = state.includePostGame ?? false;
				includeNonStandard = state.includeNonStandard ?? true;
				includeDLCBosses = state.includeDLCBosses ?? false;
				rerollTeamPerBoss = state.rerollTeamPerBoss ?? false;
			}

			// Update challenge metadata with correct boss count
			updateChallengeMetadata();

			// If there's a URL seed that differs from the current state seed,
			// try to restore from history first, or start a new challenge
			if (urlSeed && state && state.seed !== urlSeed) {
				// Clear the existing state
				if (data.challenge) {
					challengeStore.clear(data.challenge.id);
				}
				// Will be handled in the next subscription call when state is null
			} else if (urlSeed && !state) {
				// No existing state but we have a URL seed
				// Try to restore from history first
				const historicalRun = historyStore.getRunBySeed(data.challenge?.id || '', urlSeed);
				if (historicalRun && historicalRun.fullState) {
					// Restore the full state from history, ensuring all content filtering fields are set
					const restoredState = {
						...historicalRun.fullState,
						includeDLC: historicalRun.fullState.includeDLC ?? true,
						includePostGame: historicalRun.fullState.includePostGame ?? false,
						includeNonStandard: historicalRun.fullState.includeNonStandard ?? true,
						includeDLCBosses: historicalRun.fullState.includeDLCBosses ?? false,
						rerollTeamPerBoss: historicalRun.fullState.rerollTeamPerBoss ?? false
					};
					challengeStore.save(restoredState);
				} else {
					// No historical run found, start a new challenge
					startNewChallenge();
				}
			} else if (state && state.seed) {
				// Update URL with current seed if state exists and no URL seed conflict
				updateUrlWithSeed(state.seed);
			}

			// Allow effect to run after sync
			isInitializingState = false;
		});

		// Subscribe to history changes to detect if current run was deleted
		historyStore.load();
		historyUnsubscribe = historyStore.subscribe((history) => {
			// Check if the current run still exists in history
			if (challengeState && data.challenge && challengeState.seed) {
				const currentRunExists = history.some(
					(run) => run.challengeId === data.challenge!.id && run.seed === challengeState!.seed
				);
				// If the run was deleted and no state exists, navigate to home
				if (!currentRunExists && !challengeStore.hasExistingState(data.challenge.id)) {
					handleHistoryDelete(`${data.challenge.id}-${challengeState.seed}`);
				}
			}
		});
	});

	onDestroy(() => {
		// Clean up store subscriptions
		if (unsubscribe) {
			unsubscribe();
		}
		if (historyUnsubscribe) {
			historyUnsubscribe();
		}
	});

	// Update URL with seed parameter without causing navigation
	function updateUrlWithSeed(seed: string) {
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.set('seed', seed);
			goto(url.toString(), { replaceState: true, noScroll: true });
		}
	}

	// Copy seed URL to clipboard
	function copySeedUrl() {
		if (!challengeState) return;
		const url = new URL(window.location.href);
		url.searchParams.set('seed', challengeState.seed);
		navigator.clipboard.writeText(url.toString()).then(() => {
			alert('Seed URL copied to clipboard!');
		});
	}

	// Filter out optional content based on user preferences
	function getFilteredDigimon(): Digimon[] {
		if (!data.digimon) return [];
		return filterDigimonByContent(data.digimon as Digimon[], includeDLC, includePostGame);
	}

	// Calculate total boss count based on DLC setting
	function getTotalBossCount(includeDLC: boolean = false) {
		if (!data.bosses) return 1;
		if (includeDLC) {
			// Count all bosses except tutorial boss (order 0)
			return data.bosses.filter((b) => b.order > 0).length;
		} else {
			// Count only required bosses (not optional, and not tutorial)
			return data.bosses.filter((b) => !b.optional && b.order > 0).length;
		}
	}

	// Update challenge metadata with correct boss count
	function updateChallengeMetadata() {
		if (data.challenge) {
			const totalBosses = getTotalBossCount(includeDLCBosses);
			challengeStore.setChallengeMetadata(data.challenge.id, data.challenge.name, totalBosses);
		}
	}

	// Filter out optional bosses for starting position - start at boss-1 by default
	function getStartingBossOrder() {
		if (!data.bosses) return 1;
		const firstRequiredBoss = data.bosses.find((b) => !b.optional);
		return firstRequiredBoss?.order ?? 1;
	}

	function startNewChallenge() {
		if (!data.challenge || !data.digimon) return;

		const mainSeed = seedInput || randomizer.generateSeed();

		// Start at the first required boss (skip optional boss-0)
		const startBoss = getStartingBossOrder();
		const checkpoints = getCheckpoints();
		const initialGeneration = (checkpoints[0]?.unlockedGeneration ||
			'In-Training II') as EvolutionGeneration;

		// Generate initial team for starting boss
		const initialBossSeed = `${mainSeed}-boss-${startBoss}`;
		randomizer.setSeed(initialBossSeed);

		const filteredDigimon = getFilteredDigimon();
		const teamSize = data.challenge.settings.teamSize;

		const initialTeam = randomizer
			.getRandomDigimonMultiGeneration(
				filteredDigimon,
				initialGeneration,
				teamSize,
				[],
				onlyHighestGeneration,
				minGenerationOverride || undefined,
				includeNonStandard,
				startBoss // Pass boss progression
			)
			.map((digimon: Digimon, index: number) => ({
				digimonNumber: digimon.number,
				slotIndex: index,
				rolledAtCheckpoint: startBoss
			}));

		const newState: ChallengeRunState = {
			challengeId: data.challenge.id,
			seed: mainSeed, // Main seed never changes
			currentBossOrder: startBoss,
			currentGeneration: initialGeneration,
			team: initialTeam,
			rerollHistory: [],
			bossTeams: {
				[startBoss]: {
					bossOrder: startBoss,
					generation: initialGeneration,
					team: initialTeam,
					seed: initialBossSeed
				}
			},
			// Store all content filtering settings
			includeDLC,
			includePostGame,
			includeNonStandard,
			includeDLCBosses,
			rerollTeamPerBoss,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		challengeStore.save(newState);
	}

	function navigateToBoss(bossOrder: number) {
		if (!challengeState || !data.challenge || !data.bosses) return;

		// Find the highest unlocked generation for this boss order
		// (get the latest checkpoint that is <= current boss order)
		// Always calculate this first to ensure correct generation even for cached teams
		const checkpoints = getCheckpoints();
		const unlockedCheckpoints = checkpoints
			.filter((cp) => cp.bossOrder <= bossOrder)
			.sort((a, b) => b.bossOrder - a.bossOrder);

		const correctGeneration =
			unlockedCheckpoints.length > 0
				? (unlockedCheckpoints[0].unlockedGeneration as EvolutionGeneration)
				: challengeState.currentGeneration;

		// Determine if we need to generate a new team based on boss groups
		const currentBossGroup = getBossGroupForBoss(bossOrder);
		const previousBossGroup = getBossGroupForBoss(challengeState!.currentBossOrder);

		// Check if we already have a team saved for this boss OR any boss in the same group
		if (challengeState.bossTeams[bossOrder]) {
			// Restore the saved team for this boss, but use the correct generation
			// (in case the cached generation was wrong from before the fix)
			const savedTeam = challengeState.bossTeams[bossOrder];
			challengeStore.update((state) => {
				if (!state) return state;
				return {
					...state,
					currentBossOrder: bossOrder,
					currentGeneration: correctGeneration,
					team: savedTeam.team,
					// Update the cached team's generation to the correct value
					bossTeams: {
						...state.bossTeams,
						[bossOrder]: {
							...savedTeam,
							generation: correctGeneration
						}
					},
					updatedAt: new Date().toISOString()
				};
			});
			return;
		}

		// If not rerolling per boss and we're in the same boss group as a cached boss,
		// reuse the team from that boss group
		if (!rerollTeamPerBoss && currentBossGroup) {
			// Look for any cached team within the same boss group
			for (
				let bossInGroup = currentBossGroup.startBoss;
				bossInGroup <= currentBossGroup.endBoss;
				bossInGroup++
			) {
				if (challengeState.bossTeams[bossInGroup]) {
					const savedTeam = challengeState.bossTeams[bossInGroup];
					// Reuse this team for the current boss
					const reusedTeam: BossTeamSnapshot = {
						bossOrder: bossOrder,
						generation: correctGeneration,
						team: savedTeam.team,
						seed: savedTeam.seed // Use the same seed as the group
					};

					challengeStore.update((state) => {
						if (!state) return state;
						return {
							...state,
							currentBossOrder: bossOrder,
							currentGeneration: correctGeneration,
							team: savedTeam.team,
							bossTeams: {
								...state.bossTeams,
								[bossOrder]: reusedTeam
							},
							updatedAt: new Date().toISOString()
						};
					});
					return;
				}
			}
		}

		// Check if we're entering a new boss group
		// If boss groups are not defined (both null), fall back to always generating new team
		// If one is null but not the other, treat as group change
		// Otherwise compare the group start bosses
		const bossGroupChanged =
			currentBossGroup && previousBossGroup
				? currentBossGroup.startBoss !== previousBossGroup.startBoss
				: true; // No boss groups defined or mismatch - generate new team

		const shouldRerollTeam = rerollTeamPerBoss || bossGroupChanged; // Reroll when entering a new boss group

		const newGeneration = correctGeneration;

		// If not rerolling per boss and still in the same boss group, keep current team
		// but still update the generation to the highest unlocked
		if (!shouldRerollTeam && challengeState.team.length > 0) {
			challengeStore.update((state) => {
				if (!state) return state;
				return {
					...state,
					currentBossOrder: bossOrder,
					currentGeneration: newGeneration,
					updatedAt: new Date().toISOString()
				};
			});
			return;
		}

		// Generate new team for this boss

		// Generate boss-specific seed
		const bossSeed = `${challengeState.seed}-boss-${bossOrder}`;
		randomizer.setSeed(bossSeed);

		const filteredDigimon = getFilteredDigimon();
		const teamSize = data.challenge.settings.teamSize;

		// Get list of digimon already used in other teams of the same generation
		// Always exclude duplicates across teams, regardless of rerollTeamPerBoss setting
		const usedInOtherTeams = Object.values(challengeState.bossTeams)
			.filter((bt) => bt.generation === newGeneration && bt.bossOrder !== bossOrder)
			.flatMap((bt) => bt.team.map((tm) => tm.digimonNumber));

		const newTeamDigimon = randomizer.rerollMultiGeneration(
			filteredDigimon,
			newGeneration,
			teamSize,
			usedInOtherTeams,
			onlyHighestGeneration,
			minGenerationOverride || undefined,
			includeNonStandard,
			bossOrder // Pass boss progression
		);

		// If not enough digimon available with exclusions, retry without exclusions
		const finalTeam =
			newTeamDigimon.length >= teamSize
				? newTeamDigimon
				: randomizer.rerollMultiGeneration(
						filteredDigimon,
						newGeneration,
						teamSize,
						[], // No exclusions - allow duplicates if necessary
						onlyHighestGeneration,
						minGenerationOverride || undefined,
						includeNonStandard,
						bossOrder // Pass boss progression
					);

		const newTeam: TeamMember[] = finalTeam.map((digimon: Digimon, index: number) => ({
			digimonNumber: digimon.number,
			slotIndex: index,
			rolledAtCheckpoint: bossOrder
		}));

		challengeStore.update((state) => {
			if (!state) return state;
			return {
				...state,
				currentBossOrder: bossOrder,
				currentGeneration: newGeneration,
				team: newTeam,
				seed: state.seed, // Main seed never changes
				bossTeams: {
					...state.bossTeams,
					[bossOrder]: {
						bossOrder,
						generation: newGeneration,
						team: newTeam,
						seed: bossSeed
					}
				},
				updatedAt: new Date().toISOString()
			};
		});
	}

	function rerollSlot(slotIndex: number) {
		if (!challengeState || !data.digimon) return;

		const oldDigimonNumber = challengeState.team[slotIndex].digimonNumber;
		const filteredDigimon = getFilteredDigimon();

		// Build exclusion list: include digimon from other teams of the same generation
		// but exclude the digimon being rerolled (so it becomes available again)
		const currentGeneration = challengeState.currentGeneration;
		const usedInGeneration = Object.values(challengeState.bossTeams)
			.filter((bt) => bt.generation === currentGeneration)
			.flatMap((bt) => bt.team.map((tm) => tm.digimonNumber));

		// Remove the old digimon from exclusion list (make it available again)
		// and include all other current team members
		const currentTeamNumbers = challengeState.team.map((m) => m.digimonNumber);
		const exclusionList = [...new Set([...usedInGeneration, ...currentTeamNumbers])].filter(
			(num) => num !== oldDigimonNumber
		);

		// Generate sub-seed for this reroll using deterministic counter
		const rerollCount = challengeState.rerollHistory.length;
		const rerollSeed = `${challengeState.seed}-boss-${challengeState.currentBossOrder}-reroll-${rerollCount}`;
		randomizer.setSeed(rerollSeed);

		let newDigimon = randomizer.rerollSlot(
			filteredDigimon,
			challengeState.currentGeneration,
			exclusionList,
			onlyHighestGeneration,
			minGenerationOverride || undefined,
			includeNonStandard,
			challengeState.currentBossOrder // Pass boss progression
		);

		// If no digimon available with exclusions, retry without exclusions
		if (!newDigimon) {
			// Reset seed for deterministic retry
			randomizer.setSeed(rerollSeed);
			newDigimon = randomizer.rerollSlot(
				filteredDigimon,
				challengeState.currentGeneration,
				currentTeamNumbers.filter((num) => num !== oldDigimonNumber), // Only exclude current team except the slot being rerolled
				onlyHighestGeneration,
				minGenerationOverride || undefined,
				includeNonStandard,
				challengeState.currentBossOrder
			);
		}

		if (!newDigimon) return;

		const newTeam: TeamMember[] = challengeState.team.map((member, index) => {
			if (index === slotIndex) {
				return {
					digimonNumber: newDigimon.number,
					slotIndex: index,
					rolledAtCheckpoint: challengeState!.currentBossOrder
				};
			}
			return member;
		});

		// Record in reroll history
		const rerollEvent = {
			timestamp: new Date().toISOString(),
			checkpoint: challengeState.currentBossOrder,
			previousTeam: [oldDigimonNumber],
			newTeam: [newDigimon.number],
			seed: rerollSeed
		};

		challengeStore.update((state) => {
			if (!state) return state;
			// Update both current team and boss team snapshot
			return {
				...state,
				team: newTeam,
				bossTeams: {
					...state.bossTeams,
					[state.currentBossOrder]: {
						...state.bossTeams[state.currentBossOrder],
						team: newTeam,
						seed: rerollSeed
					}
				},
				rerollHistory: [...state.rerollHistory, rerollEvent],
				updatedAt: new Date().toISOString()
			};
		});
	}

	function rerollAll() {
		if (!challengeState || !data.digimon || !data.challenge) return;

		const previousTeamNumbers = challengeState.team.map((m) => m.digimonNumber);
		const teamSize = data.challenge.settings.teamSize;
		const filteredDigimon = getFilteredDigimon();

		// Build exclusion list: include digimon from other teams of the same generation
		// but exclude the current team (making them available for reroll)
		const currentGeneration = challengeState.currentGeneration;
		const currentBossOrder = challengeState.currentBossOrder;
		const usedInOtherTeams = Object.values(challengeState.bossTeams)
			.filter((bt) => bt.generation === currentGeneration && bt.bossOrder !== currentBossOrder)
			.flatMap((bt) => bt.team.map((tm) => tm.digimonNumber));

		// Generate sub-seed for this reroll using deterministic counter
		const rerollCount = challengeState.rerollHistory.length;
		const rerollSeed = `${challengeState.seed}-boss-${challengeState.currentBossOrder}-rerollall-${rerollCount}`;
		randomizer.setSeed(rerollSeed);

		const newTeamDigimon = randomizer.rerollMultiGeneration(
			filteredDigimon,
			challengeState.currentGeneration,
			teamSize,
			usedInOtherTeams, // Exclude digimon used in other teams
			onlyHighestGeneration,
			minGenerationOverride || undefined,
			includeNonStandard,
			challengeState.currentBossOrder // Pass boss progression
		);

		// If not enough digimon available with exclusions, retry without exclusions
		const finalTeam =
			newTeamDigimon.length >= teamSize
				? newTeamDigimon
				: randomizer.rerollMultiGeneration(
						filteredDigimon,
						challengeState.currentGeneration,
						teamSize,
						[], // No exclusions - allow duplicates if necessary
						onlyHighestGeneration,
						minGenerationOverride || undefined,
						includeNonStandard,
						challengeState.currentBossOrder // Pass boss progression
					);

		const newTeam: TeamMember[] = finalTeam.map((digimon: Digimon, index: number) => ({
			digimonNumber: digimon.number,
			slotIndex: index,
			rolledAtCheckpoint: challengeState!.currentBossOrder
		}));

		// Record in reroll history
		const rerollEvent = {
			timestamp: new Date().toISOString(),
			checkpoint: challengeState.currentBossOrder,
			previousTeam: previousTeamNumbers,
			newTeam: newTeam.map((m) => m.digimonNumber),
			seed: rerollSeed
		};

		challengeStore.update((state) => {
			if (!state) return state;
			// Update both current team and boss team snapshot
			return {
				...state,
				team: newTeam,
				bossTeams: {
					...state.bossTeams,
					[state.currentBossOrder]: {
						...state.bossTeams[state.currentBossOrder],
						team: newTeam,
						seed: rerollSeed
					}
				},
				rerollHistory: [...state.rerollHistory, rerollEvent],
				updatedAt: new Date().toISOString()
			};
		});
	}

	function resetChallenge() {
		if (!data.challenge || !challengeState) return;
		if (confirm('Are you sure you want to reset this challenge? All progress will be lost.')) {
			// Reset animation state when clearing challenge
			resetAnimationState(data.challenge.id, challengeState.seed);
			challengeStore.clear(data.challenge.id);
		}
	}

	// Handle team reveal animation trigger
	function handleRevealTeam() {
		if (!challengeState || !data.challenge) return;

		// Mark animation as played
		// If rerollTeamPerBoss is enabled, only mark this specific boss
		// Otherwise, mark all bosses in the current boss group as revealed
		if (rerollTeamPerBoss) {
			// Mark only this specific boss
			markAnimationPlayed(data.challenge.id, challengeState.seed, challengeState.currentBossOrder);
		} else {
			// Mark all bosses in the current group
			const currentBossGroup = getBossGroupForBoss(challengeState.currentBossOrder);
			if (currentBossGroup) {
				// Mark all bosses in this group as revealed
				for (
					let bossOrder = currentBossGroup.startBoss;
					bossOrder <= currentBossGroup.endBoss;
					bossOrder++
				) {
					markAnimationPlayed(data.challenge.id, challengeState.seed, bossOrder);
				}
			} else {
				// No boss group, just mark current boss
				markAnimationPlayed(
					data.challenge.id,
					challengeState.seed,
					challengeState.currentBossOrder
				);
			}
		}

		animationPlayedForCurrentBoss = true;
		pendingTeamReveal = false;
	}

	// Check if animation should be shown for current boss
	function updateAnimationState() {
		if (!challengeState || !data.challenge) {
			pendingTeamReveal = false;
			animationPlayedForCurrentBoss = true;
			return;
		}

		// Check if animation has been played
		// If rerollTeamPerBoss is enabled, check per boss
		// Otherwise, check for the first boss in the current boss group
		let played = false;
		if (rerollTeamPerBoss) {
			// Check animation for this specific boss
			played = hasAnimationPlayed(
				data.challenge.id,
				challengeState.seed,
				challengeState.currentBossOrder
			);
		} else {
			// Check animation for the first boss in the current boss group
			const currentBossGroup = getBossGroupForBoss(challengeState.currentBossOrder);
			if (currentBossGroup) {
				// Check if animation was played for the first boss in this group
				played = hasAnimationPlayed(
					data.challenge.id,
					challengeState.seed,
					currentBossGroup.startBoss
				);
			} else {
				// No boss group defined, check current boss
				played = hasAnimationPlayed(
					data.challenge.id,
					challengeState.seed,
					challengeState.currentBossOrder
				);
			}
		}

		animationPlayedForCurrentBoss = played;
		// Only show pending reveal if this is a new team that hasn't been revealed yet
		pendingTeamReveal = !played;
	}

	// Watch for boss changes to update animation state
	$effect(() => {
		if (challengeState?.currentBossOrder !== undefined) {
			updateAnimationState();
		}
	});

	function getTeamDigimon(): Digimon[] {
		if (!challengeState || !data.digimon) return [];
		// Create a copy of the array before sorting to avoid mutating reactive state
		return [...challengeState.team]
			.sort((a, b) => a.slotIndex - b.slotIndex)
			.map((member) => {
				const digimon = data.digimon?.find((d) => d.number === member.digimonNumber);
				return digimon ? ({ ...digimon } as Digimon) : null;
			})
			.filter((d): d is Digimon => d !== null);
	}

	function getLevelCap(): number | null {
		if (!challengeState || !data.bosses) return null;
		const currentBoss = data.bosses.find((b) => b.order === challengeState!.currentBossOrder);
		if (!currentBoss) return null;
		// Level cap is current boss level minus 7 (lowered from minus 5)
		return Math.max(1, currentBoss.level - 7);
	}

	function getCurrentCheckpoint() {
		if (!challengeState || !data.challenge) return null;
		// Find the checkpoint that matches or is less than current boss order
		const checkpoints = getCheckpoints();
		return (
			checkpoints
				.filter((cp) => cp.bossOrder <= challengeState!.currentBossOrder)
				.sort((a, b) => b.bossOrder - a.bossOrder)[0] || null
		);
	}

	function canReroll() {
		const checkpoint = getCurrentCheckpoint();
		return checkpoint?.allowReroll ?? false;
	}
</script>

<svelte:head>
	<title>{data.challenge?.name || 'Challenge'} - Digital Challenge Companion</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
	<h1 class="text-4xl font-bold text-gray-900 dark:text-muted-50 mb-8 animate-fade-in">
		{data.challenge?.name || 'Challenge'}
	</h1>

	{#if isLoadingState}
		<Card>
			<div class="flex flex-col items-center justify-center py-12">
				<div
					class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 dark:border-primary-400 mb-4"
				></div>
				<p class="text-gray-600 dark:text-muted">Loading challenge...</p>
			</div>
		</Card>
	{:else if !challengeState}
		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-4">Start New Challenge</h2>
			<p class="text-gray-700 dark:text-muted-300 mb-4">{data.challenge?.description || ''}</p>

			<div class="mb-4">
				<label for="seed" class="block text-sm font-medium text-gray-700 dark:text-muted-100 mb-2">
					Seed (optional - leave empty for random)
				</label>
				<input
					id="seed"
					type="text"
					bind:value={seedInput}
					class="w-full px-3 py-2 border border-gray-300 dark:border-border bg-white dark:bg-surface-100 text-gray-900 dark:text-muted-50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
					placeholder="Enter seed or leave empty"
				/>
			</div>

			<div class="mb-4">
				<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100">
					<input
						type="checkbox"
						bind:checked={onlyHighestGeneration}
						class="rounded border-gray-300 dark:border-border text-primary-600 focus:ring-primary-500"
					/>
					<span>Only use highest available digivolution generation (recommended)</span>
				</label>
			</div>

			{#if !onlyHighestGeneration}
				<div class="mb-4">
					<label
						for="minGeneration"
						class="block text-sm font-medium text-gray-700 dark:text-muted-100 mb-2"
					>
						Minimum Generation (optional override)
					</label>
					<select
						id="minGeneration"
						bind:value={minGenerationOverride}
						class="w-full px-3 py-2 border border-gray-300 dark:border-border bg-white dark:bg-surface-100 text-gray-900 dark:text-muted-50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
					>
						<option value={null}>All available generations</option>
						<option value="In-Training I">In-Training I</option>
						<option value="In-Training II">In-Training II</option>
						<option value="Rookie">Rookie</option>
						<option value="Champion">Champion</option>
						<option value="Ultimate">Ultimate</option>
						<option value="Mega">Mega</option>
						<option value="Mega +">Mega +</option>
					</select>
				</div>
			{/if}

			<div class="mb-4 border-t border-gray-200 dark:border-border pt-4">
				<h3 class="text-sm font-semibold text-gray-900 dark:text-muted-100 mb-2">
					Optional Content
				</h3>
				<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100 mb-2">
					<input
						type="checkbox"
						bind:checked={includeDLC}
						class="rounded border-gray-300 dark:border-border text-primary-600 focus:ring-primary-500"
					/>
					<span>Include DLC Digimon (Episode Packs 1-3*)</span>
					<span>*<i>only includes already released packs</i></span>
				</label>
				<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100 mb-2">
					<input
						type="checkbox"
						bind:checked={includePostGame}
						class="rounded border-gray-300 dark:border-border text-primary-600 focus:ring-primary-500"
					/>
					<span>Include Post-game Digimon (Chronomon variants, Bonds, Jupitermon)</span>
				</label>
				<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100 mb-2">
					<input
						type="checkbox"
						bind:checked={includeNonStandard}
						class="rounded border-gray-300 dark:border-border text-primary-600 focus:ring-primary-500"
					/>
					<span>Include Armor & Hybrid Digimon (matched by power level)</span>
				</label>
				<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100 mb-2">
					<input
						type="checkbox"
						bind:checked={includeDLCBosses}
						class="rounded border-gray-300 dark:border-border text-primary-600 focus:ring-primary-500"
					/>
					<span>Include DLC Bosses (Omnimon variants, Parallelmon)</span>
				</label>
				<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100 mb-2">
					<input
						type="checkbox"
						bind:checked={rerollTeamPerBoss}
						class="rounded border-gray-300 dark:border-border text-primary-600 focus:ring-primary-500"
					/>
					<span>New team for every boss fight (default: new team per boss group)</span>
				</label>
			</div>

			<div class="mb-6">
				<h3 class="font-semibold text-gray-900 dark:text-muted-100 mb-2">Challenge Rules:</h3>
				<ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-muted-300">
					{#each data.challenge?.rules || [] as rule (rule.id)}
						<li>
							<strong class="text-gray-900 dark:text-muted-100">{rule.title}:</strong>
							{rule.description}
						</li>
					{/each}
				</ul>
			</div>

			<Button onclick={startNewChallenge}>Generate Team</Button>
		</Card>
	{:else}
		<!-- Boss Navigation -->
		{#if data.bosses}
			<div class="mb-6">
				<BossNavigation
					currentBossOrder={challengeState.currentBossOrder}
					bosses={data.bosses}
					onNavigate={navigateToBoss}
					{includeDLCBosses}
				/>
			</div>
		{/if}

		<!-- Progress Info -->
		<div class="grid gap-4 md:grid-cols-2 mb-6">
			<Accordion title="Challenge Status">
				<div class="space-y-2 text-gray-700 dark:text-muted-300">
					<p>
						<strong class="text-gray-900 dark:text-muted-100">Level Cap:</strong>
						{getLevelCap() || 'No limit'}
					</p>
					<p>
						<strong class="text-gray-900 dark:text-muted-100">Digivolution Generation:</strong>
						<span
							class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
						>
							{$i18n.t(challengeState.currentGeneration)}
						</span>
					</p>
					<div class="mt-3">
						<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100">
							<input
								type="checkbox"
								bind:checked={onlyHighestGeneration}
								class="rounded border-gray-300 dark:border-border text-primary-600 focus:ring-primary-500"
							/>
							<span>Only highest generation</span>
						</label>
					</div>
					{#if !onlyHighestGeneration}
						<div class="mt-2">
							<label for="minGenRunning" class="block text-xs text-gray-600 dark:text-muted mb-1">
								Min Generation Override:
							</label>
							<select
								id="minGenRunning"
								bind:value={minGenerationOverride}
								class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-border bg-white dark:bg-surface-100 text-gray-900 dark:text-muted-50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
							>
								<option value={null}>All available</option>
								<option value="In-Training I">In-Training I</option>
								<option value="In-Training II">In-Training II</option>
								<option value="Rookie">Rookie</option>
								<option value="Champion">Champion</option>
								<option value="Ultimate">Ultimate</option>
								<option value="Mega">Mega</option>
								<option value="Mega +">Mega +</option>
							</select>
						</div>
					{/if}
					<p>
						<strong class="text-gray-900 dark:text-muted-100">Seed:</strong>
						<code
							class="bg-gray-100 dark:bg-surface-100 px-2 py-1 rounded text-sm text-gray-900 dark:text-muted-50"
							>{challengeState.seed}</code
						>
						<button
							onclick={copySeedUrl}
							class="ml-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
							title="Copy URL with seed to share"
						>
							📋 Copy URL
						</button>
					</p>
					<p class="text-xs text-gray-500 dark:text-muted-400 mt-1">
						ℹ️ Each reroll generates a new seed. Share the URL to let others recreate your exact
						team.
					</p>
					<p>
						<strong class="text-gray-900 dark:text-muted-100">Re-rolls Used:</strong>
						{challengeState.rerollHistory.length}
					</p>
				</div>
			</Accordion>

			<Accordion title="Digivolution Checkpoints">
				<div class="space-y-2">
					{#each getCheckpoints() as checkpoint (checkpoint.bossOrder)}
						{@const boss = data.bosses?.find((b) => b.order === checkpoint.bossOrder)}
						{@const isUnlocked = challengeState.currentBossOrder >= checkpoint.bossOrder}
						<div
							class="flex items-center gap-2 text-sm {isUnlocked
								? 'text-secondary-600 dark:text-secondary-400'
								: 'text-gray-500 dark:text-muted'}"
						>
							<span class="w-5 h-5 flex items-center justify-center">
								{#if isUnlocked}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5 text-secondary-500 dark:text-secondary-400"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clip-rule="evenodd"
										/>
									</svg>
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5 text-gray-400 dark:text-muted"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							</span>
							<span>
								{boss?.name || `Boss ${checkpoint.bossOrder}`}:
								<strong class="text-gray-900 dark:text-muted-50"
									>{$i18n.t(checkpoint.unlockedGeneration)}</strong
								>
							</span>
						</div>
					{/each}
				</div>
			</Accordion>
		</div>

		<!-- Challenge Info and Boss Groups -->
		<div class="grid gap-4 md:grid-cols-2 mb-6">
			<Accordion title="Challenge Clarifications">
				<div class="space-y-3 text-sm text-gray-700 dark:text-muted-300">
					{#if data.challenge?.challengeClarifications}
						{#each data.challenge.challengeClarifications as clarification, index (index)}
							<p class="flex items-start gap-2">
								<span class="text-primary-500 mt-0.5">•</span>
								<span>{clarification}</span>
							</p>
						{/each}
					{/if}
				</div>
			</Accordion>

			<Accordion title="Boss Groups (Team Rolls)">
				<div class="space-y-1.5 text-sm">
					<p class="text-xs text-gray-500 dark:text-muted-400 mb-2">
						A new team is rolled when you enter each boss group. Teams persist within the same
						group.
					</p>
					{#each getBossGroups() as group (group.startBoss)}
						{@const isCurrentGroup =
							challengeState &&
							getBossGroupForBoss(challengeState.currentBossOrder)?.startBoss === group.startBoss}
						<div
							class="flex items-start gap-2 {isCurrentGroup
								? 'text-primary-600 dark:text-primary-400 font-medium'
								: 'text-gray-600 dark:text-muted-300'}"
						>
							<span class="w-4 h-4 flex items-center justify-center mt-0.5">
								{#if isCurrentGroup}
									<span class="w-2 h-2 rounded-full bg-primary-500"></span>
								{:else}
									<span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-muted"></span>
								{/if}
							</span>
							<span class="flex-1">
								<span class="text-xs text-gray-400 dark:text-muted-600">
									{#if group.startBoss === group.endBoss}
										Boss {group.startBoss}
									{:else}
										Boss {group.startBoss}-{group.endBoss}
									{/if}:
								</span>
								{group.label}
							</span>
						</div>
					{/each}
				</div>
			</Accordion>
		</div>

		<!-- Team Display -->
		<div class="mb-6">
			<TeamDisplay
				team={getTeamDigimon()}
				allDigimon={data.digimon || []}
				onRerollSlot={canReroll() ? rerollSlot : undefined}
				onRerollAll={canReroll() ? rerollAll : undefined}
				showRerollButtons={canReroll()}
				levelCap={getLevelCap()}
				currentGeneration={challengeState.currentGeneration}
				pendingReveal={pendingTeamReveal}
				onRevealTeam={handleRevealTeam}
				animationPlayed={animationPlayedForCurrentBoss}
			/>
			{#if !canReroll()}
				<p class="mt-2 text-sm text-gray-500 dark:text-muted text-center">
					Re-rolls are not available at this checkpoint.
				</p>
			{/if}
		</div>

		<!-- Challenge Rules and Actions -->
		<div class="grid gap-6 md:grid-cols-2">
			<Card>
				<h2 class="text-xl font-bold text-gray-900 dark:text-muted-50 mb-4">Challenge Rules</h2>
				<ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-muted-300">
					{#each data.challenge?.rules || [] as rule (rule.id)}
						<li>
							<strong class="text-gray-900 dark:text-muted-100">{rule.title}:</strong>
							{rule.description}
						</li>
					{/each}
				</ul>
			</Card>

			<Card>
				<h2 class="text-xl font-bold text-gray-900 dark:text-muted-50 mb-4">Actions</h2>
				<div class="space-y-4">
					<div>
						<h3 class="text-sm font-semibold text-gray-900 dark:text-muted-100 mb-2">
							Content Filtering
						</h3>
						<div class="space-y-2">
							<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100">
								<input
									type="checkbox"
									bind:checked={includeDLC}
									class="rounded border-gray-300 dark:border-border text-primary-600 focus:ring-primary-500"
								/>
								<span>Include DLC Digimon (Episode Packs 1-3)</span>
							</label>
							<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100">
								<input
									type="checkbox"
									bind:checked={includePostGame}
									class="rounded border-gray-300 dark:border-border text-primary-600 focus:ring-primary-500"
								/>
								<span>Include Post-game Digimon (Chronomon variants)</span>
							</label>
							<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100">
								<input
									type="checkbox"
									bind:checked={includeNonStandard}
									class="rounded border-gray-300 dark:border-border text-primary-600 focus:ring-primary-500"
								/>
								<span>Include Armor & Hybrid Digimon (matched by power level)</span>
							</label>
							<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100">
								<input
									type="checkbox"
									bind:checked={includeDLCBosses}
									class="rounded border-gray-300 dark:border-border text-primary-600 focus:ring-primary-500"
								/>
								<span>Include DLC Bosses (Omnimon variants, Parallelmon)</span>
							</label>
							<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100">
								<input
									type="checkbox"
									bind:checked={rerollTeamPerBoss}
									class="rounded border-gray-300 dark:border-border text-primary-600 focus:ring-primary-500"
								/>
								<span>New team for every boss fight</span>
							</label>
							<p class="text-xs text-gray-500 dark:text-muted-400 mt-1">
								These settings apply to future re-rolls
							</p>
						</div>
					</div>
					<div class="pt-4 border-t border-gray-200 dark:border-border">
						<p class="text-sm text-gray-600 dark:text-muted mb-2">
							Reset this challenge to start over with a new seed and team.
						</p>
						<Button variant="outline" onclick={resetChallenge}>Reset Challenge</Button>
					</div>
				</div>
			</Card>
		</div>
	{/if}
</div>
