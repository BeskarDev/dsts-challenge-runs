import type { EvolutionGeneration } from '../types/digimon';
import { GENERATION_HIERARCHY } from '../services/randomizer';

/**
 * Mapping of non-standard generation Digimon to their equivalent standard generation
 * This allows Armor and Hybrid Digimon to be included in random results at appropriate power levels
 */
export const ARMOR_GENERATION_EQUIVALENTS: Record<string, EvolutionGeneration> = {
	// Armor Digimon - typically Champion level equivalents
	'179': 'Champion', // Submarimon
	'180': 'Champion', // Shurimon
	'181': 'Champion', // Digmon
	'182': 'Champion', // Halsemon
	'183': 'Champion', // Pegasusmon
	'184': 'Champion', // Nefertimon
	'185': 'Champion', // Flamedramon
	'186': 'Ultimate', // Magnamon (special case - more powerful)
	'431': 'Champion', // Fladramon (duplicate check)
	'432': 'Champion', // Raidramon (or similar)
};

export const HYBRID_GENERATION_EQUIVALENTS: Record<string, EvolutionGeneration> = {
	// Human Spirit forms (H) - Champion level equivalents
	'187': 'Champion', // Agunimon
	'188': 'Champion', // Lobomon
	'189': 'Champion', // Lanamon
	'190': 'Champion', // Kazemon
	'191': 'Champion', // Beetlemon
	'192': 'Champion', // Kumamon
	
	// Beast Spirit forms (B) - Ultimate level equivalents
	'193': 'Ultimate', // BurningGreymon
	'194': 'Ultimate', // KendoGarurumon
	'195': 'Ultimate', // Calmaramon
	'196': 'Ultimate', // Zephyrmon
	'197': 'Ultimate', // MetalKabuterimon
	
	// Fusion forms - Mega level equivalents
	// Aldamon and other fusions would be Mega level
};

/**
 * Get the standard generation equivalent for a non-standard Digimon
 * Returns null if not mapped or if it's already a standard generation
 */
export function getNonStandardEquivalent(
	digimonNumber: string,
	actualGeneration: EvolutionGeneration
): EvolutionGeneration | null {
	if (actualGeneration === 'Armor') {
		return ARMOR_GENERATION_EQUIVALENTS[digimonNumber] || 'Champion'; // Default to Champion
	}
	if (actualGeneration === 'Hybrid') {
		return HYBRID_GENERATION_EQUIVALENTS[digimonNumber] || 'Champion'; // Default to Champion
	}
	return null;
}
