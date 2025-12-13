import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from './storage';

describe('StorageService with Versioning', () => {
	let storageService: StorageService;
	let mockStorage: { [key: string]: string };

	beforeEach(() => {
		// Mock localStorage
		mockStorage = {};
		const localStorageMock = {
			getItem: vi.fn((key: string) => mockStorage[key] || null),
			setItem: vi.fn((key: string, value: string) => {
				mockStorage[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete mockStorage[key];
			}),
			clear: vi.fn(() => {
				mockStorage = {};
			}),
			key: vi.fn(),
			length: 0
		} as Storage;

		globalThis.localStorage = localStorageMock;

		storageService = new StorageService();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('saveState', () => {
		it('should save data with version wrapper', () => {
			const data = { name: 'test', value: 42 };
			storageService.saveState('test-key', data);

			const saved = mockStorage['test-key'];
			expect(saved).toBeDefined();

			const parsed = JSON.parse(saved);
			expect(parsed._version).toBeDefined();
			expect(parsed._createdAt).toBeDefined();
			expect(parsed._updatedAt).toBeDefined();
			expect(parsed.data).toEqual(data);
		});

		it('should handle already versioned data', () => {
			const versionedData = {
				_version: '1.0.0',
				_createdAt: '2024-01-01T00:00:00.000Z',
				_updatedAt: '2024-01-01T00:00:00.000Z',
				data: { test: true }
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			storageService.saveState('test-key', versionedData as any);

			const saved = mockStorage['test-key'];
			const parsed = JSON.parse(saved);
			expect(parsed._version).toBe('1.0.0');
		});
	});

	describe('loadState', () => {
		it('should load and unwrap versioned data', () => {
			const data = { name: 'test', value: 42 };
			storageService.saveState('test-key', data);

			const loaded = storageService.loadState<typeof data>('test-key');
			expect(loaded).toEqual(data);
		});

		it('should return null for non-existent key', () => {
			const loaded = storageService.loadState('non-existent');
			expect(loaded).toBeNull();
		});

		it('should migrate legacy data', () => {
			// Simulate legacy data without version
			const legacyData = { theme: 'dark', lastVisited: 'challenge-1' };
			mockStorage['legacy-key'] = JSON.stringify(legacyData);

			const loaded = storageService.loadState<typeof legacyData>('legacy-key');

			expect(loaded).toEqual(legacyData);

			// Check that migrated data was saved back
			const saved = mockStorage['legacy-key'];
			const parsed = JSON.parse(saved);
			expect(parsed._version).toBeDefined();
			expect(parsed.data).toEqual(legacyData);
		});

		it('should handle corrupted data gracefully', () => {
			mockStorage['corrupted-key'] = 'not valid json{{{';

			const loaded = storageService.loadState('corrupted-key');
			expect(loaded).toBeNull();
		});
	});

	describe('clearState', () => {
		it('should remove data from storage', () => {
			storageService.saveState('test-key', { test: true });
			expect(mockStorage['test-key']).toBeDefined();

			storageService.clearState('test-key');
			expect(mockStorage['test-key']).toBeUndefined();
		});
	});

	describe('history operations', () => {
		type TestHistoryItem = { id: string; name: string };

		it('should get empty history initially', () => {
			const history = storageService.getHistory<TestHistoryItem>();
			expect(history).toEqual([]);
		});

		it('should save item to history', () => {
			const item: TestHistoryItem = { id: '1', name: 'First' };
			storageService.saveToHistory(item);

			const history = storageService.getHistory<TestHistoryItem>();
			expect(history).toHaveLength(1);
			expect(history[0]).toEqual(item);
		});

		it('should update history item by id', () => {
			const item1: TestHistoryItem = { id: '1', name: 'First' };
			const item2: TestHistoryItem = { id: '2', name: 'Second' };

			storageService.saveToHistory(item1);
			storageService.saveToHistory(item2);

			const updated: TestHistoryItem = { id: '1', name: 'Updated' };
			storageService.updateHistoryItem(updated);

			const history = storageService.getHistory<TestHistoryItem>();
			expect(history[0].name).toBe('Updated');
			expect(history[1].name).toBe('Second');
		});

		it('should delete history item by id', () => {
			const item1: TestHistoryItem = { id: '1', name: 'First' };
			const item2: TestHistoryItem = { id: '2', name: 'Second' };

			storageService.saveToHistory(item1);
			storageService.saveToHistory(item2);

			storageService.deleteHistoryItem('1');

			const history = storageService.getHistory<TestHistoryItem>();
			expect(history).toHaveLength(1);
			expect(history[0].id).toBe('2');
		});

		it('should clear all history', () => {
			storageService.saveToHistory({ id: '1', name: 'First' });
			storageService.saveToHistory({ id: '2', name: 'Second' });

			storageService.clearHistory();

			const history = storageService.getHistory<TestHistoryItem>();
			expect(history).toEqual([]);
		});
	});

	describe('version migration workflow', () => {
		it('should maintain data integrity through save-load cycle', () => {
			const originalData = {
				counter: 1,
				settings: { theme: 'dark', language: 'en' }
			};

			// Save
			storageService.saveState('app-state', originalData);

			// Load
			const loaded = storageService.loadState<typeof originalData>('app-state');

			expect(loaded).toEqual(originalData);
		});
	});
});
