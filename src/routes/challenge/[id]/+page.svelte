<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import Card from '$lib/components/common/Card.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import TeamDisplay from '$lib/components/challenge/TeamDisplay.svelte';
	import BossNavigation from '$lib/components/challenge/BossNavigation.svelte';
	import { challengeStore } from '$lib/stores/challenge';
	import { RandomizerService } from '$lib/services/randomizer';
	import type { ChallengeRunState, TeamMember } from '$lib/types/challenge';
	import type { Digimon, EvolutionStage } from '$lib/types/digimon';
	import type { Boss } from '$lib/types/boss';

	let { data }: { data: PageData } = $props();

	let challengeState = $state<ChallengeRunState | null>(null);
	let seedInput = $state('');
	let randomizer = new RandomizerService();

	onMount(() => {
		// Load existing challenge state
		if (data.challenge) {
			challengeStore.load(data.challenge.id);
		}
		
		// Subscribe to store changes
		const unsubscribe = challengeStore.subscribe((state) => {
			challengeState = state;
		});
		
		return unsubscribe;
	});

	// Filter out optional bosses for starting position - start at boss-1 by default
	function getStartingBossOrder() {
		if (!data.bosses) return 1;
		const firstRequiredBoss = data.bosses.find(b => !b.optional);
		return firstRequiredBoss?.order ?? 1;
	}

	function startNewChallenge() {
		if (!data.challenge || !data.digimon) return;

		const seed = seedInput || randomizer.generateSeed();
		randomizer.setSeed(seed);

		const initialStage = data.challenge.evolutionCheckpoints[0].unlockedStage as EvolutionStage;
		const teamSize = data.challenge.settings.teamSize;
		
		// Use multi-stage selection for team generation
		const initialTeam = randomizer
			.getRandomDigimonMultiStage(data.digimon as Digimon[], initialStage, teamSize, [])
			.map((digimon, index) => ({
				digimonId: digimon.id,
				slotIndex: index,
				rolledAtCheckpoint: 0
			}));

		// Start at the first required boss (skip optional boss-0)
		const startBoss = getStartingBossOrder();

		const newState: ChallengeRunState = {
			challengeId: data.challenge.id,
			seed,
			currentBossOrder: startBoss,
			currentStage: initialStage,
			team: initialTeam,
			rerollHistory: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		challengeStore.save(newState);
	}

	function navigateToBoss(bossOrder: number) {
		if (!challengeState || !data.challenge) return;
		
		// Find if there's a checkpoint at this boss
		const checkpoint = data.challenge.evolutionCheckpoints.find(
			(cp) => cp.bossOrder === bossOrder
		);

		if (checkpoint) {
			challengeStore.update((state) => {
				if (!state) return state;
				return {
					...state,
					currentBossOrder: bossOrder,
					currentStage: checkpoint.unlockedStage as EvolutionStage,
					updatedAt: new Date().toISOString()
				};
			});
		} else {
			challengeStore.updateBossProgress(bossOrder);
		}
	}

	function rerollSlot(slotIndex: number) {
		if (!challengeState || !data.digimon) return;

		const currentTeamIds = challengeState.team.map(m => m.digimonId);
		const newDigimon = randomizer.rerollSlot(
			data.digimon as Digimon[],
			challengeState.currentStage,
			currentTeamIds
		);

		if (!newDigimon) return;

		const newTeam: TeamMember[] = challengeState.team.map((member, index) => {
			if (index === slotIndex) {
				return {
					digimonId: newDigimon.id,
					slotIndex: index,
					rolledAtCheckpoint: challengeState!.currentBossOrder
				};
			}
			return member;
		});

		challengeStore.update((state) => {
			if (!state) return state;
			return {
				...state,
				team: newTeam,
				seed: randomizer.getSeed(),
				updatedAt: new Date().toISOString()
			};
		});
	}

	function rerollAll() {
		if (!challengeState || !data.digimon || !data.challenge) return;

		const previousTeamIds = challengeState.team.map(m => m.digimonId);
		const teamSize = data.challenge.settings.teamSize;

		const newTeamDigimon = randomizer.rerollMultiStage(
			data.digimon as Digimon[],
			challengeState.currentStage,
			teamSize,
			[] // Don't exclude previous team for full reroll
		);

		const newTeam: TeamMember[] = newTeamDigimon.map((digimon, index) => ({
			digimonId: digimon.id,
			slotIndex: index,
			rolledAtCheckpoint: challengeState!.currentBossOrder
		}));

		// Record in reroll history
		const rerollEvent = {
			timestamp: new Date().toISOString(),
			checkpoint: challengeState.currentBossOrder,
			previousTeam: previousTeamIds,
			newTeam: newTeam.map(m => m.digimonId),
			seed: randomizer.getSeed()
		};

		challengeStore.update((state) => {
			if (!state) return state;
			return {
				...state,
				team: newTeam,
				seed: randomizer.getSeed(),
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
				const digimon = data.digimon?.find((d) => d.id === member.digimonId);
				return digimon ? ({ ...digimon } as Digimon) : null;
			})
			.filter((d): d is Digimon => d !== null);
	}

	function getNextBoss(): Boss | null {
		if (!challengeState || !data.bosses) return null;
		const nextBossOrder = challengeState.currentBossOrder + 1;
		return data.bosses.find((b) => b.order === nextBossOrder) || null;
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

<div class="max-w-6xl mx-auto">
	<h1 class="text-4xl font-bold text-gray-900 mb-8">{data.challenge?.name || 'Challenge'}</h1>

	{#if !challengeState}
		<Card>
			<h2 class="text-2xl font-bold text-gray-900 mb-4">Start New Challenge</h2>
			<p class="text-gray-700 mb-4">{data.challenge?.description || ''}</p>

			<div class="mb-4">
				<label for="seed" class="block text-sm font-medium text-gray-700 mb-2">
					Seed (optional - leave empty for random)
				</label>
				<input
					id="seed"
					type="text"
					bind:value={seedInput}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
					placeholder="Enter seed or leave empty"
				/>
			</div>

			<div class="mb-6">
				<h3 class="font-semibold text-gray-900 mb-2">Challenge Rules:</h3>
				<ul class="list-disc list-inside space-y-1 text-gray-700">
					{#each data.challenge?.rules || [] as rule (rule.id)}
						<li>
							<strong>{rule.title}:</strong> {rule.description}
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
				/>
			</div>
		{/if}

		<!-- Progress Info -->
		<div class="grid gap-6 md:grid-cols-2 mb-6">
			<Card>
				<h2 class="text-xl font-bold text-gray-900 mb-4">Challenge Status</h2>
				<div class="space-y-2 text-gray-700">
					<p><strong>Level Cap:</strong> {getNextBoss()?.level || 'No limit'}</p>
					<p><strong>Evolution Stage:</strong> 
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
							{challengeState.currentStage}
						</span>
					</p>
					<p><strong>Seed:</strong> <code class="bg-gray-100 px-2 py-1 rounded text-sm">{challengeState.seed}</code></p>
					<p><strong>Re-rolls Used:</strong> {challengeState.rerollHistory.length}</p>
				</div>
			</Card>

			<Card>
				<h2 class="text-xl font-bold text-gray-900 mb-4">Evolution Checkpoints</h2>
				<div class="space-y-2">
					{#each data.challenge?.evolutionCheckpoints || [] as checkpoint (checkpoint.bossOrder)}
						{@const boss = data.bosses?.find(b => b.order === checkpoint.bossOrder)}
						{@const isUnlocked = challengeState.currentBossOrder >= checkpoint.bossOrder}
						<div class="flex items-center gap-2 text-sm {isUnlocked ? 'text-green-700' : 'text-gray-500'}">
							<span class="w-5 h-5 flex items-center justify-center">
								{#if isUnlocked}
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
									</svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd" />
									</svg>
								{/if}
							</span>
							<span>
								{boss?.name || `Boss ${checkpoint.bossOrder}`}: <strong>{checkpoint.unlockedStage}</strong>
							</span>
						</div>
					{/each}
				</div>
			</Card>
		</div>

		<!-- Team Display -->
		<div class="mb-6">
			<TeamDisplay 
				team={getTeamDigimon()}
				onRerollSlot={canReroll() ? rerollSlot : undefined}
				onRerollAll={canReroll() ? rerollAll : undefined}
				showRerollButtons={canReroll()}
			/>
			{#if !canReroll()}
				<p class="mt-2 text-sm text-gray-500 text-center">
					Re-rolls are not available at this checkpoint.
				</p>
			{/if}
		</div>

		<!-- Challenge Rules and Actions -->
		<div class="grid gap-6 md:grid-cols-2">
			<Card>
				<h2 class="text-xl font-bold text-gray-900 mb-4">Challenge Rules</h2>
				<ul class="list-disc list-inside space-y-2 text-gray-700">
					{#each data.challenge?.rules || [] as rule (rule.id)}
						<li>
							<strong>{rule.title}:</strong> {rule.description}
						</li>
					{/each}
				</ul>
			</Card>

			<Card>
				<h2 class="text-xl font-bold text-gray-900 mb-4">Actions</h2>
				<div class="space-y-4">
					<div>
						<p class="text-sm text-gray-600 mb-2">
							Reset this challenge to start over with a new seed and team.
						</p>
						<Button variant="outline" onclick={resetChallenge}>
							Reset Challenge
						</Button>
					</div>
				</div>
			</Card>
		</div>
	{/if}
</div>
