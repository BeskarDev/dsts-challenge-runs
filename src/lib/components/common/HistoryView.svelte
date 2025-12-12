<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { historyStore } from '$lib/stores/history';
	import type { HistoricalRun } from '$lib/types/challenge';
	import Card from './Card.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	let history = $state<HistoricalRun[]>([]);
	let deletingRunId = $state<string | null>(null);

	onMount(() => {
		historyStore.load();
		const unsubscribe = historyStore.subscribe((value) => {
			history = value;
		});
		return unsubscribe;
	});

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

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function getStatusBadge(status: string): string {
		switch (status) {
			case 'completed':
				return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
			case 'active':
				return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
			case 'abandoned':
				return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
			default:
				return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
		}
	}

	function handleLoadRun(run: HistoricalRun) {
		// Navigate to challenge page with seed parameter
		const url = `${base}/challenge/${run.challengeId}?seed=${encodeURIComponent(run.seed)}`;
		window.location.href = url;
	}

	function handleDeleteRun(runId: string) {
		if (confirm('Are you sure you want to delete this challenge run from history?')) {
			try {
				deletingRunId = runId;
				historyStore.deleteRun(runId);
			} finally {
				deletingRunId = null;
			}
		}
	}

	// Sort history by most recent first
	let sortedHistory = $derived(
		[...history].sort((a, b) => 
			new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
		)
	);
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

	<!-- History View -->
	<div
		class="fixed inset-4 md:inset-8 z-50 rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-surface shadow-xl overflow-hidden flex flex-col"
		role="dialog"
		aria-modal="true"
		aria-label="Challenge Run History"
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-border">
			<h2 class="text-xl font-semibold text-gray-900 dark:text-muted-50">Challenge Run History</h2>
			<button
				onclick={onClose}
				class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-surface-100 transition-colors"
				aria-label="Close history"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-gray-500 dark:text-muted"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-4">
			{#if sortedHistory.length === 0}
				<div class="text-center py-12">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-16 w-16 mx-auto text-gray-400 dark:text-muted-400 mb-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<p class="text-gray-600 dark:text-muted-400 text-lg">No challenge runs yet</p>
					<p class="text-gray-500 dark:text-muted-500 text-sm mt-2">
						Start a challenge run to see it appear here!
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each sortedHistory as run (run.id)}
						<Card>
							<div class="space-y-3">
								<!-- Header Row -->
								<div class="flex items-start justify-between">
									<div>
										<h3 class="text-lg font-semibold text-gray-900 dark:text-muted-50">
											{run.challengeName}
										</h3>
										<p class="text-sm text-gray-600 dark:text-muted-400 mt-1">
											Seed: <span class="font-mono">{run.seed}</span>
										</p>
									</div>
									<span class="px-3 py-1 rounded-full text-xs font-medium {getStatusBadge(run.status)}">
										{run.status.charAt(0).toUpperCase() + run.status.slice(1)}
									</span>
								</div>

								<!-- Progress -->
								<div class="space-y-2">
									<div class="flex items-center justify-between text-sm">
										<span class="text-gray-700 dark:text-muted-300">Progress</span>
										<span class="font-semibold text-gray-900 dark:text-muted-100">
											{run.progress.currentBossOrder} / {run.progress.totalBosses} Bosses
										</span>
									</div>
									<div class="w-full bg-gray-200 dark:bg-surface-200 rounded-full h-2">
										<div
											class="bg-primary-500 h-2 rounded-full transition-all"
											style="width: {(run.progress.currentBossOrder / run.progress.totalBosses) * 100}%"
										></div>
									</div>
								</div>

								<!-- Metadata Grid -->
								<div class="grid grid-cols-2 gap-3 pt-2">
									<div class="text-sm">
										<span class="text-gray-600 dark:text-muted-400">Generation:</span>
										<span class="ml-2 font-medium text-gray-900 dark:text-muted-100">
											{run.progress.currentGeneration}
										</span>
									</div>
									<div class="text-sm">
										<span class="text-gray-600 dark:text-muted-400">Team Size:</span>
										<span class="ml-2 font-medium text-gray-900 dark:text-muted-100">
											{run.metadata.teamSize}
										</span>
									</div>
									<div class="text-sm">
										<span class="text-gray-600 dark:text-muted-400">Total Rerolls:</span>
										<span class="ml-2 font-medium text-gray-900 dark:text-muted-100">
											{run.metadata.totalRerolls}
										</span>
									</div>
									<div class="text-sm">
										<span class="text-gray-600 dark:text-muted-400">Last Updated:</span>
										<span class="ml-2 font-medium text-gray-900 dark:text-muted-100">
											{formatDate(run.lastUpdatedAt)}
										</span>
									</div>
								</div>

								<!-- Timestamps -->
								<div class="pt-2 border-t border-gray-200 dark:border-border text-xs text-gray-500 dark:text-muted-500">
									<div>Started: {formatDate(run.startedAt)}</div>
									{#if run.completedAt}
										<div>Completed: {formatDate(run.completedAt)}</div>
									{/if}
								</div>

								<!-- Actions -->
								<div class="flex gap-2 pt-3 border-t border-gray-200 dark:border-border">
									<button
										onclick={() => handleLoadRun(run)}
										disabled={deletingRunId === run.id}
										class="flex-1 px-4 py-2 rounded-full border border-primary-500 bg-transparent hover:bg-primary-500/10 text-primary-500 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
										aria-label="Load run"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4 mr-2"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
										</svg>
										Load Run
									</button>
									<button
										onclick={() => handleDeleteRun(run.id)}
										disabled={deletingRunId === run.id}
										class="px-3 py-2 rounded-md border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										aria-label="Delete run"
										title="Delete run"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
