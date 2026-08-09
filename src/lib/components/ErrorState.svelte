<script lang="ts">
	import Button from './Button.svelte';
	import type { Snippet } from 'svelte';
	import type { ErrorCode } from '$lib/types/errors';

	/**
	 * Error panel driven by the server's error code. Each code maps to a
	 * distinct title + explanation so the user knows what actually happened and
	 * what to do next. A request id is shown when present for support calls.
	 */

	let {
		code,
		message,
		detail,
		requestId,
		onretry,
		children
	}: {
		code: string;
		message: string;
		detail?: string;
		requestId?: string;
		onretry?: () => void;
		children?: Snippet;
	} = $props();

	interface Copy {
		title: string;
		body: string;
	}

	function copyFor(code: string): Copy {
		switch (code as ErrorCode) {
			case 'INVALID_URL':
			case 'VALIDATION':
				return {
					title: 'That link doesn’t look right',
					body: 'The URL couldn’t be read. Paste a full link starting with http:// or https://.'
				};
			case 'UNSUPPORTED_URL':
				return { title: 'Unsupported link', body: 'Only http(s) links to pages or videos are supported.' };
			case 'BLOCKED_URL':
				return {
					title: 'This link is off-limits',
					body: 'It points to a private or internal address, so it was blocked for safety.'
				};
			case 'NETWORK_ERROR':
			case 'TIMEOUT':
			case 'HTTP_ERROR':
				return {
					title: 'Couldn’t reach the source',
					body: 'The page or video wouldn’t respond. It may be down, slow, or behind a paywall.'
				};
			case 'BLOCKED_BY_SOURCE':
				return {
					title: 'The source refused us',
					body: 'The site blocked automated reading. Try a different URL or a YouTube link.'
				};
			case 'UNSUPPORTED_CONTENT_TYPE':
				return { title: 'Not a readable page', body: 'This URL returns a file type we can’t read (image, PDF, app).' };
			case 'EMPTY_CONTENT':
				return {
					title: 'Nothing to summarize',
					body: 'The page was too short or empty to work with. Try a fuller article or video.'
				};
			case 'CONTENT_TOO_LARGE':
				return { title: 'Too much content', body: 'The source is larger than we can process in one pass.' };
			case 'EXTRACTION_FAILED':
				return { title: 'Reading failed', body: 'We couldn’t pull readable text out of that link. Try again or pick another.' };
			case 'AI_UNAVAILABLE':
				return {
					title: 'The AI is temporarily down',
					body: 'The summarizer is having trouble. Please wait a moment and retry.'
				};
			case 'RATE_LIMITED':
				return {
					title: 'Slow down a little',
					body: 'You’ve hit the analysis limit for a short window. Give it a few minutes and try again.'
				};
			case 'NOT_FOUND':
				return { title: 'Not found', body: 'That item doesn’t exist or was already deleted.' };
			case 'DATABASE_ERROR':
			case 'INTERNAL':
			default:
				return { title: 'Something went wrong', body: 'An unexpected error occurred. Retrying may fix it.' };
		}
	}

	let copy = $derived(copyFor(code));
</script>

<div class="error-state" role="alert">
	<span class="icon" aria-hidden="true">
		<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
			<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
			<line x1="12" x2="12" y1="9" y2="13" />
			<line x1="12" x2="12.01" y1="17" y2="17" />
		</svg>
	</span>
	<h2 class="title">{copy.title}</h2>
	<p class="message">
		{message}
		{#if copy.body && copy.body !== message}<br /><span class="body">{copy.body}</span>{/if}
	</p>
	{#if children}
		<div class="actions">{@render children()}</div>
	{:else if onretry}
		<div class="actions">
			<Button onclick={onretry}>Try again</Button>
		</div>
	{/if}
	{#if detail}
		<p class="detail">{detail}</p>
	{/if}
	{#if requestId}
		<p class="request-id">Request {requestId}</p>
	{/if}
</div>

<style>
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--space-sm);
		padding: var(--space-xl);
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-lg);
		background: var(--surface-1);
		max-width: 480px;
		margin-inline: auto;
	}
	.icon {
		width: 48px;
		height: 48px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--surface-accent-soft);
		color: var(--accent);
	}
	.title {
		margin: 0;
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.message {
		margin: 0;
		font-size: 14px;
		line-height: 1.6;
		color: var(--text-secondary);
	}
	.body {
		color: var(--text-faint);
	}
	.actions {
		margin-top: var(--space-sm);
		display: flex;
		gap: var(--space-sm);
	}
	.detail {
		margin: 0;
		font-size: 12px;
		color: var(--text-faint);
	}
	.request-id {
		margin: 0;
		font-size: 11px;
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
	}
</style>
