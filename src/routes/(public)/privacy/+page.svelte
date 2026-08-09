<script lang="ts">
	/** Privacy page — plain-English, honest about what we store. */
</script>

<article class="legal">
	<h1 class="title">Privacy</h1>
	<p class="updated">Last updated: August 2026</p>

	<section>
		<h2>What we store</h2>
		<p>
			When you analyze a link, we keep the URL you submitted, the text we extracted from it,
			and the three artifacts Gemini produced. This is what powers your history, so the next
			time you open the same link, we can show the saved result instantly instead of re-reading.
		</p>
	</section>

	<section>
		<h2>Anonymity</h2>
		<p>
			URLyze has no accounts and no personal profiles. Your history is tied to a random
			anonymous session id stored in a signed cookie on your device. We never see your name,
			email, or any other identifier, and there is nothing to log you in or out of.
		</p>
	</section>

	<section>
		<h2>How content is handled</h2>
		<p>
			Extracted text is sent to Google's Gemini API to produce your artifacts. We do not sell,
			share, or otherwise trade the content you submit. Your history is only ever visible to
			the browser whose session cookie matches it.
		</p>
	</section>

	<section>
		<h2>Deleting your data</h2>
		<p>
			You can delete a single analysis from History, or clear your entire history from Settings.
			Both are immediate and permanent.
		</p>
	</section>
</article>

<style>
	.legal {
		max-width: 640px;
		margin: 0 auto;
		padding: var(--space-xxl) var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.title {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(28px, 5vw, 40px);
		font-weight: 400;
		letter-spacing: -0.02em;
	}
	.updated {
		margin: 0;
		font-size: 13px;
		color: var(--text-faint);
	}
	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	h2 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
	}
	p {
		margin: 0;
		font-size: 15px;
		line-height: 1.65;
		color: var(--text-secondary);
	}
</style>
