# Contributing to DSTS Challenge Runs

Thank you for your interest in contributing to DSTS Challenge Runs! This document provides guidelines and standards for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Standards](#documentation-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Getting Started

### Prerequisites

- Node.js 24+
- npm or pnpm
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dsts-challenge-runs.git
   cd dsts-challenge-runs
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branching Strategy

We use a feature branch workflow:

- `main` - Production-ready code, deployed to GitHub Pages
- `develop` - Integration branch for features (if used)
- `feature/[description]` - Feature branches
- `fix/[description]` - Bug fix branches
- `docs/[description]` - Documentation branches

### Creating a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Build process or auxiliary tool changes

**Examples:**
```
feat(randomizer): add seed-based team generation
fix(storage): prevent state loss on page refresh
docs(readme): update installation instructions
test(randomizer): add unit tests for duplicate prevention
```

## Code Standards

### TypeScript

- Use TypeScript for all source files
- Enable strict mode
- Prefer interfaces over type aliases for object shapes
- Use explicit return types for functions

```typescript
// ✅ Good
interface Digimon {
  id: string;
  name: string;
  stage: EvolutionStage;
}

function getDigimon(id: string): Digimon | undefined {
  // ...
}

// ❌ Avoid
type Digimon = {
  id: string;
  name: string;
  stage: string;
}

function getDigimon(id) {
  // ...
}
```

### Svelte Components

- Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- One component per file
- Use TypeScript in script blocks
- Follow the component structure:

```svelte
<script lang="ts">
  // 1. Imports
  // 2. Props
  // 3. State
  // 4. Derived values
  // 5. Effects
  // 6. Event handlers
  // 7. Helper functions
</script>

<!-- Template -->

<style>
  /* Styles (prefer Tailwind classes in template) */
</style>
```

### File Organization

```
src/
├── lib/
│   ├── components/     # Svelte components
│   │   └── ComponentName.svelte
│   ├── stores/         # Svelte stores
│   │   └── storeName.ts
│   ├── services/       # Business logic
│   │   └── serviceName.ts
│   ├── types/          # TypeScript types
│   │   └── typeName.ts
│   └── utils/          # Utility functions
│       └── utilName.ts
├── routes/             # SvelteKit routes
└── data/               # Static JSON data
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `DigimonCard.svelte` |
| Files (other) | kebab-case | `challenge-state.ts` |
| Variables | camelCase | `currentTeam` |
| Constants | UPPER_SNAKE_CASE | `MAX_TEAM_SIZE` |
| Types/Interfaces | PascalCase | `ChallengeConfig` |
| Functions | camelCase | `getRandomDigimon()` |
| CSS classes | kebab-case | `.digimon-card` |

### Formatting

- Use Prettier for code formatting
- Run `npm run format` before committing
- Configuration is in `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createRandomizer } from './randomizer';

describe('Randomizer', () => {
  let randomizer: Randomizer;

  beforeEach(() => {
    randomizer = createRandomizer();
  });

  describe('getRandomDigimon', () => {
    it('should return the requested number of Digimon', () => {
      const result = randomizer.getRandomDigimon('Rookie', 3);
      expect(result).toHaveLength(3);
    });

    it('should not return duplicates', () => {
      const result = randomizer.getRandomDigimon('Rookie', 6);
      const uniqueIds = new Set(result.map(d => d.id));
      expect(uniqueIds.size).toBe(6);
    });
  });
});
```

### Test Requirements

- Unit tests for all services and utilities
- Component tests for complex components
- Test files located next to source files: `foo.ts` → `foo.test.ts`
- Aim for meaningful coverage, not 100%

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Documentation Standards

### Code Comments

- Use JSDoc for public functions and types
- Explain "why", not "what"
- Keep comments up to date

```typescript
/**
 * Generates a random team of Digimon from the specified evolution stage.
 * Uses a seeded random number generator for reproducibility.
 *
 * @param stage - The evolution stage to select from
 * @param count - Number of Digimon to select (max 6)
 * @param exclude - Digimon IDs to exclude from selection
 * @returns Array of randomly selected Digimon
 * @throws Error if not enough Digimon available
 */
function getRandomDigimon(
  stage: EvolutionStage,
  count: number,
  exclude?: string[]
): Digimon[] {
  // ...
}
```

### README Updates

- Update README when adding new features
- Include usage examples
- Keep prerequisites current

### Spec Files

- Update spec files when requirements change
- Cross-reference related specs
- Keep roadmap current

## Pull Request Process

### Before Submitting

1. Ensure all tests pass: `npm run test`
2. Format code: `npm run format`
3. Lint code: `npm run lint`
4. Update documentation if needed
5. Rebase on latest main

### PR Template

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] PR title follows conventional commits

## Related Issues
Closes #[issue number]
```

### Review Process

1. Create PR against `main`
2. Automated checks must pass
3. At least one approval required
4. Squash merge preferred

## Issue Guidelines

### Bug Reports

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/OS information
- Screenshots if applicable

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternatives considered
- Mockups if applicable

### Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | New feature or request |
| `documentation` | Documentation improvements |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `mvp` | Required for MVP |
| `stretch` | Nice to have |

## Questions?

If you have questions, please:
1. Check existing issues and documentation
2. Open a new issue with the `question` label
3. Be patient and respectful

Thank you for contributing! 🎮
