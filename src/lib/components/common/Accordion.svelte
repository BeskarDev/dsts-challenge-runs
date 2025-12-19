<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		isOpen?: boolean;
		children?: Snippet;
	}

	/* eslint-disable svelte/prefer-writable-derived */
	let { title, isOpen = false, children }: Props = $props();

	let open = $state(false);

	$effect(() => {
		open = isOpen;
	});

	function toggle() {
		open = !open;
	}
</script>

<div
	class="border border-gray-200 dark:border-border rounded-lg overflow-hidden transition-all duration-200"
>
	<button
		onclick={toggle}
		class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-surface-100 hover:bg-gray-100 dark:hover:bg-surface-50 transition-colors duration-150 text-left"
	>
		<h3 class="text-lg font-semibold text-gray-900 dark:text-muted-50">
			{title}
		</h3>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 text-gray-500 dark:text-muted transition-transform duration-200 {open
				? 'rotate-180'
				: ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>
	{#if open}
		<div class="px-4 py-3 bg-white dark:bg-[rgba(15,24,52,0.92)] animate-fade-in">
			{#if children}
				{@render children()}
			{/if}
		</div>
	{/if}
</div>
