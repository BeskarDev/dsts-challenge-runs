import { describe, it, expect } from 'vitest';
import {
	getMinBossOrderForDigimon,
	filterDigimonByBossProgression,
	isDigimonAvailable,
	getDigimonAvailabilitySummary,
	VULCANUSMON_BOSS_ORDER,
	DEFAULT_SPECIAL_ITEM_BOSS_ORDER
} from '../utils/boss-progression';
import type { Digimon } from '../types/digimon';

// Mock digimon data for testing
const mockDigimon: Digimon[] = [
	{
		number: '001',
		name: 'Kuramon',
		generation: 'In-Training I',
		attribute: 'No Data',
		type: 'Unidentified',
		basePersonality: 'Sly',
		iconUrl: 'test-icon.png',
		detailsUrl: 'test-details.html'
		// No evolution requirements - always available
	},
	{
		number: '179',
		name: 'Submarimon',
		generation: 'Armor',
		attribute: 'Free',
		type: 'Aquatic',
		basePersonality: 'Overprotective',
		iconUrl: 'test-icon.png',
		detailsUrl: 'test-details.html',
		evolutionRequirements: {
			requiredItem: 'Digi-Egg of Knowledge'
		}
	},
	{
		number: '183',
		name: 'Flamedramon',
		generation: 'Armor',
		attribute: 'Free',
		type: 'Dragon Warrior',
		basePersonality: 'Brave',
		iconUrl: 'test-icon.png',
		detailsUrl: 'test-details.html',
		evolutionRequirements: {
			requiredItem: 'Digi-Egg of Courage',
			minBossOrder: 12 // Explicitly set higher than Vulcanusmon
		}
	},
	{
		number: '187',
		name: 'Agunimon',
		generation: 'Hybrid',
		attribute: 'Variable',
		type: 'Wizard',
		basePersonality: 'Zealous',
		iconUrl: 'test-icon.png',
		detailsUrl: 'test-details.html',
		evolutionRequirements: {
			requiredItem: 'Human Spirit of Fire'
		}
	},
	{
		number: '020',
		name: 'Agumon',
		generation: 'Rookie',
		attribute: 'Vaccine',
		type: 'Reptile',
		basePersonality: 'Brave',
		iconUrl: 'test-icon.png',
		detailsUrl: 'test-details.html',
		evolutionRequirements: {
			stats: { attack: 100 },
			agentRank: 2
			// No special items or boss requirements
		}
	},
	{
		number: '021',
		name: 'Agumon (Bond of Bravery)',
		generation: 'Rookie',
		attribute: 'Vaccine',
		type: 'Reptile',
		basePersonality: 'Brave',
		iconUrl: 'test-icon.png',
		detailsUrl: 'test-details.html',
		evolutionRequirements: {
			agentSkills: { valor: 46 }
			// No special items or boss requirements for agent skills
		}
	}
];

