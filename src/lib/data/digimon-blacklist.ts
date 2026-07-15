// Blacklist configuration for Digimon with special requirements
// This file lists Digimon that have special unlock requirements
//
// NOTE: DLC and post-game status for filtering purposes is now stored directly
// in src/data/digimon.json as `isDLC` and `isPostGame` fields, which serve as
// the single source of truth. The `dlc` and `postGame` entries below are kept
// for informational/documentation purposes only and are no longer used for
// content filtering (see src/lib/utils/digimon-filters.ts).

export const digimonBlacklist = {
	// DLC-only Digimon (requires Episode Pack purchases)
	// These are documented here for reference; filtering uses the isDLC field in digimon.json
	dlc: [
		// Episode Pack 1: Alternate Dimension
		{ number: '452', name: 'CresGarurumon', requirement: 'DLC Episode Pack 1: Alternate Dimension' },
		{ number: '453', name: 'Parallelmon', requirement: 'DLC Episode Pack 1: Alternate Dimension' },
		{ number: '454', name: 'BlitzGreymon', requirement: 'DLC Episode Pack 1: Alternate Dimension' },
		{ number: '455', name: 'Omnimon Alter-B', requirement: 'DLC Episode Pack 1: Alternate Dimension' },
		{ number: '456', name: 'Omnimon Alter-S', requirement: 'DLC Episode Pack 1: Alternate Dimension' },
		{
			number: '457',
			name: 'Omnimon Zwart Defeat',
			requirement: 'DLC Episode Pack 1: Alternate Dimension'
		},
		// Episode Pack 2: BanchoDigimon
		{ number: '458', name: 'BanchoMamemon', requirement: 'DLC Episode Pack 2' },
		{ number: '459', name: 'BanchoLillymon', requirement: 'DLC Episode Pack 2' },
		{ number: '460', name: 'BanchoGolemon', requirement: 'DLC Episode Pack 2' },
		{ number: '461', name: 'BanchoStingmon', requirement: 'DLC Episode Pack 2' },
		{ number: '462', name: 'Omnimon MM', requirement: 'DLC Episode Pack 2' },
		// Episode Pack 3: X Antibody Royal Knights
		{ number: '463', name: 'UlforceVeedramon (X Antibody)', requirement: 'DLC Episode Pack 3' },
		{ number: '464', name: 'Magnamon (X Antibody)', requirement: 'DLC Episode Pack 3' },
		{ number: '465', name: 'Jesmon (X Antibody)', requirement: 'DLC Episode Pack 3' },
		{ number: '466', name: 'Gallantmon (X Antibody)', requirement: 'DLC Episode Pack 3' },
		{ number: '467', name: 'Omnimon (X Antibody)', requirement: 'DLC Episode Pack 3' }
	],

	// Post-game only Digimon (requires completing main story)
	// These are documented here for reference; filtering uses the isPostGame field in digimon.json
	postGame: [
		{ number: '340', name: 'Jupitermon', requirement: 'Post-game exclusive' },
		{ number: '437', name: 'Jupitermon WM', requirement: 'Post-game exclusive' },
		{ number: '449', name: 'Agumon (Bond of Bravery)', requirement: 'Post-game exclusive' },
		{ number: '451', name: 'Gabumon (Bond of Friendship)', requirement: 'Post-game exclusive' }
	],

	// Armor Digimon (requires Digi-Eggs)
	armor: [
		{ number: '422', name: 'Rapidmon (Armor)', requirement: 'Armor evolution via Digi-Egg' },
		{
			number: '423',
			name: 'Magnamon',
			requirement: 'Armor evolution via Digi-Egg, high agent rank'
		}
		// All other Armor generation Digimon can be filtered by generation
	],

	// High agent rank requirements (Rank 7-10)
	highAgentRank: [
		{ number: '423', name: 'Magnamon', requirement: 'Agent Rank 8+' },
		{ number: '427', name: 'Alphamon: Ouryuken', requirement: 'Agent Rank 9+' }
	],

	// Specific skill tree requirements
	skillTreeRequired: [
		// These would be identified from the actual game data
	],

	// Mega+ tier (generally late/end-game)
	megaPlus: [
		{ number: '427', name: 'Alphamon: Ouryuken', requirement: 'Mega+ tier, Agent Rank 9+' }
		// All other Mega + generation Digimon can be filtered by generation
	]
};

// Helper function to check if a Digimon is blacklisted for challenge runs
export function isBlacklistedForChallengeRun(digimonNumber: string): boolean {
	// Check if number exists in any blacklist category
	const allBlacklisted = [
		...digimonBlacklist.dlc,
		...digimonBlacklist.postGame,
		...digimonBlacklist.armor,
		...digimonBlacklist.highAgentRank,
		...digimonBlacklist.skillTreeRequired,
		...digimonBlacklist.megaPlus
	];

	return allBlacklisted.some((entry) => entry.number === digimonNumber);
}

// Get blacklist reason for a Digimon
export function getBlacklistReason(digimonNumber: string): string | null {
	const allBlacklisted = [
		...digimonBlacklist.dlc,
		...digimonBlacklist.postGame,
		...digimonBlacklist.armor,
		...digimonBlacklist.highAgentRank,
		...digimonBlacklist.skillTreeRequired,
		...digimonBlacklist.megaPlus
	];

	const entry = allBlacklisted.find((e) => e.number === digimonNumber);
	return entry ? entry.requirement : null;
}
