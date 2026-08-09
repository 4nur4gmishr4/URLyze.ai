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
		activeText,
		type
	}: {
		result: AnalysisResult;
		activeText: string;
		type: 'summary' | 'notes' | 'slides';
	} = $props();
</script>

<div class="action-bar">
	<CopyButton text={activeText} label="Copy" />
	<span class="divider" aria-hidden="true"></span>
	{#if type === 'summary'}
		<DownloadButton {result} format="txt" />
	{:else if type === 'notes'}
		<DownloadButton {result} format="md" />
	{:else if type === 'slides'}
		<DownloadButton {result} format="pptx" />
	{/if}
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
