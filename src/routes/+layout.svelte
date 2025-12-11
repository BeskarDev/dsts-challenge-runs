<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/common/Header.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>DSTS Challenge Runs</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col">
	<Header />
	<main class="flex-1 container mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>
