# Project Overview

## Introduction

**DSTS Challenge Runs** is a web application that enables players of _Digimon Story Time Stranger_ to generate, manage, and track custom challenge runs. The app provides a streamlined interface for creating rule-based challenge configurations and monitoring progress through the game.

## Purpose

- Generate rules for various challenge run types
- Serve as a live tracking tool for challenge run progress
- Store state locally in the browser (no user accounts required)

## Target Users

Players of Digimon Story Time Stranger who want to add variety and challenge to their gameplay experience through structured, randomized rule sets.

## Key Features

### MVP Features (Initial Release)

1. **Random Evolution Challenge**
   - Hard mode gameplay
   - Evolution restriction by story progress (Baby → Rookie → Champion → Ultimate → Mega)
   - Random team composition from available Digimon at current evolution tier
   - Boss checkpoint system for evolution tier upgrades and re-rolls
   - Level cap tied to upcoming boss levels

2. **Seed-Based Randomization**
   - Reproducible random results via seed system
   - User-controlled re-roll capability
   - No duplicate Digimon in random selections

3. **Progress Tracking**
   - Simple local storage persistence
   - Track current story progress (boss checkpoints)
   - Track current team composition

### Future Considerations

- Additional challenge run types (architecture prepared for extensibility)
- Export/Import functionality for challenge states
- Shareable seeds via URL parameters (out of scope for MVP)

## Tech Stack

| Category      | Technology                   |
| ------------- | ---------------------------- |
| Runtime       | Node.js 24                   |
| Language      | TypeScript                   |
| Framework     | Svelte 5                     |
| UI Components | shadcn-svelte + Tailwind CSS |
| Build Tool    | Vite                         |
| Testing       | Vitest                       |
| Deployment    | GitHub Pages (static)        |

## Design Principles

- **Modern & Simple**: Clean, intuitive interface inspired by the source game
- **Extensible**: Architecture supports future challenge types
- **Stateless Backend**: All data stored client-side in LocalStorage
- **Responsive**: Mobile-friendly design

## References

- [Boss Info Source](https://game8.co/games/Digimon-Story-Time-Stranger/archives/553558)
- [Digimon List Source](https://game8.co/games/Digimon-Story-Time-Stranger/archives/552892)
- [Initial Plan](./initial-plan.md)
- [Clarifications](./clarifications.md)
