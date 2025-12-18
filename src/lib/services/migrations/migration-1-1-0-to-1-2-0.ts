import type { Migration } from '../versioning';
import { markAnimationPlayed } from '../../stores/animation';
import type { BossGroup } from '../../types/challenge';
// Import challenge data to get boss groups
import randomEvolutionChallenge from '../../../data/challenges/random-evolution.json';

/**
 * Get boss groups for a challenge
 */
function getBossGroupsForChallenge(challengeId: string): BossGroup[] {
	// Currently only one challenge exists, but this is extensible
	if (challengeId === 'random-evolution') {
		return (randomEvolutionChallenge.bossGroups || []) as BossGroup[];
	}
	return [];
}

/**
 * Find the boss group for a given boss order
 */
function getBossGroupForBoss(bossGroups: BossGroup[], bossOrder: number): BossGroup | null {
	return bossGroups.find(g => bossOrder >= g.startBoss && bossOrder <= g.endBoss) || null;
}

/**
 * Migration from 1.1.0 to 1.2.0
 * Updates to the "digivolution" naming convention and new checkpoint structure.
 * The challenge ID remains 'random-evolution' for backwards compatibility with URLs and storage.
 * 
 * This migration also updates animation state to work with boss groups:
 * - Marks entire boss groups as revealed based on the rerollTeamPerBoss setting
 * - For runs without rerollTeamPerBoss (default), marks all bosses in completed groups
 * - For runs with rerollTeamPerBoss=true, keeps individual boss marking
 */
export const migration_1_1_0_to_1_2_0: Migration = {
	fromVersion: '1.1.0',
	toVersion: '1.2.0',
	description: 'Update to digivolution naming, checkpoint structure, and boss group animation logic',
	migrate: (data: unknown) => {
		console.info('[Migration 1.1.0 → 1.2.0] Starting migration...');
		
		// Get all localStorage keys that are challenge states
		const challengeKeys: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith('dsts:challenge:')) {
				challengeKeys.push(key);
			}
		}
		
		console.info(`[Migration 1.1.0 → 1.2.0] Found ${challengeKeys.length} challenge states to update animation state`);
		
		// Process each challenge state to update animation state for boss groups
		for (const key of challengeKeys) {
			try {
				const stored = localStorage.getItem(key);
				if (!stored) continue;
				
				let challengeState;
				try {
					challengeState = JSON.parse(stored);
				} catch {
					console.warn(`[Migration 1.1.0 → 1.2.0] Failed to parse ${key}`);
					continue;
				}
				
				// Extract data if versioned, otherwise use as-is
				const actualData = challengeState && typeof challengeState === 'object' && 'data' in challengeState 
					? challengeState.data 
					: challengeState;
				
				if (!actualData || typeof actualData !== 'object') {
					console.warn(`[Migration 1.1.0 → 1.2.0] Invalid data structure for ${key}`);
					continue;
				}
				if (!actualData.challengeId || !actualData.seed || typeof actualData.currentBossOrder !== 'number') {
					console.warn(`[Migration 1.1.0 → 1.2.0] Missing required fields in ${key}`);
					continue;
				}
				
				// Get boss groups for this challenge
				const bossGroups = getBossGroupsForChallenge(actualData.challengeId);
				
				// Only process if this challenge has boss groups
				if (bossGroups.length === 0) {
					console.info(`[Migration 1.1.0 → 1.2.0] No boss groups for ${actualData.challengeId}, skipping animation update`);
					continue;
				}
				
				// Check if rerollTeamPerBoss is enabled (default to false for old runs)
				const rerollTeamPerBoss = actualData.rerollTeamPerBoss ?? false;
				
				console.info(`[Migration 1.1.0 → 1.2.0] Processing ${key}: challengeId=${actualData.challengeId}, currentBossOrder=${actualData.currentBossOrder}, rerollTeamPerBoss=${rerollTeamPerBoss}`);
				
				if (rerollTeamPerBoss) {
					// rerollTeamPerBoss is enabled, animation state is already per-boss from 1.1.0 migration
					console.info(`[Migration 1.1.0 → 1.2.0] ✓ Run has rerollTeamPerBoss=true, keeping per-boss animation state`);
				} else {
					// Mark entire boss groups as revealed
					// Find all boss groups up to and including the current boss
					const groupsToMark = new Set<number>();
					
					for (let bossOrder = 1; bossOrder <= actualData.currentBossOrder; bossOrder++) {
						const group = getBossGroupForBoss(bossGroups, bossOrder);
						if (group) {
							groupsToMark.add(group.startBoss);
						}
					}
					
					// Mark all bosses in completed groups
					for (const startBoss of groupsToMark) {
						const group = bossGroups.find(g => g.startBoss === startBoss);
						if (group) {
							// Mark all bosses in this group (up to currentBossOrder)
							const endBoss = Math.min(group.endBoss, actualData.currentBossOrder);
							for (let bossOrder = group.startBoss; bossOrder <= endBoss; bossOrder++) {
								markAnimationPlayed(actualData.challengeId, actualData.seed, bossOrder);
							}
							console.info(`[Migration 1.1.0 → 1.2.0] ✓ Marked boss group ${group.startBoss}-${endBoss} (${group.label})`);
						}
					}
					console.info(`[Migration 1.1.0 → 1.2.0] ✓ Marked ${groupsToMark.size} boss groups as revealed for ${actualData.challengeId}`);
				}
				
			} catch (error) {
				console.warn(`[Migration 1.1.0 → 1.2.0] Failed to process challenge state ${key}:`, error);
			}
		}
		
		console.info('[Migration 1.1.0 → 1.2.0] Migration complete');
		
		// No data structure changes needed - just return original data
		return data;
	}
};
