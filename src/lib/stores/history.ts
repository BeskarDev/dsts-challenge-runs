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
				},
				fullState: state // Save the full state for restoration
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
		},
		deleteRun: (runId: string) => {
			// Get the run to be deleted so we can clear its challenge state
			const history = storage.getHistory<HistoricalRun>();
			const runToDelete = history.find(run => run.id === runId);
			
			// Delete from history
			storage.deleteHistoryItem<HistoricalRun>(runId);
			
			// Also clear the associated challenge state if this was the last run for that challenge
			if (runToDelete) {
				const remainingRuns = history.filter(run => run.id !== runId && run.challengeId === runToDelete.challengeId);
				// If no more runs exist for this challenge, clear its state
				if (remainingRuns.length === 0) {
					storage.clearState(`dsts:challenge:${runToDelete.challengeId}`);
				}
			}
			
			// Reload the store
			const updatedHistory = storage.getHistory<HistoricalRun>();
			set(updatedHistory);
		},
		getRunBySeed: (challengeId: string, seed: string): HistoricalRun | null => {
			const history = storage.getHistory<HistoricalRun>();
			return history.find(run => run.challengeId === challengeId && run.seed === seed) || null;
		}
	};
}

export const historyStore = createHistoryStore();
