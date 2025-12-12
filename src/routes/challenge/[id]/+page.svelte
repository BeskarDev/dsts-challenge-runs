<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import Card from '$lib/components/common/Card.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import Accordion from '$lib/components/common/Accordion.svelte';
	import TeamDisplay from '$lib/components/challenge/TeamDisplay.svelte';
	import BossNavigation from '$lib/components/challenge/BossNavigation.svelte';
	import { challengeStore } from '$lib/stores/challenge';
	import { RandomizerService } from '$lib/services/randomizer';
	import type { ChallengeRunState, TeamMember } from '$lib/types/challenge';
	import type { Digimon, EvolutionGeneration } from '$lib/types/digimon';
	import type { Boss } from '$lib/types/boss';
	import { filterDigimonByContent } from '$lib/utils/digimon-filters';

	let { data }: { data: PageData } = $props();

	let challengeState = $state<ChallengeRunState | null>(null);
	let isLoadingState = $state(true);
	let seedInput = $state('');
	let randomizer = new RandomizerService();
	let unsubscribe: (() => void) | undefined;
	
	// Evolution pool settings
	let onlyHighestGeneration = $state(true); // Default to only highest generation
	let minGenerationOverride = $state<EvolutionGeneration | null>(null);
	
	// Content filtering settings
	let includeDLC = $state(true);
	let includePostGame = $state(false);
	let includeNonStandard = $state(true); // Armor and Hybrid digimon
	let includeDLCBosses = $state(false); // DLC bosses (Omnimon Zwart Defeat, etc.)
	let rerollTeamPerBoss = $state(false); // Generate new team for every boss fight (default: only per quest)

	onMount(() => {
		// Check for seed in URL parameters
		const urlSeed = $page.url.searchParams.get('seed');
		if (urlSeed) {
			seedInput = urlSeed;
		}

		// Load existing challenge state
		if (data.challenge) {
			challengeStore.load(data.challenge.id);
		}
		
		// Subscribe to store changes
		unsubscribe = challengeStore.subscribe((state) => {
			challengeState = state;
			isLoadingState = false;
			// Update URL with current seed if state exists
			if (state && state.seed) {
				updateUrlWithSeed(state.seed);
			}
		});
	});

	onDestroy(() => {
		// Clean up store subscription
		if (unsubscribe) {
			unsubscribe();
		}
	});

	// Update URL with seed parameter without causing navigation
	function updateUrlWithSeed(seed: string) {
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.set('seed', seed);
			window.history.replaceState({}, '', url.toString());
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

	// Filter out optional bosses for starting position - start at boss-1 by default
	function getStartingBossOrder() {
		if (!data.bosses) return 1;
		const firstRequiredBoss = data.bosses.find(b => !b.optional);
		return firstRequiredBoss?.order ?? 1;
	}

	function startNewChallenge() {
		if (!data.challenge || !data.digimon) return;

		const mainSeed = seedInput || randomizer.generateSeed();
		
		// Start at the first required boss (skip optional boss-0)
		const startBoss = getStartingBossOrder();
		const initialGeneration = data.challenge.evolutionCheckpoints[0].unlockedGeneration as EvolutionGeneration;
		
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
				includeNonStandard
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
		const unlockedCheckpoints = data.challenge.evolutionCheckpoints
			.filter(cp => cp.bossOrder <= bossOrder)
			.sort((a, b) => b.bossOrder - a.bossOrder);
		
		const correctGeneration = unlockedCheckpoints.length > 0
			? (unlockedCheckpoints[0].unlockedGeneration as EvolutionGeneration)
			: challengeState.currentGeneration;
		
		// Check if we already have a team saved for this boss
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
		
		// Determine if we need to generate a new team
		const currentBoss = data.bosses.find(b => b.order === bossOrder);
		const previousBoss = data.bosses.find(b => b.order === challengeState.currentBossOrder);
		
		// Check if we're crossing a generation checkpoint
		const generationChanged = correctGeneration !== challengeState.currentGeneration;
		
		const shouldRerollTeam = rerollTeamPerBoss || 
			!previousBoss || 
			!currentBoss || 
			currentBoss.location !== previousBoss.location ||
			generationChanged; // Always reroll when generation changes
		
		const newGeneration = correctGeneration;
		
		// If not rerolling per boss and location is the same, keep current team
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
		
		// Get list of digimon already used - only if rerolling per boss
		// Otherwise, allow repeats to avoid running out of digimon
		const usedInGeneration = rerollTeamPerBoss 
			? Object.values(challengeState.bossTeams)
				.filter(bt => bt.generation === newGeneration)
				.flatMap(bt => bt.team.map(tm => tm.digimonNumber))
			: [];
		
		const newTeamDigimon = randomizer.rerollMultiGeneration(
			filteredDigimon,
			newGeneration,
			teamSize,
			usedInGeneration,
			onlyHighestGeneration,
			minGenerationOverride || undefined,
			includeNonStandard
		);
		
		// If no digimon available (empty pool), retry without exclusions
		const finalTeam = newTeamDigimon.length > 0 
			? newTeamDigimon 
			: randomizer.rerollMultiGeneration(
				filteredDigimon,
				newGeneration,
				teamSize,
				[], // No exclusions
				onlyHighestGeneration,
				minGenerationOverride || undefined,
				includeNonStandard
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
		const currentTeamNumbers = challengeState.team.map(m => m.digimonNumber);
		const filteredDigimon = getFilteredDigimon();
		
		// Generate sub-seed for this reroll
		const rerollSeed = `${challengeState.seed}-boss-${challengeState.currentBossOrder}-reroll-${Date.now()}`;
		randomizer.setSeed(rerollSeed);
		
		const newDigimon = randomizer.rerollSlot(
			filteredDigimon,
			challengeState.currentGeneration,
			currentTeamNumbers,
			onlyHighestGeneration,
			minGenerationOverride || undefined,
			includeNonStandard
		);

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

		const previousTeamNumbers = challengeState.team.map(m => m.digimonNumber);
		const teamSize = data.challenge.settings.teamSize;
		const filteredDigimon = getFilteredDigimon();

		// Generate sub-seed for this reroll
		const rerollSeed = `${challengeState.seed}-boss-${challengeState.currentBossOrder}-rerollall-${Date.now()}`;
		randomizer.setSeed(rerollSeed);

		const newTeamDigimon = randomizer.rerollMultiGeneration(
			filteredDigimon,
			challengeState.currentGeneration,
			teamSize,
			[], // Don't exclude previous team for full reroll
			onlyHighestGeneration,
			minGenerationOverride || undefined,
			includeNonStandard
		);

		const newTeam: TeamMember[] = newTeamDigimon.map((digimon: Digimon, index: number) => ({
			digimonNumber: digimon.number,
			slotIndex: index,
			rolledAtCheckpoint: challengeState!.currentBossOrder
		}));

		// Record in reroll history
		const rerollEvent = {
			timestamp: new Date().toISOString(),
			checkpoint: challengeState.currentBossOrder,
			previousTeam: previousTeamNumbers,
			newTeam: newTeam.map(m => m.digimonNumber),
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
		if (!data.challenge) return;
		if (confirm('Are you sure you want to reset this challenge? All progress will be lost.')) {
			challengeStore.clear(data.challenge.id);
		}
	}

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

	function getNextBoss(): Boss | null {
		if (!challengeState || !data.bosses) return null;
		const nextBossOrder = challengeState.currentBossOrder + 1;
		return data.bosses.find((b) => b.order === nextBossOrder) || null;
	}

	function getLevelCap(): number | null {
		if (!challengeState || !data.bosses) return null;
		const currentBoss = data.bosses.find((b) => b.order === challengeState.currentBossOrder);
		if (!currentBoss) return null;
		// Level cap is current boss level minus 5
		return Math.max(1, currentBoss.level - 5);
	}

	function getCurrentCheckpoint() {
		if (!challengeState || !data.challenge) return null;
		// Find the checkpoint that matches or is less than current boss order
		const checkpoints = data.challenge.evolutionCheckpoints;
		return checkpoints
			.filter(cp => cp.bossOrder <= challengeState!.currentBossOrder)
			.sort((a, b) => b.bossOrder - a.bossOrder)[0] || null;
	}

	function canReroll() {
		const checkpoint = getCurrentCheckpoint();
		return checkpoint?.allowReroll ?? false;
	}
</script>

<svelte:head>
	<title>{data.challenge?.name || 'Challenge'} - Digimon Story Time Stranger</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
	<h1 class="text-4xl font-bold text-gray-900 dark:text-muted-50 mb-8">
		{data.challenge?.name || 'Challenge'}
	</h1>

	{#if isLoadingState}
		<Card>
			<div class="flex flex-col items-center justify-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 dark:border-primary-400 mb-4"></div>
				<p class="text-gray-600 dark:text-muted">Loading challenge...</p>
			</div>
		</Card>
	{:else if !challengeState}
		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-4">Start New Challenge</h2>
			<p class="text-gray-700 dark:text-muted-300 mb-4">{data.challenge?.description || ''}</p>

			<div class="mb-4">
				<label
					for="seed"
					class="block text-sm font-medium text-gray-700 dark:text-muted-100 mb-2"
				>
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
					<span>Only use highest available evolution generation (recommended)</span>
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
				<h3 class="text-sm font-semibold text-gray-900 dark:text-muted-100 mb-2">Optional Content</h3>
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
					<span>New team for every boss fight (default: new team per quest)</span>
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
					includeDLCBosses={includeDLCBosses}
				/>
			</div>
		{/if}

		<!-- Progress Info -->
		<div class="grid gap-4 md:grid-cols-2 mb-6">
			<Accordion title="Challenge Status">
				{#snippet children()}
					<div class="space-y-2 text-gray-700 dark:text-muted-300">
						<p>
							<strong class="text-gray-900 dark:text-muted-100">Level Cap:</strong>
							{getLevelCap() || 'No limit'}
						</p>
						<p>
							<strong class="text-gray-900 dark:text-muted-100">Evolution Generation:</strong>
							<span
								class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
							>
								{challengeState.currentGeneration}
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
								<label
									for="minGenRunning"
									class="block text-xs text-gray-600 dark:text-muted mb-1"
								>
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
							ℹ️ Each reroll generates a new seed. Share the URL to let others recreate your exact team.
						</p>
						<p>
							<strong class="text-gray-900 dark:text-muted-100">Re-rolls Used:</strong>
							{challengeState.rerollHistory.length}
						</p>
					</div>
				{/snippet}
			</Accordion>

			<Accordion title="Evolution Checkpoints">
				{#snippet children()}
					<div class="space-y-2">
						{#each data.challenge?.evolutionCheckpoints || [] as checkpoint (checkpoint.bossOrder)}
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
									{boss?.name || `Boss ${checkpoint.bossOrder}`}: <strong
										class="text-gray-900 dark:text-muted-50">{checkpoint.unlockedGeneration}</strong
									>
								</span>
							</div>
						{/each}
					</div>
				{/snippet}
			</Accordion>
		</div>

		<!-- Team Display -->
		<div class="mb-6">
			<TeamDisplay
				team={getTeamDigimon()}
				onRerollSlot={canReroll() ? rerollSlot : undefined}
				onRerollAll={canReroll() ? rerollAll : undefined}
				showRerollButtons={canReroll()}
				levelCap={getLevelCap()}
				currentGeneration={challengeState.currentGeneration}
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
						<h3 class="text-sm font-semibold text-gray-900 dark:text-muted-100 mb-2">Content Filtering</h3>
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
							</label>						<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-100">
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
						<Button variant="outline" onclick={resetChallenge}> Reset Challenge </Button>
					</div>
				</div>
			</Card>
		</div>
	{/if}
</div>
