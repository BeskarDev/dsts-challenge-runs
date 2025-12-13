# Data Model Specification

## Overview

This document defines the data structures used throughout the DSTS Challenge Runs application. All data is stored either as static JSON files (game data) or in browser LocalStorage (user state).

## Static Data Models

### Digimon

Scraped from game resources and stored in `src/data/digimon.json`.

```typescript
interface Digimon {
	id: string; // Unique identifier (slug)
	name: string; // Display name
	stage: EvolutionStage; // Evolution tier
	imageUrl?: string; // Optional path to icon/image (fallback to placeholder)
	// Future extensibility
	attributes?: DigimonAttribute[];
	types?: DigimonType[];
	stats?: DigimonStats;
}

type EvolutionStage = 'Baby' | 'Rookie' | 'Champion' | 'Ultimate' | 'Mega';
```

**Example:**

```json
{
	"id": "agumon",
	"name": "Agumon",
	"stage": "Rookie",
	"imageUrl": "/images/digimon/agumon.png"
}
```

### Boss

Scraped from game resources and stored in `src/data/bosses.json`.

```typescript
interface Boss {
	id: string; // Unique identifier
	name: string; // Display name
	level: number; // Boss level
	order: number; // Story progression order (0 = first boss, 1 = second boss, etc.)
	location?: string; // Where the boss is encountered
	imageUrl?: string; // Optional boss image
}
```

**Example:**

```json
{
	"id": "boss-0",
	"name": "First Boss",
	"level": 10,
	"order": 0,
	"location": "Starting Area"
}
```

### Challenge Configuration

Stored in `src/data/challenges/[id].json`.

```typescript
interface ChallengeConfig {
	id: string; // Unique challenge identifier
	name: string; // Display name
	description: string; // Short description
	rules: ChallengeRule[]; // List of rules
	evolutionCheckpoints: EvolutionCheckpoint[];
	settings: ChallengeSettings;
}

interface ChallengeRule {
	id: string;
	title: string;
	description: string;
}

interface EvolutionCheckpoint {
	bossOrder: number; // After which boss (by order)
	unlockedStage: EvolutionStage; // Stage unlocked at this point
	allowReroll: boolean; // Whether re-roll is allowed
}

interface ChallengeSettings {
	teamSize: number; // Number of Digimon in team
	hardModeRequired: boolean; // Whether hard mode is required
	allowDuplicates: boolean; // Whether duplicate Digimon allowed
	maxRerollsPerCheckpoint?: number; // Optional re-roll limit
}
```

**Example (Random Evolution Challenge):**

```json
{
	"id": "random-evolution",
	"name": "Random Evolution Challenge",
	"description": "Build your team from randomly selected Digimon that unlock as you progress through the story.",
	"rules": [
		{
			"id": "hard-mode",
			"title": "Hard Mode",
			"description": "Play on hard difficulty"
		},
		{
			"id": "level-cap",
			"title": "Level Cap",
			"description": "Max level restricted to upcoming boss level"
		},
		{
			"id": "random-team",
			"title": "Random Team",
			"description": "Team must be built from randomly determined Digimon"
		},
		{
			"id": "stage-restriction",
			"title": "Evolution Restriction",
			"description": "Only use Digimon up to your current unlocked evolution stage"
		}
	],
	"evolutionCheckpoints": [
		{ "bossOrder": 1, "unlockedStage": "In-Training II", "allowReroll": true },
		{ "bossOrder": 2, "unlockedStage": "Rookie", "allowReroll": true },
		{ "bossOrder": 6, "unlockedStage": "Champion", "allowReroll": true },
		{ "bossOrder": 11, "unlockedStage": "Ultimate", "allowReroll": true },
		{ "bossOrder": 22, "unlockedStage": "Mega", "allowReroll": true },
		{ "bossOrder": 26, "unlockedStage": "Mega +", "allowReroll": true }
	],
	"settings": {
		"teamSize": 6,
		"hardModeRequired": true,
		"allowDuplicates": false
	}
}
```

## User State Models

Stored in browser LocalStorage.

### Challenge Run State

```typescript
interface ChallengeRunState {
	challengeId: string; // Reference to challenge config
	seed: string; // Current seed for randomization
	currentBossOrder: number; // Current story progression position (0-indexed)
	currentStage: EvolutionStage; // Current max evolution stage
	team: TeamMember[]; // Current team composition
	rerollHistory: RerollEvent[]; // History of re-rolls
	createdAt: string; // ISO timestamp
	updatedAt: string; // ISO timestamp
}

interface TeamMember {
	digimonId: string; // Reference to Digimon
	slotIndex: number; // Team slot (0-5)
	rolledAtCheckpoint: number; // Which checkpoint this was rolled at
}

interface RerollEvent {
	timestamp: string; // ISO timestamp
	checkpoint: number; // Boss checkpoint
	previousTeam: string[]; // Previous Digimon IDs
	newTeam: string[]; // New Digimon IDs
	seed: string; // Seed used for this roll
}
```

### App State

```typescript
interface AppState {
	version: string; // App version for migrations
	lastVisitedChallenge?: string; // Last opened challenge ID
	preferences: UserPreferences;
}

interface UserPreferences {
	theme?: 'light' | 'dark' | 'system';
}
```

## LocalStorage Schema

| Key                   | Type                | Description         |
| --------------------- | ------------------- | ------------------- |
| `dsts:app`            | `AppState`          | Global app state    |
| `dsts:challenge:[id]` | `ChallengeRunState` | Per-challenge state |

## Data Flow

```
┌────────────────────┐     ┌─────────────────────┐
│  Static JSON Files │     │    LocalStorage     │
│  (Game Data)       │     │    (User State)     │
└─────────┬──────────┘     └──────────┬──────────┘
          │                           │
          │  Imported at build        │  Hydrated on load
          │                           │
          ▼                           ▼
┌─────────────────────────────────────────────────┐
│              Svelte Stores                       │
│  ┌──────────────┐    ┌────────────────────────┐ │
│  │  gameData    │    │  challengeState        │ │
│  │  (readonly)  │    │  (reactive, persisted) │ │
│  └──────────────┘    └────────────────────────┘ │
└─────────────────────────────────────────────────┘
          │                           │
          └─────────────┬─────────────┘
                        │
                        ▼
             ┌────────────────────┐
             │   UI Components    │
             └────────────────────┘
```

## Extensibility Considerations

### Adding New Digimon Fields

The `Digimon` interface includes optional fields that can be populated as needed:

```typescript
interface Digimon {
	// ... existing fields
	attributes?: DigimonAttribute[]; // e.g., Vaccine, Data, Virus
	types?: DigimonType[]; // e.g., Fire, Water
	stats?: DigimonStats; // HP, ATK, DEF, etc.
}
```

### Adding New Challenge Types

1. Create new JSON config in `src/data/challenges/`
2. Reuse existing `ChallengeRunState` structure
3. Add challenge-specific rules to the config
4. UI will dynamically render based on config

### Migration Strategy

The `AppState.version` field enables data migrations when the schema changes:

```typescript
function migrateState(state: unknown, fromVersion: string): AppState {
	// Apply sequential migrations
}
```
