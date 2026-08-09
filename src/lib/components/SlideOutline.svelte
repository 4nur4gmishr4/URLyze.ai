<script lang="ts">
	import type { Slide } from '$lib/types/analysis';

	/**
	 * Slide-outline artifact: a numbered deck preview. Each slide shows its
	 * title and points, sized to hint at the finished PowerPoint.
	 */

	let { slides }: { slides: Slide[] } = $props();
</script>

<article class="artifact" aria-labelledby="slides-title">
	<h2 id="slides-title" class="artifact-title">
		<span class="num" aria-hidden="true">03</span>
		Slide outline
		<span class="count">{slides.length} slides</span>
	</h2>

	<ol class="deck">
		{#each slides as slide, i (i)}
			<li class="slide-card">
				<span class="slide-num" aria-hidden="true">{i + 1}</span>
				<div class="slide-body">
					<h3 class="slide-title">{slide.title}</h3>
					{#if slide.points.length}
						<ul class="points">
							{#each slide.points as point (point)}
								<li>{point}</li>
							{/each}
						</ul>
					{/if}
				</div>
			</li>
		{/each}
	</ol>
</article>

<style>
	.artifact-title {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm);
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 500;
		margin: 0 0 var(--space-md);
	}
	.num {
		font-size: 13px;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}
	.count {
		font-family: var(--font-ui);
		font-size: 12px;
		font-weight: 500;
		color: var(--text-faint);
		margin-left: auto;
	}
	.deck {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.slide-card {
		display: flex;
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-md);
		background: var(--surface-1);
	}
	.slide-num {
		flex-shrink: 0;
		width: 26px;
		height: 26px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: 1px solid var(--border-strong);
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.slide-title {
		margin: 0 0 var(--space-xs);
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}
	.points {
		margin: 0;
		padding-left: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-xxs);
	}
	.points li {
		font-size: 14px;
		line-height: 1.55;
		color: var(--text-secondary);
	}
</style>
