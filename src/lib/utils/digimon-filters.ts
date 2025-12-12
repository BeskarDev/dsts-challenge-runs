import type { Digimon } from '../types/digimon';

/**
 * DLC Digimon numbers based on data scraping documentation
 * DLC Episode Pack 1 Digimon (458-463): BlitzGreymon, CresGarurumon, Omnimon variants, Parallelmon
 * DLC Episode Pack 2 Digimon (464-468): Omnimon Merciful Mode, Bancho series
 * DLC Episode Pack 3 Digimon (469-473): X-Antibody Royal Knights
 */
const DLC_DIGIMON_NUMBERS = [
	'458', '459', '460', '461', '462', '463', // Episode Pack 1
	'464', '465', '466', '467', '468',       // Episode Pack 2
	'469', '470', '471', '472', '473'        // Episode Pack 3
];

/**
 * Post-game exclusive Digimon numbers
 * Post-game exclusive Digimon (474-475): Chronomon Holy Mode, Chronomon Destroy Mode
 */
const POST_GAME_DIGIMON_NUMBERS = [
	'474', '475'
];

/**
 * Check if a Digimon is DLC content
 */
export function isDLCDigimon(digimonNumber: string): boolean {
	return DLC_DIGIMON_NUMBERS.includes(digimonNumber);
}

/**
 * Check if a Digimon is post-game content
 */
export function isPostGameDigimon(digimonNumber: string): boolean {
	return POST_GAME_DIGIMON_NUMBERS.includes(digimonNumber);
}

/**
 * Filter digimon based on content preferences
 */
export function filterDigimonByContent(
	digimon: Digimon[],
	includeDLC: boolean = true,
	includePostGame: boolean = true
): Digimon[] {
	return digimon.filter(d => {
		if (!includeDLC && isDLCDigimon(d.number)) return false;
		if (!includePostGame && isPostGameDigimon(d.number)) return false;
		return true;
	});
}
