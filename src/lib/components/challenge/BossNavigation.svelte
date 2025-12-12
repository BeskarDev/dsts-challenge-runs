<script lang="ts">
	import type { Boss } from '$lib/types/boss';
	import Button from '$lib/components/common/Button.svelte';

	interface Props {
		currentBossOrder: number;
		bosses: Boss[];
		onNavigate: (bossOrder: number) => void;
	}

	let { currentBossOrder, bosses, onNavigate }: Props = $props();

	// Get the count of required (non-optional) bosses
	const requiredBossCount = $derived(bosses.filter(b => !b.optional).length);
	
	const currentBoss = $derived(bosses.find(b => b.order === currentBossOrder));
	const previousBoss = $derived(bosses.filter(b => b.order < currentBossOrder).sort((a, b) => b.order - a.order)[0]);
	const nextBoss = $derived(bosses.find(b => b.order === currentBossOrder + 1));
	
	// Check if we can go back (skip optional bosses if needed based on current position)
	const canGoBack = $derived(currentBossOrder > 1 || (currentBossOrder === 1));
	const canGoForward = $derived(nextBoss !== undefined);

	function goBack() {
		if (previousBoss) {
			onNavigate(previousBoss.order);
		}
	}

	function goForward() {
		if (nextBoss) {
			onNavigate(nextBoss.order);
		}
	}
</script>

<div class="bg-white rounded-lg shadow-md p-4">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Boss Progress</h3>
	
	<div class="flex items-center justify-between gap-4">
		<Button 
			variant="outline" 
			onclick={goBack} 
			disabled={!canGoBack}
			class="flex items-center gap-1"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Previous
		</Button>

		<div class="flex-1 text-center">
			{#if currentBoss}
				<div class="font-semibold text-gray-900">
					{currentBoss.name}
					{#if currentBoss.optional}
						<span class="text-xs text-gray-500">(Optional)</span>
					{/if}
				</div>
				<div class="text-sm text-gray-600">
					Level {currentBoss.level} • {currentBoss.location}
				</div>
				<div class="text-xs text-gray-500 mt-1">
					Boss {currentBossOrder} / {requiredBossCount}
				</div>
			{:else}
				<div class="text-gray-500">No boss selected</div>
			{/if}
		</div>

		<Button 
			variant="outline" 
			onclick={goForward} 
			disabled={!canGoForward}
			class="flex items-center gap-1"
		>
			Next
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</Button>
	</div>

	{#if nextBoss}
		<div class="mt-4 pt-4 border-t border-gray-200">
			<div class="text-sm text-gray-600">
				<span class="font-medium">Next:</span> {nextBoss.name} (Lv. {nextBoss.level})
				{#if nextBoss.optional}
					<span class="text-xs text-gray-500">(Optional)</span>
				{/if}
			</div>
		</div>
	{:else}
		<div class="mt-4 pt-4 border-t border-gray-200">
			<div class="text-sm text-green-600 font-medium">
				🎉 All bosses defeated! Challenge complete!
			</div>
		</div>
	{/if}
</div>
