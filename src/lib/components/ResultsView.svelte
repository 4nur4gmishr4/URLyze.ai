<script lang="ts">
	import SourceHeader from './SourceHeader.svelte';
	import ArtifactNav, { type ArtifactKey } from './ArtifactNav.svelte';
	import ActionBar from './ActionBar.svelte';
	import ExecutiveSketch from './ExecutiveSketch.svelte';
	import StudyNotes from './StudyNotes.svelte';
	import SlideOutline from './SlideOutline.svelte';
	import type { AnalysisResult } from '$lib/types/analysis';

	/**
	 * Full results panel for a completed analysis: source header, artifact
	 * tabs, per-artifact actions, and the active content. The active tab is
	 * lifted up so the dashboard can restore it from the URL if desired.
	 */

	let {
		result,
		active = 'summary',
		onchange
	}: {
		result: AnalysisResult;
		active?: ArtifactKey;
		onchange: (key: ArtifactKey) => void;
	} = $props();

	/** The raw text of the active artifact — the copy target. */
	let activeText = $derived(
		active === 'summary'
			? result.summary
			: active === 'notes'
				? result.notes
				: result.pptContent
						.map((s, i) => `${i + 1}. ${s.title}\n${s.points.map((p) => `- ${p}`).join('\n')}`)
						.join('\n\n')
	);
</script>

<div class="results">
	<SourceHeader {result} />

	<div class="panel">
		<ArtifactNav {result} {active} {onchange} />
		<div class="panel-body">
			<ActionBar {result} {activeText} />

			<div id="artifact-panel" role="tabpanel" aria-labelledby={`artifact-${active}`} class="artifact-panel">
				{#if active === 'summary'}
					<ExecutiveSketch analysisId={result.id} summary={result.summary} />
				{:else if active === 'notes'}
					<StudyNotes analysisId={result.id} notes={result.notes} />
				{:else}
					<SlideOutline slides={result.pptContent} />
				{/if}
			</div>
		</div>
	</div>

	{#if result.wasDuplicate}
		<p class="dup-note">This one was already analyzed, so you're seeing the saved copy.</p>
	{/if}
</div>

<style>
	.results {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}
	.panel {
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-lg);
		background: var(--surface-1);
		overflow: hidden;
	}
	.panel-body {
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.dup-note {
		font-size: 13px;
		color: var(--text-faint);
		margin: 0;
	}
</style>
