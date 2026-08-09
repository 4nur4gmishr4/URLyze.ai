<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="app">
	<Sidebar user={data.user} />
	<main id="main-content" class="content">{@render children()}</main>
</div>

<style>
	.app {
		display: flex;
		align-items: stretch;
		min-height: 100vh;
	}
	.content {
		flex: 1;
		min-width: 0;
		padding: var(--space-lg) var(--space-xl) var(--space-xxl);
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 768px) {
		.app {
			flex-direction: column;
		}
		.content {
			padding: var(--space-md);
		}
	}
</style>
