export class StorageService {
	private isClient = typeof window !== 'undefined';

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
}

export const storage = new StorageService();
