<script lang="ts">
	import MarkdownPanel from './MarkdownPanel.svelte';

	/**
	 * Study-notes artifact: the fullest of the three, structured for review.
	 * Safe markdown via micromark, cached per analysis id.
	 */

	let { analysisId, notes }: { analysisId: string; notes: string } = $props();
</script>

<article class="artifact" aria-labelledby="notes-title">
	<h2 id="notes-title" class="artifact-title">
		<span class="num" aria-hidden="true">02</span>
		Study notes
	</h2>
	<MarkdownPanel {analysisId} text={notes} />
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
