<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Badge color variants mapped to the global .badge-* classes. */
	const VARIANTS = {
		orange: 'badge-orange',
		cream: 'badge-cream',
		dark: 'badge-dark'
	} as const;

	type Variant = keyof typeof VARIANTS;

	let {
		variant = 'cream',
		class: className = '',
		children
	}: {
		variant?: Variant;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<span class={`badge ${VARIANTS[variant]} ${className}`.trim()}>{@render children()}</span>