describe('Boss Progression Utilities', () => {
	describe('getMinBossOrderForDigimon', () => {
		it('should return null for digimon with no evolution requirements', () => {
			const minBoss = getMinBossOrderForDigimon(mockDigimon[0]); // Kuramon
			expect(minBoss).toBeNull();
		});

		it('should return explicit minBossOrder when set', () => {
			const minBoss = getMinBossOrderForDigimon(mockDigimon[2]); // Flamedramon
			expect(minBoss).toBe(12);
		});

		it('should return Vulcanusmon boss order for digi-egg requirements', () => {
			const minBoss = getMinBossOrderForDigimon(mockDigimon[1]); // Submarimon
			expect(minBoss).toBe(VULCANUSMON_BOSS_ORDER);
		});

		it('should return Vulcanusmon boss order for spirit requirements', () => {
			const minBoss = getMinBossOrderForDigimon(mockDigimon[3]); // Agunimon
			expect(minBoss).toBe(VULCANUSMON_BOSS_ORDER);
		});

		it('should return null for digimon with only stat/rank requirements', () => {
			const minBoss = getMinBossOrderForDigimon(mockDigimon[4]); // Agumon
			expect(minBoss).toBeNull();
		});

		it('should return null for digimon with only agent skills requirements', () => {
			const minBoss = getMinBossOrderForDigimon(mockDigimon[5]); // Agumon (Bond of Bravery)
			expect(minBoss).toBeNull();
		});
	});

	describe('isDigimonAvailable', () => {
		it('should return true for digimon with no boss requirements', () => {
			expect(isDigimonAvailable(mockDigimon[0], 1)).toBe(true); // Kuramon at boss 1
			expect(isDigimonAvailable(mockDigimon[4], 5)).toBe(true); // Agumon at boss 5
			expect(isDigimonAvailable(mockDigimon[5], 1)).toBe(true); // Agumon (Bond of Bravery) at boss 1
		});

		it('should return true when boss progression meets requirement', () => {
			expect(isDigimonAvailable(mockDigimon[1], VULCANUSMON_BOSS_ORDER)).toBe(true); // Submarimon at Vulcanusmon
			expect(isDigimonAvailable(mockDigimon[2], 12)).toBe(true); // Flamedramon at boss 12
		});

		it('should return false when boss progression does not meet requirement', () => {
			expect(isDigimonAvailable(mockDigimon[1], VULCANUSMON_BOSS_ORDER - 1)).toBe(false); // Submarimon before Vulcanusmon
			expect(isDigimonAvailable(mockDigimon[2], 11)).toBe(false); // Flamedramon before boss 12
		});
	});

	describe('filterDigimonByBossProgression', () => {
		it('should include all digimon when at high boss progression', () => {
			const filtered = filterDigimonByBossProgression(mockDigimon, 15);
			expect(filtered).toHaveLength(6);
			expect(filtered.map(d => d.name)).toEqual(['Kuramon', 'Submarimon', 'Flamedramon', 'Agunimon', 'Agumon', 'Agumon (Bond of Bravery)']);
		});

		it('should exclude digimon with unmet requirements at early boss progression', () => {
			const filtered = filterDigimonByBossProgression(mockDigimon, 5);
			expect(filtered).toHaveLength(3);
			expect(filtered.map(d => d.name)).toEqual(['Kuramon', 'Agumon', 'Agumon (Bond of Bravery)']);
		});

		it('should include some special digimon at Vulcanusmon boss order', () => {
			const filtered = filterDigimonByBossProgression(mockDigimon, VULCANUSMON_BOSS_ORDER);
			expect(filtered).toHaveLength(5);
			expect(filtered.map(d => d.name)).toEqual(['Kuramon', 'Submarimon', 'Agunimon', 'Agumon', 'Agumon (Bond of Bravery)']);
		});

		it('should handle empty array', () => {
			const filtered = filterDigimonByBossProgression([], 10);
			expect(filtered).toHaveLength(0);
		});
	});

	describe('getDigimonAvailabilitySummary', () => {
		it('should provide accurate summary of digimon availability', () => {
			const summary = getDigimonAvailabilitySummary(mockDigimon);
			
		expect(summary.total).toBe(6);
		expect(summary.withRequirements).toBe(3); // Submarimon, Flamedramon, Agunimon have boss progression requirements
		expect(summary.availableAtVulcanusmon).toBe(2); // Submarimon and Agunimon (Flamedramon requires boss 12, agent skills don't require boss progression)
		});

		it('should handle empty array', () => {
			const summary = getDigimonAvailabilitySummary([]);
			
			expect(summary.total).toBe(0);
			expect(summary.withRequirements).toBe(0);
			expect(summary.availableAtVulcanusmon).toBe(0);
		});
	});

	describe('Boss order constants', () => {
		it('should have consistent boss order values', () => {
			expect(VULCANUSMON_BOSS_ORDER).toBe(10);
			expect(DEFAULT_SPECIAL_ITEM_BOSS_ORDER).toBe(VULCANUSMON_BOSS_ORDER);
		});
	});
});

describe('Boss Progression Edge Cases', () => {
	it('should handle digimon with empty evolution requirements object', () => {
		const digimon: Digimon = {
			...mockDigimon[0],
			evolutionRequirements: {}
		};
		
		expect(getMinBossOrderForDigimon(digimon)).toBeNull();
		expect(isDigimonAvailable(digimon, 1)).toBe(true);
	});

	it('should handle digimon with unknown special items', () => {
		const digimon: Digimon = {
			...mockDigimon[0],
			evolutionRequirements: {
				requiredItem: 'Unknown Special Item'
			}
		};
		
		const minBoss = getMinBossOrderForDigimon(digimon);
		expect(minBoss).toBe(DEFAULT_SPECIAL_ITEM_BOSS_ORDER);
	});

	it('should handle case-insensitive item matching', () => {
		const digimon: Digimon = {
			...mockDigimon[0],
			evolutionRequirements: {
				requiredItem: 'DIGI-EGG OF COURAGE'
			}
		};
		
		const minBoss = getMinBossOrderForDigimon(digimon);
		expect(minBoss).toBe(VULCANUSMON_BOSS_ORDER);
	});

	it('should handle partial item name matches', () => {
		const digimon: Digimon = {
			...mockDigimon[0],
			evolutionRequirements: {
				requiredItem: 'Spirit of Light (Human)'
			}
		};
		
		const minBoss = getMinBossOrderForDigimon(digimon);
		expect(minBoss).toBe(VULCANUSMON_BOSS_ORDER);
	});
});