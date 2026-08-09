<script lang="ts">
	import Badge from './Badge.svelte';
	import EmptyState from './EmptyState.svelte';
	import Skeleton from './Skeleton.svelte';
	import type { AnalysisSummary, SourceType } from '$lib/types/analysis';
	import { relativeTime } from '$lib/client/format';

	/**
	 * History list with inline search + type filter + pagination. State is
	 * lifted to the page so the URL can mirror it (sharable, back-button safe).
	 */

	let {
		rows,
		total,
		loading,
		search = '',
		sourceType,
		sort = 'newest',
		limit = 10,
		offset = 0,
		onsearch,
		onfilter,
		onsort,
		onpage,
		onselect,
		ondelete
	}: {
		rows: AnalysisSummary[];
		total: number;
		loading: boolean;
		search?: string;
		sourceType?: SourceType;
		sort?: 'newest' | 'oldest';
		limit?: number;
		offset?: number;
		onsearch: (q: string) => void;
		onfilter: (t: SourceType | undefined) => void;
		onsort: (s: 'newest' | 'oldest') => void;
		onpage: (offset: number) => void;
		onselect: (id: string) => void;
		ondelete: (row: AnalysisSummary) => void;
	} = $props();

	let pages = $derived(Math.max(1, Math.ceil(total / limit)));
	let page = $derived(Math.floor(offset / limit) + 1);
</script>

<div class="history">
	<div class="controls">
		<label class="search" for="history-search">
			<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<circle cx="11" cy="11" r="8" />
				<line x1="21" x2="16.65" y1="21" y2="16.65" />
			</svg>
			<input
				id="history-search"
				type="search"
				placeholder="Search your history…"
				value={search}
				oninput={(e) => onsearch((e.currentTarget as HTMLInputElement).value)}
			/>
		</label>

		<div class="filters">
			<button
				class:active={sourceType === undefined}
				class="chip"
				onclick={() => onfilter(undefined)}
			>
				All
			</button>
			<button
				class:active={sourceType === 'WEBPAGE'}
				class="chip"
				onclick={() => onfilter('WEBPAGE')}
			>
				Articles
			</button>
			<button
				class:active={sourceType === 'YOUTUBE'}
				class="chip"
				onclick={() => onfilter('YOUTUBE')}
			>
				Videos
			</button>
			<select
				class="sort"
				value={sort}
				onchange={(e) => onsort((e.currentTarget as HTMLSelectElement).value as 'newest' | 'oldest')}
				aria-label="Sort order"
			>
				<option value="newest">Newest first</option>
				<option value="oldest">Oldest first</option>
			</select>
		</div>
	</div>

	{#if loading}
		<div class="list" aria-busy="true">
			{#each Array(4) as _, i (i)}
				<div class="row skeleton-row">
					<Skeleton lines={2} />
				</div>
			{/each}
		</div>
	{:else if rows.length === 0}
		<EmptyState
			title={search || sourceType ? 'No matches' : 'No analyses yet'}
			description={search || sourceType
				? 'Nothing fits that filter. Try widening it.'
				: 'Analyze a link and it will show up here.'}
		/>
	{:else}
		<ul class="list">
			{#each rows as row (row.id)}
				<li class="row">
					<button class="row-main" onclick={() => onselect(row.id)} aria-label={`Open ${row.title}`}>
						<span class="row-title">{row.title}</span>
						<span class="row-url">{row.originalUrl}</span>
					</button>
					<div class="row-meta">
						<Badge variant={row.sourceType === 'YOUTUBE' ? 'cream' : 'orange'}>
							{row.sourceType === 'YOUTUBE' ? 'Video' : 'Article'}
						</Badge>
						{#if row.extractionQuality !== 'HIGH'}
							<Badge variant="dark">{row.extractionQuality}</Badge>
						{/if}
						<span class="time">{relativeTime(row.createdAt)}</span>
						<button
							class="delete-btn"
							aria-label={`Delete ${row.title}`}
							title="Delete"
							onclick={() => ondelete(row)}
						>
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M3 6h18" />
								<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
								<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
							</svg>
						</button>
					</div>
				</li>
			{/each}
		</ul>

		{#if pages > 1}
			<nav class="pager" aria-label="History pages">
				<button class="page-btn" disabled={page <= 1} onclick={() => onpage(0)}>
					←
				</button>
				<span class="page-info">Page {page} of {pages}</span>
				<button
					class="page-btn"
					disabled={page >= pages}
					onclick={() => onpage(page * limit)}
				>
					→
				</button>
			</nav>
		{/if}
	{/if}
</div>

<style>
	.history {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		flex-wrap: wrap;
	}
	.search {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: 0 var(--space-md);
		height: 42px;
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-md);
		background: var(--surface-1);
		color: var(--text-faint);
		flex: 1;
		min-width: 220px;
	}
	.search:focus-within {
		border-color: var(--accent);
	}
	.search input {
		flex: 1;
		border: none;
		outline: none;
		background: none;
		color: var(--text);
		font-size: 14px;
		font-family: var(--font-ui);
	}
	.filters {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}
	.chip {
		padding: 8px 14px;
		border: 1px solid var(--border-soft);
		border-radius: 999px;
		background: var(--surface-1);
		color: var(--text-secondary);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		font-family: var(--font-ui);
		transition: all var(--duration-fast) var(--ease-out);
	}
	.chip:hover {
		color: var(--text);
	}
	.chip.active {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
	}
	.sort {
		padding: 8px 10px;
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-md);
		background: var(--surface-1);
		color: var(--text-secondary);
		font-size: 13px;
		font-family: var(--font-ui);
		cursor: pointer;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.row {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-md);
		background: var(--surface-1);
		font-family: var(--font-ui);
		transition: border-color var(--duration-fast) var(--ease-out),
			transform var(--duration-fast) var(--ease-out);
	}
	.row:hover {
		border-color: var(--border-strong);
		transform: translateY(-1px);
	}
	.row-main {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		text-align: left;
		cursor: pointer;
		border: none;
		background: none;
		padding: var(--space-xs) 0;
		flex: 1;
		font-family: var(--font-ui);
	}
	.row-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.row-url {
		font-size: 12px;
		color: var(--text-faint);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 420px;
	}
	.row-meta {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-shrink: 0;
	}
	.time {
		font-size: 12px;
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
	}
	.delete-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--text-faint);
		cursor: pointer;
		transition: color var(--duration-fast) var(--ease-out),
			background-color var(--duration-fast) var(--ease-out);
	}
	.delete-btn:hover {
		color: var(--accent);
		background: var(--surface-accent-soft);
	}
	.skeleton-row {
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-md);
		padding: var(--space-md);
	}
	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
	}
	.page-btn {
		width: 34px;
		height: 34px;
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-md);
		background: var(--surface-1);
		color: var(--text);
		cursor: pointer;
		font-size: 14px;
	}
	.page-btn:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.page-info {
		font-size: 13px;
		color: var(--text-secondary);
	}
</style>
