import { writable } from 'svelte/store';
import type { HistoricalRun, ChallengeRunState } from '../types/challenge';
import { storage } from '../services/storage';

function createHistoryStore() {
	const { subscribe, set } = writable<HistoricalRun[]>([]);

	return {
		subscribe,
		load: () => {
			const history = storage.getHistory<HistoricalRun>();
			set(history);
		},
		addOrUpdateRun: (state: ChallengeRunState, challengeName: string, totalBosses: number) => {
			const history = storage.getHistory<HistoricalRun>();
			
			// Check if this run already exists in history
			const existingIndex = history.findIndex(
				run => run.challengeId === state.challengeId && run.seed === state.seed
			);

			const historicalRun: HistoricalRun = {
				id: existingIndex >= 0 ? history[existingIndex].id : `${state.challengeId}-${state.seed}-${Date.now()}`,
				challengeId: state.challengeId,
				challengeName,
				seed: state.seed,
				startedAt: existingIndex >= 0 ? history[existingIndex].startedAt : state.createdAt,
				lastUpdatedAt: state.updatedAt,
				completedAt: state.currentBossOrder >= totalBosses ? state.updatedAt : undefined,
				status: state.currentBossOrder >= totalBosses ? 'completed' : 'active',
				progress: {
					currentBossOrder: state.currentBossOrder,
					totalBosses,
					currentGeneration: state.currentGeneration
				},
				metadata: {
					totalRerolls: state.rerollHistory.length,
					teamSize: state.team.length
				}
			};

			if (existingIndex >= 0) {
				// Update existing run
				storage.updateHistoryItem(historicalRun);
			} else {
				// Add new run
				storage.saveToHistory(historicalRun);
			}

			// Reload the store
			const updatedHistory = storage.getHistory<HistoricalRun>();
			set(updatedHistory);
		},
		clear: () => {
			storage.clearHistory();
			set([]);
		}
	};
}

export const historyStore = createHistoryStore();
