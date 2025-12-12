import { writable } from 'svelte/store';
import type { ChallengeRunState } from '../types/challenge';
import { storage } from '../services/storage';

function getChallengeKey(challengeId: string): string {
	return `dsts:challenge:${challengeId}`;
}

function createChallengeStore() {
	const { subscribe, set, update } = writable<ChallengeRunState | null>(null);

	return {
		subscribe,
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
		},
		update: (updater: (state: ChallengeRunState | null) => ChallengeRunState | null) => {
			update((state) => {
				const newState = updater(state);
				if (newState) {
					const key = getChallengeKey(newState.challengeId);
					storage.saveState(key, newState);
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
