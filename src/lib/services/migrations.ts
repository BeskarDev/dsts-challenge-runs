/**
 * Storage Migrations
 *
 * This file registers all migrations for data stored in localStorage.
 * Each migration transforms data from one version to another.
 *
 * IMPORTANT:
 * - Import this file early in the app initialization to register migrations
 * - Test all migrations thoroughly before merging
 * - See spec/versioning.md for detailed guidelines
 *
 * Individual migrations are organized in the migrations/ subdirectory for clarity.
 */

import { migrationRegistry } from './versioning';

// Import individual migrations
import { migration_1_0_0_to_1_1_0 } from './migrations/migration-1-0-0-to-1-1-0';
import { migration_1_1_0_to_1_2_0 } from './migrations/migration-1-1-0-to-1-2-0';

// Register migrations in order
migrationRegistry.register(migration_1_0_0_to_1_1_0);
migrationRegistry.register(migration_1_1_0_to_1_2_0);

// This file must export something to be a valid module
export const MIGRATIONS_LOADED = true;
