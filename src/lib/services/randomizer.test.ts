import { describe, it, expect, beforeEach } from 'vitest';
import {
	SeededRandom,
	RandomizerService,
	getGenerationsUpTo,
	GENERATION_HIERARCHY
} from './randomizer';
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

	it('should pick one element from array', () => {
		const rng = new SeededRandom('test-seed');
		const array = [1, 2, 3, 4, 5];
		const picked = rng.pickOne(array);

		expect(picked).toBeDefined();
		expect(array).toContain(picked);
	});

	it('should return undefined when picking from empty array', () => {
		const rng = new SeededRandom('test-seed');
		const picked = rng.pickOne([]);

		expect(picked).toBeUndefined();
	});
});

describe('getGenerationsUpTo', () => {
	it('should return In-Training I only for In-Training I generation', () => {
		const generations = getGenerationsUpTo('In-Training I');
		expect(generations).toEqual(['In-Training I']);
	});

	it('should return all generations up to Mega', () => {
		const generations = getGenerationsUpTo('Mega');
		expect(generations).toEqual([
			'In-Training I',
			'In-Training II',
			'Rookie',
			'Champion',
			'Ultimate',
			'Mega'
		]);
	});

	it('should return all generations including Mega + for Mega + generation', () => {
		const generations = getGenerationsUpTo('Mega +');
		expect(generations).toEqual([
			'In-Training I',
			'In-Training II',
			'Rookie',
			'Champion',
			'Ultimate',
			'Mega',
			'Mega +'
		]);
	});

	it('should contain Mega + in the standard hierarchy', () => {
		expect(GENERATION_HIERARCHY).toContain('Mega +');
	});

	it('should return Armor only for Armor generation (special handling)', () => {
		const generations = getGenerationsUpTo('Armor');
		expect(generations).toEqual(['Armor']);
	});

	it('should return Hybrid only for Hybrid generation (special handling)', () => {
		const generations = getGenerationsUpTo('Hybrid');
		expect(generations).toEqual(['Hybrid']);
	});
});

