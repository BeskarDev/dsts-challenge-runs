<script lang="ts">
	import { themeStore } from '$lib/stores/theme';
	import { changeLanguage, getCurrentLanguage, type SupportedLanguage } from '$lib/i18n';
	import { onMount } from 'svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	let isDarkMode = $state(true);
	let isJapaneseNames = $state(false);

	onMount(() => {
		// Initialize dark mode state
		isDarkMode = themeStore.getEffectiveTheme() === 'dark';

		// Subscribe to theme changes
		const unsubscribe = themeStore.subscribe(() => {
			isDarkMode = themeStore.getEffectiveTheme() === 'dark';
		});

		// Initialize Japanese names state
		isJapaneseNames = getCurrentLanguage() === 'ja';

		return unsubscribe;
	});

	function handleDarkModeToggle() {
		isDarkMode = !isDarkMode;
		themeStore.set(isDarkMode ? 'dark' : 'light');
	}

	function handleJapaneseNamesToggle() {
		isJapaneseNames = !isJapaneseNames;
		const newLang: SupportedLanguage = isJapaneseNames ? 'ja' : 'en';
		changeLanguage(newLang);
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/30 z-40"
		onclick={handleBackdropClick}
	></div>

	<!-- Config Menu -->
	<div
		class="fixed top-16 right-4 z-50 w-72 rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-surface shadow-xl"
		role="dialog"
		aria-modal="true"
		aria-label="Settings"
	>
		<div class="p-4">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-gray-900 dark:text-muted-50">Settings</h2>
				<button
					onclick={onClose}
					class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-surface-100 transition-colors"
					aria-label="Close settings"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-gray-500 dark:text-muted"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="space-y-4">
				<!-- Dark Mode Toggle -->
				<div class="flex items-center justify-between">
					<label for="dark-mode-toggle" class="text-sm font-medium text-gray-700 dark:text-muted">
						Dark Mode
					</label>
					<button
						id="dark-mode-toggle"
						type="button"
						onclick={handleDarkModeToggle}
						class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 {isDarkMode
							? 'bg-primary-500'
							: 'bg-gray-200 dark:bg-surface-200'}"
						role="switch"
						aria-checked={isDarkMode}
						aria-label="Toggle dark mode"
					>
						<span
							class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {isDarkMode
								? 'translate-x-5'
								: 'translate-x-0'}"
						></span>
					</button>
				</div>

				<!-- Japanese Names Toggle -->
				<div class="flex items-center justify-between">
					<label
						for="japanese-names-toggle"
						class="text-sm font-medium text-gray-700 dark:text-muted"
					>
						Japanese Names
					</label>
					<button
						id="japanese-names-toggle"
						type="button"
						onclick={handleJapaneseNamesToggle}
						class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 {isJapaneseNames
							? 'bg-primary-500'
							: 'bg-gray-200 dark:bg-surface-200'}"
						role="switch"
						aria-checked={isJapaneseNames}
						aria-label="Toggle Japanese names"
					>
						<span
							class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {isJapaneseNames
								? 'translate-x-5'
								: 'translate-x-0'}"
						></span>
					</button>
				</div>

				<p class="text-xs text-gray-500 dark:text-muted-400 mt-2">
					When enabled, Digimon names and terms will use their Japanese equivalents.
				</p>
			</div>
		</div>
	</div>
{/if}
