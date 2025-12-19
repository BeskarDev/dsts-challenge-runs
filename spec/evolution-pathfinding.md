# Evolution Pathfinding Algorithm Specification

## Overview

This document describes the pathfinding algorithm used to find the shortest evolution path between any two Digimon in Digimon Story: Time Stranger. The algorithm considers both digivolution (evolving up) and de-digivolution (evolving down) as valid steps.

## Problem Statement

Given:
- A source Digimon (origin)
- A target Digimon (destination)
- An evolution graph where each Digimon has `evolvesFrom` and `evolvesTo` arrays

Find:
- All shortest paths from source to target
- Each path minimizes the total number of evolution steps (digivolutions + de-digivolutions)

## Data Structures

### Evolution Graph

The evolution graph is represented as a JSON structure:

```typescript
interface EvolutionGraph {
  [digimonName: string]: {
    evolvesFrom: string[];  // Digimon this can de-digivolve from
    evolvesTo: string[];    // Digimon this can digivolve to
  }
}
```

### Path Node

Each node in the BFS queue contains:

```typescript
interface PathNode {
  digimon: string;           // Current Digimon name
  path: EvolutionStep[];     // Steps taken to reach this node
  visited: Set<string>;      // Digimon visited in this path (cycle prevention)
}

interface EvolutionStep {
  from: string;              // Source Digimon
  to: string;                // Target Digimon
  direction: 'up' | 'down';  // 'up' = digivolve, 'down' = de-digivolve
}
```

## Algorithm: Breadth-First Search (BFS)

We use BFS because:
1. All edges have equal weight (1 step per evolution)
2. BFS guarantees finding the shortest path in unweighted graphs
3. We can easily find all paths of the same minimum length

### Pseudocode

```
function findShortestPaths(source, target, graph):
    if source == target:
        return [[]]  // Empty path, already at destination
    
    queue = [{digimon: source, path: [], visited: {source}}]
    results = []
    minPathLength = Infinity
    
    while queue is not empty:
        current = queue.dequeue()
        
        // Prune paths longer than found minimum
        if current.path.length >= minPathLength:
            continue
        
        // Get all neighbors (can evolve to OR de-evolve from)
        neighbors = getNeighbors(current.digimon, graph)
        
        for each neighbor in neighbors:
            // Skip if already visited in this path (prevent cycles)
            if neighbor.name in current.visited:
                continue
            
            newStep = {
                from: current.digimon,
                to: neighbor.name,
                direction: neighbor.direction
            }
            newPath = current.path + [newStep]
            
            // Check if we reached the target
            if neighbor.name == target:
                if newPath.length < minPathLength:
                    minPathLength = newPath.length
                    results = [newPath]  // New shortest, replace all
                else if newPath.length == minPathLength:
                    results.push(newPath)  // Same length, add to results
            else:
                // Continue exploring
                newVisited = current.visited + {neighbor.name}
                queue.enqueue({
                    digimon: neighbor.name,
                    path: newPath,
                    visited: newVisited
                })
    
    return results

function getNeighbors(digimon, graph):
    neighbors = []
    
    // Can digivolve to (go up)
    for each target in graph[digimon].evolvesTo:
        neighbors.push({name: target, direction: 'up'})
    
    // Can de-digivolve from (go down)
    for each source in graph[digimon].evolvesFrom:
        neighbors.push({name: source, direction: 'down'})
    
    return neighbors
```

## Example

### Scenario: Dracmon → Gazimon

Both Dracmon and Gazimon are Rookie-level Digimon that don't share a direct connection. The algorithm finds a path through their common ancestor.

**Evolution Data:**
- Dracmon: evolvesFrom=["Tsumemon"], evolvesTo=[...]
- Tsumemon: evolvesFrom=["Kuramon"], evolvesTo=["Dracmon", "Keramon"]
- Kuramon: evolvesFrom=[], evolvesTo=["Tsumemon", "Pagumon"]
- Pagumon: evolvesFrom=["Kuramon"], evolvesTo=["Gazimon", "DemiDevimon"]
- Gazimon: evolvesFrom=["Pagumon"], evolvesTo=[...]

**BFS Execution:**

```
Step 0: Start at Dracmon
        Queue: [{Dracmon, path=[], visited={Dracmon}}]

Step 1: Process Dracmon
        Neighbors: Tsumemon (down), Sangloupmon (up)
        Queue: [
          {Tsumemon, path=[Dracmon→Tsumemon(down)], visited={Dracmon, Tsumemon}},
          {Sangloupmon, path=[Dracmon→Sangloupmon(up)], visited={Dracmon, Sangloupmon}}
        ]

Step 2: Process Tsumemon
        Neighbors: Kuramon (down), Dracmon (up), Keramon (up)
        Skip Dracmon (visited)
        Queue: [
          {Sangloupmon, ...},
          {Kuramon, path=[...→Kuramon(down)], visited={...}},
          {Keramon, path=[...→Keramon(up)], visited={...}}
        ]

Step 3: Continue until we reach Gazimon...

Final: Path found with 4 steps:
        Dracmon →(down)→ Tsumemon →(down)→ Kuramon →(up)→ Pagumon →(up)→ Gazimon
```

## Complexity Analysis

- **Time Complexity**: O(V + E) where V is the number of Digimon and E is the number of evolution edges
- **Space Complexity**: O(V) for the visited set and queue

In practice, the evolution graph is relatively sparse (each Digimon typically has 2-5 evolution options), so the algorithm performs efficiently.

## Edge Cases

1. **Same Digimon**: If source equals target, return an empty path
2. **No Path Exists**: Return an empty array if the Digimon are not connected
3. **Multiple Equal Paths**: BFS naturally collects all paths of the minimum length
4. **Cycles**: Prevented by tracking visited Digimon per path
5. **Missing Digimon**: Handle gracefully if a Digimon is not in the graph

## UI Considerations

The pathfinding results should be displayed showing:
1. Each step in the path with the Digimon card
2. Direction indicator (↑ for digivolve, ↓ for de-digivolve)
3. Step number
4. Total path length
5. If multiple paths exist, show them all in a carousel or list

## Implementation Notes

1. The evolution graph is loaded from `src/data/evolution-graph.json`
2. The algorithm runs client-side in the browser
3. Results are cached for repeated queries with the same source/target
4. The UI updates reactively as the user selects different Digimon

## Future Enhancements

1. **Weighted Paths**: Add cost per evolution (e.g., material requirements)
2. **Path Constraints**: Filter by maximum level, exclude certain Digimon
3. **Path Preferences**: Prefer certain evolution lines
4. **Visualization**: Interactive graph view of the evolution tree
