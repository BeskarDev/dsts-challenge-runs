import { describe, it, expect } from 'vitest';
import {
	buildEvolutionGraphFromDigimon,
	findShortestPaths,
	formatPath,
	getAvailableDigimon,
	validateEvolutionGraph,
	type EvolutionGraph,
	type EvolutionPath
} from './evolution-pathfinding';
import type { Digimon } from '../types/digimon';

describe('Evolution Pathfinding Service', () => {
	// Sample evolution graph for testing
	const testGraph: EvolutionGraph = {
		Kuramon: {
			evolvesFrom: [],
			evolvesTo: ['Tsumemon', 'Pagumon']
		},
		Tsumemon: {
			evolvesFrom: ['Kuramon'],
			evolvesTo: ['Dracmon', 'Keramon']
		},
		Pagumon: {
			evolvesFrom: ['Kuramon'],
			evolvesTo: ['Gazimon', 'DemiDevimon']
		},
		Dracmon: {
			evolvesFrom: ['Tsumemon'],
			evolvesTo: ['Sangloupmon']
		},
		Keramon: {
			evolvesFrom: ['Tsumemon'],
			evolvesTo: ['Chrysalimon']
		},
		Gazimon: {
			evolvesFrom: ['Pagumon'],
			evolvesTo: ['Devimon']
		},
		DemiDevimon: {
			evolvesFrom: ['Pagumon'],
			evolvesTo: ['Devimon']
		},
		Sangloupmon: {
			evolvesFrom: ['Dracmon'],
			evolvesTo: ['Matadormon']
		},
		Chrysalimon: {
			evolvesFrom: ['Keramon'],
			evolvesTo: ['Infermon']
		},
		Devimon: {
			evolvesFrom: ['Gazimon', 'DemiDevimon'],
			evolvesTo: ['Myotismon']
		},
		Matadormon: {
			evolvesFrom: ['Sangloupmon'],
			evolvesTo: []
		},
		Infermon: {
			evolvesFrom: ['Chrysalimon'],
			evolvesTo: []
		},
		Myotismon: {
			evolvesFrom: ['Devimon'],
			evolvesTo: []
		}
	};

	// Graph with a jogress/fusion Digimon (name contains " + ")
	const jogressGraph: EvolutionGraph = {
		Craniamon: {
			evolvesFrom: ['SomeUltimateMon'],
			evolvesTo: ['Craniamon + Enbarrmon']
		},
		Enbarrmon: {
			evolvesFrom: ['AnotherUltimateMon'],
			evolvesTo: ['Craniamon + Enbarrmon']
		},
		'Craniamon + Enbarrmon': {
			evolvesFrom: ['Craniamon', 'Enbarrmon'],
			evolvesTo: []
		},
		SomeUltimateMon: {
			evolvesFrom: [],
			evolvesTo: ['Craniamon']
		},
		AnotherUltimateMon: {
			evolvesFrom: [],
			evolvesTo: ['Enbarrmon']
		}
	};

	describe('findShortestPaths', () => {
		it('should return empty path when source equals target', () => {
			const paths = findShortestPaths('Dracmon', 'Dracmon', testGraph);
			expect(paths).toHaveLength(1);
			expect(paths[0].steps).toHaveLength(0);
			expect(paths[0].length).toBe(0);
		});

		it('should find direct evolution path (up)', () => {
			const paths = findShortestPaths('Dracmon', 'Sangloupmon', testGraph);
			expect(paths).toHaveLength(1);
			expect(paths[0].length).toBe(1);
			expect(paths[0].steps[0]).toEqual({
				from: 'Dracmon',
				to: 'Sangloupmon',
				direction: 'up'
			});
		});

		it('should find direct de-evolution path (down)', () => {
			const paths = findShortestPaths('Dracmon', 'Tsumemon', testGraph);
			expect(paths).toHaveLength(1);
			expect(paths[0].length).toBe(1);
			expect(paths[0].steps[0]).toEqual({
				from: 'Dracmon',
				to: 'Tsumemon',
				direction: 'down'
			});
		});

		it('should find path through common ancestor (Dracmon → Gazimon)', () => {
			const paths = findShortestPaths('Dracmon', 'Gazimon', testGraph);
			expect(paths.length).toBeGreaterThanOrEqual(1);

			// Path should be: Dracmon → Tsumemon → Kuramon → Pagumon → Gazimon (4 steps)
			const shortestPath = paths[0];
			expect(shortestPath.length).toBe(4);

			// Verify path structure
			expect(shortestPath.steps[0].from).toBe('Dracmon');
			expect(shortestPath.steps[0].direction).toBe('down');
			expect(shortestPath.steps[shortestPath.length - 1].to).toBe('Gazimon');
		});

		it('should find multiple paths of equal length', () => {
			// Both Gazimon and DemiDevimon evolve to Devimon
			// So from Pagumon to Devimon, there are 2 paths:
			// Pagumon → Gazimon → Devimon
			// Pagumon → DemiDevimon → Devimon
			const paths = findShortestPaths('Pagumon', 'Devimon', testGraph);
			expect(paths).toHaveLength(2);
			expect(paths[0].length).toBe(2);
			expect(paths[1].length).toBe(2);

			// Verify both paths reach Devimon
			const endpoints = paths.map((p) => p.steps[p.steps.length - 1].to);
			expect(endpoints.every((e) => e === 'Devimon')).toBe(true);

			// Verify they go through different intermediates
			const intermediates = paths.map((p) => p.steps[0].to);
			expect(intermediates).toContain('Gazimon');
			expect(intermediates).toContain('DemiDevimon');
		});

		it('should return empty array for non-existent source', () => {
			const paths = findShortestPaths('NonExistent', 'Dracmon', testGraph);
			expect(paths).toHaveLength(0);
		});

		it('should return empty array for non-existent target', () => {
			const paths = findShortestPaths('Dracmon', 'NonExistent', testGraph);
			expect(paths).toHaveLength(0);
		});

		it('should handle isolated Digimon with no path', () => {
			const isolatedGraph: EvolutionGraph = {
				Agumon: { evolvesFrom: [], evolvesTo: ['Greymon'] },
				Greymon: { evolvesFrom: ['Agumon'], evolvesTo: [] },
				Gabumon: { evolvesFrom: [], evolvesTo: ['Garurumon'] },
				Garurumon: { evolvesFrom: ['Gabumon'], evolvesTo: [] }
			};

			const paths = findShortestPaths('Agumon', 'Gabumon', isolatedGraph);
			expect(paths).toHaveLength(0);
		});

		it('should terminate quickly for large disconnected graphs (no path)', () => {
			// Create a large graph with two isolated subgraphs to verify BFS terminates
			const largeGraph: EvolutionGraph = {};
			// Build a chain of 50 Digimon in one subgraph
			for (let i = 0; i < 50; i++) {
				largeGraph[`Mon${i}`] = {
					evolvesFrom: i > 0 ? [`Mon${i - 1}`] : [],
					evolvesTo: i < 49 ? [`Mon${i + 1}`] : []
				};
			}
			// Build another isolated chain of 50 Digimon
			for (let i = 0; i < 50; i++) {
				largeGraph[`Other${i}`] = {
					evolvesFrom: i > 0 ? [`Other${i - 1}`] : [],
					evolvesTo: i < 49 ? [`Other${i + 1}`] : []
				};
			}
			// These two chains are not connected
			const start = Date.now();
			const paths = findShortestPaths('Mon0', 'Other0', largeGraph);
			const elapsed = Date.now() - start;
			expect(paths).toHaveLength(0);
			// Should terminate quickly - well within 1 second
			expect(elapsed).toBeLessThan(1000);
		});

		it('should prevent cycles', () => {
			// With the test graph, there's no cycle but let's verify paths don't revisit nodes
			const paths = findShortestPaths('Dracmon', 'Gazimon', testGraph);
			for (const path of paths) {
				const visited = new Set<string>();
				visited.add('Dracmon'); // Start node
				for (const step of path.steps) {
					expect(visited.has(step.to)).toBe(false);
					visited.add(step.to);
				}
			}
		});

		it('should handle whitespace in names', () => {
			const paths = findShortestPaths('  Dracmon  ', 'Sangloupmon', testGraph);
			expect(paths).toHaveLength(1);
		});

		it('should detect jogress partner when digivolving to a fusion Digimon', () => {
			// Path: Craniamon → "Craniamon + Enbarrmon"
			const paths = findShortestPaths('Craniamon', 'Craniamon + Enbarrmon', jogressGraph);
			expect(paths).toHaveLength(1);
			expect(paths[0].length).toBe(1);
			const step = paths[0].steps[0];
			expect(step.direction).toBe('up');
			expect(step.jogressPartner).toBe('Enbarrmon');
		});

		it('should detect jogress partner for the other parent', () => {
			// Path: Enbarrmon → "Craniamon + Enbarrmon"
			const paths = findShortestPaths('Enbarrmon', 'Craniamon + Enbarrmon', jogressGraph);
			expect(paths).toHaveLength(1);
			const step = paths[0].steps[0];
			expect(step.direction).toBe('up');
			expect(step.jogressPartner).toBe('Craniamon');
		});

		it('should not set jogress partner for non-fusion Digimon steps', () => {
			const paths = findShortestPaths('Dracmon', 'Sangloupmon', testGraph);
			expect(paths).toHaveLength(1);
			const step = paths[0].steps[0];
			expect(step.jogressPartner).toBeUndefined();
		});

		it('should detect jogress partner in multi-step path through fusion Digimon', () => {
			// Path: SomeUltimateMon → Craniamon → "Craniamon + Enbarrmon"
			const paths = findShortestPaths('SomeUltimateMon', 'Craniamon + Enbarrmon', jogressGraph);
			expect(paths).toHaveLength(1);
			expect(paths[0].length).toBe(2);
			// Second step is the jogress step
			const jogressStep = paths[0].steps[1];
			expect(jogressStep.from).toBe('Craniamon');
			expect(jogressStep.to).toBe('Craniamon + Enbarrmon');
			expect(jogressStep.jogressPartner).toBe('Enbarrmon');
		});
	});

	describe('formatPath', () => {
		it('should format empty path', () => {
			const path: EvolutionPath = { steps: [], length: 0 };
			expect(formatPath(path)).toBe('Already at destination');
		});

		it('should format single step path', () => {
			const path: EvolutionPath = {
				steps: [{ from: 'Dracmon', to: 'Sangloupmon', direction: 'up' }],
				length: 1
			};
			expect(formatPath(path)).toBe('Dracmon → Sangloupmon');
		});

		it('should format multi-step path with mixed directions', () => {
			const path: EvolutionPath = {
				steps: [
					{ from: 'Dracmon', to: 'Tsumemon', direction: 'down' },
					{ from: 'Tsumemon', to: 'Kuramon', direction: 'down' },
					{ from: 'Kuramon', to: 'Pagumon', direction: 'up' },
					{ from: 'Pagumon', to: 'Gazimon', direction: 'up' }
				],
				length: 4
			};
			expect(formatPath(path)).toBe('Dracmon ← Tsumemon ← Kuramon → Pagumon → Gazimon');
		});
	});

	describe('getAvailableDigimon', () => {
		it('should return sorted list of Digimon', () => {
			const available = getAvailableDigimon(testGraph);
			expect(available).toEqual([
				'Chrysalimon',
				'DemiDevimon',
				'Devimon',
				'Dracmon',
				'Gazimon',
				'Infermon',
				'Keramon',
				'Kuramon',
				'Matadormon',
				'Myotismon',
				'Pagumon',
				'Sangloupmon',
				'Tsumemon'
			]);
		});

		it('should return empty array for empty graph', () => {
			const available = getAvailableDigimon({});
			expect(available).toEqual([]);
		});
	});

	describe('buildEvolutionGraphFromDigimon', () => {
		it('should include every Digimon entry even when evolution arrays are missing', () => {
			const digimon: Digimon[] = [
				{
					number: '001',
					name: 'Agumon',
					generation: 'Rookie',
					attribute: 'Vaccine',
					type: 'Reptile',
					basePersonality: 'Daring',
					iconUrl: 'agumon.png',
					detailsUrl: 'agumon.html',
					evolvesTo: ['Greymon']
				},
				{
					number: '450',
					name: 'Omnimon (X Antibody)',
					generation: 'Mega +',
					attribute: 'Vaccine',
					type: 'Holy Warrior',
					basePersonality: 'Cool',
					iconUrl: 'omnimon-x.png',
					detailsUrl: 'omnimon-x.html',
					evolvesFrom: ['Omnimon'],
					evolvesTo: ['Omnimon']
				},
				{
					number: '451',
					name: 'BanchoMamemon',
					generation: 'Mega',
					attribute: 'Data',
					type: 'Mutant',
					basePersonality: 'Lively',
					iconUrl: 'banchomamemon.png',
					detailsUrl: 'banchomamemon.html'
				}
			];

			const graph = buildEvolutionGraphFromDigimon(digimon);

			expect(Object.keys(graph).sort()).toEqual([
				'Agumon',
				'BanchoMamemon',
				'Omnimon (X Antibody)'
			]);
			expect(graph['Agumon']).toEqual({ evolvesFrom: [], evolvesTo: ['Greymon'] });
			expect(graph['Omnimon (X Antibody)']).toEqual({
				evolvesFrom: ['Omnimon'],
				evolvesTo: ['Omnimon']
			});
			expect(graph['BanchoMamemon']).toEqual({ evolvesFrom: [], evolvesTo: [] });
		});
	});

	describe('validateEvolutionGraph', () => {
		it('should return no warnings for valid graph', () => {
			const warnings = validateEvolutionGraph(testGraph);
			expect(warnings).toHaveLength(0);
		});

		it('should warn about missing evolvesTo target', () => {
			const invalidGraph: EvolutionGraph = {
				Agumon: { evolvesFrom: [], evolvesTo: ['Greymon'] }
				// Greymon is missing
			};
			const warnings = validateEvolutionGraph(invalidGraph);
			expect(warnings).toContain('Agumon evolvesTo "Greymon" which doesn\'t exist in graph');
		});

		it('should warn about missing evolvesFrom source', () => {
			const invalidGraph: EvolutionGraph = {
				Greymon: { evolvesFrom: ['Agumon'], evolvesTo: [] }
				// Agumon is missing
			};
			const warnings = validateEvolutionGraph(invalidGraph);
			expect(warnings).toContain('Greymon evolvesFrom "Agumon" which doesn\'t exist in graph');
		});

		it('should warn about missing bidirectional consistency', () => {
			const invalidGraph: EvolutionGraph = {
				Agumon: { evolvesFrom: [], evolvesTo: ['Greymon'] },
				Greymon: { evolvesFrom: [], evolvesTo: [] } // Missing Agumon in evolvesFrom
			};
			const warnings = validateEvolutionGraph(invalidGraph);
			expect(warnings).toContain(
				"Agumon evolvesTo Greymon, but Greymon doesn't evolvesFrom Agumon"
			);
		});
	});
});
