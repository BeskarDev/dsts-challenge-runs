<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/common/Header.svelte';
	import '$lib/stores/theme'; // Import to initialize theme on load
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';

	let { children } = $props();

	// Derive page title from current route
	const pageTitle = derived(page, ($page) => {
		const path = $page.url.pathname;
		const basePath = $page.url.pathname.replace(/^\/[^/]+/, ''); // Remove base path if present
		
		if (basePath === '/' || path === '/') {
			return 'DSTS Challenge Runs';
		} else if (basePath.includes('/about') || path.includes('/about')) {
			return 'About - DSTS Challenge Runs';
		} else if (basePath.includes('/challenge/') || path.includes('/challenge/')) {
			return 'Challenge - DSTS Challenge Runs';
		}
		return 'DSTS Challenge Runs';
	});

</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{$pageTitle}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-surface-500 flex flex-col transition-colors">
	<Header />
	<main class="flex-1 container mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>
