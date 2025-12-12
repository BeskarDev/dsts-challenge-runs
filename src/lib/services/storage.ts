export class StorageService {
	private isClient = typeof window !== 'undefined';
	private readonly HISTORY_KEY = 'dsts:history';

	saveState<T>(key: string, state: T): void {
		if (!this.isClient) return;
		try {
			const serialized = JSON.stringify(state);
			localStorage.setItem(key, serialized);
		} catch (error) {
			console.error(`Failed to save state for key "${key}":`, error);
		}
	}

	loadState<T>(key: string): T | null {
		if (!this.isClient) return null;
		try {
			const serialized = localStorage.getItem(key);
			if (serialized === null) return null;
			return JSON.parse(serialized) as T;
		} catch (error) {
			console.error(`Failed to load state for key "${key}":`, error);
			return null;
		}
	}

	clearState(key: string): void {
		if (!this.isClient) return;
		try {
			localStorage.removeItem(key);
		} catch (error) {
			console.error(`Failed to clear state for key "${key}":`, error);
		}
	}

	// Historical runs management
	getHistory<T>(): T[] {
		if (!this.isClient) return [];
		try {
			const serialized = localStorage.getItem(this.HISTORY_KEY);
			if (serialized === null) return [];
			return JSON.parse(serialized) as T[];
		} catch (error) {
			console.error('Failed to load history:', error);
			return [];
		}
	}

	saveToHistory<T>(item: T): void {
		if (!this.isClient) return;
		try {
			const history = this.getHistory<T>();
			history.push(item);
			const serialized = JSON.stringify(history);
			localStorage.setItem(this.HISTORY_KEY, serialized);
		} catch (error) {
			console.error('Failed to save to history:', error);
		}
	}

	updateHistoryItem<T extends { id: string }>(updatedItem: T): void {
		if (!this.isClient) return;
		try {
			const history = this.getHistory<T>();
			const index = history.findIndex(item => item.id === updatedItem.id);
			if (index !== -1) {
				history[index] = updatedItem;
				const serialized = JSON.stringify(history);
				localStorage.setItem(this.HISTORY_KEY, serialized);
			}
		} catch (error) {
			console.error('Failed to update history item:', error);
		}
	}

	clearHistory(): void {
		if (!this.isClient) return;
		try {
			localStorage.removeItem(this.HISTORY_KEY);
		} catch (error) {
			console.error('Failed to clear history:', error);
		}
	}

	deleteHistoryItem<T extends { id: string }>(itemId: string): void {
		if (!this.isClient) return;
		try {
			const history = this.getHistory<T>();
			const filtered = history.filter(item => item.id !== itemId);
			const serialized = JSON.stringify(filtered);
			localStorage.setItem(this.HISTORY_KEY, serialized);
		} catch (error) {
			console.error('Failed to delete history item:', error);
		}
	}
}

export const storage = new StorageService();
