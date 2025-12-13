import type { EvolutionGeneration } from '../types/digimon';

/**
 * Mapping of non-standard generation Digimon to their equivalent standard generation
 * This allows Armor and Hybrid Digimon to be included in random results at appropriate power levels
 * 
 * Power level mapping based on agent rank requirements and in-game availability:
 * - Champion equivalent: Early armor forms (Agent Rank 1-3)
 * - Ultimate equivalent: Mid-tier armor forms (Agent Rank 4-6)
 * - Mega equivalent: Late-game armor forms (Agent Rank 7+)
 */
export const ARMOR_GENERATION_EQUIVALENTS: Record<string, EvolutionGeneration> = {
	// Early armor forms - Champion level (Agent Rank 1-3)
	'179': 'Champion', // Submarimon
	'180': 'Champion', // Shurimon
	'181': 'Champion', // Digmon
	'182': 'Champion', // Nefertimon
	'183': 'Champion', // Flamedramon
	'184': 'Champion', // Pegasusmon
	'185': 'Champion', // Halsemon
	'186': 'Champion', // Lighdramon
	
	// Late-game armor forms - Mega level (Agent Rank 7+)
	'422': 'Mega', // Rapidmon (Armor) - Agent Rank 7+
	'423': 'Mega', // Magnamon - Agent Rank 7+
};

export const HYBRID_GENERATION_EQUIVALENTS: Record<string, EvolutionGeneration> = {
	// Human Spirit forms (H) - Champion level equivalents
	'187': 'Champion', // Agunimon
	'188': 'Champion', // Lobomon
	'189': 'Champion', // Lanamon
	'190': 'Champion', // Kazemon
	'191': 'Champion', // Beetlemon
	'192': 'Champion', // Kumamon
	
	// Beast Spirit forms (B) - Champion level equivalents
	'193': 'Champion', // BurningGreymon
	'194': 'Champion', // KendoGarurumon
	'195': 'Champion', // Calmaramon
	'196': 'Champion', // Zephyrmon
	'197': 'Champion', // MetalKabuterimon
	
	// Fusion forms (H+B) - Ultimate level equivalents
	'305': 'Ultimate', // Aldamon
	'306': 'Ultimate', // Beowolfmon
	
	// Ancient Spirit forms - Mega level equivalents
	'424': 'Mega', // EmperorGreymon
	'425': 'Mega', // MagnaGarurumon
	'426': 'Mega', // MagnaGarurumon (Detached)
};

/**
 * Lucemon line - Special case for evolution tiers
 * Lucemon breaks the normal progression due to availability mechanics:
 * - Rookie form available at Ultimate tier
 * - Ultimate form available at Mega tier
 * - Mega+ form available at Mega+ tier (normal)
 */
export const LUCEMON_GENERATION_EQUIVALENTS: Record<string, EvolutionGeneration> = {
	'039': 'Ultimate', // Lucemon - Rookie form available at Ultimate tier
	'296': 'Mega',     // Lucemon CM - Ultimate form available at Mega tier
	// '447' (Lucemon SM) is Mega+ and stays at Mega+ tier normally
};

/**
 * Get the standard generation equivalent for a non-standard Digimon
 * Returns null if not mapped or if it's already a standard generation
 */
export function getNonStandardEquivalent(
	digimonNumber: string,
	actualGeneration: EvolutionGeneration
): EvolutionGeneration | null {
	// Check for Lucemon special cases (applies to any of its forms)
	if (LUCEMON_GENERATION_EQUIVALENTS[digimonNumber]) {
		return LUCEMON_GENERATION_EQUIVALENTS[digimonNumber];
	}
	
	if (actualGeneration === 'Armor') {
		return ARMOR_GENERATION_EQUIVALENTS[digimonNumber] || 'Champion'; // Default to Champion
	}
	if (actualGeneration === 'Hybrid') {
		return HYBRID_GENERATION_EQUIVALENTS[digimonNumber] || 'Champion'; // Default to Champion
	}
	return null;
}

/**
 * Get the effective generation for display purposes
 * This accounts for special mappings like Lucemon, Armor, and Hybrid forms
 * Returns the equivalent generation for display, or the actual generation if no mapping exists
 */
export function getEffectiveGeneration(
	digimonNumber: string,
	actualGeneration: EvolutionGeneration
): EvolutionGeneration {
	const equivalent = getNonStandardEquivalent(digimonNumber, actualGeneration);
	return equivalent || actualGeneration;
}
