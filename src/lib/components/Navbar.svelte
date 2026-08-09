<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';

	/** Landing-page navigation: brand, a CTA into the app, theme toggle. */
	let { transparent = false }: { transparent?: boolean } = $props();
</script>

<header class:transparent class="navbar">
	<a href="/" class="brand" aria-label="URLyze home">
		<span class="brand-mark" aria-hidden="true">◒</span>
		<span class="brand-name">URLyze</span>
	</a>

	<div class="navbar-actions">
		<ThemeToggle />
		<a href="/dashboard" class="btn btn-primary navbar-cta">Analyze a link</a>
	</div>
</header>

<style>
	.navbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md) var(--space-xxl);
		border-bottom: 1px solid var(--border-soft);
		background: var(--bg);
		position: relative;
		z-index: 20;
	}
	.navbar.transparent {
		background: transparent;
		border-bottom: none;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--text);
		text-decoration: none;
	}
	.brand-mark {
		font-size: 24px;
		line-height: 1;
		color: var(--accent);
	}
	.brand-name {
		font-family: var(--font-display);
		font-size: 24px;
		font-weight: 500;
		letter-spacing: -0.5px;
	}
	.navbar-actions {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.navbar-cta {
		display: none;
	}

	@media (min-width: 640px) {
		.navbar-cta {
			display: inline-flex;
		}
	}
</style>
