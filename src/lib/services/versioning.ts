/**
 * Versioning System for Local Storage Data
 *
 * This module provides version management and migration functionality
 * for all data stored in browser local storage.
 */

/**
 * Current version of the storage schema
 * Format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes that require migration
 * - MINOR: New features, backward compatible
 * - PATCH: Bug fixes, backward compatible
 */
export const CURRENT_STORAGE_VERSION = '1.1.0';

/**
 * Version information for a storage entry
 */
export interface VersionInfo {
	version: string;
	createdAt?: string;
	updatedAt?: string;
}

/**
 * Versioned wrapper for any stored data
 */
export interface VersionedData<T> {
	_version: string;
	_createdAt: string;
	_updatedAt: string;
	data: T;
}

/**
 * Migration function signature
 * Takes data from an old version and transforms it to a new version
 */
export type MigrationFn<TFrom = unknown, TTo = unknown> = (data: TFrom, fromVersion: string) => TTo;

/**
 * Migration definition
 */
export interface Migration {
	fromVersion: string;
	toVersion: string;
	migrate: MigrationFn;
	description: string;
}

/**
 * Registry of all migrations
 */
class MigrationRegistry {
	private migrations: Migration[] = [];

	/**
	 * Register a migration
	 */
	register(migration: Migration): void {
		// Check for duplicate migrations
		const existing = this.migrations.find(
			(m) => m.fromVersion === migration.fromVersion && m.toVersion === migration.toVersion
		);
		if (existing) {
			console.warn(
				`Migration from ${migration.fromVersion} to ${migration.toVersion} is already registered`
			);
			return;
		}
		this.migrations.push(migration);
	}

	/**
	 * Get the migration path from one version to another
	 */
	getMigrationPath(fromVersion: string, toVersion: string): Migration[] {
		const path: Migration[] = [];
		let currentVersion = fromVersion;

		while (currentVersion !== toVersion) {
			const nextMigration = this.migrations.find((m) => m.fromVersion === currentVersion);
			if (!nextMigration) {
				throw new Error(`No migration path from ${currentVersion} to ${toVersion}`);
			}
			path.push(nextMigration);
			currentVersion = nextMigration.toVersion;
		}

		return path;
	}

	/**
	 * Check if a migration path exists
	 */
	hasMigrationPath(fromVersion: string, toVersion: string): boolean {
		if (fromVersion === toVersion) return true;
		try {
			this.getMigrationPath(fromVersion, toVersion);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Get all registered migrations
	 */
	getAllMigrations(): Migration[] {
		return [...this.migrations];
	}
}

/**
 * Global migration registry
 */
export const migrationRegistry = new MigrationRegistry();

/**
 * Versioning Service
 */
export class VersioningService {
	/**
	 * Wrap data with version information
	 */
	wrap<T>(data: T, version: string = CURRENT_STORAGE_VERSION): VersionedData<T> {
		const now = new Date().toISOString();
		return {
			_version: version,
			_createdAt: now,
			_updatedAt: now,
			data
		};
	}

	/**
	 * Update versioned data
	 */
	update<T>(versioned: VersionedData<T>, data: T): VersionedData<T> {
		return {
			...versioned,
			_updatedAt: new Date().toISOString(),
			data
		};
	}

	/**
	 * Extract version from stored data
	 */
	getVersion(stored: unknown): string | null {
		if (!stored || typeof stored !== 'object') return null;
		if ('_version' in stored && typeof stored._version === 'string') {
			return stored._version;
		}
		// Legacy data without version
		return null;
	}

	/**
	 * Check if data needs migration
	 */
	needsMigration(stored: unknown, targetVersion: string = CURRENT_STORAGE_VERSION): boolean {
		const currentVersion = this.getVersion(stored);
		if (!currentVersion) return true; // Legacy data needs migration
		return currentVersion !== targetVersion;
	}

	/**
	 * Migrate data from one version to another
	 */
	migrate<T>(
		stored: unknown,
		targetVersion: string = CURRENT_STORAGE_VERSION
	): VersionedData<T> | null {
		const currentVersion = this.getVersion(stored);

		// Handle legacy data without version
		if (!currentVersion) {
			console.info('Migrating legacy data to versioned format');
			return this.wrap<T>(stored as T, targetVersion);
		}

		// No migration needed
		if (currentVersion === targetVersion) {
			return stored as VersionedData<T>;
		}

		// Check if migration path exists
		if (!migrationRegistry.hasMigrationPath(currentVersion, targetVersion)) {
			console.error(
				`No migration path from version ${currentVersion} to ${targetVersion}. Data may be incompatible.`
			);
			return null;
		}

		// Execute migration path
		try {
			const migrations = migrationRegistry.getMigrationPath(currentVersion, targetVersion);
			let migratedData = stored;

			for (const migration of migrations) {
				console.info(
					`Applying migration: ${migration.fromVersion} → ${migration.toVersion} - ${migration.description}`
				);
				// Extract data if versioned, otherwise use as-is
				const dataToMigrate =
					typeof migratedData === 'object' && migratedData !== null && 'data' in migratedData
						? (migratedData as VersionedData<unknown>).data
						: migratedData;

				migratedData = migration.migrate(dataToMigrate, migration.fromVersion);
			}

			// Wrap migrated data
			return this.wrap<T>(migratedData as T, targetVersion);
		} catch (error) {
			console.error('Migration failed:', error);
			return null;
		}
	}

	/**
	 * Compare two versions
	 * Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
	 */
	compareVersions(v1: string, v2: string): number {
		const parts1 = v1.split('.').map(Number);
		const parts2 = v2.split('.').map(Number);

		for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
			const num1 = parts1[i] || 0;
			const num2 = parts2[i] || 0;

			if (num1 < num2) return -1;
			if (num1 > num2) return 1;
		}

		return 0;
	}
}

/**
 * Global versioning service instance
 */
export const versioningService = new VersioningService();
