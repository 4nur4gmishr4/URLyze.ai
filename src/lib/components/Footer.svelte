<script lang="ts">
	/** Site footer with the signature sunset stripe and legal links. */
	const year = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="sunset-stripe" aria-hidden="true"></div>
	<div class="footer-inner container">
		<div class="footer-brand">
			<span class="brand-mark" aria-hidden="true">◒</span>
			<span class="brand-name">URLyze</span>
			<p class="caption">One URL → executive sketch, study notes, slide outline.</p>
		</div>

		<nav class="footer-links" aria-label="Footer">
			<a href="/privacy">Privacy</a>
			<a href="/terms">Terms</a>
			<a href="/history">History</a>
		</nav>

		<p class="caption footer-copy">© {year} URLyze</p>
	</div>
</footer>

<style>
	.footer {
		margin-top: auto;
	}
	.footer-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-lg);
		padding-block: var(--space-xxl);
		flex-wrap: wrap;
	}
	.footer-brand {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}
	.brand-mark {
		font-size: 20px;
		color: var(--accent);
	}
	.brand-name {
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 500;
	}
	.footer-brand p {
		width: 100%;
		margin-top: var(--space-xs);
	}
	.footer-links {
		display: flex;
		gap: var(--space-lg);
	}
	.footer-links a {
		color: var(--text-secondary);
		font-size: 14px;
		text-decoration: none;
	}
	.footer-links a:hover {
		color: var(--accent);
		text-decoration: underline;
	}
	.footer-copy {
		color: var(--text-faint);
	}
</style>
