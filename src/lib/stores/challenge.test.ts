import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { challengeStore } from './challenge';
import type { ChallengeRunState } from '../types/challenge';

describe('Challenge Store - Animation State Integration', () => {
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
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should initialize new challenge state with empty revealedBosses', () => {
		const newState: ChallengeRunState = {
			challengeId: 'test-challenge',
			seed: 'test-seed-123',
			currentBossOrder: 1,
			currentGeneration: 'Rookie',
			team: [],
			rerollHistory: [],
			bossTeams: {},
			includeDLC: true,
			includePostGame: false,
			includeNonStandard: true,
			includeDLCBosses: false,
			rerollTeamPerBoss: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		challengeStore.save(newState);
		challengeStore.load('test-challenge');

		// Verify state was saved with revealedBosses initialized
		const savedData = mockStorage['dsts:challenge:test-challenge'];
		expect(savedData).toBeDefined();

		const parsed = JSON.parse(savedData);
		expect(parsed.data.revealedBosses).toBeDefined();
		expect(parsed.data.revealedBosses).toEqual({});
	});

	it('should mark boss as revealed and persist to storage', () => {
		const newState: ChallengeRunState = {
			challengeId: 'test-challenge',
			seed: 'test-seed-123',
			currentBossOrder: 1,
			currentGeneration: 'Rookie',
			team: [],
			rerollHistory: [],
			bossTeams: {},
			includeDLC: true,
			includePostGame: false,
			includeNonStandard: true,
			includeDLCBosses: false,
			rerollTeamPerBoss: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		challengeStore.save(newState);

		// Mark boss 1 as revealed
		challengeStore.markBossRevealed(1);

		// Load and verify
		challengeStore.load('test-challenge');

		const savedData = mockStorage['dsts:challenge:test-challenge'];
		const parsed = JSON.parse(savedData);
		
		expect(parsed.data.revealedBosses[1]).toBe(true);
	});

	it('should correctly report boss revealed status', () => {
		const state: ChallengeRunState = {
			challengeId: 'test-challenge',
			seed: 'test-seed-123',
			currentBossOrder: 3,
			currentGeneration: 'Rookie',
			team: [],
			rerollHistory: [],
			bossTeams: {},
			revealedBosses: { 1: true, 2: true },
			includeDLC: true,
			includePostGame: false,
			includeNonStandard: true,
			includeDLCBosses: false,
			rerollTeamPerBoss: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		expect(challengeStore.isBossRevealed(state, 1)).toBe(true);
		expect(challengeStore.isBossRevealed(state, 2)).toBe(true);
		expect(challengeStore.isBossRevealed(state, 3)).toBe(false);
		expect(challengeStore.isBossRevealed(state, 99)).toBe(false);
	});

	it('should migrate legacy animation state on load', () => {
		// Create a challenge state without revealedBosses
		const legacyState = {
			challengeId: 'test-challenge',
			seed: 'test-seed-456',
			currentBossOrder: 3,
			currentGeneration: 'Rookie',
			team: [],
			rerollHistory: [],
			bossTeams: {},
			includeDLC: true,
			includePostGame: false,
			includeNonStandard: true,
			includeDLCBosses: false,
			rerollTeamPerBoss: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
			// Note: No revealedBosses field
		};

		// Create legacy animation state
		const legacyAnimationState = {
			'boss:1': true,
			'boss:2': true,
			'boss:3': true
		};

		// Manually save legacy states
		const versionedLegacyState = {
			_version: '1.2.0',
			_createdAt: new Date().toISOString(),
			_updatedAt: new Date().toISOString(),
			data: legacyState
		};
		mockStorage['dsts:challenge:test-challenge'] = JSON.stringify(versionedLegacyState);

		const versionedAnimationState = {
			_version: '1.2.0',
			_createdAt: new Date().toISOString(),
			_updatedAt: new Date().toISOString(),
			data: legacyAnimationState
		};
		mockStorage['dsts:animations:test-challenge:test-seed-456'] = JSON.stringify(versionedAnimationState);

		// Load the state - should trigger migration
		challengeStore.load('test-challenge');

		// Verify migration happened
		const savedData = mockStorage['dsts:challenge:test-challenge'];
		const parsed = JSON.parse(savedData);
		
		expect(parsed.data.revealedBosses).toBeDefined();
		expect(parsed.data.revealedBosses[1]).toBe(true);
		expect(parsed.data.revealedBosses[2]).toBe(true);
		expect(parsed.data.revealedBosses[3]).toBe(true);
	});

	it('should handle null state gracefully', () => {
		expect(challengeStore.isBossRevealed(null, 1)).toBe(false);
		expect(challengeStore.isBossRevealed(null, 99)).toBe(false);
	});

	it('should persist revealedBosses across save operations', () => {
		const state: ChallengeRunState = {
			challengeId: 'test-challenge',
			seed: 'test-seed-789',
			currentBossOrder: 1,
			currentGeneration: 'Rookie',
			team: [],
			rerollHistory: [],
			bossTeams: {},
			revealedBosses: { 1: true },
			includeDLC: true,
			includePostGame: false,
			includeNonStandard: true,
			includeDLCBosses: false,
			rerollTeamPerBoss: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Save state
		challengeStore.save(state);

		// Modify and save again
		state.currentBossOrder = 2;
		state.revealedBosses![2] = true;
		challengeStore.save(state);

		// Load and verify
		const savedData = mockStorage['dsts:challenge:test-challenge'];
		const parsed = JSON.parse(savedData);
		
		expect(parsed.data.revealedBosses[1]).toBe(true);
		expect(parsed.data.revealedBosses[2]).toBe(true);
		expect(parsed.data.currentBossOrder).toBe(2);
	});
});
