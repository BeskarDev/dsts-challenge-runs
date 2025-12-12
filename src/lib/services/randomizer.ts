import type { Digimon, EvolutionGeneration } from '../types/digimon';
import { getNonStandardEquivalent } from '../utils/generation-equivalents';

/**
 * Evolution generation hierarchy for standard evolution filtering.
 * Note: Armor and Hybrid Digimon are handled separately as they have special requirements.
 */
export const GENERATION_HIERARCHY: EvolutionGeneration[] = [
	'In-Training I',
	'In-Training II',
	'Rookie',
	'Champion',
	'Ultimate',
	'Mega',
	'Mega +'
];

/**
 * Armor generation is special and not part of the standard hierarchy.
 * It requires Digi-Eggs which are unlocked at specific game milestones.
 */
export const ARMOR_GENERATION: EvolutionGeneration = 'Armor';

/**
 * Hybrid generation is special and not part of the standard hierarchy.
 */
export const HYBRID_GENERATION: EvolutionGeneration = 'Hybrid';

/**
 * Get all generations up to and including the given generation.
 * Armor and Hybrid are not included as they have special unlock conditions.
 * @param includeNonStandard - If true, include Armor/Hybrid based on their equivalents
 */
export function getGenerationsUpTo(
	generation: EvolutionGeneration,
	includeNonStandard: boolean = false
): EvolutionGeneration[] {
	// Armor and Hybrid are special and not in the standard hierarchy
	if (generation === 'Armor') {
		return ['Armor'];
	}
	if (generation === 'Hybrid') {
		return ['Hybrid'];
	}
	const index = GENERATION_HIERARCHY.indexOf(generation);
	if (index === -1) return ['In-Training I'];
	
	const standardGens = GENERATION_HIERARCHY.slice(0, index + 1);
	
	// Optionally include non-standard generations
	if (includeNonStandard) {
		// Add Armor and Hybrid as they can be included based on equivalents
		return [...standardGens, 'Armor', 'Hybrid'];
	}
	
	return standardGens;
}

/**
 * Simple seeded random number generator using mulberry32 algorithm
 * Returns a deterministic sequence of random numbers based on the seed
 */
export class SeededRandom {
	private state: number;

	constructor(seed: string) {
		// Convert string seed to number
		this.state = this.hashString(seed);
	}

	private hashString(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = (hash << 5) - hash + str.charCodeAt(i);
			hash = hash & hash; // Convert to 32bit integer
		}
		return Math.abs(hash);
	}

	/**
	 * Generate next random number between 0 and 1
	 */
	next(): number {
		this.state = (this.state + 0x6d2b79f5) | 0;
		let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	/**
	 * Generate random integer between min (inclusive) and max (exclusive)
	 */
	nextInt(min: number, max: number): number {
		return Math.floor(this.next() * (max - min)) + min;
	}

	/**
	 * Shuffle array in place using Fisher-Yates algorithm
	 */
	shuffle<T>(array: T[]): T[] {
		const result = [...array];
		for (let i = result.length - 1; i > 0; i--) {
			const j = this.nextInt(0, i + 1);
			[result[i], result[j]] = [result[j], result[i]];
		}
		return result;
	}

	/**
	 * Pick a single random element from an array
	 */
	pickOne<T>(array: T[]): T | undefined {
		if (array.length === 0) return undefined;
		return array[this.nextInt(0, array.length)];
	}
}

export class RandomizerService {
	private rng: SeededRandom;
	private currentSeed: string;

	constructor(seed?: string) {
		this.currentSeed = seed || this.generateSeed();
		this.rng = new SeededRandom(this.currentSeed);
	}

	/**
	 * Generate a new random seed
	 */
	generateSeed(): string {
		return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	}

	/**
	 * Set a new seed and reset the RNG
	 */
	setSeed(seed: string): void {
		this.currentSeed = seed;
		this.rng = new SeededRandom(seed);
	}

	/**
	 * Get the current seed
	 */
	getSeed(): string {
		return this.currentSeed;
	}

	/**
	 * Get random Digimon from a pool, filtering by generation and excluding specified Digimon
	 */
	getRandomDigimon(
		allDigimon: Digimon[],
		generation: EvolutionGeneration,
		count: number,
		exclude: string[] = []
	): Digimon[] {
		// Filter by generation and exclude list
		const available = allDigimon.filter(
			(d) => d.generation === generation && !exclude.includes(d.number)
		);

		if (available.length === 0) {
			return [];
		}

		// If we need more than available, return all available
		if (count >= available.length) {
			return [...available];
		}

		// Shuffle and take the requested count
		const shuffled = this.rng.shuffle(available);
		return shuffled.slice(0, count);
	}

