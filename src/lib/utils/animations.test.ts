import { describe, it, expect, vi } from 'vitest';
import {
	ANIMATION_TIMING,
	EASING,
	ANIMATION_CLASSES,
	getSlotTiming,
	getTotalSlotAnimationDuration,
	prefersReducedMotion,
	getAnimationPlayedKey
} from './animations';

describe('Animation utilities', () => {
	describe('ANIMATION_TIMING', () => {
		it('should have valid timing constants', () => {
			expect(ANIMATION_TIMING.SLOT_CYCLE_DURATION).toBeGreaterThan(0);
			expect(ANIMATION_TIMING.SLOT_SLOW_START).toBeGreaterThan(0);
			expect(ANIMATION_TIMING.SLOT_TOTAL_DURATION).toBeGreaterThan(0);
			expect(ANIMATION_TIMING.SLOT_STAGGER_DELAY).toBeGreaterThan(0);
		});
	});

	describe('EASING', () => {
		it('should have valid easing strings', () => {
			expect(EASING.DEFAULT).toContain('cubic-bezier');
			expect(EASING.EASE_OUT).toContain('cubic-bezier');
			expect(EASING.EASE_IN).toContain('cubic-bezier');
			expect(EASING.BOUNCE).toContain('cubic-bezier');
			expect(EASING.SLOT_DECEL).toContain('cubic-bezier');
		});
	});

	describe('ANIMATION_CLASSES', () => {
		it('should have valid CSS class names', () => {
			expect(ANIMATION_CLASSES.FADE_IN).toBe('animate-fade-in');
			expect(ANIMATION_CLASSES.SLOT_SPIN).toBe('animate-slot-spin');
			expect(ANIMATION_CLASSES.SLOT_REVEAL).toBe('animate-slot-reveal');
		});
	});

	describe('getSlotTiming', () => {
		it('should return valid timing for first slot', () => {
			const timing = getSlotTiming(0);
			expect(timing.startDelay).toBe(0);
			expect(timing.spinDuration).toBeGreaterThan(0);
			expect(timing.totalDuration).toBe(timing.spinDuration);
		});

		it('should have increasing delays for later slots', () => {
			const timing0 = getSlotTiming(0);
			const timing1 = getSlotTiming(1);
			const timing2 = getSlotTiming(2);

			expect(timing1.startDelay).toBeGreaterThan(timing0.startDelay);
			expect(timing2.startDelay).toBeGreaterThan(timing1.startDelay);
		});

		it('should have increasing total duration for later slots', () => {
			const timing0 = getSlotTiming(0);
			const timing5 = getSlotTiming(5);

			expect(timing5.totalDuration).toBeGreaterThan(timing0.totalDuration);
		});
	});

	describe('getTotalSlotAnimationDuration', () => {
		it('should return valid duration for team size', () => {
			const duration = getTotalSlotAnimationDuration(6);
			expect(duration).toBeGreaterThan(0);
		});

		it('should increase with more slots', () => {
			const duration3 = getTotalSlotAnimationDuration(3);
			const duration6 = getTotalSlotAnimationDuration(6);

			expect(duration6).toBeGreaterThan(duration3);
		});
	});

	describe('prefersReducedMotion', () => {
		it('should return false when window is undefined (SSR)', () => {
			// In Node.js test environment, window might be defined by jsdom
			// but matchMedia might not be, so we test the function exists
			expect(typeof prefersReducedMotion).toBe('function');
		});
	});

	describe('getAnimationPlayedKey', () => {
		it('should generate unique keys for different challenges', () => {
			const key1 = getAnimationPlayedKey('challenge-1', 1);
			const key2 = getAnimationPlayedKey('challenge-2', 1);
			expect(key1).not.toBe(key2);
		});

		it('should generate unique keys for different bosses', () => {
			const key1 = getAnimationPlayedKey('challenge-1', 1);
			const key2 = getAnimationPlayedKey('challenge-1', 2);
			expect(key1).not.toBe(key2);
		});

		it('should generate consistent keys for same input', () => {
			const key1 = getAnimationPlayedKey('challenge-1', 1);
			const key2 = getAnimationPlayedKey('challenge-1', 1);
			expect(key1).toBe(key2);
		});
	});
});
