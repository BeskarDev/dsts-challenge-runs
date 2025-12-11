<script lang="ts">
	import { base } from '$app/paths';
	import Card from '$lib/components/common/Card.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import challengeConfig from '$data/challenges/random-evolution.json';
</script>

<div class="max-w-4xl mx-auto">
	<div class="text-center mb-12">
		<h1 class="text-4xl font-bold text-gray-900 mb-4">
			Digimon Story Time Stranger Challenge Runs
		</h1>
		<p class="text-xl text-gray-600">
			Generate and track custom challenge runs for your playthrough
		</p>
	</div>

	<div class="grid gap-6">
		<Card>
			<h2 class="text-2xl font-bold text-gray-900 mb-2">
				{challengeConfig.name}
			</h2>
			<p class="text-gray-600 mb-4">
				{challengeConfig.description}
			</p>

			<div class="mb-4">
				<h3 class="font-semibold text-gray-900 mb-2">Rules:</h3>
				<ul class="list-disc list-inside space-y-1 text-gray-700">
					{#each challengeConfig.rules as rule}
						<li>
							<strong>{rule.title}:</strong> {rule.description}
						</li>
					{/each}
				</ul>
			</div>

			<Button onclick={() => (window.location.href = `${base}/challenge/${challengeConfig.id}`)}>
				Start Challenge
			</Button>
		</Card>
	</div>
</div>
