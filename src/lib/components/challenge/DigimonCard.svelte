<script lang="ts">
	import { onMount } from 'svelte';
	import type { Digimon } from '$lib/types/digimon';
	import { i18n } from '$lib/i18n';
	import { portal } from '$lib/actions/portal';

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
	let showItemPopup = $state(false);
	let popupPosition = $state({ top: 0, left: 0 });
	let buttonEl: HTMLButtonElement | undefined = $state();
	let menuEl: HTMLDivElement | undefined = $state();

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

	function updatePopupPosition() {
		if (buttonEl && menuEl) {
			const rect = buttonEl.getBoundingClientRect();
			const menuWidth = menuEl.offsetWidth;
			const menuHeight = menuEl.offsetHeight;
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;
			const spacing = 8;

			// Calculate initial position (below button, slightly offset)
			let top = rect.bottom + spacing;
			let left = rect.left;

			// Adjust horizontal position if overflows
			if (left + menuWidth > viewportWidth - spacing) {
				left = viewportWidth - menuWidth - spacing;
			}
			if (left < spacing) {
				left = spacing;
			}

			// Flip to above if overflows bottom
			if (top + menuHeight > viewportHeight - spacing) {
				const topAlt = rect.top - menuHeight - spacing;
				if (topAlt >= spacing) {
					top = topAlt;
				}
			}

			popupPosition = { top, left };
		}
	}

	function handleItemInfoClick(event: MouseEvent, button: HTMLButtonElement) {
		event.stopPropagation();
		buttonEl = button;
		showItemPopup = !showItemPopup;
		if (showItemPopup) {
			// Wait for DOM to update before calculating position
			setTimeout(() => {
				updatePopupPosition();
			}, 0);
		}
	}

	function closeItemPopup() {
		showItemPopup = false;
	}

	function handleClickOutside(event: MouseEvent) {
		if (showItemPopup && buttonEl && menuEl) {
			const target = event.target as Node;
			if (!buttonEl.contains(target) && !menuEl.contains(target)) {
				closeItemPopup();
			}
		}
	}

	onMount(() => {
		window.addEventListener('click', handleClickOutside);
		window.addEventListener('scroll', updatePopupPosition, true);
		window.addEventListener('resize', updatePopupPosition);

		return () => {
			window.removeEventListener('click', handleClickOutside);
			window.removeEventListener('scroll', updatePopupPosition, true);
			window.removeEventListener('resize', updatePopupPosition);
		};
	});

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
		
		<!-- Info icon for digimon requiring special items -->
		{#if digimon.evolutionRequirements?.requiredItem}
			<button
				onclick={(e) => handleItemInfoClick(e as MouseEvent, e.currentTarget as HTMLButtonElement)}
				class="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-blue-500 hover:bg-blue-600 text-white text-[8px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shadow-md cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 z-10"
				title="Click for evolution requirements"
				aria-label="Show evolution requirements for {digimon.name}"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-2.5 w-2.5 sm:h-3 sm:w-3"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</button>
		{/if}
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

{#if showItemPopup && digimon.evolutionRequirements?.requiredItem}
	<div 
		bind:this={menuEl}
		use:portal={'body'}
		class="fixed bg-white dark:bg-surface border border-gray-200 dark:border-border rounded-lg shadow-xl p-4 max-w-sm w-80 z-[9999]"
		style="top: {popupPosition.top}px; left: {popupPosition.left}px; pointer-events: auto;"
		role="dialog"
		aria-modal="true"
		aria-label="Evolution requirements for {translatedName}"
	>
		<!-- Header -->
		<div class="flex items-start justify-between mb-3">
			<div class="flex items-center gap-2">
				<div class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h3 class="font-semibold text-sm text-gray-900 dark:text-muted-50">Evolution Requirement</h3>
			</div>
			<button 
				onclick={closeItemPopup}
				class="text-gray-400 hover:text-gray-600 dark:hover:text-muted-200 transition-colors"
				aria-label="Close evolution requirements popup"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div class="text-xs space-y-3">
			<div>
				<span class="text-gray-500 dark:text-muted-400">Digimon:</span>
				<p class="font-medium text-gray-900 dark:text-muted-50">{translatedName}</p>
			</div>

			<div>
				<span class="text-gray-500 dark:text-muted-400">Required Item:</span>
				<p class="font-medium text-blue-600 dark:text-blue-400">{digimon.evolutionRequirements.requiredItem}</p>
			</div>

			{#if digimon.evolutionRequirements.agentRank || digimon.evolutionRequirements.stats || digimon.evolutionRequirements.agentSkills}
				<div class="border-t border-gray-200 dark:border-border pt-2">
					<span class="text-gray-500 dark:text-muted-400">Requirements:</span>
					<div class="mt-1 space-y-1 text-gray-700 dark:text-muted-300">
						{#if digimon.evolutionRequirements.agentRank}
							<div>• Agent Rank: <span class="font-medium">{digimon.evolutionRequirements.agentRank}</span></div>
						{/if}
						{#if digimon.evolutionRequirements.agentSkills}
							<div>• Agent Skills:</div>
							{#if digimon.evolutionRequirements.agentSkills.valor}
								<div class="ml-4"><span class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded text-xs font-medium">Valor {digimon.evolutionRequirements.agentSkills.valor}</span></div>
							{/if}
							{#if digimon.evolutionRequirements.agentSkills.philanthropy}
								<div class="ml-4"><span class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-1.5 py-0.5 rounded text-xs font-medium">Philanthropy {digimon.evolutionRequirements.agentSkills.philanthropy}</span></div>
							{/if}
							{#if digimon.evolutionRequirements.agentSkills.amicability}
								<div class="ml-4"><span class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs font-medium">Amicability {digimon.evolutionRequirements.agentSkills.amicability}</span></div>
							{/if}
							{#if digimon.evolutionRequirements.agentSkills.wisdom}
								<div class="ml-4"><span class="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded text-xs font-medium">Wisdom {digimon.evolutionRequirements.agentSkills.wisdom}</span></div>
							{/if}
						{/if}
						{#if digimon.evolutionRequirements.stats && Object.keys(digimon.evolutionRequirements.stats).length > 0}
							<div>• Stats: {Object.entries(digimon.evolutionRequirements.stats).map(([stat, value]) => `${stat} ${value}`).join(', ')}</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if digimon.evolutionRequirements.minBossOrder}
				<div class="border-t border-gray-200 dark:border-border pt-2">
					<span class="text-gray-500 dark:text-muted-400">Story Progress:</span>
					<p class="mt-1 text-gray-600 dark:text-muted-400">Available at Boss Order #{digimon.evolutionRequirements.minBossOrder}</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
