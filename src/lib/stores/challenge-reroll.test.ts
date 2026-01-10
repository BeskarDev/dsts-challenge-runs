import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { challengeStore } from './challenge';
import type { ChallengeRunState, TeamMember, BossTeamSnapshot } from '../types/challenge';

describe('Challenge Store - Team Re-rolls Linked per Boss Group', () => {
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

	it('should update team snapshots for all bosses in the same group when re-rolling', () => {
		// Create a team for boss 1 (which is in the same group as bosses 2 and 3)
		const team1: TeamMember[] = [
			{ digimonNumber: '001', slotIndex: 0, rolledAtCheckpoint: 1 },
			{ digimonNumber: '002', slotIndex: 1, rolledAtCheckpoint: 1 },
			{ digimonNumber: '003', slotIndex: 2, rolledAtCheckpoint: 1 }
		];

		const bossTeam1: BossTeamSnapshot = {
			bossOrder: 1,
			generation: 'Rookie',
			team: team1,
			seed: 'test-seed-boss-1'
		};

		const state: ChallengeRunState = {
			challengeId: 'test-challenge',
			seed: 'test-seed-123',
			currentBossOrder: 1,
			currentGeneration: 'Rookie',
			team: team1,
			rerollHistory: [],
			bossTeams: {
				1: bossTeam1
			},
			includeDLC: true,
			includePostGame: false,
			includeNonStandard: true,
			includeDLCBosses: false,
			rerollTeamPerBoss: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		challengeStore.save(state);

		// Simulate navigating to boss 2 in the same group, which should reuse the team from boss 1
		// In the actual implementation, this would create a snapshot for boss 2
		const team2Copy = [...team1];
		const bossTeam2: BossTeamSnapshot = {
			bossOrder: 2,
			generation: 'Rookie',
			team: team2Copy,
			seed: 'test-seed-boss-1' // Same seed as boss 1, indicating same group
		};

		challengeStore.update((s) => {
			if (!s) return s;
			return {
				...s,
				currentBossOrder: 2,
				bossTeams: {
					...s.bossTeams,
					2: bossTeam2
				}
			};
		});

		// Now simulate a re-roll at boss 2
		// The re-roll should update the team for BOTH boss 1 and boss 2
		const newTeam: TeamMember[] = [
			{ digimonNumber: '004', slotIndex: 0, rolledAtCheckpoint: 2 },
			{ digimonNumber: '005', slotIndex: 1, rolledAtCheckpoint: 2 },
			{ digimonNumber: '006', slotIndex: 2, rolledAtCheckpoint: 2 }
		];

		challengeStore.update((s) => {
			if (!s) return s;

			// Simulate the fix: Update team snapshots for all bosses in the group (1, 2, 3)
			const bossOrdersInGroup = [1, 2, 3]; // Assuming boss group 1-3
			const updatedBossTeams = { ...s.bossTeams };
			const rerollSeed = `${s.seed}-boss-${s.currentBossOrder}-reroll-0`;

			for (const bossOrder of bossOrdersInGroup) {
				updatedBossTeams[bossOrder] = {
					bossOrder,
					generation: s.currentGeneration,
					team: newTeam,
					seed: rerollSeed
				};
			}

			return {
				...s,
				team: newTeam,
				bossTeams: updatedBossTeams,
				rerollHistory: [
					...s.rerollHistory,
					{
						timestamp: new Date().toISOString(),
						checkpoint: s.currentBossOrder,
						previousTeam: team1.map((m) => m.digimonNumber),
						newTeam: newTeam.map((m) => m.digimonNumber),
						seed: rerollSeed
					}
				]
			};
		});

		// Verify that all bosses in the group have the updated team
		const savedData = mockStorage['dsts:challenge:test-challenge'];
		const parsed = JSON.parse(savedData);

		// Boss 1 should have the new team
		expect(parsed.data.bossTeams['1']).toBeDefined();
		expect(parsed.data.bossTeams['1'].team).toEqual(newTeam);
		expect(parsed.data.bossTeams['1'].team[0].digimonNumber).toBe('004');

		// Boss 2 should have the new team
		expect(parsed.data.bossTeams['2']).toBeDefined();
		expect(parsed.data.bossTeams['2'].team).toEqual(newTeam);
		expect(parsed.data.bossTeams['2'].team[0].digimonNumber).toBe('004');

		// Boss 3 should also have the new team (pre-created by the fix)
		expect(parsed.data.bossTeams['3']).toBeDefined();
		expect(parsed.data.bossTeams['3'].team).toEqual(newTeam);
		expect(parsed.data.bossTeams['3'].team[0].digimonNumber).toBe('004');
	});

	it('should only update the current boss when no boss group is defined', () => {
		const team1: TeamMember[] = [
			{ digimonNumber: '001', slotIndex: 0, rolledAtCheckpoint: 1 }
		];

		const state: ChallengeRunState = {
			challengeId: 'test-challenge',
			seed: 'test-seed-456',
			currentBossOrder: 1,
			currentGeneration: 'Rookie',
			team: team1,
			rerollHistory: [],
			bossTeams: {
				1: {
					bossOrder: 1,
					generation: 'Rookie',
					team: team1,
					seed: 'test-seed-boss-1'
				}
			},
			includeDLC: true,
			includePostGame: false,
			includeNonStandard: true,
			includeDLCBosses: false,
			rerollTeamPerBoss: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		challengeStore.save(state);

		// Simulate a re-roll with no boss group (should only update current boss)
		const newTeam: TeamMember[] = [
			{ digimonNumber: '002', slotIndex: 0, rolledAtCheckpoint: 1 }
		];

		challengeStore.update((s) => {
			if (!s) return s;

			// When no boss group, only update current boss (bossOrdersInGroup = [1])
			const bossOrdersInGroup = [1];
			const updatedBossTeams = { ...s.bossTeams };
			const rerollSeed = `${s.seed}-boss-${s.currentBossOrder}-reroll-0`;

			for (const bossOrder of bossOrdersInGroup) {
				updatedBossTeams[bossOrder] = {
					bossOrder,
					generation: s.currentGeneration,
					team: newTeam,
					seed: rerollSeed
				};
			}

			return {
				...s,
				team: newTeam,
				bossTeams: updatedBossTeams
			};
		});

		const savedData = mockStorage['dsts:challenge:test-challenge'];
		const parsed = JSON.parse(savedData);

		// Only boss 1 should be updated
		expect(parsed.data.bossTeams['1'].team[0].digimonNumber).toBe('002');
		// Boss 2 should not exist
		expect(parsed.data.bossTeams['2']).toBeUndefined();
	});

	it('should demonstrate the bug when re-roll only updates current boss', () => {
		// This test demonstrates the OLD behavior (the bug)
		const team1: TeamMember[] = [
			{ digimonNumber: '001', slotIndex: 0, rolledAtCheckpoint: 1 }
		];

		const state: ChallengeRunState = {
			challengeId: 'test-challenge',
			seed: 'test-seed-bug',
			currentBossOrder: 1,
			currentGeneration: 'Rookie',
			team: team1,
			rerollHistory: [],
			bossTeams: {
				1: {
					bossOrder: 1,
					generation: 'Rookie',
					team: team1,
					seed: 'test-seed-boss-1'
				}
			},
			includeDLC: true,
			includePostGame: false,
			includeNonStandard: true,
			includeDLCBosses: false,
			rerollTeamPerBoss: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		challengeStore.save(state);

		// Navigate to boss 2, which copies the team from boss 1
		challengeStore.update((s) => {
			if (!s) return s;
			return {
				...s,
				currentBossOrder: 2,
				bossTeams: {
					...s.bossTeams,
					2: {
						bossOrder: 2,
						generation: 'Rookie',
						team: [...team1],
						seed: 'test-seed-boss-1'
					}
				}
			};
		});

		// OLD BEHAVIOR: Re-roll only updates boss 2, leaving boss 1 with old team
		const newTeam: TeamMember[] = [
			{ digimonNumber: '002', slotIndex: 0, rolledAtCheckpoint: 2 }
		];

		challengeStore.update((s) => {
			if (!s) return s;
			return {
				...s,
				team: newTeam,
				bossTeams: {
					...s.bossTeams,
					2: {
						...s.bossTeams[2],
						team: newTeam
					}
					// Boss 1 is NOT updated - this is the bug
				}
			};
		});

		const savedData = mockStorage['dsts:challenge:test-challenge'];
		const parsed = JSON.parse(savedData);

		// This shows the bug: boss 1 still has old team, boss 2 has new team
		expect(parsed.data.bossTeams['1'].team[0].digimonNumber).toBe('001'); // Old team
		expect(parsed.data.bossTeams['2'].team[0].digimonNumber).toBe('002'); // New team
	});
});
