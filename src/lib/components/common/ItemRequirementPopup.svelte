<script lang="ts">
	import { VULCANUSMON_BOSS_ORDER } from '$lib/utils/boss-progression';
	import type { DigivolutionRequirement } from '$lib/types/digimon';
	
	interface Props {
		isOpen: boolean;
		onClose: () => void;
		requirements: DigivolutionRequirement;
		digimonName: string;
		x: number;
		y: number;
	}

	let { isOpen, onClose, requirements, digimonName, x, y }: Props = $props();

	// Get story progress information based on required item
	function getStoryProgressInfo(item: string): { bossName: string; description: string; bossOrder?: number; unlockHint?: string } | null {
		if (!item) return null;
		
		const itemLower = item.toLowerCase();
		
		// Digi-Eggs (Armor Digimon)
		if (itemLower.includes('digi-egg')) {
			return {
				bossName: 'Vulcanusmon',
				description: 'Available after defeating Vulcanusmon (Boss #10)',
				bossOrder: VULCANUSMON_BOSS_ORDER,
				unlockHint: 'Digi-Eggs are found in various locations after this boss fight. Check exploration areas and complete side quests.'
			};
		}
		
		// Human/Beast Spirits (Hybrid Digimon)  
		if (itemLower.includes('spirit')) {
			const isHuman = itemLower.includes('human spirit');
			const isBeast = itemLower.includes('beast spirit');
			
			return {
				bossName: 'Vulcanusmon',
				description: `${isHuman ? 'Human' : isBeast ? 'Beast' : ''} Spirits available after Vulcanusmon (Boss #10)`,
				bossOrder: VULCANUSMON_BOSS_ORDER,
				unlockHint: `${isHuman ? 'Human Spirits are typically found earlier in story dungeons.' : isBeast ? 'Beast Spirits are often rewards from challenging late-game areas.' : 'Spirits are found throughout your journey in special locations.'}`
			};
		}
		
		// Special cases for other items
		if (itemLower.includes('omni blade')) {
			return {
				bossName: 'Endgame',
				description: 'Available in very late game progression',
				unlockHint: 'This rare item is obtained through late-game content.'
			};
		}
		
		// Default for any special item
		return {
			bossName: 'Story Progress',
			description: 'Requires specific story progression to unlock',
			unlockHint: 'Complete story missions and explore thoroughly to find this item.'
		};
	}

	// Get item description/hint
	function getItemDescription(item: string): string {
		const itemLower = item.toLowerCase();
		
		if (itemLower.includes('digi-egg')) {
			return 'Armor Digivolution requires specific Digi-Eggs obtained through story progression.';
		}
		
		if (itemLower.includes('spirit')) {
			if (itemLower.includes('human spirit')) {
				return 'Hybrid Digivolution requires Human Spirits found during your journey.';
			}
			if (itemLower.includes('beast spirit')) {
				return 'Advanced Hybrid Digivolution requires Beast Spirits unlocked through story progression.';
			}
			return 'Hybrid Digivolution requires special Spirits obtained during story progression.';
		}
		
		return 'This Digimon requires a special item to evolve.';
	}

	// Handle clicking outside to close
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.item-popup')) {
			onClose();
		}
	}

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
		}
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	const progressInfo = $derived(requirements.requiredItem ? getStoryProgressInfo(requirements.requiredItem) : null);
	const itemDescription = $derived(requirements.requiredItem ? getItemDescription(requirements.requiredItem) : '');
</script>

{#if isOpen && requirements.requiredItem}
	<!-- Backdrop -->
	<div class="fixed inset-0 bg-black/20 z-[9998]"></div>
	
	<!-- Popup -->
	<div 
		class="item-popup fixed z-[9999] bg-white dark:bg-surface border border-gray-200 dark:border-border rounded-lg shadow-xl p-4 max-w-sm w-64"
		style="left: {Math.max(16, Math.min(x - 128, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 280))}px; top: {Math.max(16, y + 8)}px;"
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
				onclick={onClose}
				class="text-gray-400 hover:text-gray-600 dark:hover:text-muted-200 transition-colors"
				aria-label="Close evolution requirements popup"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Digimon Name -->
		<div class="mb-3">
			<span class="text-xs text-gray-500 dark:text-muted-400">Digimon:</span>
			<p class="font-medium text-sm text-gray-900 dark:text-muted-50">{digimonName}</p>
		</div>

		<!-- Required Item -->
		<div class="mb-3">
			<span class="text-xs text-gray-500 dark:text-muted-400">Required Item:</span>
			<p class="font-medium text-sm text-blue-600 dark:text-blue-400">{requirements.requiredItem}</p>
		</div>

		<!-- Description -->
		<div class="mb-3">
			<span class="text-xs text-gray-500 dark:text-muted-400">Description:</span>
			<p class="text-xs text-gray-700 dark:text-muted-300 leading-relaxed">{itemDescription}</p>
		</div>

		<!-- Story Progress -->
		{#if progressInfo}
			<div class="mb-3">
				<span class="text-xs text-gray-500 dark:text-muted-400">Story Progress:</span>
				<div class="flex items-center gap-2 mt-1">
					<div class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs font-medium">
						{progressInfo.bossName}
					</div>
					{#if progressInfo.bossOrder}
						<span class="text-xs text-gray-500 dark:text-muted-400">#{progressInfo.bossOrder}</span>
					{/if}
				</div>
				<p class="text-xs text-gray-600 dark:text-muted-400 mt-1">{progressInfo.description}</p>
				{#if progressInfo.unlockHint}
					<div class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
						<div class="flex items-start gap-2">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span class="text-blue-700 dark:text-blue-300 leading-relaxed">{progressInfo.unlockHint}</span>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Additional Requirements -->
		{#if requirements.agentRank || requirements.stats || requirements.agentSkills}
			<div class="border-t border-gray-200 dark:border-border pt-3">
				<span class="text-xs text-gray-500 dark:text-muted-400 mb-2 block">Additional Requirements:</span>
				
				{#if requirements.agentRank}
					<div class="text-xs text-gray-700 dark:text-muted-300 mb-1">
						• Agent Rank: <span class="font-medium">{requirements.agentRank}</span>
					</div>
				{/if}
				
				{#if requirements.agentSkills}
					<div class="text-xs text-gray-700 dark:text-muted-300 mb-1">
						• Agent Skills:
						<div class="ml-2 mt-1 flex flex-wrap gap-1">
							{#if requirements.agentSkills.valor}
								<span class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded text-xs font-medium">Valor {requirements.agentSkills.valor}</span>
							{/if}
							{#if requirements.agentSkills.philanthropy}
								<span class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-1.5 py-0.5 rounded text-xs font-medium">Philanthropy {requirements.agentSkills.philanthropy}</span>
							{/if}
							{#if requirements.agentSkills.amicability}
								<span class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs font-medium">Amicability {requirements.agentSkills.amicability}</span>
							{/if}
							{#if requirements.agentSkills.wisdom}
								<span class="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded text-xs font-medium">Wisdom {requirements.agentSkills.wisdom}</span>
							{/if}
						</div>
					</div>
				{/if}
				
				{#if requirements.stats && Object.keys(requirements.stats).length > 0}
					<div class="text-xs text-gray-700 dark:text-muted-300">
						• Stats: 
					{#each Object.entries(requirements.stats) as [stat, value] (stat)}
						<span class="font-medium capitalize">{stat} {value}</span> 
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}