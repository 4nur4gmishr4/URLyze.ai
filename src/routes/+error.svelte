<script lang="ts">
	import { page } from '$app/state';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	/** Global error page — shows the status and a safe message, never internals. */
</script>

<div class="site">
	<Navbar user={null} />
	<main class="main">
		<div class="error-box">
			<span class="code">{page.status}</span>
			<h1 class="title">Something went wrong</h1>
			<p class="message">{page.error?.message ?? 'That page could not be loaded.'}</p>
			<a class="btn btn-primary" href="/">Back to start</a>
		</div>
	</main>
	<Footer />
</div>

<style>
	.site {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	.main {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xxl) var(--space-md);
	}
	.error-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--space-sm);
		max-width: 420px;
	}
	.code {
		font-size: 72px;
		font-weight: 600;
		color: var(--accent);
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.title {
		margin: 0;
		font-family: var(--font-display);
		font-size: 26px;
		font-weight: 500;
	}
	.message {
		margin: 0 0 var(--space-md);
		font-size: 15px;
		color: var(--text-secondary);
	}
</style>
