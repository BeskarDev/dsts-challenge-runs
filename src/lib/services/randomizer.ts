import type { Digimon, EvolutionStage } from '../types/digimon';

/**
 * Evolution stage hierarchy for filtering
 */
export const STAGE_HIERARCHY: EvolutionStage[] = ['Baby', 'Rookie', 'Champion', 'Ultimate', 'Mega', 'Mega+'];

/**
 * Get all stages up to and including the given stage
 */
export function getStagesUpTo(stage: EvolutionStage): EvolutionStage[] {
	const index = STAGE_HIERARCHY.indexOf(stage);
	if (index === -1) return ['Baby'];
	return STAGE_HIERARCHY.slice(0, index + 1);
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
	 * Get random Digimon from a pool, filtering by stage and excluding specified Digimon
	 */
	getRandomDigimon(
		allDigimon: Digimon[],
		stage: EvolutionStage,
		count: number,
		exclude: string[] = []
	): Digimon[] {
		// Filter by stage and exclude list
		const available = allDigimon.filter(
			(d) => d.stage === stage && !exclude.includes(d.id)
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
	 * Get random Digimon from multiple stages (up to and including the given stage)
	 * Prevents duplicates across all selected Digimon
	 */
	getRandomDigimonMultiStage(
		allDigimon: Digimon[],
		maxStage: EvolutionStage,
		count: number,
		exclude: string[] = []
	): Digimon[] {
		const allowedStages = getStagesUpTo(maxStage);
		
		// Filter by allowed stages and exclude list
		const available = allDigimon.filter(
			(d) => allowedStages.includes(d.stage) && !exclude.includes(d.id)
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
	 * Reroll a single slot in the team
	 * Returns a new Digimon that is not already in the team
	 */
	rerollSlot(
		allDigimon: Digimon[],
		maxStage: EvolutionStage,
		currentTeamIds: string[]
	): Digimon | null {
		// Generate new seed for this reroll
		const newSeed = this.generateSeed();
		this.setSeed(newSeed);

		const allowedStages = getStagesUpTo(maxStage);
		
		// Filter by allowed stages and exclude current team members
		const available = allDigimon.filter(
			(d) => allowedStages.includes(d.stage) && !currentTeamIds.includes(d.id)
		);

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
		stage: EvolutionStage,
		count: number,
		currentTeam: string[] = []
	): Digimon[] {
		// Generate new seed for reroll
		const newSeed = this.generateSeed();
		this.setSeed(newSeed);
		
		return this.getRandomDigimon(allDigimon, stage, count, currentTeam);
	}

	/**
	 * Generate a new team from multiple stages
	 */
	rerollMultiStage(
		allDigimon: Digimon[],
		maxStage: EvolutionStage,
		count: number,
		currentTeam: string[] = []
	): Digimon[] {
		// Generate new seed for reroll
		const newSeed = this.generateSeed();
		this.setSeed(newSeed);
		
		return this.getRandomDigimonMultiStage(allDigimon, maxStage, count, currentTeam);
	}
}
