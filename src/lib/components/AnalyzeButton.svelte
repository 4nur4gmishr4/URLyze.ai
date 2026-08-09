<script lang="ts">
	/**
	 * Submit button for the analyze form. Shows a spinner while loading and
	 * switches to a distinct error state on failure. Disabled state keeps the
	 * button in place so the hero animation doesn't shift on click.
	 */

	let {
		loading = false,
		disabled = false
	}: {
		loading?: boolean;
		disabled?: boolean;
	} = $props();
</script>

<button
	type="submit"
	class="btn btn-primary analyze-btn"
	disabled={disabled || loading}
	aria-label={loading ? 'Analyzing…' : 'Analyze'}
>
	{#if loading}
		<span class="spinner" aria-hidden="true"></span>
		Analyzing…
	{:else}
		Analyze
	{/if}
</button>

<style>
	.analyze-btn {
		height: 52px;
		padding: 10px 32px;
		font-size: 16px;
		border-radius: var(--radius-lg);
		min-width: 160px;
	}
	.spinner {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
