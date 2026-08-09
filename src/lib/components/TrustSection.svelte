<script lang="ts">
	import { scrollReveal } from '$lib/client/scrollReveal';

	/** Trust strip: honest notes about privacy, cost, and safety. Cards reveal on scroll. */

	const points = [
		{
			title: 'No account, no ads',
			body: 'Anonymous by design. Your history is tied to this browser, not to you.'
		},
		{
			title: 'Security-first',
			body: 'Private and internal addresses are blocked, and rate limits keep the service fair.'
		},
		{
			title: 'Plain text out',
			body: 'Your downloads are ordinary .txt, .md, and .pptx files, yours to keep forever.'
		}
	];
</script>

<section id="trust" class="trust" aria-labelledby="trust-title" use:scrollReveal={{ stagger: 0.1 }}>
	<h2 id="trust-title" class="section-title">Made to stay simple</h2>
	<ul class="points">
		{#each points as point (point.title)}
			<li class="point" data-reveal-item>
				<span class="check" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
				</span>
				<div class="point-text">
					<h3 class="point-title">{point.title}</h3>
					<p class="point-body">{point.body}</p>
				</div>
			</li>
		{/each}
	</ul>
</section>

<style>
	.trust {
		padding: var(--space-xxl) var(--space-md);
		max-width: 880px;
		margin: 0 auto;
	}
	.section-title {
		margin: 0 0 var(--space-lg);
		font-family: var(--font-display);
		font-size: clamp(24px, 4vw, 32px);
		font-weight: 400;
		text-align: center;
		letter-spacing: -0.02em;
	}
	.points {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-md);
	}
	.point {
		display: flex;
		gap: var(--space-sm);
		align-items: flex-start;
	}
	.check {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--surface-accent);
		color: var(--accent);
	}
	.point-title {
		margin: 0 0 2px;
		font-size: 15px;
		font-weight: 600;
	}
	.point-body {
		margin: 0;
		font-size: 13px;
		line-height: 1.55;
		color: var(--text-secondary);
	}

	@media (max-width: 700px) {
		.points {
			grid-template-columns: 1fr;
		}
	}
</style>
