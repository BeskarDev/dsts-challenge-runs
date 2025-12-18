import { describe, it, expect, beforeEach } from 'vitest';
import { versioningService } from '$lib/services/versioning';
import { hasAnimationPlayed, markAnimationPlayed } from '$lib/stores/animation';
import '$lib/services/migrations'; // Import to register migrations

/**
 * Test the animation state migration from 1.1.0 to 1.2.0
 * This migration updates animation state to work with boss groups
 */
describe('Migration 1.1.0 → 1.2.0', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
	});

	it('should mark entire boss groups as revealed when rerollTeamPerBoss is false', () => {
		// Setup: Create a challenge state at boss 3 (which is in boss group 2-3)
		// with rerollTeamPerBoss = false (default behavior)
		const challengeState = {
			challengeId: 'random-evolution',
			seed: 'test-seed-group',
			currentBossOrder: 3,
			rerollTeamPerBoss: false,
			team: [],
			bossTeams: {},
			rerollHistory: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Store in 1.1.0 format
		const wrappedState = versioningService.wrap(challengeState, '1.1.0');
		localStorage.setItem('dsts:challenge:random-evolution', JSON.stringify(wrappedState));

		// Trigger migration to 1.2.0
		versioningService.migrate(wrappedState, '1.2.0');

		// Boss 1 is in its own group (1-1) and should be marked
		expect(hasAnimationPlayed('random-evolution', 'test-seed-group', 1)).toBe(true);
		
		// Boss 2-3 are in the same group (2-3), both should be marked
		expect(hasAnimationPlayed('random-evolution', 'test-seed-group', 2)).toBe(true);
		expect(hasAnimationPlayed('random-evolution', 'test-seed-group', 3)).toBe(true);
		
		// Boss 4 is in the next group (4-5) and should NOT be marked
		expect(hasAnimationPlayed('random-evolution', 'test-seed-group', 4)).toBe(false);
	});

	it('should keep individual boss marking when rerollTeamPerBoss is true', () => {
		// Setup: Create a challenge state at boss 3 with rerollTeamPerBoss = true
		// These bosses were already marked by the 1.1.0 migration
		const challengeState = {
			challengeId: 'random-evolution',
			seed: 'test-seed-individual',
			currentBossOrder: 3,
			rerollTeamPerBoss: true,
			team: [],
			bossTeams: {},
			rerollHistory: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Store in 1.1.0 format
		const wrappedState = versioningService.wrap(challengeState, '1.1.0');
		localStorage.setItem('dsts:challenge:random-evolution', JSON.stringify(wrappedState));

		// Pre-mark bosses as they would have been by 1.1.0 migration
		// (Simulating the state after 1.0.0 → 1.1.0 migration)
		markAnimationPlayed('random-evolution', 'test-seed-individual', 1);
		markAnimationPlayed('random-evolution', 'test-seed-individual', 2);
		markAnimationPlayed('random-evolution', 'test-seed-individual', 3);

		// Trigger migration to 1.2.0
		versioningService.migrate(wrappedState, '1.2.0');

		// With rerollTeamPerBoss=true, the migration should not modify animation state
		// The per-boss marking from 1.1.0 should remain
		expect(hasAnimationPlayed('random-evolution', 'test-seed-individual', 1)).toBe(true);
		expect(hasAnimationPlayed('random-evolution', 'test-seed-individual', 2)).toBe(true);
		expect(hasAnimationPlayed('random-evolution', 'test-seed-individual', 3)).toBe(true);
		expect(hasAnimationPlayed('random-evolution', 'test-seed-individual', 4)).toBe(false);
	});

	it('should handle mid-group progress correctly', () => {
		// Setup: Create a challenge state at boss 7 (in group 6-7)
		const challengeState = {
			challengeId: 'random-evolution',
			seed: 'test-seed-midgroup',
			currentBossOrder: 7,
			rerollTeamPerBoss: false,
			team: [],
			bossTeams: {},
			rerollHistory: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Store in 1.1.0 format
		const wrappedState = versioningService.wrap(challengeState, '1.1.0');
		localStorage.setItem('dsts:challenge:random-evolution', JSON.stringify(wrappedState));

		// Trigger migration to 1.2.0
		versioningService.migrate(wrappedState, '1.2.0');

		// Previous groups should be fully marked
		expect(hasAnimationPlayed('random-evolution', 'test-seed-midgroup', 1)).toBe(true); // Group 1-1
		expect(hasAnimationPlayed('random-evolution', 'test-seed-midgroup', 2)).toBe(true); // Group 2-3
		expect(hasAnimationPlayed('random-evolution', 'test-seed-midgroup', 3)).toBe(true); // Group 2-3
		expect(hasAnimationPlayed('random-evolution', 'test-seed-midgroup', 4)).toBe(true); // Group 4-5
		expect(hasAnimationPlayed('random-evolution', 'test-seed-midgroup', 5)).toBe(true); // Group 4-5
		expect(hasAnimationPlayed('random-evolution', 'test-seed-midgroup', 6)).toBe(true); // Group 6-7
		expect(hasAnimationPlayed('random-evolution', 'test-seed-midgroup', 7)).toBe(true); // Group 6-7 (current)
		
		// Next group should not be marked
		expect(hasAnimationPlayed('random-evolution', 'test-seed-midgroup', 8)).toBe(false); // Group 8-10
	});

	it('should handle challenge without boss groups gracefully', () => {
		// Setup: Create a challenge state for a non-existent challenge (no boss groups)
		const challengeState = {
			challengeId: 'unknown-challenge',
			seed: 'test-seed',
			currentBossOrder: 3,
			rerollTeamPerBoss: false,
			team: [],
			bossTeams: {},
			rerollHistory: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Store in 1.1.0 format
		const wrappedState = versioningService.wrap(challengeState, '1.1.0');
		localStorage.setItem('dsts:challenge:unknown-challenge', JSON.stringify(wrappedState));

		// Trigger migration - should not throw
		expect(() => {
			versioningService.migrate(wrappedState, '1.2.0');
		}).not.toThrow();
	});

	it('should handle invalid or missing challenge data gracefully', () => {
		// Setup: Add some invalid data
		localStorage.setItem('dsts:challenge:invalid', 'invalid json');
		localStorage.setItem('dsts:challenge:missing-fields', JSON.stringify(versioningService.wrap({
			challengeId: 'test'
			// Missing seed and currentBossOrder
		}, '1.1.0')));

		// Migration should not throw errors
		expect(() => {
			const testData = { test: 'data' };
			versioningService.migrate(versioningService.wrap(testData, '1.1.0'), '1.2.0');
		}).not.toThrow();
	});
});
