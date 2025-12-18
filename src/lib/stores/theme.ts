import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../services/storage-keys';

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = STORAGE_KEYS.THEME;

function getInitialTheme(): Theme {
	if (!browser) return 'dark';

	const stored = storage.loadState<Theme>(THEME_KEY);
	if (stored && ['light', 'dark', 'system'].includes(stored)) {
		return stored;
	}
	// Default to dark mode when no preference is stored
	return 'dark';
}

function getSystemPreference(): 'light' | 'dark' {
	if (!browser) return 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
	if (!browser) return;

	const effectiveTheme = theme === 'system' ? getSystemPreference() : theme;

	if (effectiveTheme === 'dark') {
		document.documentElement.classList.add('dark');
	} else {
		document.documentElement.classList.remove('dark');
	}
}

function createThemeStore() {
	const initialTheme = getInitialTheme();
	const { subscribe, set } = writable<Theme>(initialTheme);

	// Apply initial theme
	if (browser) {
		applyTheme(initialTheme);

		// Ensure the initial theme is persisted to localStorage
		// This handles the case where getInitialTheme() loaded from storage
		// or returned the default
		storage.saveState(THEME_KEY, initialTheme);

		// Listen for system preference changes
		// Note: This listener persists for the app lifetime since the store is a singleton.
		// No cleanup is needed as the store is never destroyed during the app's lifecycle.
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', () => {
			const currentTheme = storage.loadState<Theme>(THEME_KEY);
			if (currentTheme === 'system' || !currentTheme) {
				applyTheme('system');
			}
		});
	}

	return {
		subscribe,
		set: (theme: Theme) => {
			if (browser) {
				storage.saveState(THEME_KEY, theme);
				applyTheme(theme);
			}
			set(theme);
		},
		toggle: () => {
			if (!browser) return;

			const current = storage.loadState<Theme>(THEME_KEY);
			const effectiveCurrent = current === 'system' || !current ? getSystemPreference() : current;
			const next = effectiveCurrent === 'dark' ? 'light' : 'dark';

			storage.saveState(THEME_KEY, next);
			applyTheme(next);
			set(next);
		},
		getEffectiveTheme: (): 'light' | 'dark' => {
			const current = browser ? storage.loadState<Theme>(THEME_KEY) : 'dark';
			if (current === 'system') {
				return getSystemPreference();
			}
			// Default to dark mode when no preference is stored
			return current || 'dark';
		}
	};
}

export const themeStore = createThemeStore();
