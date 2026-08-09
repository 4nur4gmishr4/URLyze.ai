<script lang="ts">
	import Badge from './Badge.svelte';
	import type { AnalysisResult } from '$lib/types/analysis';
	import { formatWordCount, readingMinutes, formatDuration } from '$lib/client/format';

	/**
	 * Header for a completed analysis: source type, title, and the provenance
	 * facts (domain/channel, length, extraction quality) shown under it.
	 */

	let { result }: { result: AnalysisResult } = $props();

	/** Domain without `www.` or the YouTube channel name. */
	let host = $derived(
		result.sourceType === 'YOUTUBE'
			? result.sourceMetadata.channelName
			: result.sourceMetadata.domain?.replace(/^www\./, '')
	);

	/** e.g. `12 min · 2,143 words` or `1h 10m · 8,400 words`. */
	let length = $derived(
		result.sourceType === 'YOUTUBE'
			? formatDuration(result.sourceMetadata.durationSeconds)
			: readingMinutes(result.sourceMetadata.wordCount)
	);
	let words = $derived(formatWordCount(result.sourceMetadata.wordCount));
</script>

<header class="source-header">
	<div class="top">
		<Badge variant={result.sourceType === 'YOUTUBE' ? 'cream' : 'orange'}>
			{result.sourceType === 'YOUTUBE' ? 'Video' : 'Article'}
		</Badge>
		{#if result.quality !== 'HIGH'}
			<Badge variant="dark">{result.quality} source</Badge>
		{/if}
	</div>

	<h1 class="title">{result.title}</h1>

	<p class="meta">
		{#if host}<span class="meta-item">{host}</span>{/if}
		{#if length}<span class="meta-item">{length}</span>{/if}
		{#if words}<span class="meta-item">{words}</span>{/if}
		<span class="meta-item model">{result.model}</span>
	</p>
</header>

<style>
	.source-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.top {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}
	.title {
		font-family: var(--font-display);
		font-size: clamp(24px, 4vw, 34px);
		line-height: 1.15;
		letter-spacing: -0.02em;
		margin: 0;
		overflow-wrap: anywhere;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin: 0;
		font-size: 13px;
		color: var(--text-faint);
	}
	.meta-item {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
	}
	.meta-item + .meta-item::before {
		content: '·';
		color: var(--text-faint);
	}
	.model {
		color: var(--accent);
	}
</style>
