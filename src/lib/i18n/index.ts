import i18next from 'i18next';
import { createI18nStore } from 'svelte-i18next';
import { browser } from '$app/environment';
import translations from './translations.json';

const LANGUAGE_KEY = 'dsts:language';

export type SupportedLanguage = 'en' | 'ja';

/**
 * Get the stored language preference from localStorage
 */
function getStoredLanguage(): SupportedLanguage {
	if (!browser) return 'en';
	const stored = localStorage.getItem(LANGUAGE_KEY);
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
		localStorage.setItem(LANGUAGE_KEY, language);
	}
}

/**
 * Check if Japanese names mode is enabled
 */
export function isJapaneseNamesEnabled(): boolean {
	return getStoredLanguage() === 'ja';
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
 * Translate a term using the current language setting.
 * For English, returns the original term.
 * For Japanese, returns the mapped Japanese term if available, otherwise the original.
 */
export function translateTerm(term: string): string {
	const currentLang = i18next.language;
	if (currentLang === 'en') {
		return term;
	}
	// For Japanese, check if there's a translation, otherwise return original
	const translated = i18next.t(term);
	// If the translation equals the key, it means no translation was found
	return translated;
}

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
