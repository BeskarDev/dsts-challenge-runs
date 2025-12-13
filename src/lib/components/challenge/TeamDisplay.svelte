<script lang="ts">
	import type { Digimon } from '$lib/types/digimon';
	import DigimonCard from './DigimonCard.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import { i18n } from '$lib/i18n';

	interface Props {
		team: Digimon[];
		onRerollSlot?: (slotIndex: number) => void;
		onRerollAll?: () => void;
		showRerollButtons?: boolean;
		levelCap?: number | null;
		currentGeneration?: string;
	}

	let {
		team,
		onRerollSlot,
		onRerollAll,
		showRerollButtons = true,
		levelCap,
		currentGeneration
	}: Props = $props();

	// Reactive translation for the current generation label
	let translatedGeneration = $derived(currentGeneration ? $i18n.t(currentGeneration) : '');
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
						<span
							class="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
						>
							<span class="font-semibold">Cap:</span>&nbsp;Lv.{levelCap}
						</span>
					{/if}
					{#if currentGeneration}
						<span
							class="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
						>
							<span class="font-semibold">Max:</span>&nbsp;{translatedGeneration}
						</span>
					{/if}
				</div>
			{/if}
		</div>
		{#if showRerollButtons && onRerollAll}
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

	<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
		{#each team as digimon, index (digimon.number + '-' + index)}
			<DigimonCard
				{digimon}
				slotIndex={index}
				onReroll={onRerollSlot}
				showRerollButton={showRerollButtons}
			/>
		{/each}
	</div>

	{#if team.length === 0}
		<div class="text-center py-8 text-gray-500 dark:text-muted">
			No team members yet. Generate a team to start!
		</div>
	{/if}
</div>
