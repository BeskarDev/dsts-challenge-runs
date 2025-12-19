/**
 * Evolution Pathfinding Service
 *
 * Implements BFS-based pathfinding to find the shortest evolution paths
 * between any two Digimon in the evolution graph.
 */

/** Represents a single step in an evolution path */
export interface EvolutionStep {
	/** Source Digimon name */
	from: string;
	/** Target Digimon name */
	to: string;
	/** Direction: 'up' = digivolve, 'down' = de-digivolve */
	direction: 'up' | 'down';
}

/** Represents a complete evolution path */
export interface EvolutionPath {
	/** Array of steps from source to target */
	steps: EvolutionStep[];
	/** Total number of steps */
	length: number;
}

/** Evolution data for a single Digimon */
export interface EvolutionData {
	evolvesFrom: string[];
	evolvesTo: string[];
}

/** The complete evolution graph */
export interface EvolutionGraph {
	[digimonName: string]: EvolutionData;
}

/** Node in the BFS queue */
interface PathNode {
	digimon: string;
	path: EvolutionStep[];
	visited: Set<string>;
}

/** Neighbor information */
interface Neighbor {
	name: string;
	direction: 'up' | 'down';
}

/** Options for pathfinding */
export interface PathfindingOptions {
	/** Maximum generation level allowed in the path (e.g., 'Champion' means only In-Training I/II, Rookie, and Champion are allowed) */
	maxGeneration?: string;
	/** Map of Digimon name to generation (needed for generation filtering) */
	digimonGenerations?: Map<string, string>;
}

/** Generation level ordering for comparison */
const GENERATION_ORDER: Record<string, number> = {
	'In-Training I': 1,
	'In-Training II': 2,
	'Rookie': 3,
	'Champion': 4,
	'Ultimate': 5,
	'Mega': 6,
	'Mega +': 7,
	'Armor': 4, // Armor is equivalent to Champion level
	'Hybrid': 5 // Hybrid is equivalent to Ultimate level
};

/**
 * Gets the numeric level of a generation for comparison
 */
export function getGenerationLevel(generation: string): number {
	return GENERATION_ORDER[generation] ?? 0;
}

/**
 * Gets all generation names in order
 */
export function getAllGenerations(): string[] {
	return ['In-Training I', 'In-Training II', 'Rookie', 'Champion', 'Ultimate', 'Mega', 'Mega +'];
}

/**
 * Finds all shortest evolution paths between two Digimon
 *
 * @param source - Starting Digimon name
 * @param target - Target Digimon name
 * @param graph - Evolution graph data
 * @param options - Optional pathfinding options
 * @returns Array of shortest paths (may be empty if no path exists, may contain multiple paths of equal length)
 */
export function findShortestPaths(
	source: string,
	target: string,
	graph: EvolutionGraph,
	options?: PathfindingOptions
): EvolutionPath[] {
	// Normalize names for comparison
	const normalizedSource = source.trim();
	const normalizedTarget = target.trim();

	// Same Digimon - return empty path
	if (normalizedSource === normalizedTarget) {
		return [{ steps: [], length: 0 }];
	}

	// Check if both Digimon exist in the graph
	if (!graph[normalizedSource]) {
		console.warn(`Source Digimon "${normalizedSource}" not found in evolution graph`);
		return [];
	}
	if (!graph[normalizedTarget]) {
		console.warn(`Target Digimon "${normalizedTarget}" not found in evolution graph`);
		return [];
	}

	// Get max generation level if specified
	const maxGenerationLevel = options?.maxGeneration 
		? getGenerationLevel(options.maxGeneration) 
		: undefined;

	// BFS initialization
	const queue: PathNode[] = [
		{
			digimon: normalizedSource,
			path: [],
			visited: new Set([normalizedSource])
		}
	];

	const results: EvolutionPath[] = [];
	let minPathLength = Infinity;

	// BFS loop
	while (queue.length > 0) {
		const current = queue.shift();
		if (!current) break;

		// Prune paths longer than found minimum
		if (current.path.length >= minPathLength) {
			continue;
		}

		// Get all neighbors (with optional generation filtering)
		const neighbors = getNeighbors(
			current.digimon, 
			graph, 
			options?.digimonGenerations,
			maxGenerationLevel
		);

		for (const neighbor of neighbors) {
			// Skip if already visited in this path (prevent cycles)
			if (current.visited.has(neighbor.name)) {
				continue;
			}

			const newStep: EvolutionStep = {
				from: current.digimon,
				to: neighbor.name,
				direction: neighbor.direction
			};
			const newPath = [...current.path, newStep];

			// Check if we reached the target
			if (neighbor.name === normalizedTarget) {
				if (newPath.length < minPathLength) {
					// New shortest path found - replace all previous results
					minPathLength = newPath.length;
					results.length = 0; // Clear array
					results.push({ steps: newPath, length: newPath.length });
				} else if (newPath.length === minPathLength) {
					// Same length - add to results
					results.push({ steps: newPath, length: newPath.length });
				}
			} else {
				// Continue exploring if this path could still be shortest
				if (newPath.length < minPathLength) {
					const newVisited = new Set(current.visited);
					newVisited.add(neighbor.name);
					queue.push({
						digimon: neighbor.name,
						path: newPath,
						visited: newVisited
					});
				}
			}
		}
	}

	return results;
}

