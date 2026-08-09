<script lang="ts">
	import CopyButton from './CopyButton.svelte';
	import DownloadButton from './DownloadButton.svelte';
	import type { AnalysisResult } from '$lib/types/analysis';

	/**
	 * Per-artifact action row: copy the current artifact's text, or download
	 * the whole result as txt/md/pptx. The copy target changes with the active
	 * tab; downloads always cover the full result.
	 */

	let {
		result,
		activeText
	}: {
		result: AnalysisResult;
		activeText: string;
	} = $props();
</script>

<div class="action-bar">
	<CopyButton text={activeText} label="Copy" />
	<span class="divider" aria-hidden="true"></span>
	<DownloadButton {result} format="txt" />
	<DownloadButton {result} format="md" />
	<DownloadButton {result} format="pptx" />
</div>

<style>
	.action-bar {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}
	.divider {
		width: 1px;
		height: 20px;
		background: var(--border-soft);
		margin: 0 var(--space-xs);
	}
	@media (max-width: 560px) {
		.divider {
			display: none;
		}
	}
</style>
