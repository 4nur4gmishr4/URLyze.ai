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
		result
	}: {
		result: AnalysisResult;
	} = $props();
</script>

<div class="results-layout">
	<div class="nav-sidebar">
		<nav class="section-nav">
			<a href="#summary" class="nav-link">
				<span class="nav-label">Executive sketch</span>
			</a>
			<a href="#notes" class="nav-link">
				<span class="nav-label">Study notes</span>
			</a>
			<a href="#slides" class="nav-link">
				<span class="nav-label">Slide outline</span>
			</a>
		</nav>
	</div>

	<div class="results-content">
		<SourceHeader {result} />

		<div class="panel" id="summary">
			<div class="panel-header">
				<h2 class="artifact-title">Executive Sketch</h2>
				<ActionBar {result} activeText={result.summary} type="summary" />
			</div>
			<div class="panel-body">
				<ExecutiveSketch analysisId={result.id} summary={result.summary} />
			</div>
		</div>

		<div class="panel" id="notes">
			<div class="panel-header">
				<h2 class="artifact-title">Study Notes</h2>
				<ActionBar {result} activeText={result.notes} type="notes" />
			</div>
			<div class="panel-body">
				<StudyNotes analysisId={result.id} notes={result.notes} />
			</div>
		</div>

		<div class="panel" id="slides">
			<div class="panel-header">
				<h2 class="artifact-title">Slide Outline</h2>
				<ActionBar {result} activeText={result.pptContent.map((s, i) => `${i + 1}. ${s.title}\n${s.points.map((p) => `- ${p}`).join('\n')}`).join('\n\n')} type="slides" />
			</div>
			<div class="panel-body">
				<SlideOutline slides={result.pptContent} />
			</div>
		</div>

		{#if result.wasDuplicate}
			<p class="dup-note">This one was already analyzed, so you're seeing the saved copy.</p>
		{/if}
	</div>
</div>

<style>
	.results-layout {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}
	@media (min-width: 1024px) {
		.results-layout {
			flex-direction: row-reverse; /* Source/results on right, nav on left */
			align-items: flex-start;
		}
		.nav-sidebar {
			flex: 0 0 200px;
			position: sticky;
			top: var(--space-xl);
		}
		.results-content {
			flex: 1;
			min-width: 0;
		}
		.section-nav {
			flex-direction: column;
			gap: var(--space-sm);
			border-left: 2px solid var(--border-soft);
			border-bottom: none;
			padding-left: var(--space-md);
		}
	}
	.nav-sidebar {
		z-index: 10;
		background: var(--bg);
	}
	.section-nav {
		display: flex;
		gap: var(--space-md);
		border-bottom: 1px solid var(--border-soft);
		padding-bottom: var(--space-sm);
	}
	.nav-link {
		text-decoration: none;
		color: var(--text-secondary);
		font-weight: 500;
		transition: color var(--duration-fast);
	}
	.nav-link:hover {
		color: var(--accent);
	}
	.results-content {
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
	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-md) var(--space-lg);
		border-bottom: 1px solid var(--border-soft);
		background: var(--surface-2);
	}
	.artifact-title {
		margin: 0;
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 500;
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
