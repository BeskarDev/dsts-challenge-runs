import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hasAnimationPlayed, markAnimationPlayed, resetAnimationState } from '$lib/stores/animation';
import { versioningService } from '$lib/services/versioning';
import { StorageService } from '$lib/services/storage';

/**
 * Integration tests to verify animation system works with versioning
 */
describe('Animation + Versioning Integration', () => {
	let storage: StorageService;

	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		storage = new StorageService();
		
		// Reset animation state
		resetAnimationState('test-challenge', 'test-seed');
	});

	describe('Animation state independence', () => {
		it('should not interfere with versioned storage', () => {
			// Create some versioned data
			const testData = { currentBoss: 1, team: [] };
			storage.saveState('test:challenge', testData);

			// Use animation system
			markAnimationPlayed('test-challenge', 'test-seed', 1);
			expect(hasAnimationPlayed('test-challenge', 'test-seed', 1)).toBe(true);

			// Verify versioned data is unaffected
			const loaded = storage.loadState('test:challenge');
			expect(loaded).toEqual(testData);
		});

		it('should maintain session-based behavior', () => {
			// Mark animation as played
			markAnimationPlayed('challenge-1', 'seed-1', 2);
			expect(hasAnimationPlayed('challenge-1', 'seed-1', 2)).toBe(true);

			// Simulate clearing the run's animation state
			resetAnimationState('challenge-1', 'seed-1');
			
			// Animation should not be marked as played anymore
			expect(hasAnimationPlayed('challenge-1', 'seed-1', 2)).toBe(false);
		});
	});

	describe('Challenge state with animations', () => {
		it('should work with versioned challenge state', () => {
			// Create a challenge state using versioned storage
			const challengeState = {
				challengeId: 'random-evolution',
				seed: 'test-seed-123',
				currentBossOrder: 1,
				team: [
					{ digimonNumber: 1, slotIndex: 0, rolledAtCheckpoint: 1 },
					{ digimonNumber: 2, slotIndex: 1, rolledAtCheckpoint: 1 }
				],
				bossTeams: {},
				rerollHistory: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};

			// Save with versioning
			storage.saveState('dsts:challenge:random-evolution', challengeState);

			// Use animation system with this challenge
			expect(hasAnimationPlayed('random-evolution', 'test-seed-123', 1)).toBe(false);
			markAnimationPlayed('random-evolution', 'test-seed-123', 1);
			expect(hasAnimationPlayed('random-evolution', 'test-seed-123', 1)).toBe(true);

			// Load challenge state - should still work
			const loaded = storage.loadState('dsts:challenge:random-evolution');
			expect(loaded).toMatchObject(challengeState);
		});

		it('should handle challenge state migrations without affecting animations', () => {
			// Create some "legacy" data (without version)
			const legacyData = {
				challengeId: 'test-challenge',
				currentBossOrder: 1,
				team: []
			};

			// Manually put it in localStorage without versioning
			localStorage.setItem('test-legacy-challenge', JSON.stringify(legacyData));

			// Load it (should trigger migration)
			const migrated = storage.loadState('test-legacy-challenge');
			expect(migrated).toEqual(legacyData);

			// Animation system should still work independently
			markAnimationPlayed('test-challenge', 'test-seed', 1);
			expect(hasAnimationPlayed('test-challenge', 'test-seed', 1)).toBe(true);
		});
	});

	describe('Error handling', () => {
		it('should not break when storage operations fail', () => {
			// Mock localStorage to fail
			const originalSetItem = Storage.prototype.setItem;
			Storage.prototype.setItem = vi.fn(() => {
				throw new Error('Storage full');
			});

			try {
				// Versioned storage should handle the error gracefully
				const testData = { test: 'data' };
				storage.saveState('failing-key', testData);

				// Animation system should still work
				markAnimationPlayed('test-challenge', 'test-seed', 1);
				expect(hasAnimationPlayed('test-challenge', 'test-seed', 1)).toBe(true);
			} finally {
				// Restore original function
				Storage.prototype.setItem = originalSetItem;
			}
		});
	});

	describe('Memory usage', () => {
		it('should not leak memory with many animation states', () => {
			// Create many animation states
			for (let i = 0; i < 100; i++) {
				markAnimationPlayed(`challenge-${i}`, `seed-${i}`, 1);
			}

			// Reset should clear all states
			for (let i = 0; i < 100; i++) {
				resetAnimationState(`challenge-${i}`, `seed-${i}`);
				expect(hasAnimationPlayed(`challenge-${i}`, `seed-${i}`, 1)).toBe(false);
			}
		});
	});
});