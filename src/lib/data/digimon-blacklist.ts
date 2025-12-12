// Blacklist configuration for Digimon with special requirements
// This file lists Digimon that have special unlock requirements

export const digimonBlacklist = {
  // DLC-only Digimon (requires Episode Pack purchases)
  // Note: Using Digimon numbers as identifiers
  dlc: [
    { number: "454", name: "BlitzGreymon", requirement: "DLC Episode Pack 1: Alternate Dimension" },
    { number: "452", name: "CresGarurumon", requirement: "DLC Episode Pack 1: Alternate Dimension" },
    { number: "455", name: "Omnimon Alter-B", requirement: "DLC Episode Pack 1: Alternate Dimension" },
    { number: "457", name: "Omnimon Zwart Defeat", requirement: "DLC Episode Pack 1: Alternate Dimension" },
    { number: "456", name: "Omnimon Alter-S", requirement: "DLC Episode Pack 1: Alternate Dimension" },
    { number: "453", name: "Parallelmon", requirement: "DLC Any Episode Pack" }
    // Note: If there are more DLC Digimon, they would be added here
  ],
  
  // Post-game only Digimon (requires completing main story)
  postGame: [
    // These would be identified from the actual game data
  ],
  
  // Armor Digimon (requires Digi-Eggs)
  armor: [
    { number: "422", name: "Rapidmon (Armor)", requirement: "Armor evolution via Digi-Egg" },
    { number: "423", name: "Magnamon", requirement: "Armor evolution via Digi-Egg, high agent rank" }
    // All other Armor generation Digimon can be filtered by generation
  ],
  
  // High agent rank requirements (Rank 7-10)
  highAgentRank: [
    { number: "423", name: "Magnamon", requirement: "Agent Rank 8+" },
    { number: "427", name: "Alphamon: Ouryuken", requirement: "Agent Rank 9+" }
  ],
  
  // Specific skill tree requirements
  skillTreeRequired: [
    // These would be identified from the actual game data
  ],
  
  // Mega+ tier (generally late/end-game)
  megaPlus: [
    { number: "427", name: "Alphamon: Ouryuken", requirement: "Mega+ tier, Agent Rank 9+" }
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
  
  return allBlacklisted.some(entry => entry.number === digimonNumber);
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
  
  const entry = allBlacklisted.find(e => e.number === digimonNumber);
  return entry ? entry.requirement : null;
}
