<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import ProgressSteps, { type PipelineStep } from '$lib/components/ProgressSteps.svelte';
	import ResultsView from '$lib/components/ResultsView.svelte';
	import ErrorState from '$lib/components/ErrorState.svelte';
	import UrlInput from '$lib/components/UrlInput.svelte';
	import AnalyzeButton from '$lib/components/AnalyzeButton.svelte';
	import { analyze, getAnalysis, ApiError } from '$lib/client/api';
	import type { AnalysisResult } from '$lib/types/analysis';

	/**
	 * Dashboard — the working screen. Reads `?url=` and runs the pipeline, or
	 * `?id=` to reopen a past analysis. Results are cached in memory by URL so
	 * re-visits skip the round trip, and persisted server-side (history reads
	 * from the DB).
	 */

	// --- in-memory result cache: avoids re-analyzing the same URL this session.
	const cache = new Map<string, AnalysisResult>();

	let url = $derived((page.url.searchParams.get('url') ?? '').trim());
	let analysisId = $derived((page.url.searchParams.get('id') ?? '').trim());
	let submittedUrl = $state('');
	let result = $state<AnalysisResult | null>(null);
	let step = $state<PipelineStep>('extract');
	let error = $state<{ code: string; message: string; detail?: string; requestId?: string } | null>(null);

	let isLoading = $derived(submittedUrl !== '' && result === null && error === null);

	$effect(() => {
		const id = analysisId;
		if (id) {
			// Reopening a past analysis from history — load it directly.
			submittedUrl = id;
			result = null;
			error = null;
			void (async () => {
				try {
					result = await getAnalysis(id);
				} catch (e) {
					if (e instanceof ApiError) {
						error = { code: e.code, message: e.message, detail: e.detail, requestId: e.requestId };
					} else {
						error = { code: 'INTERNAL', message: 'Could not load that analysis.' };
					}
				}
			})();
			return;
		}
		const u = url;
		if (!u) {
			// No URL in the query string — back to the entry state.
			submittedUrl = '';
			result = null;
			error = null;
			return;
		}
		const cached = cache.get(u);
		if (cached) {
			submittedUrl = u;
			result = cached;
			error = null;
			return;
		}
		void runAnalysis(u);
	});

	async function runAnalysis(input: string): Promise<void> {
		submittedUrl = input;
		result = null;
		error = null;
		step = 'extract';
		// Walk the pipeline stages for a coarse visual; each stage is at least ~600ms.
		const controller = new AbortController();
		const stages: PipelineStep[] = ['extract', 'summarize', 'structure'];
		let i = 0;
		const ticker = setInterval(() => {
			if (i < stages.length) step = stages[i++];
		}, 900);
		try {
			const res = await analyze(input, controller.signal);
			cache.set(input, res);
			result = res;
			step = 'done';
		} catch (e) {
			if (controller.signal.aborted) return;
			if (e instanceof ApiError) {
				error = { code: e.code, message: e.message, detail: e.detail, requestId: e.requestId };
			} else {
				error = { code: 'INTERNAL', message: 'Something went wrong while analyzing.' };
			}
		} finally {
			clearInterval(ticker);
		}
	}

	function onsubmit(u: string): void {
		if (!u.trim()) return;
		void goto(`/dashboard?url=${encodeURIComponent(u.trim())}`);
	}

	function onretry(): void {
		// Clear the query param so the $effect re-triggers for the same URL.
		if (submittedUrl) {
			// Ensure a rerun even when the URL is identical.
			cache.delete(submittedUrl);
			const u = submittedUrl;
			submittedUrl = '';
			queueMicrotask(() => void runAnalysis(u));
		}
	}
</script>

<div class="dashboard">
	{#if submittedUrl === ''}
		<section class="entry">
			<h1 class="entry-title">What should we read?</h1>
			<p class="entry-sub">Paste a link to an article or a YouTube video.</p>
			<form
				class="entry-form"
				onsubmit={(e) => {
					e.preventDefault();
					const input = e.currentTarget.querySelector<HTMLInputElement>('input');
					if (input?.value) onsubmit(input.value);
				}}
			>
				<UrlInput disabled={isLoading} onsubmit={onsubmit} />
				<AnalyzeButton disabled={isLoading} />
			</form>
		</section>
	{:else if error}
		<ErrorState
			code={error.code}
			message={error.message}
			detail={error.detail}
			requestId={error.requestId}
			onretry={onretry}
		>
			{#snippet children()}
				<button class="btn btn-secondary" onclick={() => goto('/dashboard')}>Analyze something else</button>
			{/snippet}
		</ErrorState>
	{:else if result}
		<ResultsView {result} />
	{:else}
		<section class="progress-wrap" aria-live="polite" aria-busy="true">
			<div class="progress-card">
				<ProgressSteps {step} />
			</div>
			<p class="progress-note">
				{#if analysisId}
					Loading saved analysis…
				{:else}
					Analyzing <span class="progress-url">{submittedUrl}</span>. This can take up to a minute.
				{/if}
			</p>
		</section>
	{/if}
</div>

<style>
	.dashboard {
		max-width: 860px;
		width: 100%;
		margin: 0 auto;
	}
	.entry {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--space-sm);
		padding-top: var(--space-xxl);
	}
	.entry-title {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(26px, 5vw, 38px);
		font-weight: 400;
		letter-spacing: -0.02em;
	}
	.entry-sub {
		margin: 0 0 var(--space-md);
		color: var(--text-secondary);
	}
	.entry-form {
		display: flex;
		gap: var(--space-sm);
		align-items: flex-start;
		width: 100%;
		max-width: 640px;
	}
	.entry-form :global(.url-form) {
		flex: 1;
	}
	.progress-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding-top: var(--space-xxl);
	}
	.progress-card {
		width: min(100%, 400px);
		padding: var(--space-lg);
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-lg);
		background: var(--surface-1);
	}
	.progress-note {
		font-size: 13px;
		color: var(--text-faint);
		text-align: center;
		max-width: 460px;
		overflow-wrap: anywhere;
	}
	.progress-url {
		color: var(--text-secondary);
	}

	@media (max-width: 640px) {
		.entry-form {
			flex-direction: column;
		}
		.entry-form :global(.analyze-btn) {
			width: 100%;
		}
	}
</style>
