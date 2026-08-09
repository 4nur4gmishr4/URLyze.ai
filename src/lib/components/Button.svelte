<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Button variants mapped to the global .btn-* classes. */
	const VARIANTS = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		cream: 'btn-cream',
		dark: 'btn-dark',
		link: 'btn-link'
	} as const;

	type Variant = keyof typeof VARIANTS;

	let {
		variant = 'primary',
		type = 'button',
		href,
		block = false,
		disabled = false,
		ariaLabel,
		class: className = '',
		onclick,
		children
	}: {
		variant?: Variant;
		type?: 'button' | 'submit';
		href?: string;
		block?: boolean;
		disabled?: boolean;
		ariaLabel?: string;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();

	let classes = $derived(`btn ${VARIANTS[variant]} ${block ? 'btn-block' : ''} ${className}`.trim());
</script>

{#if href}
	<a {href} class={classes} aria-label={ariaLabel} class:disabled={disabled}>{@render children()}</a>
{:else}
	<button {type} {disabled} class={classes} aria-label={ariaLabel} {onclick}>
		{@render children()}
	</button>
{/if}
