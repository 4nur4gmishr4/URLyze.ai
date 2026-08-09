<script lang="ts">
	import { onMount } from 'svelte';
	import Skeleton from './Skeleton.svelte';
	import { renderMarkdown } from '$lib/client/markdown';

	/**
	 * Renders an LLM artifact's markdown to safe HTML (no raw HTML passes
	 * through). Shows a skeleton while the micromark chunk loads on first
	 * render, then caches per analysis id.
	 */

	let {
		analysisId,
		text,
		class: className = ''
	}: {
		analysisId: string;
		text: string;
		class?: string;
	} = $props();

	let html = $state('');
	let loading = $state(true);

	onMount(() => {
		renderMarkdown(analysisId, text)
			.then((out) => {
				html = out;
				loading = false;
			})
			.catch(() => {
				// Fall back to escaped plain text if micromark fails to load.
				const pre = document.createElement('pre');
				pre.textContent = text;
				html = pre.outerHTML;
				loading = false;
			});
	});
</script>

{#if loading}
	<Skeleton />
{:else}
	<div class="markdown-panel {className}" aria-label="Markdown content">{@html html}</div>
{/if}
