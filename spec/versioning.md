# Local Storage Versioning System

## Overview

This document describes the versioning system for all data stored in browser local storage. The versioning system enables safe data migrations when the application's data structures evolve, ensuring players never lose their progress or settings during updates.

## Design Principles

1. **Backward Compatibility**: Legacy data without versions is automatically migrated to the versioned format
2. **Non-Destructive**: Migrations preserve all player data; no data is lost during version updates
3. **Transparent**: Versioning happens automatically behind the scenes with minimal developer intervention
4. **Extensible**: Easy to add new migrations as the application evolves
5. **Fail-Safe**: If migration fails, the system logs errors but doesn't crash the application

## Architecture

### Core Components

#### 1. Versioning Service (`src/lib/services/versioning.ts`)

The main service that handles version management and migration logic.

**Key Features:**

- Wraps data with version metadata
- Detects version mismatches
- Executes migration chains
- Provides version comparison utilities

**VersionedData Structure:**

```typescript
interface VersionedData<T> {
	_version: string; // Semantic version (e.g., "1.0.0")
	_createdAt: string; // ISO timestamp of creation
	_updatedAt: string; // ISO timestamp of last update
	data: T; // The actual application data
}
```

#### 2. Storage Service (`src/lib/services/storage.ts`)

Enhanced storage wrapper that automatically applies versioning to all localStorage operations.

**Key Features:**

- Automatic versioning on save
- Automatic migration on load
- Transparent data unwrapping
- Error handling and logging

#### 3. Migration Registry

A registry that maintains all migration functions in the application.

**Migration Structure:**

```typescript
interface Migration {
	fromVersion: string;
	toVersion: string;
	migrate: (data: unknown, fromVersion: string) => unknown;
	description: string;
}
```

## Current Storage Schema

### Storage Keys

All localStorage keys are centrally defined in `src/lib/services/storage-keys.ts`:

| Key             | Description                                        | Data Type           |
| --------------- | -------------------------------------------------- | ------------------- |
| `dsts:app`      | Global app state including version and preferences | `AppState`          |
| `dsts:theme`    | User theme preference (light/dark/system)          | `Theme`             |
| `dsts:language` | User language preference (en/ja)                   | `SupportedLanguage` |
| `dsts:history`  | Historical challenge run data                      | `HistoricalRun[]`   |

### Current Version

**Version: 1.0.0**

This is the initial versioned release. All legacy data (data stored before versioning was implemented) will be automatically migrated to version 1.0.0.

## How Versioning Works

### Data Flow

```
┌─────────────────┐
│   Application   │
│   wants to save │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  StorageService.saveState() │
│  • Wraps data with version  │
│  • Adds timestamps          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  localStorage   │
│  (versioned)    │
└─────────────────┘

┌─────────────────┐
│  Application    │
│  wants to load  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  StorageService.loadState() │
│  • Reads from storage       │
│  • Checks version           │
│  • Migrates if needed       │
│  • Unwraps data             │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  Application    │
│  (clean data)   │
└─────────────────┘
```

### Migration Process

1. **Version Detection**: When loading data, the system checks the `_version` field
2. **Path Discovery**: If migration is needed, the system finds a migration path from the current version to the target version
3. **Sequential Migration**: Migrations are applied sequentially (e.g., 1.0.0 → 1.1.0 → 1.2.0)
4. **Data Preservation**: Each migration transforms the data structure while preserving all player information
5. **Automatic Save**: After successful migration, the updated data is automatically saved back to storage

### Legacy Data Handling

Data stored before the versioning system was implemented (legacy data) has no `_version` field. The system:

1. Detects legacy data (missing `_version`)
2. Wraps it in the versioned structure
3. Sets the version to `1.0.0`
4. Saves the migrated data back to storage

This process is transparent and happens automatically on first load after upgrade.

## Adding Migrations

### When to Create a Migration

Create a new migration when you make **breaking changes** to stored data structures:

- ✅ Renaming fields in stored objects
- ✅ Changing field types or formats
- ✅ Restructuring nested data
- ✅ Removing fields that are no longer needed
- ✅ Adding new required fields

**Do NOT create a migration for:**

- ❌ Adding optional fields (backward compatible)
- ❌ Changing UI logic that doesn't affect storage
- ❌ Bug fixes that don't change data structure

### Migration Versioning Strategy

