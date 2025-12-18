import { describe, it, expect } from 'vitest';
import { RandomizerService } from './randomizer';
import type { Digimon } from '../types/digimon';

describe('Seed Determinism', () => {
	// Mock digimon data for testing
	const mockDigimon: Digimon[] = [
		{
			number: '001',
			name: 'Koromon',
			generation: 'In-Training I',
			attribute: 'None',
			type: 'Free',
			basePersonality: 'Brainy',
			iconUrl: '',
			detailsUrl: ''
		},
		{
			number: '002',
			name: 'Tsunomon',
			generation: 'In-Training I',
			attribute: 'None',
			type: 'Free',
			basePersonality: 'Fighter',
			iconUrl: '',
			detailsUrl: ''
		},
		{
			number: '003',
			name: 'Agumon',
			generation: 'Rookie',
			attribute: 'Vaccine',
			type: 'Fire',
			basePersonality: 'Fighter',
			iconUrl: '',
			detailsUrl: ''
		},
		{
			number: '004',
			name: 'Gabumon',
			generation: 'Rookie',
			attribute: 'Data',
			type: 'Water',
			basePersonality: 'Brainy',
			iconUrl: '',
			detailsUrl: ''
		},
		{
			number: '005',
			name: 'Greymon',
			generation: 'Champion',
			attribute: 'Vaccine',
			type: 'Fire',
			basePersonality: 'Fighter',
			iconUrl: '',
			detailsUrl: ''
		},
		{
			number: '006',
			name: 'Garurumon',
			generation: 'Champion',
			attribute: 'Data',
			type: 'Water',
			basePersonality: 'Fighter',
			iconUrl: '',
			detailsUrl: ''
		},
		{
			number: '007',
			name: 'MetalGreymon',
			generation: 'Ultimate',
			attribute: 'Vaccine',
			type: 'Fire',
			basePersonality: 'Fighter',
			iconUrl: '',
			detailsUrl: ''
		},
		{
			number: '008',
			name: 'WereGarurumon',
			generation: 'Ultimate',
			attribute: 'Data',
			type: 'Water',
			basePersonality: 'Fighter',
			iconUrl: '',
			detailsUrl: ''
		},
		{
			number: '009',
			name: 'WarGreymon',
			generation: 'Mega',
			attribute: 'Vaccine',
			type: 'Fire',
			basePersonality: 'Fighter',
			iconUrl: '',
			detailsUrl: ''
		},
		{
			number: '010',
			name: 'MetalGarurumon',
			generation: 'Mega',
			attribute: 'Data',
			type: 'Water',
			basePersonality: 'Fighter',
			iconUrl: '',
			detailsUrl: ''
		}
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
		expect(team1.map((d) => d.number)).toEqual(team2.map((d) => d.number));
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
			teams1.push(team.map((d) => d.number));
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
			teams2.push(team.map((d) => d.number));
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
		expect(team1.map((d) => d.number)).not.toEqual(team2.map((d) => d.number));
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
		expect(team1.map((d) => d.number)).toEqual(team2.map((d) => d.number));
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
