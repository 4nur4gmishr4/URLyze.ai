<script lang="ts">
	import { goto } from '$app/navigation';
	import HistoryList from '$lib/components/HistoryList.svelte';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import { listAnalyses, deleteAnalysis, ApiError } from '$lib/client/api';
	import type { AnalysisSummary, SourceType } from '$lib/types/analysis';

	/**
	 * History — server-backed list of this browser's analyses. Reads the list
	 * from the DB (instant on re-open, no re-analysis) with debounced search,
	 * type filter, and pagination. Selecting a row opens it on the dashboard.
	 */

	let rows = $state<AnalysisSummary[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let loadError = $state('');

	let search = $state('');
	let sourceType = $state<SourceType | undefined>(undefined);
	let sort = $state<'newest' | 'oldest'>('newest');
	const limit = 10;
	let offset = $state(0);

	let pending = $state<AnalysisSummary | null>(null);
	let deleting = $state(false);

	let debounce: ReturnType<typeof setTimeout>;

	function load(): void {
		loading = true;
		loadError = '';
		void listAnalyses({ search, sourceType, sort, limit, offset })
			.then((res) => {
				rows = res.rows;
				total = res.total;
				loading = false;
			})
			.catch((e) => {
				loading = false;
				loadError = e instanceof ApiError ? e.message : 'Could not load history.';
			});
	}

	function onsearch(q: string): void {
		search = q;
		clearTimeout(debounce);
		debounce = setTimeout(() => {
			offset = 0;
			load();
		}, 300);
	}

	function onfilter(t: SourceType | undefined): void {
		sourceType = t;
		offset = 0;
		load();
	}

	function onsort(s: 'newest' | 'oldest'): void {
		sort = s;
		offset = 0;
		load();
	}

	function onpage(next: number): void {
		offset = next;
		load();
	}

	function onselect(id: string): void {
		void goto(`/dashboard?id=${id}`);
	}

	function openDelete(row: AnalysisSummary): void {
		pending = row;
	}

	async function confirmDelete(): Promise<void> {
		const row = pending;
		if (!row || deleting) return;
		deleting = true;
		try {
			await deleteAnalysis(row.id);
			// Remove locally so the list stays snappy; refetch for totals.
			rows = rows.filter((r) => r.id !== row.id);
			total -= 1;
			offset = 0;
			if (rows.length === 0) load();
		} finally {
			deleting = false;
			pending = null;
		}
	}
</script>

<div class="history-page">
	<header class="page-head">
		<h1 class="page-title">History</h1>
		<p class="page-sub">{total} saved analysis{total === 1 ? '' : 'es'}</p>
	</header>

	{#if loadError}
		<p class="load-error" role="alert">{loadError}</p>
	{/if}

	<HistoryList
		{rows}
		{total}
		{loading}
		{search}
		{sourceType}
		{sort}
		{limit}
		{offset}
		onsearch={onsearch}
		onfilter={onfilter}
		onsort={onsort}
		onpage={onpage}
		onselect={onselect}
		ondelete={openDelete}
	/>

	{#if pending}
		{@const row = pending}
		<DeleteDialog
			open
			title="Delete this analysis?"
			message={`"${row.title}" will be removed for good.`}
			onconfirm={confirmDelete}
			onclose={() => (pending = null)}
		/>
	{/if}
</div>

<style>
	.history-page {
		max-width: 860px;
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.page-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-md);
		flex-wrap: wrap;
	}
	.page-title {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(24px, 4vw, 32px);
		font-weight: 400;
		letter-spacing: -0.02em;
	}
	.page-sub {
		margin: 0;
		font-size: 13px;
		color: var(--text-faint);
	}
	.load-error {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--border-accent);
		border-radius: var(--radius-md);
		background: var(--surface-accent-soft);
		color: var(--accent);
		font-size: 14px;
	}
</style>
