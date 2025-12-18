import { writable } from 'svelte/store';
import type { ChallengeRunState } from '../types/challenge';
import { storage } from '../services/storage';
import { historyStore } from './history';
import bossesData from '../../data/bosses.json';

function getChallengeKey(challengeId: string): string {
	return `dsts:challenge:${challengeId}`;
}

function getTotalBossesForState(state: ChallengeRunState): number {
	// Get all non-optional bosses (required bosses)
	const requiredBosses = bossesData.filter((boss) => !boss.optional);

	// Add DLC bosses if included (boss orders 34, 35, 36)
	const dlcBosses = bossesData.filter((boss) => boss.optional && boss.order >= 34);

	const includeDLC = state.includeDLCBosses ?? false; // Default to false if not set
	return includeDLC ? requiredBosses.length + dlcBosses.length : requiredBosses.length;
}

// Helper to get total bosses for a challenge - this needs to be set externally
const DEFAULT_CHALLENGE_NAME = 'Challenge Run';
const totalBossesCache: Record<string, number> = {};
const challengeNameCache: Record<string, string> = {};

function createChallengeStore() {
	const { subscribe, set, update } = writable<ChallengeRunState | null>(null);

	return {
		subscribe,
		// Set metadata for history tracking
		setChallengeMetadata: (challengeId: string, name: string, totalBosses: number) => {
			challengeNameCache[challengeId] = name;
			totalBossesCache[challengeId] = totalBosses;
		},
		load: (challengeId: string) => {
			const key = getChallengeKey(challengeId);
			let state = storage.loadState<ChallengeRunState>(key);

			// Migrate old state format if needed
			if (state && !state.bossTeams) {
				state = {
					...state,
					bossTeams: {
						[state.currentBossOrder]: {
							bossOrder: state.currentBossOrder,
							generation: state.currentGeneration,
							team: state.team,
							seed: `${state.seed}-boss-${state.currentBossOrder}`
						}
					}
				};
				// Save migrated state
				storage.saveState(key, state);
			}

			// Migrate content filtering fields if missing
			if (state) {
				let needsSave = false;
				const migratedState = state as unknown as Record<string, unknown>;

				if (!('includeDLC' in state)) {
					migratedState.includeDLC = true;
					needsSave = true;
				}
				if (!('includePostGame' in state)) {
					migratedState.includePostGame = false;
					needsSave = true;
				}
				if (!('includeNonStandard' in state)) {
					migratedState.includeNonStandard = true;
					needsSave = true;
				}
				if (!('includeDLCBosses' in state)) {
					migratedState.includeDLCBosses = false;
					needsSave = true;
				}
				if (!('rerollTeamPerBoss' in state)) {
					migratedState.rerollTeamPerBoss = false;
					needsSave = true;
				}

				if (needsSave) {
					storage.saveState(key, state as unknown as ChallengeRunState);
				}
			}

			set(state);
		},
		hasExistingState: (challengeId: string): boolean => {
			const key = getChallengeKey(challengeId);
			return storage.loadState<ChallengeRunState>(key) !== null;
		},
		save: (state: ChallengeRunState) => {
			const key = getChallengeKey(state.challengeId);

			// Ensure all content filtering fields are set
			const normalizedState = {
				...state,
				includeDLC: state.includeDLC ?? true,
				includePostGame: state.includePostGame ?? false,
				includeNonStandard: state.includeNonStandard ?? true,
				includeDLCBosses: state.includeDLCBosses ?? false,
				rerollTeamPerBoss: state.rerollTeamPerBoss ?? false
			};

			storage.saveState(key, normalizedState);
			set(normalizedState);

			// Update history with accurate boss count based on DLC setting
			const challengeName =
				challengeNameCache[normalizedState.challengeId] || DEFAULT_CHALLENGE_NAME;
			const totalBosses = getTotalBossesForState(normalizedState);
			historyStore.addOrUpdateRun(normalizedState, challengeName, totalBosses);
		},
		update: (updater: (state: ChallengeRunState | null) => ChallengeRunState | null) => {
			update((state) => {
				const newState = updater(state);
				if (newState) {
					const key = getChallengeKey(newState.challengeId);
					storage.saveState(key, newState);

					// Update history with accurate boss count based on DLC setting
					const challengeName = challengeNameCache[newState.challengeId] || DEFAULT_CHALLENGE_NAME;
					const totalBosses = getTotalBossesForState(newState);
					historyStore.addOrUpdateRun(newState, challengeName, totalBosses);
				}
				return newState;
			});
		},
		updateBossProgress: (bossOrder: number) => {
			update((state) => {
				if (!state) return state;
				const newState = {
					...state,
					currentBossOrder: bossOrder,
					updatedAt: new Date().toISOString()
				};
				storage.saveState(getChallengeKey(state.challengeId), newState);

				// Update history with accurate boss count based on DLC setting
				const challengeName = challengeNameCache[state.challengeId] || DEFAULT_CHALLENGE_NAME;
				const totalBosses = getTotalBossesForState(newState);
				historyStore.addOrUpdateRun(newState, challengeName, totalBosses);

				return newState;
			});
		},
		updateTeam: (team: ChallengeRunState['team']) => {
			update((state) => {
				if (!state) return state;
				const newState = {
					...state,
					team,
					updatedAt: new Date().toISOString()
				};
				storage.saveState(getChallengeKey(state.challengeId), newState);

				// Update history with accurate boss count based on DLC setting
				const challengeName = challengeNameCache[state.challengeId] || DEFAULT_CHALLENGE_NAME;
				const totalBosses = getTotalBossesForState(newState);
				historyStore.addOrUpdateRun(newState, challengeName, totalBosses);

				return newState;
			});
		},
		clear: (challengeId: string) => {
			const key = getChallengeKey(challengeId);
			storage.clearState(key);
			set(null);
		},
		reset: () => {
			set(null);
		}
	};
}

export const challengeStore = createChallengeStore();
