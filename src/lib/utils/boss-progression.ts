import type { Digimon, DigivolutionRequirement } from '../types/digimon';

/**
 * Boss progression logic for determining digimon availability
 */

/**
 * Vulcanusmon boss order - this is when most special items (digi-eggs, spirits) become available
 */
export const VULCANUSMON_BOSS_ORDER = 10;

/**
 * Default minimum boss order for digimon with special item requirements
 */
export const DEFAULT_SPECIAL_ITEM_BOSS_ORDER = VULCANUSMON_BOSS_ORDER;

/**
 * Special item mappings to minimum boss orders
 * This can be expanded as we learn more about specific item unlock conditions
 */
export const ITEM_BOSS_ORDER_MAP: Record<string, number> = {
	// Digi-Eggs (Armor Digimon) - most unlock after Vulcanusmon
	'digi-egg of courage': VULCANUSMON_BOSS_ORDER,
	'digi-egg of friendship': VULCANUSMON_BOSS_ORDER,
	'digi-egg of love': VULCANUSMON_BOSS_ORDER,
	'digi-egg of sincerity': VULCANUSMON_BOSS_ORDER,
	'digi-egg of knowledge': VULCANUSMON_BOSS_ORDER,
	'digi-egg of reliability': VULCANUSMON_BOSS_ORDER,
	'digi-egg of hope': VULCANUSMON_BOSS_ORDER,
	'digi-egg of light': VULCANUSMON_BOSS_ORDER,
	'digi-egg of kindness': VULCANUSMON_BOSS_ORDER,
	'digi-egg of miracles': VULCANUSMON_BOSS_ORDER,

	// Human Spirits (Hybrid Digimon) - unlock after Vulcanusmon
	'human spirit of fire': VULCANUSMON_BOSS_ORDER,
	'human spirit of light': VULCANUSMON_BOSS_ORDER,
	'human spirit of ice': VULCANUSMON_BOSS_ORDER,
	'human spirit of wind': VULCANUSMON_BOSS_ORDER,
	'human spirit of thunder': VULCANUSMON_BOSS_ORDER,
	'human spirit of earth': VULCANUSMON_BOSS_ORDER,
	'human spirit of wood': VULCANUSMON_BOSS_ORDER,
	'human spirit of water': VULCANUSMON_BOSS_ORDER,
	'human spirit of steel': VULCANUSMON_BOSS_ORDER,
	'human spirit of darkness': VULCANUSMON_BOSS_ORDER,

	// Beast Spirits (Hybrid Digimon) - unlock after Vulcanusmon
	'beast spirit of fire': VULCANUSMON_BOSS_ORDER,
	'beast spirit of light': VULCANUSMON_BOSS_ORDER,
	'beast spirit of ice': VULCANUSMON_BOSS_ORDER,
	'beast spirit of wind': VULCANUSMON_BOSS_ORDER,
	'beast spirit of thunder': VULCANUSMON_BOSS_ORDER,
	'beast spirit of earth': VULCANUSMON_BOSS_ORDER,
	'beast spirit of wood': VULCANUSMON_BOSS_ORDER,
	'beast spirit of water': VULCANUSMON_BOSS_ORDER,
	'beast spirit of steel': VULCANUSMON_BOSS_ORDER,
	'beast spirit of darkness': VULCANUSMON_BOSS_ORDER
};

/**
 * Determine the minimum boss order required for a digimon based on its evolution requirements
 */
export function getMinBossOrderForDigimon(digimon: Digimon): number | null {
	const requirements = digimon.evolutionRequirements;
	if (!requirements) return null;

	// If explicitly set in requirements, use that
	if (requirements.minBossOrder !== null && requirements.minBossOrder !== undefined) {
		return requirements.minBossOrder;
	}

	// Determine based on required item
	if (requirements.requiredItem) {
		const itemKey = requirements.requiredItem.toLowerCase().trim();
		
		// Direct lookup
		if (ITEM_BOSS_ORDER_MAP[itemKey] !== undefined) {
			return ITEM_BOSS_ORDER_MAP[itemKey];
		}

		// Fuzzy matching for common patterns
		for (const [pattern, bossOrder] of Object.entries(ITEM_BOSS_ORDER_MAP)) {
			if (itemKey.includes(pattern) || pattern.includes(itemKey)) {
				return bossOrder;
			}
		}

		// Default for any unrecognized special item
		if (isSpecialItem(itemKey)) {
			return DEFAULT_SPECIAL_ITEM_BOSS_ORDER;
		}
	}

	// No special boss order requirements
	return null;
}

/**
 * Check if an item is considered a "special item" that requires boss progression
 */
function isSpecialItem(itemName: string): boolean {
	const lowerName = itemName.toLowerCase();
	
	// Known special item patterns
	const specialPatterns = [
		'digi-egg',
		'digimental',
		'spirit',
		'crest',
		'tag',
		'd-arc',
		'scanner'
	];

	// Check for known patterns
	const hasKnownPattern = specialPatterns.some(pattern => lowerName.includes(pattern));
	
	// If it has a known pattern, it's definitely special
	if (hasKnownPattern) return true;
	
	// For unknown items, consider them special if they're not common stat-related terms
	const commonTerms = ['none', 'n/a', '-', ''];
	const isCommonTerm = commonTerms.includes(lowerName) || lowerName.trim() === '';
	
	// If it's not a common term and we have an actual item name, treat it as special
	return !isCommonTerm && itemName.trim().length > 0;
}

/**
 * Filter digimon by boss progression requirements
 */
export function filterDigimonByBossProgression(
	digimon: Digimon[],
	currentBossOrder: number
): Digimon[] {
	return digimon.filter(d => {
		const minBossOrder = getMinBossOrderForDigimon(d);
		
		// If no special requirements, always available
		if (minBossOrder === null) return true;
		
		// Check if current progression meets the requirement
		return currentBossOrder >= minBossOrder;
	});
}

/**
 * Check if a specific digimon is available at the current boss progression
 */
export function isDigimonAvailable(digimon: Digimon, currentBossOrder: number): boolean {
	const minBossOrder = getMinBossOrderForDigimon(digimon);
	
	if (minBossOrder === null) return true;
	
	return currentBossOrder >= minBossOrder;
}

/**
 * Get a summary of digimon availability by boss progression
 */
export function getDigimonAvailabilitySummary(
	digimon: Digimon[]
): { total: number; withRequirements: number; availableAtVulcanusmon: number } {
	let withRequirements = 0;
	let availableAtVulcanusmon = 0;

	for (const d of digimon) {
		const minBossOrder = getMinBossOrderForDigimon(d);
		
		if (minBossOrder !== null) {
			withRequirements++;
			
			if (minBossOrder <= VULCANUSMON_BOSS_ORDER) {
				availableAtVulcanusmon++;
			}
		}
	}

	return {
		total: digimon.length,
		withRequirements,
		availableAtVulcanusmon
	};
}