<script lang="ts">
	import Logo from './Logo.svelte';

	/** Site footer: brand, product links, legal links, and a closing note. */

	const year = new Date().getFullYear();
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
		</div>

		<nav class="footer-col" aria-label="Product links">
			<h3 class="col-title">Product</h3>
			<a href="/#how">How it works</a>
			<a href="/dashboard">Start analyzing</a>
			<a href="/history">Your history</a>
		</nav>

		<nav class="footer-col" aria-label="Legal links">
			<h3 class="col-title">Legal</h3>
			<a href="/privacy">Privacy</a>
			<a href="/terms">Terms</a>
		</nav>

		<div class="footer-note">
			<p class="caption">© {year} URLyze. Built for people who read a lot.</p>
		</div>
	</div>
</footer>

<style>
	.footer {
		margin-top: auto;
	}
	.footer-inner {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: var(--space-lg);
		padding-block: var(--space-xxl);
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
	.footer-note {
		grid-column: 1 / -1;
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border-soft);
	}
	.footer-note .caption {
		color: var(--text-faint);
	}

	@media (max-width: 700px) {
		.footer-inner {
			grid-template-columns: 1fr 1fr;
		}
		.footer-brand {
			grid-column: 1 / -1;
		}
	}
</style>
