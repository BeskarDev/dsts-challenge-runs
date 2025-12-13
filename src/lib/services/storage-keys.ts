/**
 * Storage Keys Registry
 *
 * Central registry for all localStorage keys used in the application.
 * This helps maintain consistency and track all storage usage.
 */

/**
 * All localStorage keys used by the application
 */
export const STORAGE_KEYS = {
	APP: 'dsts:app',
	THEME: 'dsts:theme',
	LANGUAGE: 'dsts:language',
	HISTORY: 'dsts:history'
	// Future keys should be added here
} as const;

/**
 * Type-safe key accessor
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Check if a key is a valid storage key
 */
export function isValidStorageKey(key: string): key is StorageKey {
	return Object.values(STORAGE_KEYS).includes(key as StorageKey);
}
