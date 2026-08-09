<script lang="ts">
	import MarkdownPanel from './MarkdownPanel.svelte';

	/**
	 * Executive-sketch artifact: a tight, scannable distillation of the
	 * source. Rendered as safe markdown; caches per analysis id.
	 */

	let { analysisId, summary }: { analysisId: string; summary: string } = $props();
</script>

<article class="artifact" aria-labelledby="exec-title">
	<h2 id="exec-title" class="artifact-title">
		<span class="num" aria-hidden="true">01</span>
		Executive sketch
	</h2>
	<MarkdownPanel {analysisId} text={summary} />
</article>

<style>
	.artifact-title {
		display: flex;
		align-items: center;
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
</style>
