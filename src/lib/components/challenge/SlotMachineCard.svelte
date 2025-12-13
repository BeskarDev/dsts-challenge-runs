<script lang="ts">
	import type { Digimon } from '$lib/types/digimon';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { getSlotTiming, prefersReducedMotion, ANIMATION_TIMING } from '$lib/utils/animations';

	interface Props {
		digimon: Digimon;
		slotIndex: number;
		shouldAnimate: boolean;
		allDigimon: Digimon[];
		onAnimationComplete?: () => void;
		children?: Snippet;
	}

	let {
		digimon,
		slotIndex,
		shouldAnimate,
		allDigimon,
		onAnimationComplete,
		children
	}: Props = $props();

	// Animation states
	let animationState = $state<'idle' | 'spinning' | 'revealing' | 'complete'>('idle');
	let currentDisplayDigimon = $state<Digimon | null>(null);
	let cycleTimeout: ReturnType<typeof setTimeout> | null = null;

	// Get timing for this slot
	const timing = $derived(getSlotTiming(slotIndex));

	// Get a pool of random digimon for the spinning effect
	function getRandomDigimon(): Digimon {
		const randomIndex = Math.floor(Math.random() * allDigimon.length);
		return allDigimon[randomIndex];
	}

	function startAnimation() {
		if (prefersReducedMotion()) {
			// Skip animation for users who prefer reduced motion
			animationState = 'complete';
			currentDisplayDigimon = digimon;
			onAnimationComplete?.();
			return;
		}

		// Wait for the staggered start delay
		setTimeout(() => {
			animationState = 'spinning';
			
			// Start cycling through random digimon
			let cycleCount = 0;
			let cycleSpeed = ANIMATION_TIMING.SLOT_CYCLE_DURATION;
			const maxCycles = Math.floor(timing.spinDuration / ANIMATION_TIMING.SLOT_CYCLE_DURATION);

			const cycle = () => {
				currentDisplayDigimon = getRandomDigimon();
				cycleCount++;

				// Gradually slow down as we approach the end
				if (cycleCount > maxCycles * 0.6) {
					cycleSpeed = cycleSpeed * 1.15; // Exponential slowdown
				}

				if (cycleCount >= maxCycles) {
					// Stop spinning and reveal final digimon
					if (cycleTimeout) {
						clearTimeout(cycleTimeout);
						cycleTimeout = null;
					}
					animationState = 'revealing';
					currentDisplayDigimon = digimon;
					
					// Complete after reveal animation
					setTimeout(() => {
						animationState = 'complete';
						onAnimationComplete?.();
					}, 400); // Match the slot-reveal animation duration
				} else {
					// Schedule next cycle with adjusted speed
					cycleTimeout = setTimeout(cycle, cycleSpeed);
				}
			};

			// Start first cycle
			cycle();
		}, timing.startDelay);
	}

	onMount(() => {
		if (shouldAnimate) {
			startAnimation();
		} else {
			// No animation, show directly
			animationState = 'complete';
			currentDisplayDigimon = digimon;
		}

		return () => {
			if (cycleTimeout) {
				clearTimeout(cycleTimeout);
			}
		};
	});

	// Reactive: If shouldAnimate changes and becomes true, start animation
	$effect(() => {
		if (shouldAnimate && animationState === 'idle') {
			startAnimation();
		}
	});
</script>

<div class="slot-machine-wrapper relative" data-slot-state={animationState}>
	{#if animationState === 'idle'}
		<!-- Placeholder state -->
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
					{slotIndex + 1}
				</span>
			</div>
			<div class="text-center">
				<div class="h-4 w-16 bg-gray-200 dark:bg-surface-100 rounded mb-2 mx-auto"></div>
				<div class="h-3 w-12 bg-gray-200 dark:bg-surface-100 rounded mx-auto"></div>
			</div>
		</div>
	{:else if animationState === 'spinning' && currentDisplayDigimon}
		<!-- Spinning state - show blurred cycling digimon -->
		<div
			class="rounded-md border border-primary-300 dark:border-primary-600 bg-white dark:bg-[rgba(15,24,52,0.92)] backdrop-blur-sm p-4 flex flex-col items-center gap-3 shadow-glow animate-slot-spin"
		>
			<div class="relative w-20 h-20">
				<img
					src={currentDisplayDigimon.iconUrl}
					alt="Rolling..."
					class="w-full h-full object-contain rounded-md bg-gray-100 dark:bg-surface-200 blur-[2px]"
				/>
				<span
					class="absolute -top-2 -left-2 bg-primary-500 text-white dark:text-surface-500 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-glow"
				>
					{slotIndex + 1}
				</span>
			</div>
			<div class="text-center opacity-50">
				<div class="font-semibold text-gray-900 dark:text-muted-50 blur-[1px]">
					{currentDisplayDigimon.name}
				</div>
				<p class="text-sm text-gray-600 dark:text-muted blur-[1px]">
					{currentDisplayDigimon.generation}
				</p>
			</div>
		</div>
	{:else if animationState === 'revealing'}
		<!-- Revealing state - show final digimon with reveal animation -->
		<div class="animate-slot-reveal">
			{#if children}
				{@render children()}
			{/if}
		</div>
	{:else}
		<!-- Complete state - show regular digimon card -->
		{#if children}
			{@render children()}
		{/if}
	{/if}
</div>

<style>
	.slot-machine-wrapper {
		perspective: 1000px;
	}
</style>