/**
 * Gets all neighbors for a Digimon in the evolution graph
 *
 * @param digimon - Digimon name
 * @param graph - Evolution graph data
 * @param digimonGenerations - Optional map of digimon name to generation for filtering
 * @param maxGenerationLevel - Optional maximum generation level allowed
 * @returns Array of neighbors with direction information
 */
function getNeighbors(
	digimon: string, 
	graph: EvolutionGraph, 
	digimonGenerations?: Map<string, string>,
	maxGenerationLevel?: number
): Neighbor[] {
	const neighbors: Neighbor[] = [];
	const data = graph[digimon];

	if (!data) {
		return neighbors;
	}

	// Can digivolve to (go up)
	for (const target of data.evolvesTo || []) {
		if (graph[target]) {
			// Only add if target exists in graph and within generation limit
			if (maxGenerationLevel && digimonGenerations) {
				const targetGen = digimonGenerations.get(target);
				if (targetGen && getGenerationLevel(targetGen) > maxGenerationLevel) {
					continue; // Skip this neighbor, it's above the allowed generation
				}
			}
			neighbors.push({ name: target, direction: 'up' });
		}
	}

	// Can de-digivolve from (go down)
	for (const source of data.evolvesFrom || []) {
		if (graph[source]) {
			// Only add if source exists in graph and within generation limit
			if (maxGenerationLevel && digimonGenerations) {
				const sourceGen = digimonGenerations.get(source);
				if (sourceGen && getGenerationLevel(sourceGen) > maxGenerationLevel) {
					continue; // Skip this neighbor, it's above the allowed generation
				}
			}
			neighbors.push({ name: source, direction: 'down' });
		}
	}

	return neighbors;
}

/**
 * Formats an evolution path for display
 *
 * @param path - Evolution path to format
 * @returns Human-readable string representation
 */
export function formatPath(path: EvolutionPath): string {
	if (path.steps.length === 0) {
		return 'Already at destination';
	}

	const parts = [path.steps[0].from];
	for (const step of path.steps) {
		const arrow = step.direction === 'up' ? '→' : '←';
		parts.push(`${arrow} ${step.to}`);
	}

	return parts.join(' ');
}

/**
 * Gets all Digimon names that exist in the evolution graph
 *
 * @param graph - Evolution graph data
 * @returns Sorted array of Digimon names
 */
export function getAvailableDigimon(graph: EvolutionGraph): string[] {
	return Object.keys(graph).sort();
}

/**
 * Validates that an evolution graph is well-formed
 * Checks for bidirectional consistency
 *
 * @param graph - Evolution graph to validate
 * @returns Array of validation warnings
 */
export function validateEvolutionGraph(graph: EvolutionGraph): string[] {
	const warnings: string[] = [];

	for (const [digimon, data] of Object.entries(graph)) {
		// Check evolvesTo references exist
		for (const target of data.evolvesTo || []) {
			if (!graph[target]) {
				warnings.push(`${digimon} evolvesTo "${target}" which doesn't exist in graph`);
			} else {
				// Check bidirectional consistency
				if (!graph[target].evolvesFrom?.includes(digimon)) {
					warnings.push(`${digimon} evolvesTo ${target}, but ${target} doesn't evolvesFrom ${digimon}`);
				}
			}
		}

		// Check evolvesFrom references exist
		for (const source of data.evolvesFrom || []) {
			if (!graph[source]) {
				warnings.push(`${digimon} evolvesFrom "${source}" which doesn't exist in graph`);
			} else {
				// Check bidirectional consistency
				if (!graph[source].evolvesTo?.includes(digimon)) {
					warnings.push(`${digimon} evolvesFrom ${source}, but ${source} doesn't evolvesTo ${digimon}`);
				}
			}
		}
	}

	return warnings;
}
