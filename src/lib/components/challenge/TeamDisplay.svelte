<script lang="ts">
	import type { Digimon } from '$lib/types/digimon';
	import DigimonCard from './DigimonCard.svelte';
	import SlotMachineCard from './SlotMachineCard.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import { i18n } from '$lib/i18n';
	import { getTotalSlotAnimationDuration } from '$lib/utils/animations';

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

	// Reactive translation for the current generation label
	let translatedGeneration = $derived(currentGeneration ? $i18n.t(currentGeneration) : '');

	// Determine if we should show animation
	let shouldAnimate = $derived(pendingReveal && !animationPlayed && allDigimon.length > 0);

	function handleRevealTeam() {
		if (shouldAnimate) {
			isAnimating = true;
			completedSlots = 0;
			onRevealTeam?.();
		}
	}

	function handleSlotAnimationComplete() {
		completedSlots++;
		if (completedSlots >= team.length) {
			// All slots completed
			setTimeout(() => {
				isAnimating = false;
			}, 200);
		}
	}

	// Calculate estimated animation time for display
	let estimatedTime = $derived(
		team.length > 0 ? Math.round(getTotalSlotAnimationDuration(team.length) / 1000) : 0
	);
</script>

<div
	class="rounded-md border border-gray-200 dark:border-border bg-white dark:bg-[rgba(8,14,32,0.80)] backdrop-blur-sm p-6 shadow-panel-light dark:shadow-panel"
>
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
		<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
			<h2 class="text-xl font-bold text-gray-900 dark:text-muted-50">Current Team</h2>
			{#if levelCap || currentGeneration}
				<div class="flex items-center gap-2 text-sm">
					{#if levelCap}
						<span class="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-fade-in">
							<span class="font-semibold">Cap:</span>&nbsp;Lv.{levelCap}
						</span>
					{/if}
					{#if currentGeneration}
						<span class="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800 animate-fade-in">
							<span class="font-semibold">Max:</span>&nbsp;{translatedGeneration}
						</span>
					{/if}
				</div>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if shouldAnimate && !isAnimating}
				<!-- Show "Roll New Team" button when pending reveal -->
				<Button variant="primary" onclick={handleRevealTeam}>
					<span class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
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
						Roll New Team
					</span>
				</Button>
			{:else if showRerollButtons && onRerollAll && !isAnimating}
				<Button variant="secondary" onclick={onRerollAll}>
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

	{#if shouldAnimate && !isAnimating}
		<!-- Pending reveal state: show placeholders -->
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
			{#each team as _digimon, index (index)}
				<div
					class="rounded-md border border-gray-200 dark:border-border bg-gray-100 dark:bg-surface-200 p-4 flex flex-col items-center gap-3 shadow-panel-light dark:shadow-panel animate-pulse-subtle"
				>
					<div class="relative w-20 h-20">
						<div class="w-full h-full rounded-md bg-gray-200 dark:bg-surface-100 flex items-center justify-center">
							<span class="text-gray-400 dark:text-muted text-2xl">?</span>
						</div>
						<span
							class="absolute -top-2 -left-2 bg-gray-400 dark:bg-muted text-white dark:text-surface-500 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
						>
							{index + 1}
						</span>
					</div>
					<div class="text-center">
						<div class="h-4 w-16 bg-gray-200 dark:bg-surface-100 rounded mb-2 mx-auto"></div>
						<div class="h-3 w-12 bg-gray-200 dark:bg-surface-100 rounded mx-auto"></div>
					</div>
				</div>
			{/each}
		</div>
		<p class="text-center text-sm text-gray-500 dark:text-muted mt-4">
			Click "Roll New Team" to reveal your team! (~{estimatedTime}s)
		</p>
	{:else if isAnimating}
		<!-- Animating state: show slot machine cards -->
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
			{#each team as digimon, index (digimon.number + '-' + index)}
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
						onReroll={onRerollSlot}
						showRerollButton={showRerollButtons}
					/>
				</SlotMachineCard>
			{/each}
		</div>
	{:else}
		<!-- Normal state: show regular team display -->
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
			{#each team as digimon, index (digimon.number + '-' + index)}
				<div class={animationPlayed ? '' : 'animate-scale-in'} style="animation-delay: {index * 50}ms">
					<DigimonCard
						{digimon}
						slotIndex={index}
						onReroll={onRerollSlot}
						showRerollButton={showRerollButtons}
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
