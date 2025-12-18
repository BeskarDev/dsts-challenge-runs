import type { Migration } from '../versioning';
import { markAnimationPlayed } from '../../stores/animation';

/**
 * Migration from 1.0.0 to 1.1.0
 * Sets animation state for existing challenge progress to mark teams as revealed
 * up to the current boss order, so users don't see animations for teams they've already seen.
 */
export const migration_1_0_0_to_1_1_0: Migration = {
	fromVersion: '1.0.0',
	toVersion: '1.1.0',
	description: 'Mark existing team progress as revealed in animation state',
	migrate: (data: unknown) => {
		// This migration runs on the entire localStorage, not individual items
		// We need to check for challenge states and mark appropriate animations as played
		
		console.info('[Migration 1.0.0 → 1.1.0] Starting migration...');
		
		// Get all localStorage keys that are challenge states
		const challengeKeys: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith('dsts:challenge:')) {
				challengeKeys.push(key);
			}
		}
		
		console.info(`[Migration 1.0.0 → 1.1.0] Found ${challengeKeys.length} challenge states to process`);
		
		// Process each challenge state
		for (const key of challengeKeys) {
			try {
				const stored = localStorage.getItem(key);
				if (!stored) continue;
				
				let challengeState;
				try {
					challengeState = JSON.parse(stored);
				} catch {
					console.warn(`[Migration 1.0.0 → 1.1.0] Failed to parse ${key}`);
					continue; // Skip invalid JSON
				}
				
				// Extract data if versioned, otherwise use as-is
				const actualData = challengeState && typeof challengeState === 'object' && 'data' in challengeState 
					? challengeState.data 
					: challengeState;
				
				if (!actualData || typeof actualData !== 'object') {
					console.warn(`[Migration 1.0.0 → 1.1.0] Invalid data structure for ${key}`);
					continue;
				}
				if (!actualData.challengeId || !actualData.seed || typeof actualData.currentBossOrder !== 'number') {
					console.warn(`[Migration 1.0.0 → 1.1.0] Missing required fields in ${key}`);
					continue;
				}
				
				console.info(`[Migration 1.0.0 → 1.1.0] Processing ${key}: challengeId=${actualData.challengeId}, seed=${actualData.seed}, currentBossOrder=${actualData.currentBossOrder}`);
				
				// Mark all bosses up to current progress as revealed (simple per-boss approach)
				for (let bossOrder = 1; bossOrder <= actualData.currentBossOrder; bossOrder++) {
					markAnimationPlayed(actualData.challengeId, actualData.seed, bossOrder);
				}
				
				console.info(`[Migration 1.0.0 → 1.1.0] ✓ Marked bosses 1-${actualData.currentBossOrder} as revealed for ${actualData.challengeId} (seed: ${actualData.seed})`);
				
			} catch (error) {
				console.warn(`[Migration 1.0.0 → 1.1.0] Failed to process challenge state ${key}:`, error);
			}
		}
		
		console.info('[Migration 1.0.0 → 1.1.0] Migration complete');
		
		// Return the original data unchanged - this migration only affects animation state
		return data;
	}
};
