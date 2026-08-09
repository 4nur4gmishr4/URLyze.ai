<script lang="ts">
	/** Lines of skeleton to render (each ~varies in width). */
	let {
		lines = 3,
		class: className = ''
	}: { lines?: number; class?: string } = $props();

	const widths = [92, 100, 78, 88, 60];
</script>

<div class={`skeleton-block ${className}`} aria-hidden="true">
	{#each Array(lines) as _, i}
		<div class="skeleton skeleton-line" style:width="{widths[i % widths.length]}%"></div>
	{/each}
</div>

<style>
	.skeleton-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-lg) 0;
	}
	.skeleton-line {
		height: 14px;
	}
</style>
