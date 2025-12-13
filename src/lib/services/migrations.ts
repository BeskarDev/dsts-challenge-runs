/**
 * Storage Migrations
 *
 * This file contains all migrations for data stored in localStorage.
 * Each migration transforms data from one version to another.
 *
 * IMPORTANT:
 * - Import this file early in the app initialization to register migrations
 * - Test all migrations thoroughly before merging
 * - See spec/versioning.md for detailed guidelines
 */

// Import migration registry when you need to add migrations
// import { migrationRegistry } from './versioning';
// import type { Migration } from './versioning';

// Example migration template (commented out)
// Uncomment and modify when you need to create a migration

/*
import { migrationRegistry } from './versioning';
import type { Migration } from './versioning';

const migration_1_0_0_to_1_1_0: Migration = {
  fromVersion: '1.0.0',
  toVersion: '1.1.0',
  description: 'Describe what this migration does',
  migrate: (data: any, fromVersion: string) => {
    // Transform the data structure
    // Example: Renaming a field
    return {
      ...data,
      newFieldName: data.oldFieldName,
      // Don't include oldFieldName
    };
  }
};

// Register the migration
migrationRegistry.register(migration_1_0_0_to_1_1_0);
*/

// Add your migrations below this line
// ===========================================

// No migrations yet - this is version 1.0.0 (initial versioned release)

// This file must export something to be a valid module
export const MIGRATIONS_LOADED = true;

