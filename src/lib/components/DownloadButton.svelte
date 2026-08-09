<script lang="ts">
	import Button from './Button.svelte';
	import type { AnalysisResult } from '$lib/types/analysis';
	import { downloadTxt, downloadMd, downloadPptx } from '$lib/client/downloads';

	/**
	 * Download control for one format. .txt/.md are instant; .pptx lazy-loads
	 * the pptxgenjs library so the button shows a brief preparing state.
	 */

	let {
		result,
		format
	}: {
		result: AnalysisResult;
		format: 'txt' | 'md' | 'pptx';
	} = $props();

	const LABELS: Record<typeof format, string> = { txt: '.txt', md: '.md', pptx: '.pptx' };

	let busy = $state(false);

	async function onDownload(): Promise<void> {
		if (busy) return;
		busy = true;
		try {
			if (format === 'pptx') await downloadPptx(result);
			else if (format === 'md') downloadMd(result);
			else downloadTxt(result);
		} finally {
			busy = false;
		}
	}
</script>

<Button
	variant={format === 'pptx' ? 'primary' : 'secondary'}
	onclick={onDownload}
	disabled={busy}
	class="download-btn"
>
	{#if busy}
		<span class="spinner" aria-hidden="true"></span>
		Preparing…
	{:else}
		<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="7 10 12 15 17 10" />
			<line x1="12" x2="12" y1="15" y2="3" />
		</svg>
		{LABELS[format]}
	{/if}
</Button>

<style>
	.spinner {
		display: inline-block;
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.35);
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
