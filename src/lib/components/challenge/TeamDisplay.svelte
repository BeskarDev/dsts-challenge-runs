<script lang="ts">
	import type { Digimon } from '$lib/types/digimon';
	import DigimonCard from './DigimonCard.svelte';
	import SlotMachineCard from './SlotMachineCard.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import { i18n } from '$lib/i18n';

	interface Props {
		team: Digimon[];
		allDigimon?: Digimon[];
		onRerollSlot?: (slotIndex: number) => void;
		onRerollAll?: () => void;
		showRerollButtons?: boolean;
		levelCap?: number | null;
		currentGeneration?: string;
		// Animation control
		pendingReveal?: boolean;
		onRevealTeam?: () => void;
		animationPlayed?: boolean;
	}

	let {
		team,
		allDigimon = [],
		onRerollSlot,
		onRerollAll,
		showRerollButtons = true,
		levelCap,
		currentGeneration,
		pendingReveal = false,
		onRevealTeam,
		animationPlayed = true
	}: Props = $props();

	// Animation state
	let isAnimating = $state(false);
	let completedSlots = $state(0);
	let rerollingSlots = $state<Set<number>>(new Set());
	let isRerollAnimation = $state(false);

	// Reactive translation for the current generation label
	let translatedGeneration = $derived(currentGeneration ? $i18n.t(currentGeneration) : '');

	// Determine if we should show animation
	let shouldAnimate = $derived(pendingReveal && !animationPlayed && allDigimon.length > 0);
	let shouldShowOverlayButton = $derived(shouldAnimate && !isAnimating);

	// Create array of slot indices for placeholder rendering
	let placeholderSlots = $derived(Array.from({ length: team.length }, (_, i) => i));

	function handleRevealTeam() {
		if (shouldAnimate) {
			isAnimating = true;
			completedSlots = 0;
			onRevealTeam?.();
		}
	}

	function handleSlotAnimationComplete() {
		completedSlots++;
		const expectedSlots = isRerollAnimation ? rerollingSlots.size : team.length;
		if (completedSlots >= expectedSlots) {
			// All slots completed
			setTimeout(() => {
				isAnimating = false;
				isRerollAnimation = false;
				rerollingSlots = new Set();
			}, 200);
		}
	}

	function handleRerollSlot(slotIndex: number) {
		if (allDigimon.length > 0) {
			// Start re-roll animation for single slot
			rerollingSlots = new Set([slotIndex]);
			isRerollAnimation = true;
			isAnimating = true;
			completedSlots = 0;
		}
		// Call original handler
		onRerollSlot?.(slotIndex);
	}

	function handleRerollAll() {
		if (allDigimon.length > 0) {
			// Start re-roll animation for all slots
			rerollingSlots = new Set(Array.from({ length: team.length }, (_, i) => i));
			isRerollAnimation = true;
			isAnimating = true;
			completedSlots = 0;
		}
		// Call original handler
		onRerollAll?.();
	}
</script>

<div
	class="rounded-md border border-gray-200 dark:border-border bg-white dark:bg-[rgba(8,14,32,0.80)] backdrop-blur-sm p-3 sm:p-6 shadow-panel-light dark:shadow-panel"
