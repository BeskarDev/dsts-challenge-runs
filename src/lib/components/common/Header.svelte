<script lang="ts">
	import { base } from '$app/paths';
	import ConfigMenu from './ConfigMenu.svelte';
	import HistoryView from './HistoryView.svelte';

	let isConfigMenuOpen = $state(false);
	let isHistoryViewOpen = $state(false);

	function toggleConfigMenu() {
		isConfigMenuOpen = !isConfigMenuOpen;
	}

	function closeConfigMenu() {
		isConfigMenuOpen = false;
	}

	function toggleHistoryView() {
		isHistoryViewOpen = !isHistoryViewOpen;
	}

	function closeHistoryView() {
		isHistoryViewOpen = false;
	}
</script>

<header
	class="sticky top-0 z-40 bg-surface-100 dark:bg-surface border-b border-gray-200 dark:border-border shadow-lg transition-colors"
>
	<div class="container mx-auto px-3 py-3">
		<div class="flex items-center justify-between">
			<a
				href="{base}/"
				class="flex items-center gap-3 text-2xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors"
			>
				<img src="{base}/logo.png" alt="Digital Challenge Companion Logo" class="h-10 w-10" />
			</a>
			<nav class="flex items-center gap-6">
				<ul class="flex gap-6">
					<li>
						<a
							href="{base}/"
							class="text-gray-900 dark:text-muted hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
						>
							Home
						</a>
					</li>
					<li>
						<a
							href="{base}/about"
							class="text-gray-900 dark:text-muted hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
						>
							About
						</a>
					</li>
				</ul>
				<div class="flex items-center gap-2">
					<!-- History button -->
					<button
						onclick={toggleHistoryView}
						class="p-2 rounded-md border border-gray-200 dark:border-border bg-surface-50 dark:bg-surface-100 hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
						aria-label="View challenge history"
						title="Challenge History"
						aria-expanded={isHistoryViewOpen}
					>
						<!-- History/Document icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-primary-600 dark:text-primary-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</button>
					<!-- Settings button -->
					<button
						onclick={toggleConfigMenu}
						class="p-2 rounded-md border border-gray-200 dark:border-border bg-surface-50 dark:bg-surface-100 hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
						aria-label="Open settings"
						title="Settings"
						aria-expanded={isConfigMenuOpen}
					>
						<!-- Cog/Settings icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-primary-600 dark:text-primary-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</button>
				</div>
			</nav>
		</div>
	</div>
</header>

<ConfigMenu isOpen={isConfigMenuOpen} onClose={closeConfigMenu} />
<HistoryView isOpen={isHistoryViewOpen} onClose={closeHistoryView} />
