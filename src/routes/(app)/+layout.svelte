<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import Navbar from '$lib/components/Navbar.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="app">
	<Navbar user={data.user} />
	<main id="main-content" class="content">{@render children()}</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
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
		.content {
			padding: var(--space-md);
		}
	}
</style>