>
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
		<div class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
			<h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-muted-50">Current Team</h2>
			{#if levelCap || currentGeneration}
				<div class="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
					{#if levelCap}
						<span
							class="inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-fade-in"
						>
							<span class="font-semibold">Cap:</span>&nbsp;Lv.{levelCap}
						</span>
					{/if}
					{#if currentGeneration}
						<span
							class="inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800 animate-fade-in"
						>
							<span class="font-semibold">Max:</span>&nbsp;{translatedGeneration}
						</span>
					{/if}
				</div>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if showRerollButtons && onRerollAll}
				<Button 
					variant="secondary" 
					onclick={handleRerollAll}
					disabled={isAnimating || shouldShowOverlayButton}
				>
					<span class="flex items-center gap-2">
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
						Re-roll All
					</span>
				</Button>
			{/if}
		</div>
	</div>

	<!-- Team display area with overlay button -->
	<div class="relative">
		<!-- Overlay button for revealing team -->
		{#if shouldShowOverlayButton}
			<div class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-surface-500/80 backdrop-blur-sm rounded-md">
				<Button variant="primary" onclick={handleRevealTeam} class="animate-pulse-subtle shadow-2xl">
					<span class="flex items-center gap-3 px-4 py-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span class="text-lg font-bold">Roll New Team</span>
					</span>
				</Button>
			</div>
		{/if}

		{#if shouldAnimate && !isAnimating}
		<!-- Pending reveal state: show placeholders -->
		<div class="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
			{#each placeholderSlots as index (index)}
				<div
					class="rounded-md border border-gray-200 dark:border-border bg-gray-100 dark:bg-surface-200 p-2 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-3 shadow-panel-light dark:shadow-panel animate-pulse-subtle min-h-[180px] sm:min-h-[300px]"
				>
					<!-- Skeleton icon -->
					<div class="relative">
						<div class="w-[50px] h-[50px] sm:w-[75px] sm:h-[75px] rounded-md bg-gray-300 dark:bg-gray-400"></div>
						<span
							class="absolute -top-1.5 -left-1.5 sm:-top-2 sm:-left-2 bg-gray-400 dark:bg-muted text-white dark:text-surface-500 text-[10px] sm:text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center"
						>
							{index + 1}
						</span>
					</div>
					<!-- Skeleton text -->
					<div class="text-center w-full space-y-1 sm:space-y-2">
						<div class="h-3 sm:h-4 w-16 sm:w-20 bg-gray-300 dark:bg-gray-400 rounded mx-auto"></div>
						<div class="h-2.5 sm:h-3 w-12 sm:w-16 bg-gray-300 dark:bg-gray-400 rounded mx-auto"></div>
						<!-- Skeleton additional info rows -->
						<div class="mt-1.5 sm:mt-3 space-y-1 sm:space-y-1.5 flex flex-col items-center">
							<div class="h-2 sm:h-2.5 w-10 sm:w-14 bg-gray-300 dark:bg-gray-400 rounded"></div>
							<div class="h-2 sm:h-2.5 w-8 sm:w-12 bg-gray-300 dark:bg-gray-400 rounded"></div>
							<div class="h-2 sm:h-2.5 w-12 sm:w-16 bg-gray-300 dark:bg-gray-400 rounded"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if isAnimating}
		<!-- Animating state: show slot machine cards -->
		<div class="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
			{#each team as digimon, index (digimon.number + '-' + index)}
				{#if isRerollAnimation && !rerollingSlots.has(index)}
					<!-- Non-animating slot during re-roll -->
					<div class="min-h-[180px] sm:min-h-[300px]">
						<DigimonCard
							{digimon}
							slotIndex={index}
							onReroll={handleRerollSlot}
							showRerollButton={showRerollButtons}
							rerollDisabled={true}
						/>
					</div>
				{:else}
					<!-- Animating slot -->
					<div class="min-h-[180px] sm:min-h-[300px]">
						<SlotMachineCard
							{digimon}
							slotIndex={index}
							shouldAnimate={true}
							{allDigimon}
							onAnimationComplete={handleSlotAnimationComplete}
						>
							<DigimonCard
								{digimon}
								slotIndex={index}
								onReroll={handleRerollSlot}
								showRerollButton={showRerollButtons}
								rerollDisabled={isAnimating}
							/>
						</SlotMachineCard>
					</div>
				{/if}
			{/each}
		</div>
	{:else}
		<!-- Normal state: show regular team display -->
		<div class="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
			{#each team as digimon, index (digimon.number + '-' + index)}
				<div class="min-h-[180px] sm:min-h-[300px] {animationPlayed ? '' : 'animate-scale-in'}" style="animation-delay: {index * 50}ms">
					<DigimonCard
						{digimon}
						slotIndex={index}
						onReroll={handleRerollSlot}
						showRerollButton={showRerollButtons}
						rerollDisabled={isAnimating}
					/>
				</div>
			{/each}
		</div>
	{/if}

		{#if team.length === 0}
			<div class="text-center py-8 text-gray-500 dark:text-muted">
				No team members yet. Generate a team to start!
			</div>
		{/if}
	</div>
</div>
