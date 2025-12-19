<script lang="ts">
import { onMount } from 'svelte';
import digimonData from '$lib/../data/digimon.json';
import evolutionGraphData from '$lib/../data/evolution-graph.json';
import {
findShortestPaths,
getAllGenerations,
getGenerationLevel,
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

// Build generation lookup map for pathfinding
const digimonGenerations: Map<string, string> = new Map(
(digimonData as Digimon[]).map((d) => [d.name, d.generation])
);

// Get available digimon that exist in both datasets
const availableDigimon = $derived(
Object.keys(evolutionGraph)
.filter((name) => digimonByName.has(name))
.sort()
);

// Available generations for filtering
const generations = getAllGenerations();

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
let maxGeneration = $state(''); // Empty means no limit
let showItemPopup = $state(false);
let popupDigimon = $state<Digimon | null>(null);
let popupPosition = $state({ top: 0, left: 0 });
let popupButtonEl: HTMLButtonElement | undefined = $state();
let popupMenuEl: HTMLDivElement | undefined = $state();

// Refs for dropdown closing
let sourceInputRef: HTMLInputElement | null = null;
let targetInputRef: HTMLInputElement | null = null;

// Search relevance scoring - exact match gets highest score, startsWith next, then includes
function getSearchRelevance(digimonName: string, searchTerm: string): number {
const lowerName = digimonName.toLowerCase();
const lowerSearch = searchTerm.toLowerCase();

if (lowerName === lowerSearch) return 1000; // Exact match
if (lowerName.startsWith(lowerSearch)) return 500; // Starts with
if (lowerName.includes(lowerSearch)) return 100; // Contains
return 0;
}

// Filtered and sorted lists for autocomplete
const filteredSourceDigimon = $derived(() => {
if (!sourceFilter) return availableDigimon;
const filtered = availableDigimon.filter((d) => 
d.toLowerCase().includes(sourceFilter.toLowerCase())
);
// Sort by relevance (closeness to search term), then alphabetically
return filtered.sort((a, b) => {
const relevanceA = getSearchRelevance(a, sourceFilter);
const relevanceB = getSearchRelevance(b, sourceFilter);
if (relevanceA !== relevanceB) return relevanceB - relevanceA;
return a.localeCompare(b);
});
});

const filteredTargetDigimon = $derived(() => {
if (!targetFilter) return availableDigimon;
const filtered = availableDigimon.filter((d) => 
d.toLowerCase().includes(targetFilter.toLowerCase())
);
// Sort by relevance (closeness to search term), then alphabetically
return filtered.sort((a, b) => {
const relevanceA = getSearchRelevance(a, targetFilter);
const relevanceB = getSearchRelevance(b, targetFilter);
if (relevanceA !== relevanceB) return relevanceB - relevanceA;
return a.localeCompare(b);
});
});

function handleSearch() {
searchError = '';
paths = [];
currentPathIndex = 0;

if (!sourceDigimon || !targetDigimon) {
searchError = 'Please select both source and target Digimon';
return;
}

// Check if source/target are within generation limit
if (maxGeneration) {
const maxLevel = getGenerationLevel(maxGeneration);
const sourceGen = digimonGenerations.get(sourceDigimon);
const targetGen = digimonGenerations.get(targetDigimon);

if (sourceGen && getGenerationLevel(sourceGen) > maxLevel) {
searchError = `${sourceDigimon} (${sourceGen}) is above the maximum generation limit (${maxGeneration})`;
return;
}
if (targetGen && getGenerationLevel(targetGen) > maxLevel) {
searchError = `${targetDigimon} (${targetGen}) is above the maximum generation limit (${maxGeneration})`;
return;
}
}

isSearching = true;

// Use setTimeout to allow UI to update
setTimeout(() => {
const options = maxGeneration ? {
maxGeneration,
digimonGenerations
} : undefined;

const foundPaths = findShortestPaths(sourceDigimon, targetDigimon, evolutionGraph, options);

if (foundPaths.length === 0) {
if (maxGeneration) {
searchError = `No evolution path found between ${sourceDigimon} and ${targetDigimon} within ${maxGeneration} generation limit`;
} else {
searchError = `No evolution path found between ${sourceDigimon} and ${targetDigimon}`;
}
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
paths = [];
}

function selectTarget(name: string) {
targetDigimon = name;
targetFilter = name;
showTargetDropdown = false;
paths = [];
}

function clearSource() {
sourceDigimon = '';
sourceFilter = '';
paths = [];
}

function clearTarget() {
targetDigimon = '';
targetFilter = '';
paths = [];
}

function handleSourceInput(e: Event) {
const target = e.target as HTMLInputElement;
sourceFilter = target.value;
showSourceDropdown = true;
if (sourceDigimon && !sourceDigimon.toLowerCase().includes(sourceFilter.toLowerCase())) {
sourceDigimon = '';
}
}

function handleTargetInput(e: Event) {
const target = e.target as HTMLInputElement;
targetFilter = target.value;
showTargetDropdown = true;
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

// Handle item requirement popup
function updatePopupPosition() {
	if (popupButtonEl && popupMenuEl) {
		const rect = popupButtonEl.getBoundingClientRect();
		const menuWidth = popupMenuEl.offsetWidth;
		const menuHeight = popupMenuEl.offsetHeight;
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const spacing = 8;

		// Calculate initial position (centered below button)
		let top = rect.bottom + spacing;
		let left = rect.left + (rect.width / 2) - (menuWidth / 2);

		// Adjust horizontal position if it overflows viewport
		if (left + menuWidth > viewportWidth) {
			left = viewportWidth - menuWidth - spacing;
		}
		if (left < spacing) {
			left = spacing;
		}

		// Flip to above button if it overflows bottom
		if (top + menuHeight > viewportHeight && rect.top - menuHeight - spacing > 0) {
			top = rect.top - menuHeight - spacing;
		}

		popupPosition = { top, left };
	}
}

function handleItemInfoClick(event: MouseEvent, digimon: Digimon, buttonEl: HTMLButtonElement) {
	event.stopPropagation();
	popupDigimon = digimon;
	popupButtonEl = buttonEl;
	showItemPopup = !showItemPopup;
	if (showItemPopup) {
		setTimeout(() => {
			updatePopupPosition();
		}, 0);
	}
}

function closeItemPopup() {
	showItemPopup = false;
	popupDigimon = null;
}

function handleClickOutside(event: MouseEvent) {
	if (showItemPopup && popupButtonEl && popupMenuEl) {
		const target = event.target as Node;
		if (!popupButtonEl.contains(target) && !popupMenuEl.contains(target)) {
			closeItemPopup();
		}
	}
}

onMount(() => {
	window.addEventListener('click', handleClickOutside);
	window.addEventListener('scroll', updatePopupPosition);
	window.addEventListener('resize', updatePopupPosition);

	return () => {
		window.removeEventListener('click', handleClickOutside);
		window.removeEventListener('scroll', updatePopupPosition);
		window.removeEventListener('resize', updatePopupPosition);
	};
});
</script>

<svelte:window onkeydown={handleKeydown} on:click={handleClickOutside} />

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 md:p-4"
onclick={handleBackdropClick}
>
<div
class="w-full max-w-4xl max-h-[95vh] rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-surface shadow-2xl overflow-hidden flex flex-col"
role="dialog"
aria-modal="true"
aria-label="Evolution Pathfinder"
tabindex="-1"
onclick={(e) => e.stopPropagation()}
>
<!-- Header -->
<div class="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 dark:border-border bg-gray-50 dark:bg-surface-100">
<div>
<h2 class="text-lg md:text-xl font-bold text-gray-900 dark:text-muted-50">Evolution Pathfinder</h2>
<p class="text-xs md:text-sm text-gray-600 dark:text-muted-400 mt-0.5">
Find the shortest evolution path between any two Digimon
</p>
</div>
<button
onclick={onClose}
class="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-surface-200 transition-colors"
aria-label="Close pathfinder"
>
<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6 text-gray-500 dark:text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
</svg>
</button>
</div>

<!-- Content -->
<div class="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6">
<!-- Selection Area -->
<div class="flex flex-col gap-3 md:gap-4">
<div class="flex flex-col md:flex-row items-stretch md:items-end gap-3 md:gap-4">
<!-- Source Digimon -->
<div class="flex-1 source-dropdown-container">
<label for="source-digimon-input" class="block text-sm font-medium text-gray-700 dark:text-muted-300 mb-1.5">
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
class="w-full px-3 py-2.5 md:px-4 md:py-3 pr-16 rounded-lg border border-gray-300 dark:border-border bg-white dark:bg-surface-100 text-gray-900 dark:text-muted-50 placeholder-gray-400 dark:placeholder-muted-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm md:text-base"
/>
<div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
{#if sourceDigimon}
<button
type="button"
onclick={clearSource}
class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-surface-200 transition-colors"
aria-label="Clear selection"
>
<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
</svg>
</button>
{#if getDigimonInfo(sourceDigimon)?.iconUrl}
<img src={getDigimonInfo(sourceDigimon)?.iconUrl} alt={sourceDigimon} class="w-7 h-7 md:w-8 md:h-8 rounded-md" />
{/if}
{/if}
</div>
{#if showSourceDropdown && filteredSourceDigimon().length > 0}
<div class="absolute z-20 w-full mt-1 max-h-48 md:max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-surface shadow-lg">
{#each filteredSourceDigimon().slice(0, 50) as name (name)}
{@const info = getDigimonInfo(name)}
<button
type="button"
class="w-full px-3 py-2 flex items-center gap-2 md:gap-3 hover:bg-gray-100 dark:hover:bg-surface-100 transition-colors text-left"
onclick={() => selectSource(name)}
>
{#if info?.iconUrl}
<img src={info.iconUrl} alt={name} class="w-7 h-7 md:w-8 md:h-8 rounded-md flex-shrink-0" />
{:else}
<div class="w-7 h-7 md:w-8 md:h-8 rounded-md bg-gray-200 dark:bg-surface-200 flex-shrink-0"></div>
{/if}
<div class="min-w-0">
<div class="font-medium text-sm text-gray-900 dark:text-muted-50 truncate">{$i18n.t(name)}</div>
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
class="self-center md:self-auto p-2 md:p-3 rounded-full border border-gray-300 dark:border-border bg-white dark:bg-surface-100 hover:bg-gray-100 dark:hover:bg-surface-200 transition-colors flex-shrink-0"
aria-label="Swap source and target"
title="Swap"
>
<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 text-gray-600 dark:text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
<path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
</svg>
</button>

<!-- Target Digimon -->
<div class="flex-1 target-dropdown-container">
<label for="target-digimon-input" class="block text-sm font-medium text-gray-700 dark:text-muted-300 mb-1.5">
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
class="w-full px-3 py-2.5 md:px-4 md:py-3 pr-16 rounded-lg border border-gray-300 dark:border-border bg-white dark:bg-surface-100 text-gray-900 dark:text-muted-50 placeholder-gray-400 dark:placeholder-muted-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm md:text-base"
/>
<div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
{#if targetDigimon}
<button
type="button"
onclick={clearTarget}
class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-surface-200 transition-colors"
aria-label="Clear selection"
>
<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
</svg>
</button>
{#if getDigimonInfo(targetDigimon)?.iconUrl}
<img src={getDigimonInfo(targetDigimon)?.iconUrl} alt={targetDigimon} class="w-7 h-7 md:w-8 md:h-8 rounded-md" />
{/if}
{/if}
</div>
{#if showTargetDropdown && filteredTargetDigimon().length > 0}
<div class="absolute z-20 w-full mt-1 max-h-48 md:max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-surface shadow-lg">
{#each filteredTargetDigimon().slice(0, 50) as name (name)}
{@const info = getDigimonInfo(name)}
<button
type="button"
class="w-full px-3 py-2 flex items-center gap-2 md:gap-3 hover:bg-gray-100 dark:hover:bg-surface-100 transition-colors text-left"
onclick={() => selectTarget(name)}
>
{#if info?.iconUrl}
<img src={info.iconUrl} alt={name} class="w-7 h-7 md:w-8 md:h-8 rounded-md flex-shrink-0" />
{:else}
<div class="w-7 h-7 md:w-8 md:h-8 rounded-md bg-gray-200 dark:bg-surface-200 flex-shrink-0"></div>
{/if}
<div class="min-w-0">
<div class="font-medium text-sm text-gray-900 dark:text-muted-50 truncate">{$i18n.t(name)}</div>
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

<!-- Max Generation Filter -->
<div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
<label for="max-generation" class="text-sm font-medium text-gray-700 dark:text-muted-300 whitespace-nowrap">
Max Generation:
</label>
<select
id="max-generation"
bind:value={maxGeneration}
onchange={() => { paths = []; }}
class="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-border bg-white dark:bg-surface-100 text-gray-900 dark:text-muted-50 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
>
<option value="">No limit</option>
{#each generations as gen (gen)}
<option value={gen}>{gen}</option>
{/each}
</select>
{#if maxGeneration}
<span class="text-xs text-gray-500 dark:text-muted-400">
(Path limited to {maxGeneration} and below)
</span>
{/if}
</div>
</div>

<!-- Search Button -->
<div class="flex justify-center">
<button
onclick={handleSearch}
disabled={isSearching || !sourceDigimon || !targetDigimon}
class="px-6 md:px-8 py-2.5 md:py-3 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center gap-2 text-sm md:text-base"
>
{#if isSearching}
<svg class="animate-spin h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
Searching...
{:else}
<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
</svg>
Find Path
{/if}
</button>
</div>

<!-- Error Message -->
{#if searchError}
<div class="p-3 md:p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-center text-sm">
{searchError}
</div>
{/if}

<!-- Results -->
{#if paths.length > 0}
<div class="space-y-3 md:space-y-4">
<!-- Path Info Header -->
<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
<div class="text-base md:text-lg font-semibold text-gray-900 dark:text-muted-50">
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
class="p-1.5 md:p-2 rounded-md border border-gray-300 dark:border-border bg-white dark:bg-surface-100 hover:bg-gray-100 dark:hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
aria-label="Previous path"
>
<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
</svg>
</button>
<span class="text-xs md:text-sm text-gray-600 dark:text-muted-400 whitespace-nowrap">
Path {currentPathIndex + 1}/{paths.length}
</span>
<button
onclick={() => currentPathIndex = Math.min(paths.length - 1, currentPathIndex + 1)}
disabled={currentPathIndex === paths.length - 1}
class="p-1.5 md:p-2 rounded-md border border-gray-300 dark:border-border bg-white dark:bg-surface-100 hover:bg-gray-100 dark:hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
aria-label="Next path"
>
<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
</svg>
</button>
</div>
{/if}
</div>

<!-- Compact Path Visualization -->
<div class="p-2 md:p-3 rounded-lg bg-gray-50 dark:bg-surface-100 border border-gray-200 dark:border-border">
<div class="flex flex-wrap items-center justify-center gap-1 md:gap-2">
{#each pathDigimon() as digimonName, index (digimonName + '-' + index)}
{@const info = getDigimonInfo(digimonName)}
{@const step = index > 0 ? currentPath.steps[index - 1] : null}

<!-- Arrow (not for first item) -->
{#if index > 0 && step}
<span class="text-lg md:text-xl font-bold {step.direction === 'up' ? 'text-green-500' : 'text-orange-500'}">
{getDirectionLabel(step.direction)}
</span>
{/if}

<!-- Compact Digimon Card -->
<div class="flex-shrink-0 w-16 md:w-20 p-1.5 md:p-2 rounded-lg bg-white dark:bg-surface border border-gray-200 dark:border-border shadow-sm text-center {index === 0 ? 'ring-2 ring-blue-500' : ''} {index === pathDigimon().length - 1 ? 'ring-2 ring-green-500' : ''}">
<div class="relative">
{#if info?.iconUrl}
<a href={info.detailsUrl} target="_blank" rel="noopener noreferrer" class="block hover:opacity-80 transition-opacity">
<img src={info.iconUrl} alt={digimonName} class="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-md bg-gray-100 dark:bg-surface-200" />
</a>
{:else}
<div class="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-md bg-gray-200 dark:bg-surface-200"></div>
{/if}

<!-- Info icon for digimon requiring special items -->
{#if info?.evolutionRequirements?.requiredItem}
	<button
		onclick={(e) => {
			const btn = e.currentTarget as HTMLButtonElement;
			handleItemInfoClick(e as MouseEvent, info, btn);
		}}
		class="absolute -top-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white text-[6px] md:text-[8px] rounded-full w-3 h-3 md:w-4 md:h-4 flex items-center justify-center shadow-md cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400"
		title="Click for evolution requirements"
		aria-label="Show evolution requirements for {digimonName}"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-1.5 w-1.5 md:h-2 md:w-2"
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
<div class="mt-1 font-medium text-[10px] md:text-xs text-gray-900 dark:text-muted-50 truncate" title={$i18n.t(digimonName)}>
	{$i18n.t(digimonName)}
</div>
{#if info}
<div class="text-[9px] md:text-[10px] text-gray-500 dark:text-muted-400 truncate">
	{$i18n.t(info.generation)}
</div>
<div class="flex items-center justify-center gap-0.5 mt-0.5">
	{#if getAttributeIconUrl(info.attribute)}
		<img src={getAttributeIconUrl(info.attribute)} alt={info.attribute} class="w-2.5 h-2.5 md:w-3 md:h-3 dark:invert-0 invert" />
	{/if}
	<span class="text-[8px] md:text-[9px] text-gray-500 dark:text-muted-400 truncate">{$i18n.t(info.attribute)}</span>
</div>
<!-- Base Personality -->
<div class="text-[8px] md:text-[9px] text-purple-600 dark:text-purple-400 truncate mt-0.5" title="Base Personality">
	{info.basePersonality}
</div>
{/if}
</div>
{/each}
</div>
</div>

<!-- Path Summary Text -->
<div class="text-xs md:text-sm text-gray-600 dark:text-muted-400 text-center">
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
<div class="text-center text-gray-500 dark:text-muted-400 py-6 md:py-8">
<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
<path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
</svg>
<p class="text-sm md:text-base">Select an origin and destination Digimon to find the shortest evolution path.</p>
<p class="text-xs md:text-sm mt-2">The algorithm considers both digivolution and de-digivolution as valid steps.</p>
</div>
{/if}

<!-- Portal: Item Requirement Popup -->
{#if showItemPopup && popupDigimon?.evolutionRequirements?.requiredItem}
	<div 
		bind:this={popupMenuEl}
			class="fixed z-[9999] bg-white dark:bg-surface border border-gray-200 dark:border-border rounded-lg shadow-xl p-4 max-w-sm w-80"
			style="top: {popupPosition.top}px; left: {popupPosition.left}px;"
			role="menu"
			tabindex="-1"
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
					<p class="font-medium text-gray-900 dark:text-muted-50">{popupDigimon.name}</p>
				</div>

				<div>
					<span class="text-gray-500 dark:text-muted-400">Required Item:</span>
					<p class="font-medium text-blue-600 dark:text-blue-400">{popupDigimon.evolutionRequirements.requiredItem}</p>
				</div>

				{#if popupDigimon.evolutionRequirements.agentRank || popupDigimon.evolutionRequirements.stats || popupDigimon.evolutionRequirements.agentSkills}
					<div class="border-t border-gray-200 dark:border-border pt-2">
						<span class="text-gray-500 dark:text-muted-400">Requirements:</span>
						<div class="mt-1 space-y-1 text-gray-700 dark:text-muted-300">
							{#if popupDigimon.evolutionRequirements.agentRank}
								<div>• Agent Rank: <span class="font-medium">{popupDigimon.evolutionRequirements.agentRank}</span></div>
							{/if}
							{#if popupDigimon.evolutionRequirements.agentSkills}
								<div>• Agent Skills:</div>
								{#if popupDigimon.evolutionRequirements.agentSkills.valor}
									<div class="ml-4"><span class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded text-xs font-medium">Valor {popupDigimon.evolutionRequirements.agentSkills.valor}</span></div>
								{/if}
								{#if popupDigimon.evolutionRequirements.agentSkills.philanthropy}
									<div class="ml-4"><span class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-1.5 py-0.5 rounded text-xs font-medium">Philanthropy {popupDigimon.evolutionRequirements.agentSkills.philanthropy}</span></div>
								{/if}
								{#if popupDigimon.evolutionRequirements.agentSkills.amicability}
									<div class="ml-4"><span class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs font-medium">Amicability {popupDigimon.evolutionRequirements.agentSkills.amicability}</span></div>
								{/if}
								{#if popupDigimon.evolutionRequirements.agentSkills.wisdom}
									<div class="ml-4"><span class="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded text-xs font-medium">Wisdom {popupDigimon.evolutionRequirements.agentSkills.wisdom}</span></div>
								{/if}
							{/if}
							{#if popupDigimon.evolutionRequirements.stats && Object.keys(popupDigimon.evolutionRequirements.stats).length > 0}
								<div>• Stats: {Object.entries(popupDigimon.evolutionRequirements.stats).map(([stat, value]) => `${stat} ${value}`).join(', ')}</div>
							{/if}
						</div>
					</div>
				{/if}

				{#if popupDigimon.evolutionRequirements.minBossOrder}
					<div class="border-t border-gray-200 dark:border-border pt-2">
						<span class="text-gray-500 dark:text-muted-400">Story Progress:</span>
						<p class="mt-1 text-gray-600 dark:text-muted-400">Available at Boss Order #{popupDigimon.evolutionRequirements.minBossOrder}</p>
					</div>
				{/if}
			</div>
	</div>
{/if}

</div>
</div>
</div>
{/if}
