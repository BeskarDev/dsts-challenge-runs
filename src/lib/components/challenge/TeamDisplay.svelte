<script lang="ts">
	import type { Digimon } from '$lib/types/digimon';
	import DigimonCard from './DigimonCard.svelte';
	import Button from '$lib/components/common/Button.svelte';

	interface Props {
		team: Digimon[];
		onRerollSlot?: (slotIndex: number) => void;
		onRerollAll?: () => void;
		showRerollButtons?: boolean;
	}

	let { team, onRerollSlot, onRerollAll, showRerollButtons = true }: Props = $props();
</script>

<div class="bg-white rounded-lg shadow-md p-6">
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-xl font-bold text-gray-900">Current Team</h2>
		{#if showRerollButtons && onRerollAll}
			<Button variant="secondary" onclick={onRerollAll}>
				<span class="flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Re-roll All
				</span>
			</Button>
		{/if}
	</div>

	<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
		{#each team as digimon, index (digimon.id + '-' + index)}
			<DigimonCard 
				{digimon} 
				slotIndex={index} 
				onReroll={onRerollSlot}
				showRerollButton={showRerollButtons}
			/>
		{/each}
	</div>

	{#if team.length === 0}
		<div class="text-center py-8 text-gray-500">
			No team members yet. Generate a team to start!
		</div>
	{/if}
</div>
