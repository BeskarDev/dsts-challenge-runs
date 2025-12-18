import { describe, it, expect } from 'vitest';
import { RandomizerService } from './randomizer';
import type { Digimon } from '../types/digimon';

describe('Seed Determinism', () => {
	// Mock digimon data for testing
	const mockDigimon: Digimon[] = [
		{ number: '001', name: 'Koromon', generation: 'In-Training I', attribute: 'None', type: 'Free', memory: 2, equip: 0, hp: 590, sp: 62, attack: 79, defense: 69, intelligence: 59, speed: 64 },
		{ number: '002', name: 'Tsunomon', generation: 'In-Training I', attribute: 'None', type: 'Free', memory: 2, equip: 0, hp: 620, sp: 56, attack: 84, defense: 64, intelligence: 54, speed: 69 },
		{ number: '003', name: 'Agumon', generation: 'Rookie', attribute: 'Vaccine', type: 'Fire', memory: 4, equip: 0, hp: 930, sp: 88, attack: 125, defense: 92, intelligence: 75, speed: 85 },
		{ number: '004', name: 'Gabumon', generation: 'Rookie', attribute: 'Data', type: 'Water', memory: 4, equip: 0, hp: 1050, sp: 77, attack: 105, defense: 105, intelligence: 70, speed: 75 },
		{ number: '005', name: 'Greymon', generation: 'Champion', attribute: 'Vaccine', type: 'Fire', memory: 8, equip: 1, hp: 1380, sp: 122, attack: 170, defense: 135, intelligence: 95, speed: 105 },
		{ number: '006', name: 'Garurumon', generation: 'Champion', attribute: 'Data', type: 'Water', memory: 8, equip: 1, hp: 1470, sp: 109, attack: 145, defense: 145, intelligence: 90, speed: 110 },
		{ number: '007', name: 'MetalGreymon', generation: 'Ultimate', attribute: 'Vaccine', type: 'Fire', memory: 12, equip: 2, hp: 1830, sp: 156, attack: 215, defense: 180, intelligence: 115, speed: 125 },
		{ number: '008', name: 'WereGarurumon', generation: 'Ultimate', attribute: 'Data', type: 'Water', memory: 12, equip: 2, hp: 1920, sp: 143, attack: 190, defense: 190, intelligence: 110, speed: 130 },
		{ number: '009', name: 'WarGreymon', generation: 'Mega', attribute: 'Vaccine', type: 'Fire', memory: 16, equip: 3, hp: 2280, sp: 190, attack: 260, defense: 225, intelligence: 135, speed: 145 },
		{ number: '010', name: 'MetalGarurumon', generation: 'Mega', attribute: 'Data', type: 'Water', memory: 16, equip: 3, hp: 2370, sp: 177, attack: 235, defense: 235, intelligence: 130, speed: 150 }
	];

	it('should generate the same team for boss 1 with the same seed', () => {
		const seed = 'test-seed-12345';
		
		// First run
		const randomizer1 = new RandomizerService(seed);
		const bossSeed1 = `${seed}-boss-1`;
		randomizer1.setSeed(bossSeed1);
		const team1 = randomizer1.getRandomDigimonMultiGeneration(
			mockDigimon,
			'Rookie',
			3,
			[],
			false,
			undefined,
			false
		);

		// Second run with same seed
		const randomizer2 = new RandomizerService(seed);
		const bossSeed2 = `${seed}-boss-1`;
		randomizer2.setSeed(bossSeed2);
		const team2 = randomizer2.getRandomDigimonMultiGeneration(
			mockDigimon,
			'Rookie',
			3,
			[],
			false,
			undefined,
			false
		);

		// Teams should be identical
		expect(team1.map(d => d.number)).toEqual(team2.map(d => d.number));
	});

	it('should generate the same teams for multiple bosses with the same seed', () => {
		const seed = 'test-seed-67890';
		
		// First full run - simulate boss 1, 2, 3
		const randomizer1 = new RandomizerService(seed);
		const teams1 = [];
		
		for (let boss = 1; boss <= 3; boss++) {
			const bossSeed = `${seed}-boss-${boss}`;
			randomizer1.setSeed(bossSeed);
			const team = randomizer1.rerollMultiGeneration(
				mockDigimon,
				boss === 1 ? 'Rookie' : boss === 2 ? 'Champion' : 'Ultimate',
				3,
				[],
				false,
				undefined,
				false
			);
			teams1.push(team.map(d => d.number));
		}

		// Second full run with same seed
		const randomizer2 = new RandomizerService(seed);
		const teams2 = [];
		
		for (let boss = 1; boss <= 3; boss++) {
			const bossSeed = `${seed}-boss-${boss}`;
			randomizer2.setSeed(bossSeed);
			const team = randomizer2.rerollMultiGeneration(
				mockDigimon,
				boss === 1 ? 'Rookie' : boss === 2 ? 'Champion' : 'Ultimate',
				3,
				[],
				false,
				undefined,
				false
			);
			teams2.push(team.map(d => d.number));
		}

		// All teams should be identical
		expect(teams1).toEqual(teams2);
	});

	it('should generate different teams for different bosses with the same base seed', () => {
		const seed = 'test-seed-99999';
		const randomizer = new RandomizerService(seed);
		
		// Boss 1
		randomizer.setSeed(`${seed}-boss-1`);
		const team1 = randomizer.rerollMultiGeneration(
			mockDigimon,
			'Rookie',
			3,
			[],
			false,
			undefined,
			false
		);

		// Boss 2
		randomizer.setSeed(`${seed}-boss-2`);
		const team2 = randomizer.rerollMultiGeneration(
			mockDigimon,
			'Rookie',
			3,
			[],
			false,
			undefined,
			false
		);

		// Teams should be different (different boss seeds)
		expect(team1.map(d => d.number)).not.toEqual(team2.map(d => d.number));
	});

	it('should maintain determinism even after setting seed multiple times', () => {
		const seed = 'test-seed-abc';
		const randomizer = new RandomizerService(seed);
		
		// Generate team for boss 5
		randomizer.setSeed(`${seed}-boss-5`);
		const team1 = randomizer.rerollMultiGeneration(mockDigimon, 'Ultimate', 3);
		
		// Set some other seed
		randomizer.setSeed('some-other-seed');
		randomizer.rerollMultiGeneration(mockDigimon, 'Mega', 3);
		
		// Go back to boss 5 seed
		randomizer.setSeed(`${seed}-boss-5`);
		const team2 = randomizer.rerollMultiGeneration(mockDigimon, 'Ultimate', 3);
		
		// Teams should be identical
		expect(team1.map(d => d.number)).toEqual(team2.map(d => d.number));
	});

	it('should not use Math.random() when rerollMultiGeneration is called with a set seed', () => {
		const seed = 'fixed-seed';
		const randomizer = new RandomizerService(seed);
		
		// Set a specific seed
		randomizer.setSeed(`${seed}-boss-10`);
		
		// Mock Math.random to detect if it's called
		const originalRandom = Math.random;
		let randomCalled = false;
		Math.random = () => {
			randomCalled = true;
			return originalRandom();
		};
		
		try {
			// Generate team - should not call Math.random
			randomizer.rerollMultiGeneration(mockDigimon, 'Champion', 3);
			
			expect(randomCalled).toBe(false);
		} finally {
			// Restore Math.random
			Math.random = originalRandom;
		}
	});
});
