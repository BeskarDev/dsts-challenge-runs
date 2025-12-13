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
		primary:
			'bg-primary-500 hover:bg-primary-600 active:scale-95 text-white dark:text-surface-500 rounded-full shadow-[0_4px_12px_rgba(46,195,246,0.3)] hover:shadow-[0_6px_16px_rgba(46,195,246,0.4)] hover:-translate-y-0.5',
		secondary:
			'bg-secondary-400 hover:bg-secondary-500 active:scale-95 text-surface-500 rounded-full shadow-[0_4px_12px_rgba(64,224,208,0.3)] hover:shadow-[0_6px_16px_rgba(64,224,208,0.4)] hover:-translate-y-0.5',
		outline:
			'bg-transparent hover:bg-primary-500/10 active:scale-95 text-primary-500 border border-primary-500 rounded-full hover:-translate-y-0.5'
	};
</script>

<button
	class="px-4 py-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 {variantClasses[variant]} {className}"
	{disabled}
	{onclick}
>
	{#if children}
		{@render children()}
	{/if}
</button>