	/**
	 * Get random Digimon from multiple generations (up to and including the given generation)
	 * Prevents duplicates across all selected Digimon
	 * @param onlyHighest - If true, only include the highest available generation
	 * @param minGeneration - Optional minimum generation to include (for override)
	 * @param includeNonStandard - If true, include Armor/Hybrid based on equivalent generations
	 */
	getRandomDigimonMultiGeneration(
		allDigimon: Digimon[],
		maxGeneration: EvolutionGeneration,
		count: number,
		exclude: string[] = [],
		onlyHighest: boolean = false,
		minGeneration?: EvolutionGeneration,
		includeNonStandard: boolean = false
	): Digimon[] {
		let allowedGenerations: EvolutionGeneration[];
		
		if (onlyHighest) {
			// Only include the highest generation
			allowedGenerations = [maxGeneration];
		} else if (minGeneration) {
			// Include generations from minGeneration to maxGeneration
			const allGenerations = getGenerationsUpTo(maxGeneration, includeNonStandard);
			const minIndex = allGenerations.indexOf(minGeneration);
			allowedGenerations = minIndex >= 0 ? allGenerations.slice(minIndex) : allGenerations;
		} else {
			// Include all generations up to max
			allowedGenerations = getGenerationsUpTo(maxGeneration, includeNonStandard);
		}
		
		// Get the max generation index for non-standard filtering
		const maxGenIndex = GENERATION_HIERARCHY.indexOf(maxGeneration);
		
		// Filter by allowed generations and exclude list
		const available = allDigimon.filter((d) => {
			if (exclude.includes(d.number)) return false;
			
			// Check standard generations
			if (allowedGenerations.includes(d.generation)) {
				return true;
			}
			
			// Check non-standard generations if enabled
			if (includeNonStandard && (d.generation === 'Armor' || d.generation === 'Hybrid')) {
				const equivalent = getNonStandardEquivalent(d.number, d.generation);
				if (equivalent) {
					const equivIndex = GENERATION_HIERARCHY.indexOf(equivalent);
					return equivIndex >= 0 && equivIndex <= maxGenIndex;
				}
			}
			
			return false;
		});

		if (available.length === 0) {
			return [];
		}

		// If we need more than available, return all available
		if (count >= available.length) {
			return [...available];
		}

		// Shuffle and take the requested count
		const shuffled = this.rng.shuffle(available);
		return shuffled.slice(0, count);
	}

	/**
	 * Reroll a single slot in the team
	 * Returns a new Digimon that is not already in the team
	 * @param onlyHighest - If true, only include the highest available generation
	 * @param minGeneration - Optional minimum generation to include (for override)
	 * @param includeNonStandard - If true, include Armor/Hybrid based on equivalent generations
	 */
	rerollSlot(
		allDigimon: Digimon[],
		maxGeneration: EvolutionGeneration,
		currentTeamNumbers: string[],
		onlyHighest: boolean = false,
		minGeneration?: EvolutionGeneration,
		includeNonStandard: boolean = false
	): Digimon | null {
		// Generate new seed for this reroll
		const newSeed = this.generateSeed();
		this.setSeed(newSeed);

		let allowedGenerations: EvolutionGeneration[];
		
		if (onlyHighest) {
			allowedGenerations = [maxGeneration];
		} else if (minGeneration) {
			const allGenerations = getGenerationsUpTo(maxGeneration, includeNonStandard);
			const minIndex = allGenerations.indexOf(minGeneration);
			allowedGenerations = minIndex >= 0 ? allGenerations.slice(minIndex) : allGenerations;
		} else {
			allowedGenerations = getGenerationsUpTo(maxGeneration, includeNonStandard);
		}
		
		// Get the max generation index for non-standard filtering
		const maxGenIndex = GENERATION_HIERARCHY.indexOf(maxGeneration);
		
		// Filter by allowed generations and exclude current team members
		const available = allDigimon.filter((d) => {
			if (currentTeamNumbers.includes(d.number)) return false;
			
			// Check standard generations
			if (allowedGenerations.includes(d.generation)) {
				return true;
			}
			
			// Check non-standard generations if enabled
			if (includeNonStandard && (d.generation === 'Armor' || d.generation === 'Hybrid')) {
				const equivalent = getNonStandardEquivalent(d.number, d.generation);
				if (equivalent) {
					const equivIndex = GENERATION_HIERARCHY.indexOf(equivalent);
					return equivIndex >= 0 && equivIndex <= maxGenIndex;
				}
			}
			
			return false;
		});

		if (available.length === 0) {
			return null;
		}

		return this.rng.pickOne(available) || null;
	}

	/**
	 * Generate a new team, excluding current team members
	 */
	reroll(
		allDigimon: Digimon[],
		generation: EvolutionGeneration,
		count: number,
		currentTeam: string[] = []
	): Digimon[] {
		// Generate new seed for reroll
		const newSeed = this.generateSeed();
		this.setSeed(newSeed);
		
		return this.getRandomDigimon(allDigimon, generation, count, currentTeam);
	}

	/**
	 * Generate a new team from multiple generations
	 * @param onlyHighest - If true, only include the highest available generation
	 * @param minGeneration - Optional minimum generation to include (for override)
	 * @param includeNonStandard - If true, include Armor/Hybrid based on equivalent generations
	 */
	rerollMultiGeneration(
		allDigimon: Digimon[],
		maxGeneration: EvolutionGeneration,
		count: number,
		currentTeam: string[] = [],
		onlyHighest: boolean = false,
		minGeneration?: EvolutionGeneration,
		includeNonStandard: boolean = false
	): Digimon[] {
		// Generate new seed for reroll
		const newSeed = this.generateSeed();
		this.setSeed(newSeed);
		
		return this.getRandomDigimonMultiGeneration(
			allDigimon, 
			maxGeneration, 
			count, 
			currentTeam,
			onlyHighest,
			minGeneration,
			includeNonStandard
		);
	}
}
