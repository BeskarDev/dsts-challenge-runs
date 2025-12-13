<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import Card from '$lib/components/common/Card.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import challengeConfig from '$data/challenges/random-evolution.json';
	import { challengeStore } from '$lib/stores/challenge';

	let hasExistingChallenge = $state(false);
	let isLoading = $state(true);

	onMount(() => {
		hasExistingChallenge = challengeStore.hasExistingState(challengeConfig.id);
		isLoading = false;
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

<svelte:head>
	<title>Digital Challenge Companion</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<div class="text-center mb-12">
		<div class="flex justify-center mb-4">
			<img
				src="{base}/logo.png"
				alt="Digital Challenge Companion"
				class="h-64 w-64 object-contain"
			/>
		</div>
		<h1 class="text-4xl font-bold text-gray-900 dark:text-muted-50 mb-4">
			Digital Challenge Companion
		</h1>
		<p class="text-xl text-gray-600 dark:text-muted">
			Track custom challenge runs for your playthrough
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
				{#if isLoading}
					<div class="text-gray-500 dark:text-muted">Loading...</div>
				{:else}
					<Button
						onclick={continueChallenge}
						disabled={!hasExistingChallenge}
						class="flex items-center gap-2 justify-center"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path d="M8 5v14l11-7z" />
						</svg>
						Continue
					</Button>
					<Button
						variant="outline"
						onclick={newChallenge}
						class="flex items-center gap-2 justify-center"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
						New
					</Button>
				{/if}
			</div>
		</Card>
	</div>
</div>
