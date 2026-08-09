<script lang="ts">
	import Logo from './Logo.svelte';

	/** Site footer: brand, product links, output overview, legal links, and a closing bar. */

	const year = new Date().getFullYear();

	const outputs = [
		{ label: 'Executive sketch', detail: 'The big picture in a fast read.' },
		{ label: 'Study notes', detail: 'Key ideas laid out for real learning.' },
		{ label: 'Slide outline', detail: 'A deck-ready structure to present.' }
	];
</script>

<footer class="footer">
	<div class="sunset-stripe" aria-hidden="true"></div>
	<div class="footer-inner container">
		<div class="footer-brand">
			<a href="/" class="brand" aria-label="URLyze home">
				<Logo size={28} />
				<span class="brand-name">URLyze</span>
			</a>
			<p class="caption">
				Paste a link, get an executive sketch, study notes, and a slide outline in seconds.
			</p>
			<p class="caption tagline">
				Free to use. No account needed. Your history stays on this browser.
			</p>
		</div>

		<nav class="footer-col" aria-label="Product links">
			<h3 class="col-title">Product</h3>
			<a href="/#how">How it works</a>
			<a href="/dashboard">Start analyzing</a>
			<a href="/history">Your history</a>
			<a href="/settings">Settings</a>
		</nav>

		<div class="footer-col" aria-label="What you get">
			<h3 class="col-title">What you get</h3>
			{#each outputs as out (out.label)}
				<span class="output-item">
					<span class="output-label">{out.label}</span>
					<span class="output-detail">{out.detail}</span>
				</span>
			{/each}
		</div>

		<nav class="footer-col" aria-label="Legal links">
			<h3 class="col-title">Legal</h3>
			<a href="/privacy">Privacy</a>
			<a href="/terms">Terms</a>
		</nav>
	</div>

	<div class="footer-bottom container">
		<p class="caption">© {year} URLyze. Built for people who read a lot.</p>
		<p class="caption stack">SvelteKit · Postgres · AI</p>
	</div>
</footer>

<style>
	.footer {
		margin-top: auto;
	}
	.footer-inner {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: var(--space-lg);
		padding-top: var(--space-xxl);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--text);
		text-decoration: none;
		width: fit-content;
	}
	.brand-name {
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 600;
		letter-spacing: -0.4px;
	}
	.footer-brand p {
		max-width: 300px;
		margin-top: var(--space-sm);
		line-height: 1.6;
	}
	.footer-brand .tagline {
		font-size: 12px;
		color: var(--text-faint);
	}
	.footer-col {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.col-title {
		margin: 0 0 var(--space-xs);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-faint);
	}
	.footer-col a {
		color: var(--text-secondary);
		font-size: 14px;
		text-decoration: none;
		width: fit-content;
	}
	.footer-col a:hover {
		color: var(--accent);
		text-decoration: underline;
	}
	.output-item {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.output-label {
		font-size: 14px;
		color: var(--text-secondary);
	}
	.output-detail {
		font-size: 12px;
		color: var(--text-faint);
	}
	.footer-bottom {
		display: flex;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-top: var(--space-lg);
		padding-block: var(--space-md);
		border-top: 1px solid var(--border-soft);
	}
	.footer-bottom .caption {
		color: var(--text-faint);
	}
	.footer-bottom .stack {
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 700px) {
		.footer-inner {
			grid-template-columns: 1fr 1fr;
		}
		.footer-brand {
			grid-column: 1 / -1;
		}
		.footer-bottom {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
