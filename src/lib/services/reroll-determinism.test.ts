import { describe, it, expect } from 'vitest';
import { RandomizerService } from './randomizer';
import type { Digimon } from '../types/digimon';

describe('Reroll Determinism', () => {
	// Mock digimon data for testing
	const mockDigimon: Digimon[] = [
		{
			number: '001',
			name: 'Agumon',
			generation: 'Rookie',
			type: 'Reptile',
			attribute: 'Vaccine',
			basePersonality: 'Fighter',
			iconUrl: '/icons/agumon.png',
			detailsUrl: '/digimon/agumon'
		},
		{
			number: '002',
			name: 'Gabumon',
			generation: 'Rookie',
			type: 'Beast',
			attribute: 'Data',
			basePersonality: 'Durable',
			iconUrl: '/icons/gabumon.png',
			detailsUrl: '/digimon/gabumon'
		},
		{
			number: '003',
			name: 'Patamon',
			generation: 'Rookie',
			type: 'Mammal',
			attribute: 'Data',
			basePersonality: 'Nimble',
			iconUrl: '/icons/patamon.png',
			detailsUrl: '/digimon/patamon'
		},
		{
			number: '004',
			name: 'Palmon',
			generation: 'Rookie',
			type: 'Plant',
			attribute: 'Data',
			basePersonality: 'Brainy',
			iconUrl: '/icons/palmon.png',
			detailsUrl: '/digimon/palmon'
		},
		{
			number: '005',
			name: 'Tentomon',
			generation: 'Rookie',
			type: 'Insectoid',
			attribute: 'Free',
			basePersonality: 'Fighter',
			iconUrl: '/icons/tentomon.png',
			detailsUrl: '/digimon/tentomon'
		}
	];

	describe('Single slot reroll determinism', () => {
		it('should produce the same result when using the same seed and reroll count', () => {
			const baseSeed = 'test-seed-123';
			const bossOrder = 5;
			const rerollCount = 0;

			// First run
			const randomizer1 = new RandomizerService();
			const rerollSeed1 = `${baseSeed}-boss-${bossOrder}-reroll-${rerollCount}`;
			randomizer1.setSeed(rerollSeed1);
			const result1 = randomizer1.rerollSlot(mockDigimon, 'Rookie', ['001'], false);

			// Second run with same parameters
			const randomizer2 = new RandomizerService();
			const rerollSeed2 = `${baseSeed}-boss-${bossOrder}-reroll-${rerollCount}`;
			randomizer2.setSeed(rerollSeed2);
			const result2 = randomizer2.rerollSlot(mockDigimon, 'Rookie', ['001'], false);

			// Should produce same result
			expect(result1?.number).toBe(result2?.number);
		});

		it('should produce different results with different reroll counts', () => {
			const baseSeed = 'test-seed-123';
			const bossOrder = 5;

			// First reroll (rerollCount = 0)
			const randomizer1 = new RandomizerService();
			const rerollSeed1 = `${baseSeed}-boss-${bossOrder}-reroll-${0}`;
			randomizer1.setSeed(rerollSeed1);
			const result1 = randomizer1.rerollSlot(mockDigimon, 'Rookie', ['001'], false);

			// Second reroll (rerollCount = 1)
			const randomizer2 = new RandomizerService();
			const rerollSeed2 = `${baseSeed}-boss-${bossOrder}-reroll-${1}`;
			randomizer2.setSeed(rerollSeed2);
			const result2 = randomizer2.rerollSlot(mockDigimon, 'Rookie', ['001'], false);

			// Should produce different results
			expect(result1?.number).not.toBe(result2?.number);
		});

		it('should reproduce the same sequence of rerolls across multiple runs', () => {
			const baseSeed = 'test-seed-456';
			const bossOrder = 10;
			const currentTeam = ['001'];

			// Generate sequence 1
			const sequence1: string[] = [];
			for (let rerollCount = 0; rerollCount < 5; rerollCount++) {
				const randomizer = new RandomizerService();
				const rerollSeed = `${baseSeed}-boss-${bossOrder}-reroll-${rerollCount}`;
				randomizer.setSeed(rerollSeed);
				const result = randomizer.rerollSlot(mockDigimon, 'Rookie', currentTeam, false);
				if (result) sequence1.push(result.number);
			}

			// Generate sequence 2
			const sequence2: string[] = [];
			for (let rerollCount = 0; rerollCount < 5; rerollCount++) {
				const randomizer = new RandomizerService();
				const rerollSeed = `${baseSeed}-boss-${bossOrder}-reroll-${rerollCount}`;
				randomizer.setSeed(rerollSeed);
				const result = randomizer.rerollSlot(mockDigimon, 'Rookie', currentTeam, false);
				if (result) sequence2.push(result.number);
			}

			// Sequences should be identical
			expect(sequence1).toEqual(sequence2);
			expect(sequence1.length).toBe(5);
		});
	});

	describe('Full team reroll determinism', () => {
		it('should produce the same team when using the same seed and reroll count', () => {
			const baseSeed = 'test-seed-789';
			const bossOrder = 3;
			const rerollCount = 0;
			const teamSize = 3;

			// First run
			const randomizer1 = new RandomizerService();
			const rerollSeed1 = `${baseSeed}-boss-${bossOrder}-rerollall-${rerollCount}`;
			randomizer1.setSeed(rerollSeed1);
			const result1 = randomizer1.rerollMultiGeneration(
				mockDigimon,
				'Rookie',
				teamSize,
				[],
				false
			);

			// Second run with same parameters
			const randomizer2 = new RandomizerService();
			const rerollSeed2 = `${baseSeed}-boss-${bossOrder}-rerollall-${rerollCount}`;
			randomizer2.setSeed(rerollSeed2);
			const result2 = randomizer2.rerollMultiGeneration(
				mockDigimon,
				'Rookie',
				teamSize,
				[],
				false
			);

			// Should produce same team
			expect(result1.map((d) => d.number)).toEqual(result2.map((d) => d.number));
		});

		it('should produce different teams with different reroll counts', () => {
			const baseSeed = 'test-seed-789';
			const bossOrder = 3;
			const teamSize = 3;

			// First reroll (rerollCount = 0)
			const randomizer1 = new RandomizerService();
			const rerollSeed1 = `${baseSeed}-boss-${bossOrder}-rerollall-${0}`;
			randomizer1.setSeed(rerollSeed1);
			const result1 = randomizer1.rerollMultiGeneration(
				mockDigimon,
				'Rookie',
				teamSize,
				[],
				false
			);

			// Second reroll (rerollCount = 1)
			const randomizer2 = new RandomizerService();
			const rerollSeed2 = `${baseSeed}-boss-${bossOrder}-rerollall-${1}`;
			randomizer2.setSeed(rerollSeed2);
			const result2 = randomizer2.rerollMultiGeneration(
				mockDigimon,
				'Rookie',
				teamSize,
				[],
				false
			);

			// Should produce different teams
			expect(result1.map((d) => d.number)).not.toEqual(result2.map((d) => d.number));
		});

		it('should reproduce the same sequence of team rerolls across multiple runs', () => {
			const baseSeed = 'test-seed-xyz';
			const bossOrder = 8;
			const teamSize = 3;

			// Generate sequence 1
			const sequence1: string[][] = [];
			for (let rerollCount = 0; rerollCount < 3; rerollCount++) {
				const randomizer = new RandomizerService();
				const rerollSeed = `${baseSeed}-boss-${bossOrder}-rerollall-${rerollCount}`;
				randomizer.setSeed(rerollSeed);
				const result = randomizer.rerollMultiGeneration(
					mockDigimon,
					'Rookie',
					teamSize,
					[],
					false
				);
				sequence1.push(result.map((d) => d.number));
			}

			// Generate sequence 2
			const sequence2: string[][] = [];
			for (let rerollCount = 0; rerollCount < 3; rerollCount++) {
				const randomizer = new RandomizerService();
				const rerollSeed = `${baseSeed}-boss-${bossOrder}-rerollall-${rerollCount}`;
				randomizer.setSeed(rerollSeed);
				const result = randomizer.rerollMultiGeneration(
					mockDigimon,
					'Rookie',
					teamSize,
					[],
					false
				);
				sequence2.push(result.map((d) => d.number));
			}

			// Sequences should be identical
			expect(sequence1).toEqual(sequence2);
			expect(sequence1.length).toBe(3);
		});
	});

	describe('Cross-device consistency', () => {
		it('should produce identical results across different simulated devices', () => {
			const baseSeed = 'shared-seed-12345';
			const bossOrder = 15;

			// Simulate Device 1: Start run and do some rerolls
			const device1Results: string[] = [];
			for (let rerollCount = 0; rerollCount < 3; rerollCount++) {
				const randomizer = new RandomizerService();
				const rerollSeed = `${baseSeed}-boss-${bossOrder}-reroll-${rerollCount}`;
				randomizer.setSeed(rerollSeed);
				const result = randomizer.rerollSlot(mockDigimon, 'Rookie', ['001'], false);
				if (result) device1Results.push(result.number);
			}

			// Simulate Device 2: Same seed, same reroll sequence
			const device2Results: string[] = [];
			for (let rerollCount = 0; rerollCount < 3; rerollCount++) {
				const randomizer = new RandomizerService();
				const rerollSeed = `${baseSeed}-boss-${bossOrder}-reroll-${rerollCount}`;
				randomizer.setSeed(rerollSeed);
				const result = randomizer.rerollSlot(mockDigimon, 'Rookie', ['001'], false);
				if (result) device2Results.push(result.number);
			}

			// Results should be identical across devices
			expect(device1Results).toEqual(device2Results);
		});

		it('should maintain consistency even when rerolls happen at different times', () => {
			const baseSeed = 'shared-seed-67890';
			const bossOrder = 20;
			const teamSize = 3;

			// Device 1: Do rerolls with gaps (simulating different timestamps)
			const device1RerollAtCount2 = () => {
				const randomizer = new RandomizerService();
				const rerollSeed = `${baseSeed}-boss-${bossOrder}-rerollall-${2}`;
				randomizer.setSeed(rerollSeed);
				return randomizer.rerollMultiGeneration(mockDigimon, 'Rookie', teamSize, [], false);
			};

			// Device 2: Do same reroll at count 2
			const device2RerollAtCount2 = () => {
				const randomizer = new RandomizerService();
				const rerollSeed = `${baseSeed}-boss-${bossOrder}-rerollall-${2}`;
				randomizer.setSeed(rerollSeed);
				return randomizer.rerollMultiGeneration(mockDigimon, 'Rookie', teamSize, [], false);
			};

			const result1 = device1RerollAtCount2();
			const result2 = device2RerollAtCount2();

			// Should get same result regardless of when the reroll happens
			expect(result1.map((d) => d.number)).toEqual(result2.map((d) => d.number));
		});
	});
});
