<script lang="ts">
	import type { Boss, Element, DamageElement, Attribute } from '$lib/types/boss';
	import Button from '$lib/components/common/Button.svelte';

	interface Props {
		currentBossOrder: number;
		bosses: Boss[];
		onNavigate: (bossOrder: number) => void;
		includeDLCBosses?: boolean;
	}

	let { currentBossOrder, bosses, onNavigate, includeDLCBosses = false }: Props = $props();

	// Filter bosses based on DLC setting - only filter out DLC bosses, keep required bosses always
	const filteredBosses = $derived(
		bosses.filter(b => !b.optional || (b.optional && includeDLCBosses) || b.order === 0)
	);

	// Get the count of bosses in filtered list (excluding boss 0 which is always shown but optional)
	const requiredBossCount = $derived(filteredBosses.filter(b => b.order !== 0).length);

	// Calculate current boss number (1-based, excluding boss 0)
	const currentBossNumber = $derived(() => {
		return filteredBosses.filter(b => b.order !== 0 && b.order <= currentBossOrder).length;
	});

	const currentBoss = $derived(filteredBosses.find((b) => b.order === currentBossOrder));
	const previousBoss = $derived(
		filteredBosses.filter((b) => b.order < currentBossOrder).sort((a, b) => b.order - a.order)[0]
	);
	const nextBoss = $derived(filteredBosses.find((b) => b.order === currentBossOrder + 1));

	// Check if we're at the last boss (last in filtered list, regardless of optional status)
	const isLastBoss = $derived(!nextBoss && currentBoss);

	// Check if we can go back (skip optional bosses if needed based on current position)
	const canGoBack = $derived(currentBossOrder > 1 || currentBossOrder === 1);
	// Allow forward navigation on last boss to trigger celebration
	const canGoForward = $derived(nextBoss !== undefined || isLastBoss);

	let showCelebration = $state(false);

	function goBack() {
		if (previousBoss) {
			onNavigate(previousBoss.order);
		}
	}

	function goForward() {
		if (nextBoss) {
			onNavigate(nextBoss.order);
		} else if (isLastBoss) {
			// Show celebration!
			showCelebration = true;
		}
	}

	// Helper to check if an element is an attribute
	function isAttribute(element: Element): element is Attribute {
		return element === 'Vaccine' || element === 'Data' || element === 'Virus';
	}

	// Helper to separate attributes from damage elements
	function separateElements(elements?: Element[]): {
		attributes: Attribute[];
		damageElements: DamageElement[];
	} {
		if (!elements) return { attributes: [], damageElements: [] };
		const attributes: Attribute[] = [];
		const damageElements: DamageElement[] = [];
		for (const element of elements) {
			if (isAttribute(element)) {
				attributes.push(element);
			} else {
				damageElements.push(element as DamageElement);
			}
		}
		return { attributes, damageElements };
	}

	// Get attribute icon URL from Grindosaur CDN
	function getAttributeIconUrl(attribute: Attribute): string {
		const attributeMap: Record<Attribute, string> = {
			Vaccine: 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/vaccine-icon.png',
			Data: 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/data-icon.png',
			Virus: 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/virus-icon.png'
		};
		return attributeMap[attribute];
	}

	// Element display configuration with colors (for colored dots)
	const damageElementConfig: Record<DamageElement, { color: string; bgColor: string }> = {
		Fire: { color: 'bg-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
		Water: { color: 'bg-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
		Ice: { color: 'bg-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
		Wind: { color: 'bg-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
		Plant: { color: 'bg-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
		Earth: { color: 'bg-amber-700', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
		Electric: { color: 'bg-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
		Light: { color: 'bg-yellow-200', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
		Dark: { color: 'bg-purple-900', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
		Steel: { color: 'bg-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
		Neutral: { color: 'bg-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-900/30' }
	};
</script>

<div
	class="rounded-md border border-gray-200 dark:border-border bg-white dark:bg-[rgba(8,14,32,0.80)] backdrop-blur-sm p-4 shadow-panel-light dark:shadow-panel"
>
	<h3 class="text-lg font-semibold text-gray-900 dark:text-muted-50 mb-2">Boss Progress</h3>
	<p class="text-sm text-gray-600 dark:text-muted mb-4">
		Current objective shown below. Click <strong>Next</strong> after defeating each boss.
	</p>

	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
		<Button variant="outline" onclick={goBack} disabled={!canGoBack} class="flex items-center gap-1 justify-center md:justify-start">
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
					d="M15 19l-7-7 7-7"
				/>
			</svg>
			Previous
		</Button>

		<div class="flex-1 order-first md:order-none">
			<div class="rounded-lg p-4 flex flex-col items-center">
				<div class="flex items-center justify-center gap-2 mb-2">
					<span class="inline-flex items-baseline px-2 py-1 rounded-full text-xs font-bold bg-amber-500 text-white uppercase tracking-wide">
						Current Objective
					</span>
				</div>
				{#if currentBoss}
				<div class="flex items-center justify-center gap-3 mb-2 flex-wrap">
					{#if currentBoss.imageUrl}
						<img
							src={currentBoss.imageUrl}
							alt={currentBoss.name}
							class="w-12 h-12 object-contain"
						/>
					{/if}
					<div class="text-lg font-bold text-gray-900 dark:text-muted-50 text-center">
						{currentBoss.name}
						{#if currentBoss.optional}
							<span class="text-sm text-gray-500 dark:text-muted">(Optional)</span>
						{/if}
					</div>
				</div>
				<div class="text-sm md:text-base text-gray-600 dark:text-muted font-medium text-center">
					Level {currentBoss.level} • {currentBoss.location}
				</div>
				<div class="text-sm text-gray-500 dark:text-muted-600 mt-1 text-center">
					Boss {currentBossNumber()} / {requiredBossCount}
				</div>
				{#if currentBoss.guideUrl}
					<a
						href={currentBoss.guideUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center gap-1 mt-1"
					>
						View Strategy Guide
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
					</a>
				{/if}
				{:else}
					<div class="text-gray-500 dark:text-muted text-center">No boss selected</div>
				{/if}
			</div>
		</div>

		<Button
			variant="outline"
			onclick={goForward}
			disabled={!canGoForward}
			class="flex items-center gap-1 justify-center md:justify-start"
		>
			Next
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</Button>
	</div>

	{#if currentBoss && (currentBoss.weaknesses || currentBoss.resistances || currentBoss.immunities)}
		<div class="mt-4 pt-4 border-t border-gray-200 dark:border-border space-y-3">
			<h4 class="text-sm font-medium text-gray-700 dark:text-muted-100 mb-2">
				Damage Interactions
			</h4>

			{#if currentBoss.weaknesses && currentBoss.weaknesses.length > 0}
				{@const { attributes, damageElements } = separateElements(currentBoss.weaknesses)}
				<div class="flex items-start gap-2">
					<span class="text-xs font-medium text-gray-600 dark:text-muted min-w-[70px]">
						Weak to:
					</span>
					<div class="flex flex-wrap gap-1">
						{#each attributes as attribute}
							<span
								class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
								title={attribute}
							>
							<img src={getAttributeIconUrl(attribute)} alt={attribute} class="w-3 h-3 dark:invert-0 invert" />
								<span>{attribute}</span>
							</span>
						{/each}
						{#each damageElements as element}
							<span
								class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
								title={element}
							>
								<span class="w-2 h-2 rounded-full {damageElementConfig[element].color}"></span>
								<span>{element}</span>
							</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if currentBoss.resistances && currentBoss.resistances.length > 0}
				{@const { attributes, damageElements } = separateElements(currentBoss.resistances)}
				<div class="flex items-start gap-2">
					<span class="text-xs font-medium text-gray-600 dark:text-muted min-w-[70px]">
						Resists:
					</span>
					<div class="flex flex-wrap gap-1">
						{#each attributes as attribute}
							<span
								class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
								title={attribute}
							>
							<img src={getAttributeIconUrl(attribute)} alt={attribute} class="w-3 h-3 dark:invert-0 invert" />
								<span>{attribute}</span>
							</span>
						{/each}
						{#each damageElements as element}
							<span
								class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
								title={element}
							>
								<span class="w-2 h-2 rounded-full {damageElementConfig[element].color}"></span>
								<span>{element}</span>
							</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if currentBoss.immunities && currentBoss.immunities.length > 0}
				{@const { attributes, damageElements } = separateElements(currentBoss.immunities)}
				<div class="flex items-start gap-2">
					<span class="text-xs font-medium text-gray-600 dark:text-muted min-w-[70px]">
						Immune to:
					</span>
					<div class="flex flex-wrap gap-1">
						{#each attributes as attribute}
							<span
								class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
								title={attribute}
							>
							<img src={getAttributeIconUrl(attribute)} alt={attribute} class="w-3 h-3 dark:invert-0 invert" />
								<span>{attribute}</span>
							</span>
						{/each}
						{#each damageElements as element}
							<span
								class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
								title={element}
							>
								<span class="w-2 h-2 rounded-full {damageElementConfig[element].color}"></span>
								<span>{element}</span>
							</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if nextBoss}
		<div class="mt-4 pt-4 border-t border-gray-200 dark:border-border">
			<div class="text-sm text-gray-600 dark:text-muted">
				<span class="font-medium text-gray-700 dark:text-muted-100">Next:</span>
				{nextBoss.name} (Lv. {nextBoss.level})
				{#if nextBoss.optional}
					<span class="text-xs text-gray-500 dark:text-muted">(Optional)</span>
				{/if}
			</div>
		</div>
	{:else if isLastBoss && !showCelebration}
		<div class="mt-4 pt-4 border-t border-gray-200 dark:border-border">
			<div class="text-sm text-secondary-500 dark:text-secondary-400 font-medium text-center">
				🎉 All bosses defeated! Click <strong>Next</strong> to celebrate!
			</div>
		</div>
	{/if}
</div>

{#if showCelebration}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300" onclick={() => showCelebration = false}>
		<div class="bg-white dark:bg-surface-100 rounded-lg p-8 shadow-2xl text-center max-w-md mx-4 animate-in zoom-in duration-300">
			<div class="text-6xl mb-4 animate-bounce">🎉</div>
			<h2 class="text-3xl font-bold text-gray-900 dark:text-muted-50 mb-2">Congratulations!</h2>
			<p class="text-lg text-gray-700 dark:text-muted-300 mb-4">
				You've completed the challenge!
			</p>
			<p class="text-sm text-gray-600 dark:text-muted mb-6">
				All required bosses have been defeated. Great job, Tamer!
			</p>
			<button 
				onclick={() => showCelebration = false}
				class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors"
			>
				Awesome! 🎊
			</button>
		</div>
	</div>
	<!-- Confetti animation -->
	<div class="fixed inset-0 z-40 pointer-events-none">
		{#each Array(50) as _, i}
			<div 
				class="absolute animate-confetti"
				style="
					left: {Math.random() * 100}%;
					top: -10%;
					animation-delay: {Math.random() * 2}s;
					animation-duration: {3 + Math.random() * 2}s;
				"
			>
				<span class="text-2xl" style="transform: rotate({Math.random() * 360}deg);">
					{['🎉', '🎊', '⭐', '✨', '🎆', '🎇'][Math.floor(Math.random() * 6)]}
				</span>
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes confetti {
		0% {
			transform: translateY(0) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: translateY(100vh) rotate(720deg);
			opacity: 0;
		}
	}
	
	.animate-confetti {
		animation: confetti linear forwards;
	}
</style>
