<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Friendly empty state for lists that have nothing to show yet. */
	let {
		icon = '📄',
		title,
		description,
		class: className = '',
		action
	}: {
		icon?: string;
		title: string;
		description: string;
		class?: string;
		action?: Snippet;
	} = $props();
</script>

<div class={`empty-state ${className}`}>
	<div class="empty-icon" aria-hidden="true">{icon}</div>
	<h3 class="heading-5 empty-title">{title}</h3>
	<p class="body-sm empty-desc">{description}</p>
	{#if action}<div class="empty-action">{@render action()}</div>{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--space-sm);
		padding: var(--space-xxl);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		background: var(--surface-2);
	}
	.empty-icon {
		font-size: 32px;
		line-height: 1;
	}
	.empty-title {
		color: var(--text);
	}
	.empty-desc {
		color: var(--text-secondary);
		max-width: 40ch;
	}
	.empty-action {
		margin-top: var(--space-xs);
	}
</style>
