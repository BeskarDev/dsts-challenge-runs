<script lang="ts">
	import { onMount } from 'svelte';
	import digimonData from '$lib/../data/digimon.json';
	import evolutionGraphData from '$lib/../data/evolution-graph.json';
	import {
		findShortestPaths,
		type EvolutionGraph,
		type EvolutionPath
	} from '$lib/services/evolution-pathfinding';
	import type { Digimon } from '$lib/types/digimon';
	import { i18n } from '$lib/i18n';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	// Extract evolution graph from JSON data with runtime validation
	const rawEvolutionData = evolutionGraphData as { evolutions?: EvolutionGraph };
	const evolutionGraph: EvolutionGraph = rawEvolutionData.evolutions ?? {};

	// Build lookup map using functional approach (immutable after initialization)
	const digimonByName: Map<string, Digimon> = new Map(
		(digimonData as Digimon[]).map((d) => [d.name, d])
	);

	// Get available digimon that exist in both datasets
	const availableDigimon = $derived(
		Object.keys(evolutionGraph)
			.filter((name) => digimonByName.has(name))
			.sort()
	);

	// State
	let sourceDigimon = $state('');
	let targetDigimon = $state('');
	let paths = $state<EvolutionPath[]>([]);
	let currentPathIndex = $state(0);
	let isSearching = $state(false);
	let searchError = $state('');
	let sourceFilter = $state('');
	let targetFilter = $state('');
	let showSourceDropdown = $state(false);
	let showTargetDropdown = $state(false);

	// Refs for dropdown closing
	let sourceInputRef: HTMLInputElement | null = null;
	let targetInputRef: HTMLInputElement | null = null;

	// Filtered lists for autocomplete
	const filteredSourceDigimon = $derived(
		sourceFilter
			? availableDigimon.filter((d) => d.toLowerCase().includes(sourceFilter.toLowerCase()))
			: availableDigimon
	);

	const filteredTargetDigimon = $derived(
		targetFilter
			? availableDigimon.filter((d) => d.toLowerCase().includes(targetFilter.toLowerCase()))
			: availableDigimon
	);

	function handleSearch() {
		searchError = '';
		paths = [];
		currentPathIndex = 0;

		if (!sourceDigimon || !targetDigimon) {
			searchError = 'Please select both source and target Digimon';
			return;
		}

		isSearching = true;

		// Use setTimeout to allow UI to update
		setTimeout(() => {
			const foundPaths = findShortestPaths(sourceDigimon, targetDigimon, evolutionGraph);

			if (foundPaths.length === 0) {
				searchError = `No evolution path found between ${sourceDigimon} and ${targetDigimon}`;
			} else {
				paths = foundPaths;
			}
			isSearching = false;
		}, 10);
	}

	function selectSource(name: string) {
		sourceDigimon = name;
		sourceFilter = name;
		showSourceDropdown = false;
		// Clear paths when selection changes
		paths = [];
	}

	function selectTarget(name: string) {
		targetDigimon = name;
		targetFilter = name;
		showTargetDropdown = false;
		// Clear paths when selection changes
		paths = [];
	}

	function handleSourceInput(e: Event) {
		const target = e.target as HTMLInputElement;
		sourceFilter = target.value;
		showSourceDropdown = true;
		// Clear the actual selection if filter doesn't match
		if (sourceDigimon && !sourceDigimon.toLowerCase().includes(sourceFilter.toLowerCase())) {
			sourceDigimon = '';
		}
	}

	function handleTargetInput(e: Event) {
		const target = e.target as HTMLInputElement;
		targetFilter = target.value;
		showTargetDropdown = true;
		// Clear the actual selection if filter doesn't match
		if (targetDigimon && !targetDigimon.toLowerCase().includes(targetFilter.toLowerCase())) {
			targetDigimon = '';
		}
	}

	function swapDigimon() {
		const temp = sourceDigimon;
		sourceDigimon = targetDigimon;
		targetDigimon = temp;
		sourceFilter = sourceDigimon;
		targetFilter = targetDigimon;
		paths = [];
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (showSourceDropdown || showTargetDropdown) {
				showSourceDropdown = false;
				showTargetDropdown = false;
			} else {
				onClose();
			}
		}
	}

	function getDigimonInfo(name: string): Digimon | undefined {
		return digimonByName.get(name);
	}

	function getDirectionLabel(direction: 'up' | 'down'): string {
		return direction === 'up' ? 'Digivolve' : 'De-digivolve';
	}

	function getDirectionArrow(direction: 'up' | 'down'): string {
		return direction === 'up' ? '↑' : '↓';
	}

	function getAttributeIconUrl(attribute: string): string {
		const attributeMap: Record<string, string> = {
			Vaccine: 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/vaccine-icon.png',
			Data: 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/data-icon.png',
			Virus: 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/virus-icon.png',
			Free: 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/free-icon.png',
			Variable: 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/variable-icon.png',
			Unknown: 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/unknown-icon.png',
			'No Data': 'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/no-data-icon.png'
		};
		return attributeMap[attribute] || '';
	}

	// Close dropdowns when clicking outside
	function handleDocumentClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.source-dropdown-container')) {
			showSourceDropdown = false;
		}
		if (!target.closest('.target-dropdown-container')) {
			showTargetDropdown = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleDocumentClick);
		return () => document.removeEventListener('click', handleDocumentClick);
	});

	// Get all digimon in the current path for display
	const currentPath = $derived(paths[currentPathIndex]);
	const pathDigimon = $derived(() => {
		if (!currentPath || currentPath.steps.length === 0) {
			return sourceDigimon && targetDigimon && sourceDigimon === targetDigimon
				? [sourceDigimon]
				: [];
		}
		const names = [currentPath.steps[0].from];
		for (const step of currentPath.steps) {
			names.push(step.to);
		}
		return names;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
		onclick={handleBackdropClick}
	>
		<!-- Dialog -->
		<div
			class="w-full max-w-4xl max-h-[90vh] rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-surface shadow-2xl overflow-hidden flex flex-col"
			role="dialog"
			aria-modal="true"
			aria-label="Evolution Pathfinder"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-border bg-gray-50 dark:bg-surface-100">
				<div>
					<h2 class="text-xl font-bold text-gray-900 dark:text-muted-50">Evolution Pathfinder</h2>
					<p class="text-sm text-gray-600 dark:text-muted-400 mt-1">
						Find the shortest evolution path between any two Digimon
					</p>
				</div>
				<button
					onclick={onClose}
					class="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-surface-200 transition-colors"
					aria-label="Close pathfinder"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-gray-500 dark:text-muted"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-4 space-y-6">
				<!-- Selection Area -->
				<div class="flex flex-col md:flex-row items-center gap-4">
					<!-- Source Digimon -->
					<div class="flex-1 w-full source-dropdown-container">
						<label for="source-digimon-input" class="block text-sm font-medium text-gray-700 dark:text-muted-300 mb-2">
							Origin Digimon
						</label>
						<div class="relative">
							<input
								id="source-digimon-input"
								bind:this={sourceInputRef}
								type="text"
								value={sourceFilter}
								oninput={handleSourceInput}
								onfocus={() => (showSourceDropdown = true)}
								placeholder="Search Digimon..."
								class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-border bg-white dark:bg-surface-100 text-gray-900 dark:text-muted-50 placeholder-gray-400 dark:placeholder-muted-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
							/>
							{#if sourceDigimon}
								<div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
									{#if getDigimonInfo(sourceDigimon)?.iconUrl}
										<img
											src={getDigimonInfo(sourceDigimon)?.iconUrl}
											alt={sourceDigimon}
											class="w-8 h-8 rounded-md"
										/>
									{/if}
								</div>
							{/if}
							{#if showSourceDropdown && filteredSourceDigimon.length > 0}
								<div class="absolute z-20 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-surface shadow-lg">
									{#each filteredSourceDigimon.slice(0, 50) as name (name)}
										{@const info = getDigimonInfo(name)}
										<button
											type="button"
											class="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-surface-100 transition-colors text-left"
											onclick={() => selectSource(name)}
										>
											{#if info?.iconUrl}
												<img src={info.iconUrl} alt={name} class="w-8 h-8 rounded-md" />
											{:else}
												<div class="w-8 h-8 rounded-md bg-gray-200 dark:bg-surface-200"></div>
											{/if}
											<div>
												<div class="font-medium text-gray-900 dark:text-muted-50">{$i18n.t(name)}</div>
												{#if info}
													<div class="text-xs text-gray-500 dark:text-muted-400">{$i18n.t(info.generation)}</div>
												{/if}
											</div>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- Swap Button -->
					<button
						onclick={swapDigimon}
						class="p-3 rounded-full border border-gray-300 dark:border-border bg-white dark:bg-surface-100 hover:bg-gray-100 dark:hover:bg-surface-200 transition-colors mt-6 md:mt-0"
						aria-label="Swap source and target"
						title="Swap"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
						</svg>
					</button>

					<!-- Target Digimon -->
					<div class="flex-1 w-full target-dropdown-container">
						<label for="target-digimon-input" class="block text-sm font-medium text-gray-700 dark:text-muted-300 mb-2">
							Destination Digimon
						</label>
						<div class="relative">
							<input
								id="target-digimon-input"
								bind:this={targetInputRef}
								type="text"
								value={targetFilter}
								oninput={handleTargetInput}
								onfocus={() => (showTargetDropdown = true)}
								placeholder="Search Digimon..."
								class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-border bg-white dark:bg-surface-100 text-gray-900 dark:text-muted-50 placeholder-gray-400 dark:placeholder-muted-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
							/>
							{#if targetDigimon}
								<div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
									{#if getDigimonInfo(targetDigimon)?.iconUrl}
										<img
											src={getDigimonInfo(targetDigimon)?.iconUrl}
											alt={targetDigimon}
											class="w-8 h-8 rounded-md"
										/>
									{/if}
								</div>
							{/if}
							{#if showTargetDropdown && filteredTargetDigimon.length > 0}
								<div class="absolute z-20 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-surface shadow-lg">
									{#each filteredTargetDigimon.slice(0, 50) as name (name)}
										{@const info = getDigimonInfo(name)}
										<button
											type="button"
											class="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-surface-100 transition-colors text-left"
											onclick={() => selectTarget(name)}
										>
											{#if info?.iconUrl}
												<img src={info.iconUrl} alt={name} class="w-8 h-8 rounded-md" />
											{:else}
												<div class="w-8 h-8 rounded-md bg-gray-200 dark:bg-surface-200"></div>
											{/if}
											<div>
												<div class="font-medium text-gray-900 dark:text-muted-50">{$i18n.t(name)}</div>
												{#if info}
													<div class="text-xs text-gray-500 dark:text-muted-400">{$i18n.t(info.generation)}</div>
												{/if}
											</div>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Search Button -->
				<div class="flex justify-center">
					<button
						onclick={handleSearch}
						disabled={isSearching || !sourceDigimon || !targetDigimon}
						class="px-8 py-3 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center gap-2"
					>
						{#if isSearching}
							<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Searching...
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							Find Path
						{/if}
					</button>
				</div>

				<!-- Error Message -->
				{#if searchError}
					<div class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-center">
						{searchError}
					</div>
				{/if}

				<!-- Results -->
				{#if paths.length > 0}
					<div class="space-y-4">
						<!-- Path Info Header -->
						<div class="flex items-center justify-between">
							<div class="text-lg font-semibold text-gray-900 dark:text-muted-50">
								{#if currentPath.steps.length === 0}
									Already at destination!
								{:else}
									Path found: {currentPath.steps.length} step{currentPath.steps.length !== 1 ? 's' : ''}
								{/if}
							</div>
							{#if paths.length > 1}
								<div class="flex items-center gap-2">
									<button
										onclick={() => currentPathIndex = Math.max(0, currentPathIndex - 1)}
										disabled={currentPathIndex === 0}
										class="p-2 rounded-md border border-gray-300 dark:border-border bg-white dark:bg-surface-100 hover:bg-gray-100 dark:hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										aria-label="Previous path"
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
										</svg>
									</button>
									<span class="text-sm text-gray-600 dark:text-muted-400">
										Path {currentPathIndex + 1} of {paths.length}
									</span>
									<button
										onclick={() => currentPathIndex = Math.min(paths.length - 1, currentPathIndex + 1)}
										disabled={currentPathIndex === paths.length - 1}
										class="p-2 rounded-md border border-gray-300 dark:border-border bg-white dark:bg-surface-100 hover:bg-gray-100 dark:hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										aria-label="Next path"
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
										</svg>
									</button>
								</div>
							{/if}
						</div>

						<!-- Path Visualization -->
						<div class="p-4 rounded-lg bg-gray-50 dark:bg-surface-100 border border-gray-200 dark:border-border overflow-x-auto">
							<div class="flex items-center gap-2 min-w-max">
								{#each pathDigimon() as digimonName, index (digimonName + '-' + index)}
									{@const info = getDigimonInfo(digimonName)}
									{@const step = index > 0 ? currentPath.steps[index - 1] : null}

									<!-- Arrow (not for first item) -->
									{#if index > 0 && step}
										<div class="flex flex-col items-center px-2">
											<span class="text-2xl {step.direction === 'up' ? 'text-green-500' : 'text-orange-500'}">
												{getDirectionArrow(step.direction)}
											</span>
											<span class="text-xs text-gray-500 dark:text-muted-400">
												{getDirectionLabel(step.direction)}
											</span>
										</div>
									{/if}

									<!-- Digimon Card -->
									<div class="flex-shrink-0 w-32 p-3 rounded-lg bg-white dark:bg-surface border border-gray-200 dark:border-border shadow-sm text-center {index === 0 ? 'ring-2 ring-blue-500' : ''} {index === pathDigimon().length - 1 ? 'ring-2 ring-green-500' : ''}">
										{#if info?.iconUrl}
											<a
												href={info.detailsUrl}
												target="_blank"
												rel="noopener noreferrer"
												class="block mb-2 hover:opacity-80 transition-opacity"
											>
												<img
													src={info.iconUrl}
													alt={digimonName}
													class="w-16 h-16 mx-auto rounded-md bg-gray-100 dark:bg-surface-200"
												/>
											</a>
										{:else}
											<div class="w-16 h-16 mx-auto rounded-md bg-gray-200 dark:bg-surface-200 mb-2"></div>
										{/if}
										<a
											href={info?.detailsUrl}
											target="_blank"
											rel="noopener noreferrer"
											class="block font-medium text-sm text-gray-900 dark:text-muted-50 hover:text-primary-500 dark:hover:text-primary-400 transition-colors truncate"
											title={$i18n.t(digimonName)}
										>
											{$i18n.t(digimonName)}
										</a>
										{#if info}
											<div class="text-xs text-gray-500 dark:text-muted-400 mt-1">
												{$i18n.t(info.generation)}
											</div>
											<div class="flex items-center justify-center gap-1 mt-1">
												{#if getAttributeIconUrl(info.attribute)}
													<img
														src={getAttributeIconUrl(info.attribute)}
														alt={info.attribute}
														class="w-3 h-3 dark:invert-0 invert"
													/>
												{/if}
												<span class="text-xs text-gray-500 dark:text-muted-400">{$i18n.t(info.attribute)}</span>
											</div>
										{/if}
										{#if index === 0}
											<span class="inline-block mt-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Origin</span>
										{:else if index === pathDigimon().length - 1}
											<span class="inline-block mt-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Destination</span>
										{/if}
									</div>
								{/each}
							</div>
						</div>

						<!-- Path Summary Text -->
						<div class="text-sm text-gray-600 dark:text-muted-400 text-center">
							{#if currentPath.steps.length > 0}
								{@const upSteps = currentPath.steps.filter(s => s.direction === 'up').length}
								{@const downSteps = currentPath.steps.filter(s => s.direction === 'down').length}
								{upSteps} digivolution{upSteps !== 1 ? 's' : ''}, {downSteps} de-digivolution{downSteps !== 1 ? 's' : ''}
							{/if}
						</div>
					</div>
				{/if}

				<!-- Help Text -->
				{#if paths.length === 0 && !searchError}
					<div class="text-center text-gray-500 dark:text-muted-400 py-8">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
						</svg>
						<p>Select an origin and destination Digimon to find the shortest evolution path.</p>
						<p class="text-sm mt-2">The algorithm considers both digivolution and de-digivolution as valid steps.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
