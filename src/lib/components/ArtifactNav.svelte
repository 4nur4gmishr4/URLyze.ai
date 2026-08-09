<script lang="ts">
	import type { AnalysisResult } from '$lib/types/analysis';

	/**
	 * Tab bar for switching between the three artifacts. Behaves like proper
	 * tabs (arrow-key navigation, aria-selected) without a heavyweight
	 * dependency.
	 */

	export type ArtifactKey = 'summary' | 'notes' | 'slides';

	let {
		result,
		active,
		onchange
	}: {
		result: AnalysisResult;
		active: ArtifactKey;
		onchange: (key: ArtifactKey) => void;
	} = $props();

	let TABS = $derived([
		{ key: 'summary', label: 'Executive sketch', hint: 'One-page read' },
		{ key: 'notes', label: 'Study notes', hint: `${result.notes.split(' ').length.toLocaleString()} words` },
		{ key: 'slides', label: 'Slide outline', hint: `${result.pptContent.length} slides` }
	] as { key: ArtifactKey; label: string; hint: string }[]);

	let tabRefs: (HTMLButtonElement | undefined)[] = [];

	function onKeydown(e: KeyboardEvent): void {
		const idx = TABS.findIndex((t) => t.key === active);
		if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
		e.preventDefault();
		const dir = e.key === 'ArrowRight' ? 1 : -1;
		const next = (idx + dir + TABS.length) % TABS.length;
		onchange(TABS[next].key);
		tabRefs[next]?.focus();
	}
</script>

<div role="tablist" aria-label="Artifacts" class="artifact-nav">
	{#each TABS as tab, i (tab.key)}
		<button
			role="tab"
			id={`artifact-${tab.key}`}
			aria-selected={active === tab.key}
			aria-controls="artifact-panel"
			tabindex={active === tab.key ? 0 : -1}
			class:active={active === tab.key}
			class="tab"
			onclick={() => onchange(tab.key)}
			onkeydown={onKeydown}
			bind:this={tabRefs[i]}
		>
			<span class="tab-label">{tab.label}</span>
			<span class="tab-hint">{tab.hint}</span>
		</button>
	{/each}
</div>

<style>
	.artifact-nav {
		display: flex;
		gap: var(--space-xxs);
		border-bottom: 1px solid var(--border-soft);
		overflow-x: auto;
		scrollbar-width: none;
	}
	.artifact-nav::-webkit-scrollbar {
		display: none;
	}
	.tab {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		padding: var(--space-sm) var(--space-md);
		border: none;
		background: none;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		color: var(--text-secondary);
		font-family: var(--font-ui);
		transition: color var(--duration-fast) var(--ease-out),
			border-color var(--duration-fast) var(--ease-out);
	}
	.tab:hover {
		color: var(--text);
	}
	.tab.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}
	.tab-label {
		font-size: 14px;
		font-weight: 600;
	}
	.tab-hint {
		font-size: 11px;
		color: var(--text-faint);
	}
</style>
