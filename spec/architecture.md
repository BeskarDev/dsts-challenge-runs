# Architecture Specification

## Overview

This document outlines the technical architecture for the DSTS Challenge Runs web application. The application follows a component-based architecture using Svelte 5, with clear separation of concerns and extensibility for future challenge types.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Svelte App                         │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ┌─────────┐  ┌──────────────┐  ┌───────────────┐  │   │
│  │  │  Pages  │  │  Components  │  │  UI (shadcn)  │  │   │
│  │  └────┬────┘  └──────┬───────┘  └───────────────┘  │   │
│  │       │              │                              │   │
│  │  ┌────▼──────────────▼─────────────────────────┐   │   │
│  │  │              Svelte Stores                   │   │   │
│  │  │         (Global State Management)            │   │   │
│  │  └─────────────────┬───────────────────────────┘   │   │
│  │                    │                                │   │
│  │  ┌─────────────────▼───────────────────────────┐   │   │
│  │  │              LocalStorage                    │   │   │
│  │  │         (State Persistence)                  │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │           Static JSON Data                   │   │   │
│  │  │    (Digimon, Bosses, Challenge Configs)     │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── lib/
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Shared components (Header, Footer, etc.)
│   │   └── challenge/      # Challenge-specific components
│   ├── stores/             # Svelte stores for state management
│   │   ├── challenge.ts    # Challenge run state
│   │   └── app.ts          # App-level state
│   ├── services/           # Business logic services
│   │   ├── randomizer.ts   # Seed-based randomization
│   │   └── storage.ts      # LocalStorage wrapper
│   ├── types/              # TypeScript type definitions
│   │   ├── digimon.ts
│   │   ├── boss.ts
│   │   └── challenge.ts
│   └── utils/              # Utility functions
├── routes/
│   ├── +page.svelte        # Landing page
│   ├── +layout.svelte      # Root layout with header
│   ├── about/
│   │   └── +page.svelte    # About page
│   └── challenge/
│       └── [id]/
│           └── +page.svelte # Challenge run detail page
├── data/                   # Static JSON data files
│   ├── digimon.json        # Scraped Digimon data
│   ├── bosses.json         # Scraped boss data
│   └── challenges/
│       └── random-evolution.json
└── app.html                # HTML template
```

## Core Components

### 1. Routing

| Route             | Description                        |
| ----------------- | ---------------------------------- |
| `/`               | Landing page - Challenge selection |
| `/challenge/[id]` | Challenge run detail/tracking page |
| `/about`          | About page with app info           |

### 2. State Management

Using Svelte 5's runes and stores for reactive state management:

```typescript
// Example store structure
interface ChallengeState {
	id: string;
	seed: string;
	currentBossIndex: number;
	currentEvolutionTier: EvolutionTier;
	team: Digimon[];
	rerollHistory: RerollEvent[];
}
```

State is persisted to LocalStorage on changes and rehydrated on app load.

### 3. Randomization Service

- Seeded random number generator for reproducibility
- Re-roll functionality with history tracking
- Duplicate prevention in team selection

```typescript
interface RandomizerService {
	setSeed(seed: string): void;
	getRandomDigimon(tier: EvolutionTier, count: number, exclude?: Digimon[]): Digimon[];
	reroll(currentTeam: Digimon[]): Digimon[];
}
```

### 4. Storage Service

```typescript
interface StorageService {
	saveState(key: string, state: unknown): void;
	loadState<T>(key: string): T | null;
	clearState(key: string): void;
}
```

## Design Patterns

### Single Responsibility Principle

- Each component/service has one clear purpose
- Business logic separated from UI components
- Data transformations isolated in utility functions

### Dependency Injection

- Services instantiated at app level
- Components receive dependencies via props or context

### Factory Pattern

- Challenge configurations created via factory functions
- Enables easy addition of new challenge types

## Extensibility

The architecture supports future challenge types through:

1. **Challenge Configuration Schema**: Each challenge type has its own JSON configuration
2. **Dynamic Routing**: `/challenge/[id]` pattern supports any number of challenge types
3. **Store Composition**: Per-challenge stores can be composed from common building blocks
4. **Component Abstraction**: Shared UI patterns extracted into reusable components

## Deployment

- Static build output from Vite
- Deployed to GitHub Pages via GitHub Actions workflow
- No server-side requirements

## Technology Decisions

| Decision      | Rationale                                                  |
| ------------- | ---------------------------------------------------------- |
| Svelte 5      | Modern, reactive framework with excellent performance      |
| shadcn-svelte | Consistent, accessible UI components                       |
| LocalStorage  | Simple persistence without backend requirements            |
| Static JSON   | Scraped data committed to repo, no runtime fetching needed |
| Vitest        | Fast, Vite-native testing framework                        |
