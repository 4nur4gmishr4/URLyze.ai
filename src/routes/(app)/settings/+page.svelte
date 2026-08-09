<script lang="ts">
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import { clearAllAnalyses, ApiError } from '$lib/client/api';

	/** Settings — appearance and data controls. */

	let clearError = $state('');

	async function clearHistory(): Promise<void> {
		clearError = '';
		try {
			await clearAllAnalyses();
		} catch (e) {
			clearError = e instanceof ApiError ? e.message : 'Could not clear history.';
			throw e; // let the panel reset its busy state
		}
	}
</script>

<div class="settings-page">
	<header class="page-head">
		<h1 class="page-title">Settings</h1>
		<p class="page-sub">Appearance and data</p>
	</header>

	{#if clearError}
		<p class="clear-error" role="alert">{clearError}</p>
	{/if}

	<SettingsPanel onclear={clearHistory} />
</div>

<style>
	.settings-page {
		max-width: 720px;
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.page-head {
		display: flex;
		flex-direction: column;
		gap: var(--space-xxs);
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
	.clear-error {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--border-accent);
		border-radius: var(--radius-md);
		background: var(--surface-accent-soft);
		color: var(--accent);
		font-size: 14px;
	}
</style>