describe('RandomizerService', () => {
	let randomizer: RandomizerService;
	let digimon: Digimon[];

	beforeEach(() => {
		randomizer = new RandomizerService('test-seed');
		digimon = [
			{
				number: '009',
				name: 'Koromon',
				generation: 'In-Training II',
				attribute: 'No Data',
				type: 'Lesser',
				basePersonality: 'Daring',
				iconUrl: 'https://example.com/koromon.png',
				detailsUrl: 'https://example.com/koromon'
			},
			{
				number: '011',
				name: 'Tsunomon',
				generation: 'In-Training II',
				attribute: 'No Data',
				type: 'Lesser',
				basePersonality: 'Friendly',
				iconUrl: 'https://example.com/tsunomon.png',
				detailsUrl: 'https://example.com/tsunomon'
			},
			{
				number: '021',
				name: 'Agumon',
				generation: 'Rookie',
				attribute: 'Vaccine',
				type: 'Reptile',
				basePersonality: 'Daring',
				iconUrl: 'https://example.com/agumon.png',
				detailsUrl: 'https://example.com/agumon'
			},
			{
				number: '043',
				name: 'Gabumon',
				generation: 'Rookie',
				attribute: 'Data',
				type: 'Reptile',
				basePersonality: 'Sociable',
				iconUrl: 'https://example.com/gabumon.png',
				detailsUrl: 'https://example.com/gabumon'
			},
			{
				number: '051',
				name: 'Patamon',
				generation: 'Rookie',
				attribute: 'Data',
				type: 'Mammal',
				basePersonality: 'Enlightened',
				iconUrl: 'https://example.com/patamon.png',
				detailsUrl: 'https://example.com/patamon'
			},
			{
				number: '075',
				name: 'Greymon',
				generation: 'Champion',
				attribute: 'Vaccine',
				type: 'Dinosaur',
				basePersonality: 'Daring',
				iconUrl: 'https://example.com/greymon.png',
				detailsUrl: 'https://example.com/greymon'
			},
			{
				number: '200',
				name: 'MetalGreymon',
				generation: 'Ultimate',
				attribute: 'Vaccine',
				type: 'Android',
				basePersonality: 'Reckless',
				iconUrl: 'https://example.com/metalgreymon.png',
				detailsUrl: 'https://example.com/metalgreymon'
			},
			{
				number: '321',
				name: 'WarGreymon',
				generation: 'Mega',
				attribute: 'Vaccine',
				type: 'Dragon Man',
				basePersonality: 'Daring',
				iconUrl: 'https://example.com/wargreymon.png',
				detailsUrl: 'https://example.com/wargreymon'
			},
			{
				number: '430',
				name: 'Omnimon',
				generation: 'Mega +',
				attribute: 'Vaccine',
				type: 'Holy Knight',
				basePersonality: 'Daring',
				iconUrl: 'https://example.com/omnimon.png',
				detailsUrl: 'https://example.com/omnimon'
			}
		];
	});

	it('should filter digimon by generation', () => {
		const rookies = randomizer.getRandomDigimon(digimon, 'Rookie', 2, []);

		expect(rookies).toHaveLength(2);
		rookies.forEach((d) => {
			expect(d.generation).toBe('Rookie');
		});
	});

	it('should exclude specified digimon', () => {
		const excluded = ['021', '043'];
		const rookies = randomizer.getRandomDigimon(digimon, 'Rookie', 1, excluded);

		expect(rookies).toHaveLength(1);
		expect(rookies[0].number).toBe('051');
	});

	it('should prevent duplicates', () => {
		const selected = randomizer.getRandomDigimon(digimon, 'Rookie', 3, []);
		const numbers = selected.map((d) => d.number);
		const uniqueNumbers = new Set(numbers);

		expect(uniqueNumbers.size).toBe(numbers.length);
	});

	it('should generate consistent results with same seed', () => {
		const randomizer1 = new RandomizerService('same-seed');
		const randomizer2 = new RandomizerService('same-seed');

		const team1 = randomizer1.getRandomDigimon(digimon, 'Rookie', 2, []);
		const team2 = randomizer2.getRandomDigimon(digimon, 'Rookie', 2, []);

		expect(team1.map((d) => d.number)).toEqual(team2.map((d) => d.number));
	});

	describe('getRandomDigimonMultiGeneration', () => {
		it('should return digimon from multiple generations up to max', () => {
			const selected = randomizer.getRandomDigimonMultiGeneration(digimon, 'Champion', 4, []);

			expect(selected.length).toBeLessThanOrEqual(4);
			selected.forEach((d) => {
				expect(['In-Training I', 'In-Training II', 'Rookie', 'Champion']).toContain(d.generation);
			});
		});

		it('should not include generations above max', () => {
			const selected = randomizer.getRandomDigimonMultiGeneration(digimon, 'Rookie', 6, []);

			selected.forEach((d) => {
				expect(['In-Training I', 'In-Training II', 'Rookie']).toContain(d.generation);
				expect(['Champion', 'Ultimate', 'Mega', 'Mega +']).not.toContain(d.generation);
			});
		});

		it('should exclude specified digimon', () => {
			const selected = randomizer.getRandomDigimonMultiGeneration(digimon, 'Rookie', 3, [
				'009',
				'021'
			]);

			const numbers = selected.map((d) => d.number);
			expect(numbers).not.toContain('009');
			expect(numbers).not.toContain('021');
		});
	});

	describe('rerollSlot', () => {
		it('should return a new digimon not in current team', () => {
			const currentTeam = ['009', '011'];
			const newDigimon = randomizer.rerollSlot(digimon, 'Rookie', currentTeam);

			expect(newDigimon).not.toBeNull();
			expect(currentTeam).not.toContain(newDigimon?.number);
		});

		it('should return null when no digimon available', () => {
			const allNumbers = digimon
				.filter((d) => ['In-Training I', 'In-Training II', 'Rookie'].includes(d.generation))
				.map((d) => d.number);
			const newDigimon = randomizer.rerollSlot(digimon, 'Rookie', allNumbers);

			expect(newDigimon).toBeNull();
		});
	});

	describe('rerollMultiGeneration', () => {
		it('should return team from multiple generations', () => {
			const team = randomizer.rerollMultiGeneration(digimon, 'Champion', 4, []);

			expect(team.length).toBeLessThanOrEqual(4);
			team.forEach((d) => {
				expect(['In-Training I', 'In-Training II', 'Rookie', 'Champion']).toContain(d.generation);
			});
		});
	});

	describe('Lucemon special generation mapping', () => {
		let digimonWithLucemon: Digimon[];

		beforeEach(() => {
			digimonWithLucemon = [
				...digimon,
				{
					number: '039',
					name: 'Lucemon',
					generation: 'Rookie',
					attribute: 'Vaccine',
					type: 'Angel',
					basePersonality: 'Enlightened',
					iconUrl: 'https://example.com/lucemon.png',
					detailsUrl: 'https://example.com/lucemon'
				},
				{
					number: '296',
					name: 'Lucemon CM',
					generation: 'Ultimate',
					attribute: 'Virus',
					type: 'Evil King',
					basePersonality: 'Enlightened',
					iconUrl: 'https://example.com/lucemon-cm.png',
					detailsUrl: 'https://example.com/lucemon-cm'
				}
			];
		});

		it('should not include Lucemon (Rookie) when filtering for Rookie generation', () => {
			const rookies = randomizer.getRandomDigimonMultiGeneration(
				digimonWithLucemon,
				'Rookie',
				10,
				[]
			);

			// Lucemon should not be included because it's treated as Ultimate
			const lucemonIncluded = rookies.some((d) => d.number === '039');
			expect(lucemonIncluded).toBe(false);
		});

		it('should include Lucemon (Rookie) when filtering for Ultimate generation', () => {
			const ultimates = randomizer.getRandomDigimonMultiGeneration(
				digimonWithLucemon,
				'Ultimate',
				10,
				[]
			);

			// Lucemon should be included because it's treated as Ultimate
			const lucemonIncluded = ultimates.some((d) => d.number === '039');
			expect(lucemonIncluded).toBe(true);
		});

		it('should not include Lucemon CM (Ultimate) when filtering for Ultimate generation', () => {
			const ultimates = randomizer.getRandomDigimonMultiGeneration(
				digimonWithLucemon,
				'Ultimate',
				10,
				[]
			);

			// Lucemon CM should not be included because it's treated as Mega
			const lucemonCMIncluded = ultimates.some((d) => d.number === '296');
			expect(lucemonCMIncluded).toBe(false);
		});

		it('should include Lucemon CM (Ultimate) when filtering for Mega generation', () => {
			const megas = randomizer.getRandomDigimonMultiGeneration(digimonWithLucemon, 'Mega', 10, []);

			// Lucemon CM should be included because it's treated as Mega
			const lucemonCMIncluded = megas.some((d) => d.number === '296');
			expect(lucemonCMIncluded).toBe(true);
		});

		it('should exclude Lucemon (Rookie) from Champion and below filters', () => {
			const champions = randomizer.getRandomDigimonMultiGeneration(
				digimonWithLucemon,
				'Champion',
				10,
				[]
			);

			// Lucemon should not be included at Champion level
			const lucemonIncluded = champions.some((d) => d.number === '039');
			expect(lucemonIncluded).toBe(false);
		});
	});

	describe('Boss Progression Integration', () => {
		let digimonWithRequirements: Digimon[];

		beforeEach(() => {
			digimonWithRequirements = [
				// Regular digimon with no boss requirements
				{
					number: '001',
					name: 'Kuramon',
					generation: 'In-Training I',
					attribute: 'No Data',
					type: 'Unidentified',
					basePersonality: 'Sly',
					iconUrl: 'test.png',
					detailsUrl: 'test.html'
				},
				// Armor digimon requiring digi-egg (boss 10+)
				{
					number: '179',
					name: 'Submarimon',
					generation: 'Armor',
					attribute: 'Free',
					type: 'Aquatic',
					basePersonality: 'Overprotective',
					iconUrl: 'test.png',
					detailsUrl: 'test.html',
					evolutionRequirements: {
						requiredItem: 'Digi-Egg of Knowledge'
					}
				},
				// Hybrid digimon requiring spirit (boss 10+)
				{
					number: '187',
					name: 'Agunimon',
					generation: 'Hybrid',
					attribute: 'Variable',
					type: 'Wizard',
					basePersonality: 'Zealous',
					iconUrl: 'test.png',
					detailsUrl: 'test.html',
					evolutionRequirements: {
						requiredItem: 'Human Spirit of Fire'
					}
				},
				// Regular champion
				{
					number: '021',
					name: 'Greymon',
					generation: 'Champion',
					attribute: 'Vaccine',
					type: 'Dinosaur',
					basePersonality: 'Brave',
					iconUrl: 'test.png',
					detailsUrl: 'test.html'
				}
			];
		});

		describe('filterByBossProgression', () => {
			it('should return boss progression filtered digimon', () => {
				// Early boss - should only get non-special digimon
				const earlyFiltered = randomizer.filterByBossProgression(digimonWithRequirements, 5);
				expect(earlyFiltered).toHaveLength(2);
				expect(earlyFiltered.map(d => d.name)).toEqual(['Kuramon', 'Greymon']);

				// Vulcanusmon boss - should include armor/hybrid
				const vulcanusFiltered = randomizer.filterByBossProgression(digimonWithRequirements, 10);
				expect(vulcanusFiltered).toHaveLength(4);
			});
		});

		describe('getRandomDigimon with boss progression', () => {
			it('should respect boss progression in single generation selection', () => {
				// Before Vulcanusmon - no Armor digimon should be selected
				const earlyResult = randomizer.getRandomDigimon(
					digimonWithRequirements, 
					'Armor', 
					10, 
					[], 
					5 // Boss order 5
				);
				expect(earlyResult).toHaveLength(0);

				// After Vulcanusmon - Armor digimon should be available
				const lateResult = randomizer.getRandomDigimon(
					digimonWithRequirements, 
					'Armor', 
					10, 
					[], 
					10 // Boss order 10
				);
				expect(lateResult).toHaveLength(1);
				expect(lateResult[0].name).toBe('Submarimon');
			});
		});

		describe('getRandomDigimonMultiGeneration with boss progression', () => {
			it('should include boss progression filtering', () => {
				// Before Vulcanusmon
				const earlyResult = randomizer.getRandomDigimonMultiGeneration(
					digimonWithRequirements,
					'Champion',
					10,
					[],
					false,
					undefined,
					true, // include non-standard
					5 // Boss order 5
				);
				
				// Should not include armor/hybrid digimon
				const hasArmor = earlyResult.some(d => d.generation === 'Armor');
				const hasHybrid = earlyResult.some(d => d.generation === 'Hybrid');
				expect(hasArmor).toBe(false);
				expect(hasHybrid).toBe(false);

				// After Vulcanusmon
				const lateResult = randomizer.getRandomDigimonMultiGeneration(
					digimonWithRequirements,
					'Champion',
					10,
					[],
					false,
					undefined,
					true, // include non-standard
					10 // Boss order 10
				);
				
				// Should potentially include armor/hybrid digimon (if they're equivalent to Champion)
				// We can't guarantee they'll be selected due to randomness, but pool should include them
				expect(lateResult.length).toBeGreaterThan(0);
			});
		});

		describe('rerollSlot with boss progression', () => {
			it('should respect boss progression when rerolling slots', () => {
				// Test with higher boss order first to ensure digimon are available
				const result = randomizer.rerollSlot(
					digimonWithRequirements,
					'Champion',
					['001'], // Exclude Kuramon
					false,
					undefined,
					true, // include non-standard
					10 // Boss order 10
				);
				
				expect(result).not.toBeNull();
				if (result) {
					expect(result.number).not.toBe('001'); // Should not be excluded digimon
				}
			});
		});

		describe('rerollMultiGeneration with boss progression', () => {
			it('should use boss progression in multi-generation reroll', () => {
				const result = randomizer.rerollMultiGeneration(
					digimonWithRequirements,
					'Champion',
					2,
					[],
					false,
					undefined,
					true, // include non-standard
					10 // Boss order 10
				);
				
				expect(result).toHaveLength(2);
				// With boss progression, more digimon should be available
			});
		});

		describe('Backwards compatibility', () => {
			it('should work without boss progression parameter', () => {
				// All existing methods should work without the new parameter
				const result1 = randomizer.getRandomDigimon(digimonWithRequirements, 'Champion', 2);
				const result2 = randomizer.getRandomDigimonMultiGeneration(digimonWithRequirements, 'Champion', 2);
				const result3 = randomizer.rerollSlot(digimonWithRequirements, 'Champion', []);
				const result4 = randomizer.rerollMultiGeneration(digimonWithRequirements, 'Champion', 2);

				// Should not throw errors and return valid results
				expect(Array.isArray(result1)).toBe(true);
				expect(Array.isArray(result2)).toBe(true);
				expect(result3 === null || typeof result3 === 'object').toBe(true);
				expect(Array.isArray(result4)).toBe(true);
			});
		});
	});
});
