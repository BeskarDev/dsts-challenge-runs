import { describe, it, expect, beforeEach } from 'vitest';
import { SeededRandom, RandomizerService } from './randomizer';
import type { Digimon } from '../types/digimon';

describe('SeededRandom', () => {
	it('should generate consistent random numbers with same seed', () => {
		const rng1 = new SeededRandom('test-seed');
		const rng2 = new SeededRandom('test-seed');

		const values1 = [rng1.next(), rng1.next(), rng1.next()];
		const values2 = [rng2.next(), rng2.next(), rng2.next()];

		expect(values1).toEqual(values2);
	});

	it('should generate different numbers with different seeds', () => {
		const rng1 = new SeededRandom('seed-1');
		const rng2 = new SeededRandom('seed-2');

		const value1 = rng1.next();
		const value2 = rng2.next();

		expect(value1).not.toEqual(value2);
	});

	it('should generate integers in range', () => {
		const rng = new SeededRandom('test-seed');
		
		for (let i = 0; i < 100; i++) {
			const value = rng.nextInt(0, 10);
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(10);
		}
	});

	it('should shuffle array consistently with same seed', () => {
		const array = [1, 2, 3, 4, 5];
		
		const rng1 = new SeededRandom('test-seed');
		const shuffled1 = rng1.shuffle(array);
		
		const rng2 = new SeededRandom('test-seed');
		const shuffled2 = rng2.shuffle(array);

		expect(shuffled1).toEqual(shuffled2);
	});
});

describe('RandomizerService', () => {
	let randomizer: RandomizerService;
	let digimon: Digimon[];

	beforeEach(() => {
		randomizer = new RandomizerService('test-seed');
		digimon = [
			{ id: 'koromon', name: 'Koromon', stage: 'Baby' },
			{ id: 'tsunomon', name: 'Tsunomon', stage: 'Baby' },
			{ id: 'agumon', name: 'Agumon', stage: 'Rookie' },
			{ id: 'gabumon', name: 'Gabumon', stage: 'Rookie' },
			{ id: 'patamon', name: 'Patamon', stage: 'Rookie' },
			{ id: 'greymon', name: 'Greymon', stage: 'Champion' }
		];
	});

	it('should filter digimon by stage', () => {
		const rookies = randomizer.getRandomDigimon(digimon, 'Rookie', 2, []);
		
		expect(rookies).toHaveLength(2);
		rookies.forEach((d) => {
			expect(d.stage).toBe('Rookie');
		});
	});

	it('should exclude specified digimon', () => {
		const excluded = ['agumon', 'gabumon'];
		const rookies = randomizer.getRandomDigimon(digimon, 'Rookie', 1, excluded);
		
		expect(rookies).toHaveLength(1);
		expect(rookies[0].id).toBe('patamon');
	});

	it('should prevent duplicates', () => {
		const selected = randomizer.getRandomDigimon(digimon, 'Rookie', 3, []);
		const ids = selected.map((d) => d.id);
		const uniqueIds = new Set(ids);
		
		expect(uniqueIds.size).toBe(ids.length);
	});

	it('should generate consistent results with same seed', () => {
		const randomizer1 = new RandomizerService('same-seed');
		const randomizer2 = new RandomizerService('same-seed');
		
		const team1 = randomizer1.getRandomDigimon(digimon, 'Rookie', 2, []);
		const team2 = randomizer2.getRandomDigimon(digimon, 'Rookie', 2, []);
		
		expect(team1.map((d) => d.id)).toEqual(team2.map((d) => d.id));
	});

	it('should change seed on reroll', () => {
		const initialSeed = randomizer.getSeed();
		randomizer.reroll(digimon, 'Rookie', 2, []);
		const newSeed = randomizer.getSeed();
		
		expect(newSeed).not.toBe(initialSeed);
	});
});
