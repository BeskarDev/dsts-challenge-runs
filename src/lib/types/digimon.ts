/**
 * Evolution generation/stage names as they appear in the game
 */
export type EvolutionGeneration =
	| 'In-Training I'
	| 'In-Training II'
	| 'Rookie'
	| 'Champion'
	| 'Ultimate'
	| 'Mega'
	| 'Mega +'
	| 'Armor'
	| 'Hybrid';

/**
 * Digivolution requirements for evolving to a specific Digimon
 */
export interface DigivolutionRequirement {
	/** Required stats for digivolution */
	stats?: {
		hp?: number;
		sp?: number;
		attack?: number;
		defense?: number;
		intelligence?: number;
		speed?: number;
	};

	/** Required agent rank */
	agentRank?: number;

	/** Required agent skills for digivolution */
	agentSkills?: {
		valor?: number;
		philanthropy?: number;
		amicability?: number;
		wisdom?: number;
	};

	/** Required item (e.g., "Human Spirit of Light", "Digi-Egg of Courage") */
	requiredItem?: string;

	/** Minimum boss order required to unlock this digimon */
	minBossOrder?: number;
}

/**
 * Digimon data interface matching the comprehensive table structure
 * All fields are directly sourced from the authoritative digimon-table data
 */
export interface Digimon {
	/** Digimon number (e.g., "001", "002") */
	number: string;
	/** Digimon name */
	name: string;
	/** Evolution generation/stage */
	generation: EvolutionGeneration;
	/** Attribute (e.g., "Vaccine", "Data", "Virus", "Free", "Variable", "Unknown", "No Data") */
	attribute: string;
	/** Digimon type (e.g., "Reptile", "Beast", "Dragon") */
	type: string;
	/** Base personality trait */
	basePersonality: string;
	/** Direct URL to the Digimon's icon image */
	iconUrl: string;
	/** Direct URL to the Digimon's details page */
	detailsUrl: string;
	/** Whether this Digimon requires DLC (Episode Packs or Pre-order) */
	isDLC?: boolean;
	/** Whether this Digimon is post-game exclusive */
	isPostGame?: boolean;
	/** Array of Digimon names this Digimon can evolve from (de-digivolve) */
	evolvesFrom?: string[];
	/** Array of Digimon names this Digimon can evolve to (digivolve) */
	evolvesTo?: string[];
	/** Digivolution requirements for obtaining this Digimon */
	evolutionRequirements?: DigivolutionRequirement;
}

/**
 * Legacy type alias for backwards compatibility during migration
 * @deprecated Use EvolutionGeneration instead
 */
export type EvolutionStage = EvolutionGeneration;
