<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import Card from '$lib/components/common/Card.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import { challengeStore } from '$lib/stores/challenge';
	import { RandomizerService } from '$lib/services/randomizer';
	import type { ChallengeRunState } from '$lib/types/challenge';
	import type { Digimon, EvolutionStage } from '$lib/types/digimon';

	let { data }: { data: PageData } = $props();

	let challengeState = $state<ChallengeRunState | null>(null);
	let seedInput = $state('');
	let randomizer = $state<RandomizerService>(new RandomizerService());

	// Subscribe to store
	$effect(() => {
		const unsubscribe = challengeStore.subscribe((state) => {
			challengeState = state;
		});
		return unsubscribe;
	});

	onMount(() => {
		// Load existing challenge state
		if (data.challenge) {
			challengeStore.load(data.challenge.id);
		}
	});

	function startNewChallenge() {
		if (!data.challenge || !data.digimon) return;

		const seed = seedInput || randomizer.generateSeed();
		randomizer.setSeed(seed);

		const initialStage = data.challenge.evolutionCheckpoints[0].unlockedStage as EvolutionStage;
		const teamSize = data.challenge.settings.teamSize;
		
		const initialTeam = randomizer
			.getRandomDigimon(data.digimon as Digimon[], initialStage, teamSize, [])
			.map((digimon, index) => ({
				digimonId: digimon.id,
				slotIndex: index,
				rolledAtCheckpoint: 0
			}));

		const newState: ChallengeRunState = {
			challengeId: data.challenge.id,
			seed,
			currentBossOrder: 0,
			currentStage: initialStage,
			team: initialTeam,
			rerollHistory: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		challengeStore.save(newState);
	}

	function advanceBoss() {
		if (!challengeState || !data.challenge) return;
		
		const nextBoss = challengeState.currentBossOrder + 1;
		const nextCheckpoint = data.challenge.evolutionCheckpoints.find(
			(cp) => cp.bossOrder === nextBoss
		);

		if (nextCheckpoint) {
			challengeStore.update((state) => {
				if (!state) return state;
				return {
					...state,
					currentBossOrder: nextBoss,
					currentStage: nextCheckpoint.unlockedStage as EvolutionStage,
					updatedAt: new Date().toISOString()
				};
			});
		} else {
			challengeStore.updateBossProgress(nextBoss);
		}
	}

	function getTeamDigimon(): Digimon[] {
		if (!challengeState || !data.digimon) return [];
		return challengeState.team
			.map((member) => {
				const digimon = data.digimon?.find((d) => d.id === member.digimonId);
				return digimon ? ({ ...digimon } as Digimon) : null;
			})
			.filter((d): d is Digimon => d !== null);
	}

	function getCurrentBoss() {
		if (!data.bosses) return undefined;
		return data.bosses.find((b) => b.order === challengeState?.currentBossOrder);
	}

	function getNextBoss() {
		if (!challengeState || !data.bosses) return null;
		const nextBossOrder = challengeState.currentBossOrder + 1;
		return data.bosses.find((b) => b.order === nextBossOrder);
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

			<Button onclick={startNewChallenge}>Generate Team</Button>
		</Card>
	{:else}
		<div class="grid gap-6 md:grid-cols-2">
			<Card>
				<h2 class="text-xl font-bold text-gray-900 mb-4">Progress</h2>
				<div class="space-y-2 text-gray-700">
					<p><strong>Current Boss:</strong> {getCurrentBoss()?.name || 'None'}</p>
					<p><strong>Next Boss:</strong> {getNextBoss()?.name || 'Final Boss Defeated!'}</p>
					<p><strong>Level Cap:</strong> {getNextBoss()?.level || 'No limit'}</p>
					<p><strong>Evolution Stage:</strong> {challengeState.currentStage}</p>
					<p><strong>Seed:</strong> <code class="bg-gray-100 px-2 py-1 rounded">{challengeState.seed}</code></p>
				</div>

				<div class="mt-4">
					{#if getNextBoss()}
						<Button onclick={advanceBoss}>Advance to Next Boss</Button>
					{/if}
				</div>
			</Card>

			<Card>
				<h2 class="text-xl font-bold text-gray-900 mb-4">Current Team</h2>
				<div class="space-y-2">
					{#each getTeamDigimon() as digimon (digimon.id)}
						<div class="flex items-center gap-3 p-2 bg-gray-50 rounded">
							<span class="font-medium text-gray-700">{getTeamDigimon().indexOf(digimon) + 1}.</span>
							<div>
								<p class="font-semibold text-gray-900">{digimon.name}</p>
								<p class="text-sm text-gray-600">{digimon.stage}</p>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		</div>

		<div class="mt-6">
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
		</div>
	{/if}
</div>
