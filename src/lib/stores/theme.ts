import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'dsts:theme';

function getInitialTheme(): Theme {
	if (!browser) return 'system';

	const stored = localStorage.getItem(THEME_KEY) as Theme | null;
	if (stored && ['light', 'dark', 'system'].includes(stored)) {
		return stored;
	}
	return 'system';
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

		// Listen for system preference changes
		// Note: This listener persists for the app lifetime since the store is a singleton.
		// No cleanup is needed as the store is never destroyed during the app's lifecycle.
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', () => {
			const currentTheme = localStorage.getItem(THEME_KEY) as Theme | null;
			if (currentTheme === 'system' || !currentTheme) {
				applyTheme('system');
			}
		});
	}

	return {
		subscribe,
		set: (theme: Theme) => {
			if (browser) {
				localStorage.setItem(THEME_KEY, theme);
				applyTheme(theme);
			}
			set(theme);
		},
		toggle: () => {
			if (!browser) return;

			const current = localStorage.getItem(THEME_KEY) as Theme | null;
			const effectiveCurrent =
				current === 'system' || !current ? getSystemPreference() : current;
			const next = effectiveCurrent === 'dark' ? 'light' : 'dark';

			localStorage.setItem(THEME_KEY, next);
			applyTheme(next);
			set(next);
		},
		getEffectiveTheme: (): 'light' | 'dark' => {
			const current = browser
				? (localStorage.getItem(THEME_KEY) as Theme | null)
				: 'system';
			return current === 'system' || !current ? getSystemPreference() : current;
		}
	};
}

export const themeStore = createThemeStore();
