<script lang="ts">
	/**
	 * URL entry point. Validates loosely on the client (server does the real
	 * validation + SSRF check) and hands the value up via `onsubmit`.
	 */

	let {
		value = '',
		disabled = false,
		error = '',
		placeholder = 'Paste a link, like an article or YouTube video',
		onsubmit
	}: {
		value?: string;
		disabled?: boolean;
		error?: string;
		placeholder?: string;
		onsubmit?: (url: string) => void;
	} = $props();

	function handleSubmit(e: SubmitEvent): void {
		e.preventDefault();
		if (!value.trim()) return;
		onsubmit?.(value.trim());
	}

	function onInput(e: Event): void {
		value = (e.currentTarget as HTMLInputElement).value;
	}
</script>

<form class="url-form" onsubmit={handleSubmit} novalidate>
	<div class:error={!!error} class="input-wrap">
		<span class="url-icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
				<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
				<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
			</svg>
		</span>
		<input
			type="url"
			class="input url-input"
			{placeholder}
			bind:value
			oninput={onInput}
			{disabled}
			autocomplete="url"
			spellcheck="false"
			aria-label="URL to analyze"
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? 'url-error' : undefined}
		/>
	</div>
	{#if error}<p class="url-error" id="url-error">{error}</p>{/if}
</form>

<style>
	.url-form {
		width: 100%;
		position: relative;
	}
	.input-wrap {
		position: relative;
	}
	.url-icon {
		position: absolute;
		left: var(--space-md);
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-faint);
		display: inline-flex;
		pointer-events: none;
	}
	.url-input {
		padding-left: 44px;
		height: 52px;
		font-size: 16px;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-1);
	}
	.url-input:focus {
		padding-left: calc(44px - 1px);
	}
	.input-wrap.error .url-input {
		border-color: var(--accent);
	}
	.url-error {
		margin-top: var(--space-xs);
		font-size: 13px;
		color: var(--accent);
	}
</style>
