<script lang="ts">
	import type { Digimon } from '$lib/types/digimon';

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

	// Map attribute names to icon URLs from GrindoSaur CDN
	function getAttributeIconUrl(attribute: string): string {
		const attributeMap: Record<string, string> = {
			'Vaccine': 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/vaccine-icon.png',
			'Data': 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/data-icon.png',
			'Virus': 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/virus-icon.png',
			'Free': 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/free-icon.png',
			'Variable': 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/variable-icon.png',
			'Unknown': 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/unknown-icon.png',
			'No Data': 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/no-data-icon.png'
		};
		return attributeMap[attribute] || '';
	}

</script>

<div
	class="rounded-md border border-gray-200 dark:border-border bg-white dark:bg-[rgba(15,24,52,0.92)] backdrop-blur-sm p-4 flex flex-col items-center gap-3 shadow-panel-light dark:shadow-panel hover:shadow-lg dark:hover:shadow-[0_22px_45px_rgba(0,0,0,0.80)] transition-all"
>
	<div class="relative w-20 h-20">
		{#if !imageError}
			<img
				src={digimon.iconUrl}
				alt={digimon.name}
				class="w-full h-full object-contain rounded-md bg-gray-100 dark:bg-surface-200"
				onerror={handleImageError}
			/>
		{:else}
			<div
				class="w-full h-full rounded-md bg-gray-200 dark:bg-surface-200 flex items-center justify-center text-gray-400 dark:text-muted"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-10 w-10"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/>
				</svg>
			</div>
		{/if}
		<span
			class="absolute -top-2 -left-2 bg-primary-500 text-white dark:text-surface-500 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-glow"
		>
			{slotIndex + 1}
		</span>
	</div>

	<div class="text-center">
		<a
			href={digimon.detailsUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="font-semibold text-gray-900 dark:text-muted-50 hover:text-primary-500 dark:hover:text-primary-400 hover:underline transition-colors"
		>
			{digimon.name}
		</a>
		<p class="text-sm text-gray-600 dark:text-muted">{digimon.generation}</p>
		
		<!-- Additional info: Attribute, Type, Personality -->
		<div class="mt-2 space-y-1">
			<div class="flex items-center justify-center gap-1">
				{#if getAttributeIconUrl(digimon.attribute)}
					<img 
						src={getAttributeIconUrl(digimon.attribute)} 
						alt={digimon.attribute}
						class="w-4 h-4"
						title={digimon.attribute}
					/>
				{/if}
				<span class="text-xs text-gray-600 dark:text-muted">{digimon.attribute}</span>
			</div>
			<p class="text-xs text-gray-500 dark:text-muted-400">{digimon.type}</p>
			<p class="text-xs text-gray-500 dark:text-muted-400 italic">{digimon.basePersonality}</p>
		</div>
	</div>

	{#if showRerollButton && onReroll}
		<button
			onclick={handleReroll}
			class="px-3 py-1 text-sm bg-gray-100 dark:bg-surface-100 hover:bg-gray-200 dark:hover:bg-surface-50 text-gray-700 dark:text-muted rounded-full border border-transparent dark:border-border transition-all flex items-center gap-1"
			title="Re-roll this slot"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				/>
			</svg>
			Re-roll
		</button>
	{/if}
</div>
