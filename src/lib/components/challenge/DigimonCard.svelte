<script lang="ts">
	import type { Digimon } from '$lib/types/digimon';
	import { i18n } from '$lib/i18n';

	interface Props {
		digimon: Digimon;
		slotIndex: number;
		onReroll?: (slotIndex: number) => void;
		showRerollButton?: boolean;
		rerollDisabled?: boolean;
	}

	let {
		digimon,
		slotIndex,
		onReroll,
		showRerollButton = true,
		rerollDisabled = false
	}: Props = $props();

	let imageError = $state(false);

	// Reactive translations that update when language changes
	let translatedName = $derived($i18n.t(digimon.name));
	let translatedGeneration = $derived($i18n.t(digimon.generation));
	let translatedAttribute = $derived($i18n.t(digimon.attribute));
	let translatedType = $derived($i18n.t(digimon.type));

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
			Vaccine:
				'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/vaccine-icon.png',
			Data: 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/data-icon.png',
			Virus:
				'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/virus-icon.png',
			Free: 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/free-icon.png',
			Variable:
				'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/variable-icon.png',
			Unknown:
				'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/unknown-icon.png',
			'No Data':
				'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/no-data-icon.png'
		};
		return attributeMap[attribute] || '';
	}
</script>

<div
	class="rounded-md border border-gray-200 dark:border-border bg-white dark:bg-[rgba(15,24,52,0.92)] backdrop-blur-sm p-2 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-3 shadow-panel-light dark:shadow-panel hover:shadow-lg dark:hover:shadow-[0_22px_45px_rgba(0,0,0,0.80)] transition-all min-h-[180px] sm:min-h-[300px] h-full"
>
	<div class="relative w-12 h-12 sm:w-20 sm:h-20">
		{#if !imageError}
			<a
				href={digimon.detailsUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="block cursor-pointer hover:opacity-80 transition-opacity"
				title="View on GrindoSaur"
			>
				<img
					src={digimon.iconUrl}
					alt={digimon.name}
					class="w-full h-full object-contain rounded-md bg-gray-100 dark:bg-surface-200"
					onerror={handleImageError}
				/>
			</a>
		{:else}
			<div
				class="w-full h-full rounded-md bg-gray-200 dark:bg-surface-200 flex items-center justify-center text-gray-400 dark:text-muted"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 sm:h-10 sm:w-10"
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
			class="absolute -top-1.5 -left-1.5 sm:-top-2 sm:-left-2 bg-primary-500 text-white dark:text-surface-500 text-[10px] sm:text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-glow"
		>
			{slotIndex + 1}
		</span>
	</div>

	<div class="text-center">
		<a
			href={digimon.detailsUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="font-semibold text-[11px] sm:text-base text-gray-900 dark:text-muted-50 hover:text-primary-500 dark:hover:text-primary-400 hover:underline transition-colors line-clamp-2 sm:line-clamp-none"
		>
			{translatedName}
		</a>
		<p class="text-[10px] sm:text-sm text-gray-600 dark:text-muted">{translatedGeneration}</p>

		<!-- Additional info: Attribute, Type, Personality -->
		<div class="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
			<div class="flex items-center justify-center gap-0.5 sm:gap-1">
				{#if getAttributeIconUrl(digimon.attribute)}
					<img
						src={getAttributeIconUrl(digimon.attribute)}
						alt={translatedAttribute}
						class="w-3 h-3 sm:w-4 sm:h-4 dark:invert-0 invert"
						title={translatedAttribute}
					/>
				{/if}
				<span class="text-[9px] sm:text-xs text-gray-600 dark:text-muted"
					>{translatedAttribute}</span
				>
			</div>
			<p class="text-[9px] sm:text-xs text-gray-500 dark:text-muted-400 hidden sm:block">
				{translatedType}
			</p>
			<p class="text-[9px] sm:text-xs text-gray-500 dark:text-muted-400 italic hidden sm:block">
				{digimon.basePersonality}
			</p>
		</div>
	</div>

	{#if showRerollButton && onReroll}
		<button
			onclick={handleReroll}
			disabled={rerollDisabled}
			class="mt-auto px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-sm bg-gray-100 dark:bg-surface-100 hover:bg-gray-200 dark:hover:bg-surface-50 text-gray-700 dark:text-muted rounded-full border border-transparent dark:border-border transition-all flex items-center gap-0.5 sm:gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-surface-100"
			title="Re-roll this slot"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-3 w-3 sm:h-4 sm:w-4"
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
			<span class="hidden sm:inline">Re-roll</span>
		</button>
	{/if}
</div>
