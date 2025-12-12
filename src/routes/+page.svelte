<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import Card from '$lib/components/common/Card.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import challengeConfig from '$data/challenges/random-evolution.json';
	import { challengeStore } from '$lib/stores/challenge';

	let hasExistingChallenge = $state(false);

	onMount(() => {
		hasExistingChallenge = challengeStore.hasExistingState(challengeConfig.id);
	});

	function continueChallenge() {
		window.location.href = `${base}/challenge/${challengeConfig.id}`;
	}

	function newChallenge() {
		// Clear existing challenge state before starting new one
		challengeStore.clear(challengeConfig.id);
		window.location.href = `${base}/challenge/${challengeConfig.id}`;
	}
</script>

<div class="max-w-4xl mx-auto">
	<div class="text-center mb-12">
		<h1 class="text-4xl font-bold text-gray-900 dark:text-muted-50 mb-4">
			Digimon Story Time Stranger Challenge Runs
		</h1>
		<p class="text-xl text-gray-600 dark:text-muted">
			Generate and track custom challenge runs for your playthrough
		</p>
	</div>

	<div class="grid gap-6">
		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-2">
				{challengeConfig.name}
			</h2>
			<p class="text-gray-600 dark:text-muted mb-4">
				{challengeConfig.description}
			</p>

			<div class="mb-4">
				<h3 class="font-semibold text-gray-900 dark:text-muted-100 mb-2">Rules:</h3>
				<ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-muted-300">
					{#each challengeConfig.rules as rule (rule.id)}
						<li>
							<strong class="text-gray-900 dark:text-muted-100">{rule.title}:</strong>
							{rule.description}
						</li>
					{/each}
				</ul>
			</div>

			<div class="flex gap-4">
				{#if hasExistingChallenge}
					<Button onclick={continueChallenge}>Continue Challenge</Button>
					<Button variant="outline" onclick={newChallenge}>New Challenge</Button>
				{:else}
					<Button onclick={newChallenge}>Start Challenge</Button>
				{/if}
			</div>
		</Card>
	</div>
</div>