Use **semantic versioning** (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes requiring migration (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backward compatible (e.g., 1.0.0 → 1.0.1)

### Step-by-Step Migration Guide

#### Step 1: Update the Version Number

In `src/lib/services/versioning.ts`, update `CURRENT_STORAGE_VERSION`:

```typescript
// Before
export const CURRENT_STORAGE_VERSION = '1.0.0';

// After
export const CURRENT_STORAGE_VERSION = '1.1.0';
```

#### Step 2: Create the Migration Function

Create a new file or add to an existing migrations file (e.g., `src/lib/services/migrations.ts`):

```typescript
import { migrationRegistry } from './versioning';
import type { Migration } from './versioning';

// Example: Migrating from 1.0.0 to 1.1.0
// Changing { theme: string } to { preferences: { theme: string } }
const migration_1_0_0_to_1_1_0: Migration = {
	fromVersion: '1.0.0',
	toVersion: '1.1.0',
	description: 'Restructure app state to use preferences object',
	migrate: (data: any) => {
		// Transform the data structure
		return {
			version: data.version || '1.0.0',
			lastVisitedChallenge: data.lastVisitedChallenge,
			preferences: {
				theme: data.theme || 'dark' // Move theme into preferences
			}
		};
	}
};

// Register the migration
migrationRegistry.register(migration_1_0_0_to_1_1_0);
```

#### Step 3: Import and Register Migrations

In your app initialization (e.g., `src/routes/+layout.ts` or `src/lib/index.ts`):

```typescript
// Import migrations to register them
import './lib/services/migrations';
```

#### Step 4: Update TypeScript Types

Update the corresponding TypeScript interfaces to match the new structure:

```typescript
// Before
interface AppState {
	version: string;
	theme?: string;
	lastVisitedChallenge?: string;
}

// After
interface AppState {
	version: string;
	lastVisitedChallenge?: string;
	preferences: {
		theme?: string;
	};
}
```

#### Step 5: Test the Migration

Write tests to verify the migration works correctly:

```typescript
import { describe, it, expect } from 'vitest';
import { versioningService, migrationRegistry } from './versioning';

describe('Migration 1.0.0 to 1.1.0', () => {
	it('should migrate theme to preferences object', () => {
		const oldData = {
			version: '1.0.0',
			theme: 'dark',
			lastVisitedChallenge: 'challenge-1'
		};

		// Wrap with old version
		const wrapped = versioningService.wrap(oldData, '1.0.0');

		// Migrate to new version
		const migrated = versioningService.migrate(wrapped, '1.1.0');

		expect(migrated).not.toBeNull();
		expect(migrated?._version).toBe('1.1.0');
		expect(migrated?.data).toHaveProperty('preferences');
		expect(migrated?.data.preferences.theme).toBe('dark');
	});
});
```

#### Step 6: Test Manually

1. **Test with fresh data**: Clear localStorage and verify the app works with the new structure
2. **Test with legacy data**:
   - Manually set old data in localStorage
   - Reload the app
   - Verify data is migrated correctly
   - Check that no data is lost

#### Step 7: Document the Migration

Update this document with details about the new migration:

```markdown
### Version 1.1.0 (YYYY-MM-DD)

**Breaking Changes:**

- App state structure changed to nest theme under `preferences` object

**Migration:**

- Old data with `theme` at root level is moved to `preferences.theme`
- Default theme is set to 'dark' if not present

**Affected Storage Keys:**

- `dsts:app`
```

## Migration Examples

### Example 1: Renaming a Field

**Scenario**: Rename `currentBossOrder` to `currentBossIndex` for clarity

```typescript
const migration_1_0_0_to_1_1_0: Migration = {
	fromVersion: '1.0.0',
	toVersion: '1.1.0',
	description: 'Rename currentBossOrder to currentBossIndex',
	migrate: (data: any) => ({
		...data,
		currentBossIndex: data.currentBossOrder
		// Don't include currentBossOrder in new structure
	})
};
```

### Example 2: Changing Data Type

**Scenario**: Change `createdAt` from timestamp number to ISO string

```typescript
const migration_1_1_0_to_1_2_0: Migration = {
	fromVersion: '1.1.0',
	toVersion: '1.2.0',
	description: 'Convert createdAt from timestamp to ISO string',
	migrate: (data: any) => ({
		...data,
		createdAt:
			typeof data.createdAt === 'number' ? new Date(data.createdAt).toISOString() : data.createdAt
	})
};
```

### Example 3: Restructuring Nested Data

**Scenario**: Flatten team member structure

```typescript
const migration_1_2_0_to_2_0_0: Migration = {
	fromVersion: '1.2.0',
	toVersion: '2.0.0',
	description: 'Flatten team member structure',
	migrate: (data: any) => ({
		...data,
		team: data.team.map((member: any) => ({
			digimonNumber: member.digimon.number,
			slotIndex: member.slot,
			rolledAtCheckpoint: member.checkpoint
		}))
	})
};
```

## Best Practices

### For Contributors

1. **Always check storage keys**: Before modifying data structures, check `src/lib/services/storage-keys.ts` to see what's stored
2. **Test both paths**: Test with fresh data AND with migrated data
3. **Write migration tests**: Every migration should have corresponding tests
4. **Document breaking changes**: Update this file with migration details
5. **Use semantic versioning**: Follow the MAJOR.MINOR.PATCH convention strictly
6. **Consider backward compatibility**: Only create migrations for truly breaking changes

### For Code Reviewers

1. **Verify version update**: Check that `CURRENT_STORAGE_VERSION` is updated
2. **Review migration logic**: Ensure no data loss occurs
3. **Check test coverage**: Verify migration tests are present
4. **Validate documentation**: Ensure this file is updated
5. **Test locally**: Manually test migration with real data

### For Maintainers

1. **Keep migrations clean**: Remove obsolete migrations after several versions (with care)
2. **Monitor errors**: Watch for migration errors in production logs
3. **Plan breaking changes**: Group breaking changes together to minimize migration chains
4. **Communicate changes**: Inform users about data migrations in release notes

## Troubleshooting

### Problem: Migration Fails

**Symptoms**: Console shows "Migration failed" error

**Solutions:**

1. Check the migration function for errors
2. Verify the migration path exists in the registry
3. Ensure all intermediate migrations are registered
4. Test with sample data matching the old structure

### Problem: Data Loss After Migration

**Symptoms**: User reports missing data after update

**Solutions:**

1. Review the migration function for missing field mappings
2. Check if default values are appropriate
3. Test migration with actual user data (from backups)
4. Consider rollback strategy if data is critical

### Problem: Version Mismatch Error

**Symptoms**: "No migration path from X to Y" error

**Solutions:**

1. Ensure all migrations are imported and registered
2. Check migration chain is complete (no gaps)
3. Verify version numbers are correct
4. Consider adding intermediate migrations if jumping major versions

## Debugging Tips

### Inspect Stored Data

```javascript
// In browser console
const data = localStorage.getItem('dsts:app');
console.log(JSON.parse(data));
```

### Force Migration

```javascript
// In browser console - force re-migration
const data = localStorage.getItem('dsts:app');
const parsed = JSON.parse(data);
parsed._version = '1.0.0'; // Set to old version
localStorage.setItem('dsts:app', JSON.stringify(parsed));
// Reload page to trigger migration
```

### Clear All Data

```javascript
// In browser console - clear all app data
Object.keys(localStorage)
	.filter((key) => key.startsWith('dsts:'))
	.forEach((key) => localStorage.removeItem(key));
```

## Future Considerations

### Potential Enhancements

1. **Migration History**: Track which migrations have been applied to help debug issues
2. **Rollback Support**: Ability to rollback to previous versions
3. **Schema Validation**: Validate data structure after migration using JSON Schema or Zod
4. **Cloud Sync**: Extend versioning to support cloud storage synchronization
5. **Compression**: Compress old data to save space while maintaining migration capability

### Long-Term Maintenance

- **Review migrations annually**: Remove obsolete migrations for versions no longer in use
- **Maintain changelog**: Keep detailed changelog of all migrations
- **User communication**: Inform users about major data structure changes
- **Backup strategy**: Consider implementing data export/import for user backups

## Version History

### Version 1.0.0 (2025-12-13)

**Initial versioned release**

This is the first version of the versioning system. All existing data will be automatically migrated to this version.

**Storage Keys:**

- `dsts:app`: Application state with version, preferences, and last visited challenge
- `dsts:theme`: User theme preference (light/dark/system)
- `dsts:language`: User language preference (en/ja)
- `dsts:history`: Array of historical challenge runs

**No breaking changes** - This release wraps existing data with version metadata without changing the structure.

---

## Contributor Responsibilities

**Every contributor who modifies local storage data structures MUST:**

1. ✅ Check if their changes require a migration
2. ✅ Update `CURRENT_STORAGE_VERSION` if needed
3. ✅ Create and register migration functions
4. ✅ Write tests for migrations
5. ✅ Update this documentation
6. ✅ Test with both fresh and legacy data
7. ✅ Document breaking changes in PR description

**Failure to follow these steps may result in:**

- Player data loss
- Application crashes
- Inconsistent state
- Difficult debugging
- PR rejection

This versioning system is critical infrastructure. Treat it with care and respect.

---

For questions or clarification, please open an issue or discuss in PR reviews.
