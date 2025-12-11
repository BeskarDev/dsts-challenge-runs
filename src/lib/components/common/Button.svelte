<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
		variant?: 'primary' | 'secondary' | 'outline';
		class?: string;
		disabled?: boolean;
		onclick?: () => void;
	}

	let { 
		children, 
		variant = 'primary', 
		class: className = '',
		disabled = false,
		onclick
	}: Props = $props();

	const variantClasses = {
		primary: 'bg-primary-600 hover:bg-primary-700 text-white',
		secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
		outline: 'bg-white hover:bg-gray-50 text-primary-600 border-2 border-primary-600'
	};
</script>

<button
	class="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed {variantClasses[variant]} {className}"
	{disabled}
	{onclick}
>
	{#if children}
		{@render children()}
	{/if}
</button>
