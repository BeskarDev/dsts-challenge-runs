<script lang="ts">
	import type { Digimon } from '$lib/types/digimon';
	import { getGrindosaurUrl, getGrindosaurIconUrl } from '$lib/types/digimon';

	interface Props {
		digimon: Digimon;
		slotIndex: number;
		onReroll?: (slotIndex: number) => void;
		showRerollButton?: boolean;
	}

	let { digimon, slotIndex, onReroll, showRerollButton = true }: Props = $props();

	let imageError = $state(false);

	function handleImageError() {
		imageError = true;
	}

	function handleReroll() {
		if (onReroll) {
			onReroll(slotIndex);
		}
	}
</script>

<div class="bg-white rounded-lg shadow-md p-4 flex flex-col items-center gap-3 hover:shadow-lg transition-shadow">
	<div class="relative w-20 h-20">
		{#if !imageError}
			<img
				src={getGrindosaurIconUrl(digimon.name)}
				alt={digimon.name}
				class="w-full h-full object-contain rounded-lg bg-gray-100"
				onerror={handleImageError}
			/>
		{:else}
			<div class="w-full h-full rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
			</div>
		{/if}
		<span class="absolute -top-2 -left-2 bg-primary-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
			{slotIndex + 1}
		</span>
	</div>

	<div class="text-center">
		<a
			href={getGrindosaurUrl(digimon.name)}
			target="_blank"
			rel="noopener noreferrer"
			class="font-semibold text-gray-900 hover:text-primary-600 hover:underline transition-colors"
		>
			{digimon.name}
		</a>
		<p class="text-sm text-gray-600">{digimon.stage}</p>
	</div>

	{#if showRerollButton && onReroll}
		<button
			onclick={handleReroll}
			class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center gap-1"
			title="Re-roll this slot"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
			Re-roll
		</button>
	{/if}
</div>
