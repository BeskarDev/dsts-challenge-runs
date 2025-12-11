<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow {className}">
	{#if children}
		{@render children()}
	{/if}
</div>
