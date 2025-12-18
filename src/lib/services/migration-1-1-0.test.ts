import { describe, it, expect, beforeEach } from 'vitest';
import { versioningService } from '$lib/services/versioning';
import { hasAnimationPlayed } from '$lib/stores/animation';
import '$lib/services/migrations'; // Import to register migrations

/**
 * Test the animation state migration from 1.0.0 to 1.1.0
 */
describe('Animation State Migration 1.0.0 → 1.1.0', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
	});

	it('should mark existing team progress as revealed', () => {
		// Setup: Create a challenge state at boss 3 in localStorage (version 1.0.0 format)
		const challengeState = {
			challengeId: 'random-evolution',
			seed: 'test-seed-123',
			currentBossOrder: 3,
			team: [],
			bossTeams: {},
			rerollHistory: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Store in old 1.0.0 format (wrapped with version 1.0.0)
		const wrappedState = versioningService.wrap(challengeState, '1.0.0');
		localStorage.setItem('dsts:challenge:random-evolution', JSON.stringify(wrappedState));

		// Verify no animations are marked as played initially
		expect(hasAnimationPlayed('random-evolution', 'test-seed-123', 1)).toBe(false);
		expect(hasAnimationPlayed('random-evolution', 'test-seed-123', 2)).toBe(false);
		expect(hasAnimationPlayed('random-evolution', 'test-seed-123', 3)).toBe(false);
		expect(hasAnimationPlayed('random-evolution', 'test-seed-123', 4)).toBe(false);

		// Trigger migration by reading with new version
		const migrated = versioningService.migrate(wrappedState, '1.1.0');
		expect(migrated).not.toBeNull();
		expect(migrated?._version).toBe('1.1.0');

		// Verify that bosses 1-3 are now marked as revealed, but boss 4 is not
		expect(hasAnimationPlayed('random-evolution', 'test-seed-123', 1)).toBe(true);
		expect(hasAnimationPlayed('random-evolution', 'test-seed-123', 2)).toBe(true);
		expect(hasAnimationPlayed('random-evolution', 'test-seed-123', 3)).toBe(true);
		expect(hasAnimationPlayed('random-evolution', 'test-seed-123', 4)).toBe(false);
	});

	it('should handle multiple challenge states', () => {
		// Setup: Create multiple challenge states
		const challenge1 = versioningService.wrap(
			{
				challengeId: 'challenge-1',
				seed: 'seed-1',
				currentBossOrder: 2,
				team: [],
				bossTeams: {},
				rerollHistory: []
			},
			'1.0.0'
		);

		const challenge2 = versioningService.wrap(
			{
				challengeId: 'challenge-2',
				seed: 'seed-2',
				currentBossOrder: 5,
				team: [],
				bossTeams: {},
				rerollHistory: []
			},
			'1.0.0'
		);

		localStorage.setItem('dsts:challenge:challenge-1', JSON.stringify(challenge1));
		localStorage.setItem('dsts:challenge:challenge-2', JSON.stringify(challenge2));

		// Trigger migration on both
		versioningService.migrate(challenge1, '1.1.0');
		versioningService.migrate(challenge2, '1.1.0');

		// Verify challenge 1 (boss 2)
		expect(hasAnimationPlayed('challenge-1', 'seed-1', 1)).toBe(true);
		expect(hasAnimationPlayed('challenge-1', 'seed-1', 2)).toBe(true);
		expect(hasAnimationPlayed('challenge-1', 'seed-1', 3)).toBe(false);

		// Verify challenge 2 (boss 5)
		expect(hasAnimationPlayed('challenge-2', 'seed-2', 1)).toBe(true);
		expect(hasAnimationPlayed('challenge-2', 'seed-2', 2)).toBe(true);
		expect(hasAnimationPlayed('challenge-2', 'seed-2', 3)).toBe(true);
		expect(hasAnimationPlayed('challenge-2', 'seed-2', 4)).toBe(true);
		expect(hasAnimationPlayed('challenge-2', 'seed-2', 5)).toBe(true);
		expect(hasAnimationPlayed('challenge-2', 'seed-2', 6)).toBe(false);
	});

	it('should handle invalid or missing challenge data gracefully', () => {
		// Setup: Add some invalid data
		localStorage.setItem('dsts:challenge:invalid', 'invalid json');
		localStorage.setItem(
			'dsts:challenge:missing-fields',
			JSON.stringify(
				versioningService.wrap(
					{
						challengeId: 'test'
						// Missing seed and currentBossOrder
					},
					'1.0.0'
				)
			)
		);

		// Migration should not throw errors
		expect(() => {
			const testData = { test: 'data' };
			versioningService.migrate(versioningService.wrap(testData, '1.0.0'), '1.1.0');
		}).not.toThrow();
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

		// Store in old 1.0.0 format
		const wrappedState = versioningService.wrap(challengeState, '1.0.0');
		localStorage.setItem('dsts:challenge:random-evolution', JSON.stringify(wrappedState));

		// Trigger migration
		versioningService.migrate(wrappedState, '1.1.0');

		// Boss 1 is in its own group (1-1) and should be marked
		expect(hasAnimationPlayed('random-evolution', 'test-seed-group', 1)).toBe(true);

		// Boss 2-3 are in the same group (2-3), both should be marked
		expect(hasAnimationPlayed('random-evolution', 'test-seed-group', 2)).toBe(true);
		expect(hasAnimationPlayed('random-evolution', 'test-seed-group', 3)).toBe(true);

		// Boss 4 is in the next group (4-5) and should NOT be marked
		expect(hasAnimationPlayed('random-evolution', 'test-seed-group', 4)).toBe(false);
	});

	it('should mark individual bosses when rerollTeamPerBoss is true', () => {
		// Setup: Create a challenge state at boss 3 with rerollTeamPerBoss = true
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

		// Store in old 1.0.0 format
		const wrappedState = versioningService.wrap(challengeState, '1.0.0');
		localStorage.setItem('dsts:challenge:random-evolution', JSON.stringify(wrappedState));

		// Trigger migration
		versioningService.migrate(wrappedState, '1.1.0');

		// All bosses 1-3 should be marked individually
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

		// Store in old 1.0.0 format
		const wrappedState = versioningService.wrap(challengeState, '1.0.0');
		localStorage.setItem('dsts:challenge:random-evolution', JSON.stringify(wrappedState));

		// Trigger migration
		versioningService.migrate(wrappedState, '1.1.0');

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

	it('should not affect other localStorage data', () => {
		// Setup: Add non-challenge data
		localStorage.setItem('other-key', 'other-value');
		localStorage.setItem('dsts:theme', 'dark');

		const testData = { test: 'data' };
		const migrated = versioningService.migrate(versioningService.wrap(testData, '1.0.0'), '1.1.0');

		// Verify other data is unchanged
		expect(localStorage.getItem('other-key')).toBe('other-value');
		expect(localStorage.getItem('dsts:theme')).toBe('dark');
		expect(migrated?.data).toEqual(testData);
	});
});
