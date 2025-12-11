import { writable } from 'svelte/store';
import type { AppState } from '../types/challenge';
import { storage } from '../services/storage';

const APP_STATE_KEY = 'dsts:app';

const defaultAppState: AppState = {
	version: '1.0.0',
	preferences: {}
};

function createAppStore() {
	// Load initial state from localStorage
	const initialState = storage.loadState<AppState>(APP_STATE_KEY) || defaultAppState;
	
	const { subscribe, set, update } = writable<AppState>(initialState);

	return {
		subscribe,
		set: (state: AppState) => {
			storage.saveState(APP_STATE_KEY, state);
			set(state);
		},
		update: (updater: (state: AppState) => AppState) => {
			update((state) => {
				const newState = updater(state);
				storage.saveState(APP_STATE_KEY, newState);
				return newState;
			});
		},
		setLastVisitedChallenge: (challengeId: string) => {
			update((state) => {
				const newState = { ...state, lastVisitedChallenge: challengeId };
				storage.saveState(APP_STATE_KEY, newState);
				return newState;
			});
		},
		reset: () => {
			storage.clearState(APP_STATE_KEY);
			set(defaultAppState);
		}
	};
}

export const appStore = createAppStore();
