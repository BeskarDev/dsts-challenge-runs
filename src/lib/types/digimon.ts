export type EvolutionStage = 'Baby' | 'Rookie' | 'Champion' | 'Ultimate' | 'Mega' | 'Mega+' | 'Armor';

export interface Digimon {
	id: string;
	name: string;
	stage: EvolutionStage;
	imageUrl?: string;
	// Future extensibility
	attributes?: string[];
	types?: string[];
}

/**
 * Generate a Grindosaur URL for a Digimon
 * Handles special characters and whitespace in names
 */
export function getGrindosaurUrl(name: string): string {
	// Convert name to URL-safe format: lowercase, spaces to hyphens, remove special chars
	const urlName = name
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[()]/g, '')
		.replace(/[^a-z0-9-]/g, '');
	return `https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/${urlName}`;
}

/**
 * Generate a Grindosaur icon URL for a Digimon (256x256px)
 * Handles special characters and whitespace in names
 */
export function getGrindosaurIconUrl(name: string): string {
	// Convert name to URL-safe format: lowercase, spaces to hyphens, remove special chars
	const urlName = name
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[()]/g, '')
		.replace(/[^a-z0-9-]/g, '');
	return `https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/${urlName}-icon.png`;
}
