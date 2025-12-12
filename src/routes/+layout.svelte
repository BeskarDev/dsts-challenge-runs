<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/common/Header.svelte';
	import '$lib/stores/theme'; // Import to initialize theme on load

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>DSTS Challenge Runs</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-surface-500 flex flex-col transition-colors">
	<Header />
	<main class="flex-1 container mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>
