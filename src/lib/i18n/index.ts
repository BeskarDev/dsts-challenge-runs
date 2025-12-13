import i18next from 'i18next';
import { createI18nStore } from 'svelte-i18next';
import { browser } from '$app/environment';
import translations from './translations.json';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../services/storage-keys';

const LANGUAGE_KEY = STORAGE_KEYS.LANGUAGE;

export type SupportedLanguage = 'en' | 'ja';

/**
 * Get the stored language preference from localStorage
 */
function getStoredLanguage(): SupportedLanguage {
	if (!browser) return 'en';
	const stored = storage.loadState<SupportedLanguage>(LANGUAGE_KEY);
	if (stored === 'ja' || stored === 'en') {
		return stored;
	}
	return 'en';
}

/**
 * Save language preference to localStorage
 */
export function setStoredLanguage(language: SupportedLanguage): void {
	if (browser) {
		storage.saveState(LANGUAGE_KEY, language);
	}
}

// Initialize i18next
i18next.init({
	lng: getStoredLanguage(),
	fallbackLng: 'en',
	resources: {
		en: {
			translation: translations.en
		},
		ja: {
			translation: translations.ja
		}
	},
	interpolation: {
		escapeValue: false
	},
	// Return the key if translation is not found (for English passthrough)
	returnNull: false,
	returnEmptyString: false
});

// Create the svelte-i18next store
export const i18n = createI18nStore(i18next);

/**
 * Change the current language
 */
export function changeLanguage(language: SupportedLanguage): void {
	i18next.changeLanguage(language);
	setStoredLanguage(language);
}

/**
 * Get the current language
 */
export function getCurrentLanguage(): SupportedLanguage {
	return i18next.language as SupportedLanguage;
}

export { i18next };
