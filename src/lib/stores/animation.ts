/**
 * Store for tracking UI animation state across the app
 * This allows us to track which animations have already been played
 * and avoid replaying them on navigation. Now persists to localStorage per run.
 * 
 * @deprecated Animation state is now stored in the challenge state itself.
 * These functions are kept for backwards compatibility and migration.
 */

import { storage } from '../services/storage';

// In-memory cache for performance
const animationPlayedCache = new Map<string, boolean>();

/**
 * Get animation state storage key for a specific challenge run
 */
function getAnimationStorageKey(challengeId: string, seed: string): string {
	return `dsts:animations:${challengeId}:${seed}`;
}

/**
 * Load animation state from localStorage for a run
 */
function loadAnimationState(challengeId: string, seed: string): Record<string, boolean> {
	const key = getAnimationStorageKey(challengeId, seed);
	return storage.loadState<Record<string, boolean>>(key) || {};
}

/**
 * Save animation state to localStorage for a run
 * @deprecated Use challengeStore.markBossRevealed instead
 */
function saveAnimationState(
	challengeId: string,
	seed: string,
	animationState: Record<string, boolean>
): void {
	const key = getAnimationStorageKey(challengeId, seed);
	storage.saveState(key, animationState);
}

/**
 * Create a unique key for tracking animation state within a run
 */
function createKey(bossOrder: number): string {
	return `boss:${bossOrder}`;
}

/**
 * Migrate legacy animation state to challenge state
 * This function loads old animation state and returns it so it can be merged
 * into the challenge state.
 */
export function migrateAnimationState(
	challengeId: string,
	seed: string
): Record<number, boolean> {
	const animationState = loadAnimationState(challengeId, seed);
	const revealedBosses: Record<number, boolean> = {};

	// Convert boss:X keys to numeric keys
	for (const [key, value] of Object.entries(animationState)) {
		if (key.startsWith('boss:') && value === true) {
			const bossOrder = parseInt(key.substring(5), 10);
			if (!isNaN(bossOrder)) {
				revealedBosses[bossOrder] = true;
			}
		}
	}

	return revealedBosses;
}

/**
 * Check if animation has been played for a specific boss in a run
 * @deprecated Use challengeStore.isBossRevealed instead
 */
export function hasAnimationPlayed(challengeId: string, seed: string, bossOrder: number): boolean {
	const runKey = `${challengeId}:${seed}`;
	const bossKey = createKey(bossOrder);
	const cacheKey = `${runKey}:${bossKey}`;

	// Check cache first
	if (animationPlayedCache.has(cacheKey)) {
		return animationPlayedCache.get(cacheKey)!;
	}

	// Load from localStorage
	const animationState = loadAnimationState(challengeId, seed);
	const hasPlayed = animationState[bossKey] === true;

	// Cache result
	animationPlayedCache.set(cacheKey, hasPlayed);

	return hasPlayed;
}

/**
 * Mark animation as played for a specific boss in a run
 * @deprecated Use challengeStore.markBossRevealed instead
 */
export function markAnimationPlayed(challengeId: string, seed: string, bossOrder: number): void {
	const runKey = `${challengeId}:${seed}`;
	const bossKey = createKey(bossOrder);
	const cacheKey = `${runKey}:${bossKey}`;

	// Load current state
	const animationState = loadAnimationState(challengeId, seed);

	// Update state
	animationState[bossKey] = true;

	// Save to localStorage
	saveAnimationState(challengeId, seed, animationState);

	// Update cache
	animationPlayedCache.set(cacheKey, true);
}

/**
 * Reset animation state for a specific run (when clearing challenge state)
 */
export function resetAnimationState(challengeId: string, seed: string): void {
	const key = getAnimationStorageKey(challengeId, seed);
	storage.clearState(key);

	// Clear cache entries for this run
	const runKey = `${challengeId}:${seed}`;
	for (const cacheKey of animationPlayedCache.keys()) {
		if (cacheKey.startsWith(runKey)) {
			animationPlayedCache.delete(cacheKey);
		}
	}
}

/**
 * Reset all animation state (for debugging/testing)
 */
export function resetAllAnimationState(): void {
	// Clear cache
	animationPlayedCache.clear();

	// Clear localStorage entries (this is a destructive operation)
	// Note: This would require iterating through all localStorage keys
	// For now, we'll just clear the cache and let individual run resets handle localStorage
}
