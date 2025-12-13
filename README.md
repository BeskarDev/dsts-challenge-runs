# Digital Challenge Companion

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00.svg)](https://svelte.dev/)

Generate and track custom challenge runs for Digimon Story: Time Stranger.

## 🎮 Features

- **Seed-based randomization** for reproducible challenge runs
- **Evolution tier restrictions** based on story progress
- **Boss checkpoint system** for tracking progress
- **Re-roll functionality** at designated checkpoints
- **Local storage** - all data stays in your browser
- **Dark/Light mode** support

## 🚀 Quick Start

### Prerequisites

- Node.js 24+
- npm or pnpm

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## 📖 Documentation

For detailed documentation, see the [spec/](./spec/) directory:

- [Project Overview](./spec/overview.md)
- [Architecture](./spec/architecture.md)
- [Data Model](./spec/data_model.md)
- [Versioning System](./spec/versioning.md) - **Important for contributors**
- [Implementation Roadmap](./spec/roadmap.md)
- [Contributing Guidelines](./spec/contributing.md)
- [Style Guide](./spec/style_guide.md)

## 🛠️ Tech Stack

- **Framework**: Svelte 5 with SvelteKit
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Vitest
- **Deployment**: GitHub Pages

## 🎯 Challenge Types

### Random Evolution Challenge

Build your team from randomly selected Digimon that unlock as you progress through the story.

**Rules:**

- Hard mode required
- Level cap based on upcoming boss
- Random team composition
- Evolution restrictions by story progress

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./spec/contributing.md) for guidelines.

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [Boss Info Source](https://game8.co/games/Digimon-Story-Time-Stranger/archives/553558)
- [Digimon List Source](https://game8.co/games/Digimon-Story-Time-Stranger/archives/552892)
