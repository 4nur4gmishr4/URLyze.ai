<script lang="ts">
	/**
	 * Pipeline progress indicator shown while an analysis runs. Steps advance
	 * as the server pipeline progresses; the final step holds in a pulsing
	 * state until results arrive.
	 */

	export type PipelineStep = 'extract' | 'summarize' | 'structure' | 'done';

	let {
		step = 'extract'
	}: {
		step?: PipelineStep;
	} = $props();

	const STEPS: { key: PipelineStep; label: string; sub: string }[] = [
		{ key: 'extract', label: 'Reading source', sub: 'Pulling the full text' },
		{ key: 'summarize', label: 'Summarizing', sub: 'AI distills the core' },
		{ key: 'structure', label: 'Structuring', sub: 'Building your three artifacts' },
		{ key: 'done', label: 'Done', sub: 'Results ready' }
	];

	const ORDER: Record<PipelineStep, number> = { extract: 0, summarize: 1, structure: 2, done: 3 };

	let activeIndex = $derived(ORDER[step]);
</script>

<ol class="steps" aria-label="Analysis progress">
	{#each STEPS as s, i (s.key)}
		<li
			class:active={i === activeIndex}
			class:complete={i < activeIndex}
			class="step"
			aria-current={i === activeIndex ? 'step' : undefined}
		>
			<span class="step-dot" aria-hidden="true">
				{#if i < activeIndex}
					<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
				{:else}
					{i + 1}
				{/if}
			</span>
			<span class="step-text">
				<span class="step-label">{s.label}</span>
				<span class="step-sub">{s.sub}</span>
			</span>
		</li>
	{/each}
</ol>

<style>
	.steps {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin: 0;
		padding: 0;
	}
	.step {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		opacity: 0.45;
		transition: opacity var(--duration-fast) var(--ease-out);
	}
	.step.active,
	.step.complete {
		opacity: 1;
	}
	.step-dot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 1px solid var(--border-strong);
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
		background: var(--surface-1);
		flex-shrink: 0;
	}
	.step.active .step-dot {
		border-color: var(--accent);
		color: var(--accent);
		animation: pulse 1.4s ease-in-out infinite;
	}
	.step.complete .step-dot {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--on-accent);
	}
	.step-text {
		display: flex;
		flex-direction: column;
		line-height: 1.25;
	}
	.step-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--text);
	}
	.step-sub {
		font-size: 12px;
		color: var(--text-faint);
	}
	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(250, 82, 15, 0.3);
		}
		50% {
			box-shadow: 0 0 0 5px rgba(250, 82, 15, 0);
		}
	}
	@media (max-width: 480px) {
		.step-sub {
			display: none;
		}
	}
</style>
