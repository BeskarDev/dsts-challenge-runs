// Blacklist configuration for Digimon with special requirements
// This file lists Digimon that have special unlock requirements

export const digimonBlacklist = {
  // DLC-only Digimon (requires Episode Pack purchases)
  dlc: [
    { id: "458", name: "BlitzGreymon", requirement: "DLC Episode Pack 1: Alternate Dimension" },
    { id: "459", name: "CresGarurumon", requirement: "DLC Episode Pack 1: Alternate Dimension" },
    { id: "460", name: "Omnimon Alter-B", requirement: "DLC Episode Pack 1: Alternate Dimension" },
    { id: "461", name: "Omnimon Zwart Defeat", requirement: "DLC Episode Pack 1: Alternate Dimension" },
    { id: "462", name: "Omnimon Alter-S", requirement: "DLC Episode Pack 1: Alternate Dimension" },
    { id: "463", name: "Parallelmon", requirement: "DLC Any Episode Pack" },
    { id: "464", name: "Omnimon Merciful Mode", requirement: "DLC Episode Pack 2" },
    { id: "465", name: "BanchoLillymon", requirement: "DLC Episode Pack 2" },
    { id: "466", name: "BanchoStingmon", requirement: "DLC Episode Pack 2" },
    { id: "467", name: "BanchoGolemon", requirement: "DLC Episode Pack 2" },
    { id: "468", name: "BanchoMamemon", requirement: "DLC Episode Pack 2" },
    { id: "469", name: "Omnimon X", requirement: "DLC Episode Pack 3" },
    { id: "470", name: "Magnamon X", requirement: "DLC Episode Pack 3" },
    { id: "471", name: "UlforceVeedramon X", requirement: "DLC Episode Pack 3" },
    { id: "472", name: "Gallantmon X", requirement: "DLC Episode Pack 3" },
    { id: "473", name: "Jesmon X", requirement: "DLC Episode Pack 3" }
  ],
  
  // Post-game only Digimon (requires completing main story)
  postGame: [
    { id: "474", name: "Chronomon Holy Mode", requirement: "Post-game, max all four personality skill trees" },
    { id: "475", name: "Chronomon Destroy Mode", requirement: "Post-game, max all four personality skill trees" }
  ],
  
  // Armor Digimon (requires Digi-Eggs)
  armor: [
    { id: "179", name: "Sabmarimon", requirement: "Armor evolution via Digi-Egg" },
    { id: "180", name: "Raidramon", requirement: "Armor evolution via Digi-Egg" },
    { id: "181", name: "Flamedramon", requirement: "Armor evolution via Digi-Egg" },
    { id: "182", name: "Magnamon", requirement: "Armor evolution via Digi-Egg, high agent rank" },
    { id: "183", name: "Rapidmon (Armor)", requirement: "Armor evolution via Digi-Egg" },
    { id: "184", name: "Honeybeemon", requirement: "Armor evolution via Digi-Egg" },
    { id: "185", name: "Allomon", requirement: "Armor evolution via Digi-Egg" },
    { id: "186", name: "Kangarumon", requirement: "Armor evolution via Digi-Egg" },
    { id: "187", name: "Halsemon", requirement: "Armor evolution via Digi-Egg" },
    { id: "188", name: "Nefertimon", requirement: "Armor evolution via Digi-Egg" },
    { id: "189", name: "Lightdramon", requirement: "Armor evolution via Digi-Egg" },
    { id: "190", name: "Sagittarimon", requirement: "Armor evolution via Digi-Egg" },
    { id: "191", name: "Prairiemon", requirement: "Armor evolution via Digi-Egg" },
    { id: "192", name: "Saggitarimon", requirement: "Armor evolution via Digi-Egg" }
  ],
  
  // High agent rank requirements (Rank 7-10)
  highAgentRank: [
    { id: "182", name: "Magnamon", requirement: "Agent Rank 8+" },
    { id: "313", name: "Jesmon", requirement: "Agent Rank 7+" },
    { id: "314", name: "Jesmon GX", requirement: "Agent Rank 8+, all agent skills in a specific category" },
    { id: "315", name: "Jesmon X-Antibody", requirement: "Agent Rank 9+, specific skill requirements" },
    { id: "427", name: "Alphamon Ouryuken", requirement: "Agent Rank 9+" }
  ],
  
  // Specific skill tree requirements
  skillTreeRequired: [
    { id: "314", name: "Jesmon GX", requirement: "Max out specific agent skill category" },
    { id: "474", name: "Chronomon Holy Mode", requirement: "Max all four personality skill trees" },
    { id: "475", name: "Chronomon Destroy Mode", requirement: "Max all four personality skill trees" }
  ],
  
  // Mega+ tier (generally late/end-game)
  megaPlus: [
    { id: "410", name: "Omegamon X-Antibody", requirement: "Mega+ tier, high stats" },
    { id: "411", name: "Omegamon Alter-S", requirement: "Mega+ tier, DLC" },
    { id: "427", name: "Alphamon Ouryuken", requirement: "Mega+ tier, Agent Rank 9+" }
    // Add more Mega+ as identified
  ]
};

// Helper function to check if a Digimon is blacklisted for challenge runs
export function isBlacklistedForChallengeRun(digimonId: string): boolean {
  // Check if ID exists in any blacklist category
  const allBlacklisted = [
    ...digimonBlacklist.dlc,
    ...digimonBlacklist.postGame,
    ...digimonBlacklist.armor,
    ...digimonBlacklist.highAgentRank,
    ...digimonBlacklist.skillTreeRequired,
    ...digimonBlacklist.megaPlus
  ];
  
  return allBlacklisted.some(entry => entry.id === digimonId);
}

// Get blacklist reason for a Digimon
export function getBlacklistReason(digimonId: string): string | null {
  const allBlacklisted = [
    ...digimonBlacklist.dlc,
    ...digimonBlacklist.postGame,
    ...digimonBlacklist.armor,
    ...digimonBlacklist.highAgentRank,
    ...digimonBlacklist.skillTreeRequired,
    ...digimonBlacklist.megaPlus
  ];
  
  const entry = allBlacklisted.find(e => e.id === digimonId);
  return entry ? entry.requirement : null;
}
