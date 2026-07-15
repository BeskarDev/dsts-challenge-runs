import type { Digimon } from '../types/digimon';

/**
 * Check if a Digimon is DLC content.
 * Uses the `isDLC` field from the Digimon data as the single source of truth.
 */
export function isDLCDigimon(digimon: Digimon): boolean {
	return digimon.isDLC === true;
}

/**
 * Check if a Digimon is post-game content.
 * Uses the `isPostGame` field from the Digimon data as the single source of truth.
 */
export function isPostGameDigimon(digimon: Digimon): boolean {
	return digimon.isPostGame === true;
}

/**
 * Filter digimon based on content preferences
 */
export function filterDigimonByContent(
	digimon: Digimon[],
	includeDLC: boolean = true,
	includePostGame: boolean = true
): Digimon[] {
	return digimon.filter((d) => {
		if (!includeDLC && isDLCDigimon(d)) return false;
		if (!includePostGame && isPostGameDigimon(d)) return false;
		return true;
	});
}
