# DSTS Challenge Runs

A web application for generating and tracking custom challenge runs in *Digimon Story Time Stranger*.

## Overview

DSTS Challenge Runs provides players with structured challenge run configurations that add variety and difficulty to their gameplay experience. The app features:

- **Rule Generation**: Generate randomized challenge rules based on configurable parameters
- **Progress Tracking**: Track your progress through boss checkpoints and evolution tiers
- **Seed System**: Reproducible randomization with sharable seeds
- **Local Storage**: All progress saved locally in your browser

## Features (MVP)

### Random Evolution Challenge
- Play on hard mode
- Evolution restricted by story progress (Baby → Rookie → Champion → Ultimate → Mega)
- Team composition randomly determined at each evolution tier checkpoint
- Level cap tied to upcoming boss levels
- Re-roll capability at checkpoints

## Tech Stack

- **Runtime**: Node.js 24
- **Language**: TypeScript
- **Framework**: Svelte 5
- **UI**: shadcn-svelte + Tailwind CSS
- **Build**: Vite
- **Testing**: Vitest
- **Deployment**: GitHub Pages

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Documentation

### Specifications
- [Project Overview](./spec/overview.md) - Goals, features, and tech stack
- [Architecture](./spec/architecture.md) - System design and component structure
- [Data Model](./spec/data_model.md) - Data structures and storage schema
- [Roadmap](./spec/roadmap.md) - Implementation phases and milestones

### Additional Resources
- [Initial Plan](./spec/initial-plan.md) - Original project requirements
- [Clarifications](./spec/clarifications.md) - Requirements clarifications

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines, code standards, and contribution process.

## License

See [LICENSE](./LICENSE) for details.