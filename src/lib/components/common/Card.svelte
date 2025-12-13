<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
		class?: string;
		animate?: boolean;
	}

	let { children, class: className = '', animate = false }: Props = $props();
</script>

<div
	class="rounded-md border border-gray-200 dark:border-border bg-white dark:bg-[rgba(8,14,32,0.80)] backdrop-blur-sm p-6 shadow-panel-light dark:shadow-panel hover:shadow-lg dark:hover:shadow-[0_22px_45px_rgba(0,0,0,0.80)] transition-all duration-200 {animate ? 'animate-scale-in' : ''} {className}"
>
	{#if children}
		{@render children()}
	{/if}
</div>
