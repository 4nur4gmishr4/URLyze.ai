<script lang="ts">
	import { scrollReveal } from '$lib/client/scrollReveal';

	/** Three-step explainer for the landing page. Steps reveal on scroll. */

	const steps = [
		{
			num: '1',
			title: 'Paste a link',
			body: 'An article, a blog post, a YouTube video. Anything with substance works.'
		},
		{
			num: '2',
			title: 'We read it',
			body: 'The full text or transcript is pulled safely and processed by AI.'
		},
		{
			num: '3',
			title: 'Get three artifacts',
			body: 'An executive sketch, study notes, and a slide outline, downloadable in seconds.'
		}
	];
</script>

<section id="how" class="how" aria-labelledby="how-title" use:scrollReveal={{ stagger: 0.1 }}>
	<h2 id="how-title" class="section-title">How it works</h2>
	<ol class="steps">
		{#each steps as step, i (step.num)}
			<li class="step" data-reveal-item>
				<span class="step-num" aria-hidden="true">{step.num}</span>
				<h3 class="step-title">{step.title}</h3>
				<p class="step-body">{step.body}</p>
			</li>
		{/each}
	</ol>
</section>

<style>
	.how {
		padding: var(--space-xxl) var(--space-md);
		max-width: 880px;
		margin: 0 auto;
	}
	.section-title {
		margin: 0 0 var(--space-xl);
		font-family: var(--font-display);
		font-size: clamp(24px, 4vw, 32px);
		font-weight: 400;
		text-align: center;
		letter-spacing: -0.02em;
	}
	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-lg);
	}
	.step {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-lg);
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-lg);
		background: var(--surface-1);
	}
	.step-num {
		width: 30px;
		height: 30px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--surface-accent);
		color: var(--accent);
		font-size: 14px;
		font-weight: 600;
		margin-bottom: var(--space-xs);
	}
	.step-title {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
	}
	.step-body {
		margin: 0;
		font-size: 14px;
		line-height: 1.6;
		color: var(--text-secondary);
	}

	@media (max-width: 700px) {
		.steps {
			grid-template-columns: 1fr;
		}
	}
</style>
