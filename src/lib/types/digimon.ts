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
}

/**
 * Legacy type alias for backwards compatibility during migration
 * @deprecated Use EvolutionGeneration instead
 */
export type EvolutionStage = EvolutionGeneration;
