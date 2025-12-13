import { describe, it, expect, beforeEach } from 'vitest';
import { versioningService, migrationRegistry, CURRENT_STORAGE_VERSION } from './versioning';
import type { Migration } from './versioning';

describe('VersioningService', () => {
	describe('wrap', () => {
		it('should wrap data with version information', () => {
			const data = { name: 'test', value: 42 };
			const wrapped = versioningService.wrap(data);

			expect(wrapped._version).toBe(CURRENT_STORAGE_VERSION);
			expect(wrapped.data).toEqual(data);
			expect(wrapped._createdAt).toBeDefined();
			expect(wrapped._updatedAt).toBeDefined();
		});

		it('should use custom version when provided', () => {
			const data = { name: 'test' };
			const customVersion = '0.5.0';
			const wrapped = versioningService.wrap(data, customVersion);

			expect(wrapped._version).toBe(customVersion);
		});

		it('should set createdAt and updatedAt to same value', () => {
			const data = { test: true };
			const wrapped = versioningService.wrap(data);

			expect(wrapped._createdAt).toBe(wrapped._updatedAt);
		});
	});

	describe('update', () => {
		it('should update data and updatedAt timestamp', () => {
			const originalData = { count: 1 };
			const wrapped = versioningService.wrap(originalData);

			const newData = { count: 2 };
			const updated = versioningService.update(wrapped, newData);

			expect(updated.data).toEqual(newData);
			expect(updated._createdAt).toBe(wrapped._createdAt);
			expect(updated._version).toBe(wrapped._version);
			// updatedAt should be defined
			expect(updated._updatedAt).toBeDefined();
		});
	});

	describe('getVersion', () => {
		it('should extract version from versioned data', () => {
			const wrapped = versioningService.wrap({ test: true });
			const version = versioningService.getVersion(wrapped);

			expect(version).toBe(CURRENT_STORAGE_VERSION);
		});

		it('should return null for non-versioned data', () => {
			const legacy = { test: true };
			const version = versioningService.getVersion(legacy);

			expect(version).toBeNull();
		});

		it('should return null for invalid data', () => {
			expect(versioningService.getVersion(null)).toBeNull();
			expect(versioningService.getVersion(undefined)).toBeNull();
			expect(versioningService.getVersion(123)).toBeNull();
			expect(versioningService.getVersion('string')).toBeNull();
		});
	});

	describe('needsMigration', () => {
		it('should return false for current version', () => {
			const wrapped = versioningService.wrap({ test: true });
			const needs = versioningService.needsMigration(wrapped);

			expect(needs).toBe(false);
		});

		it('should return true for legacy data without version', () => {
			const legacy = { test: true };
			const needs = versioningService.needsMigration(legacy);

			expect(needs).toBe(true);
		});

		it('should return true for older version', () => {
			const old = versioningService.wrap({ test: true }, '0.1.0');
			const needs = versioningService.needsMigration(old);

			expect(needs).toBe(true);
		});

		it('should support custom target version', () => {
			const v1 = versioningService.wrap({ test: true }, '1.0.0');
			const needs = versioningService.needsMigration(v1, '2.0.0');

			expect(needs).toBe(true);
		});
	});

	describe('compareVersions', () => {
		it('should return 0 for equal versions', () => {
			expect(versioningService.compareVersions('1.0.0', '1.0.0')).toBe(0);
			expect(versioningService.compareVersions('2.5.3', '2.5.3')).toBe(0);
		});

		it('should return -1 when first version is lower', () => {
			expect(versioningService.compareVersions('1.0.0', '2.0.0')).toBe(-1);
			expect(versioningService.compareVersions('1.0.0', '1.1.0')).toBe(-1);
			expect(versioningService.compareVersions('1.0.0', '1.0.1')).toBe(-1);
		});

		it('should return 1 when first version is higher', () => {
			expect(versioningService.compareVersions('2.0.0', '1.0.0')).toBe(1);
			expect(versioningService.compareVersions('1.1.0', '1.0.0')).toBe(1);
			expect(versioningService.compareVersions('1.0.1', '1.0.0')).toBe(1);
		});
	});

	describe('migrate', () => {
		it('should wrap legacy data without migration', () => {
			const legacy = { name: 'test', value: 42 };
			const migrated = versioningService.migrate<typeof legacy>(legacy);

			expect(migrated).not.toBeNull();
			expect(migrated?._version).toBe(CURRENT_STORAGE_VERSION);
			expect(migrated?.data).toEqual(legacy);
		});

		it('should return data as-is if already at target version', () => {
			const wrapped = versioningService.wrap({ test: true });
			const migrated = versioningService.migrate(wrapped);

			expect(migrated).toEqual(wrapped);
		});

		it('should return null if no migration path exists', () => {
			const old = versioningService.wrap({ test: true }, '0.1.0');
			const migrated = versioningService.migrate(old, '2.0.0');

			expect(migrated).toBeNull();
		});
	});
});

describe('MigrationRegistry', () => {
	let testMigration: Migration;

	beforeEach(() => {
		// Note: We're testing the global registry, so tests may have side effects
		testMigration = {
			fromVersion: '1.0.0',
			toVersion: '1.1.0',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			migrate: (data: any) => ({ new: data.old }),
			description: 'Test migration'
		};
	});

	describe('register', () => {
		it('should register a migration', () => {
			migrationRegistry.register(testMigration);
			const migrations = migrationRegistry.getAllMigrations();

			expect(migrations.some((m) => m.fromVersion === '1.0.0' && m.toVersion === '1.1.0')).toBe(
				true
			);
		});

		it('should warn when registering duplicate migration', () => {
			migrationRegistry.register(testMigration);
			// Registering again should warn but not fail
			migrationRegistry.register(testMigration);
			// Test passes if no error is thrown
		});
	});

	describe('hasMigrationPath', () => {
		it('should return true for same version', () => {
			expect(migrationRegistry.hasMigrationPath('1.0.0', '1.0.0')).toBe(true);
		});

		it('should return false when no path exists', () => {
			expect(migrationRegistry.hasMigrationPath('0.1.0', '5.0.0')).toBe(false);
		});
	});

	describe('getMigrationPath', () => {
		it('should throw error when no path exists', () => {
			expect(() => {
				migrationRegistry.getMigrationPath('0.1.0', '99.0.0');
			}).toThrow();
		});
	});
});

describe('Integration: Storage with Versioning', () => {
	it('should handle legacy data migration workflow', () => {
		// Simulate legacy data
		const legacyData = { theme: 'dark', lastVisited: 'challenge-1' };

		// Migrate to versioned format
		const migrated = versioningService.migrate<typeof legacyData>(legacyData);

		expect(migrated).not.toBeNull();
		expect(migrated?._version).toBe(CURRENT_STORAGE_VERSION);
		expect(migrated?.data).toEqual(legacyData);
		expect(migrated?._createdAt).toBeDefined();
		expect(migrated?._updatedAt).toBeDefined();
	});

	it('should preserve data through wrap-update cycle', () => {
		const originalData = { counter: 1, name: 'test' };
		const wrapped = versioningService.wrap(originalData);

		const updatedData = { counter: 2, name: 'test' };
		const updated = versioningService.update(wrapped, updatedData);

		expect(updated.data).toEqual(updatedData);
		expect(updated._version).toBe(wrapped._version);
		expect(updated._createdAt).toBe(wrapped._createdAt);
	});
});
