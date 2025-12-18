/**
 * Centralized animation utilities for the app
 * All animation timing, easing, and configuration should be defined here
 */

// Animation timing constants (in milliseconds)
export const ANIMATION_TIMING = {
	// Slot machine animation
	SLOT_CYCLE_DURATION: 80, // Duration of each slot cycle
	SLOT_SLOW_START: 400, // When to start slowing down
	SLOT_TOTAL_DURATION: 1200, // Total duration per slot
	SLOT_STAGGER_DELAY: 300, // Delay between each slot starting

	// General UI animations
	FADE_DURATION: 200,
	SCALE_DURATION: 200,
	HOVER_TRANSITION: 150,

	// Page transitions
	PAGE_TRANSITION: 300
} as const;

// Easing functions
export const EASING = {
	// Standard easing
	DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
	// Ease out for smooth endings
	EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
	// Ease in for building tension
	EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
	// Bounce effect
	BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
	// Slot machine deceleration
	SLOT_DECEL: 'cubic-bezier(0.16, 1, 0.3, 1)'
} as const;

// CSS animation class names (defined in app.css)
export const ANIMATION_CLASSES = {
	FADE_IN: 'animate-fade-in',
	FADE_OUT: 'animate-fade-out',
	SCALE_IN: 'animate-scale-in',
	SLOT_SPIN: 'animate-slot-spin',
	SLOT_REVEAL: 'animate-slot-reveal',
	PULSE: 'animate-pulse-subtle',
	BOUNCE_IN: 'animate-bounce-in'
} as const;

/**
 * Calculate slot machine timing for each slot index
 * Returns timings that create a staggered reveal effect
 */
export function getSlotTiming(slotIndex: number): {
	startDelay: number;
	spinDuration: number;
	totalDuration: number;
} {
	const startDelay = slotIndex * ANIMATION_TIMING.SLOT_STAGGER_DELAY;
	// Later slots spin longer for suspense
	const spinDuration = ANIMATION_TIMING.SLOT_TOTAL_DURATION + slotIndex * 100;
	const totalDuration = startDelay + spinDuration;

	return { startDelay, spinDuration, totalDuration };
}

/**
 * Get total animation duration for all slots
 */
export function getTotalSlotAnimationDuration(totalSlots: number): number {
	const lastSlotTiming = getSlotTiming(totalSlots - 1);
	return lastSlotTiming.totalDuration;
}

/**
 * Check if reduced motion is preferred by the user
 */
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Create a store key for tracking if animation has played for a specific boss
 */
export function getAnimationPlayedKey(challengeId: string, bossOrder: number): string {
	return `animation-played:${challengeId}:boss-${bossOrder}`;
}
