import { writable } from 'svelte/store';
import type { ChallengeRunState } from '../types/challenge';
import { storage } from '../services/storage';
import { historyStore } from './history';

function getChallengeKey(challengeId: string): string {
	return `dsts:challenge:${challengeId}`;
}

// Helper to get total bosses for a challenge - this needs to be set externally
const DEFAULT_CHALLENGE_NAME = 'Challenge Run';
const DEFAULT_TOTAL_BOSSES = 1;
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

			set(state);
		},
		hasExistingState: (challengeId: string): boolean => {
			const key = getChallengeKey(challengeId);
			return storage.loadState<ChallengeRunState>(key) !== null;
		},
		save: (state: ChallengeRunState) => {
			const key = getChallengeKey(state.challengeId);
			storage.saveState(key, state);
			set(state);

			// Update history
			const challengeName = challengeNameCache[state.challengeId] || DEFAULT_CHALLENGE_NAME;
			const totalBosses = totalBossesCache[state.challengeId] || DEFAULT_TOTAL_BOSSES;
			historyStore.addOrUpdateRun(state, challengeName, totalBosses);
		},
		update: (updater: (state: ChallengeRunState | null) => ChallengeRunState | null) => {
			update((state) => {
				const newState = updater(state);
				if (newState) {
					const key = getChallengeKey(newState.challengeId);
					storage.saveState(key, newState);

					// Update history
					const challengeName = challengeNameCache[newState.challengeId] || DEFAULT_CHALLENGE_NAME;
					const totalBosses = totalBossesCache[newState.challengeId] || DEFAULT_TOTAL_BOSSES;
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

				// Update history
				const challengeName = challengeNameCache[state.challengeId] || DEFAULT_CHALLENGE_NAME;
				const totalBosses = totalBossesCache[state.challengeId] || DEFAULT_TOTAL_BOSSES;
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

				// Update history
				const challengeName = challengeNameCache[state.challengeId] || DEFAULT_CHALLENGE_NAME;
				const totalBosses = totalBossesCache[state.challengeId] || DEFAULT_TOTAL_BOSSES;
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
