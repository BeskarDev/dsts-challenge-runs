/**
 * Store for tracking UI animation state across the app
 * This allows us to track which animations have already been played
 * and avoid replaying them on navigation
 */

// Session-based storage for animation state (doesn't persist across browser sessions)
const animationPlayedMap = new Map<string, boolean>();

/**
 * Create a unique key for tracking animation state
 */
function createKey(challengeId: string, bossOrder: number): string {
	return `${challengeId}:boss:${bossOrder}`;
}

/**
 * Check if animation has been played for a specific boss
 */
export function hasAnimationPlayed(challengeId: string, bossOrder: number): boolean {
	const key = createKey(challengeId, bossOrder);
	return animationPlayedMap.get(key) === true;
}

/**
 * Mark animation as played for a specific boss
 */
export function markAnimationPlayed(challengeId: string, bossOrder: number): void {
	const key = createKey(challengeId, bossOrder);
	animationPlayedMap.set(key, true);
}

/**
 * Reset animation state for a challenge (when starting new challenge)
 */
export function resetAnimationState(challengeId: string): void {
	// Clear all keys that start with this challenge ID
	for (const key of animationPlayedMap.keys()) {
		if (key.startsWith(`${challengeId}:`)) {
			animationPlayedMap.delete(key);
		}
	}
}

/**
 * Reset all animation state (for debugging/testing)
 */
export function resetAllAnimationState(): void {
	animationPlayedMap.clear();
}
