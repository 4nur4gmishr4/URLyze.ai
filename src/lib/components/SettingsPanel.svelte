<script lang="ts">
	import Button from './Button.svelte';
	import { theme, setTheme } from '$lib/client/theme.svelte';

	/**
	 * Settings page body. Currently: appearance (theme) and a clear-history
	 * action. Every control updates server or persisted state immediately.
	 */

	let { onclear }: { onclear?: () => Promise<void> | void } = $props();

	let clearing = $state(false);
	let cleared = $state(false);

	async function clearHistory(): Promise<void> {
		if (clearing) return;
		clearing = true;
		cleared = false;
		try {
			await onclear?.();
			cleared = true;
		} finally {
			clearing = false;
		}
	}
</script>

<section class="settings">
	<div class="card">
		<h2 class="card-title">Appearance</h2>
		<p class="card-desc">Pick a theme. Your choice is saved on this device.</p>
		<div class="theme-options" role="radiogroup" aria-label="Theme">
			<label class:active={theme.value === 'light'} class="theme-option">
				<input
					type="radio"
					name="theme"
					value="light"
					checked={theme.value === 'light'}
					onchange={() => setTheme('light')}
				/>
				<span class="swatch swatch-light" aria-hidden="true"></span>
				<span>Light</span>
			</label>
			<label class:active={theme.value === 'dark'} class="theme-option">
				<input
					type="radio"
					name="theme"
					value="dark"
					checked={theme.value === 'dark'}
					onchange={() => setTheme('dark')}
				/>
				<span class="swatch swatch-dark" aria-hidden="true"></span>
				<span>Dark</span>
			</label>
		</div>
	</div>

	<div class="card">
		<h2 class="card-title">Data</h2>
		<p class="card-desc">Your analyses live on our server, tied to this browser. Clearing wipes them.</p>
		<Button variant="secondary" onclick={clearHistory} disabled={clearing}>
			{clearing ? 'Clearing…' : 'Clear all history'}
		</Button>
		{#if cleared}<p class="success">History cleared.</p>{/if}
	</div>
</section>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-lg);
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-lg);
		background: var(--surface-1);
		align-items: flex-start;
	}
	.card-title {
		margin: 0;
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 500;
	}
	.card-desc {
		margin: 0;
		font-size: 14px;
		line-height: 1.55;
		color: var(--text-secondary);
	}
	.theme-options {
		display: flex;
		gap: var(--space-sm);
	}
	.theme-option {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--border-soft);
		border-radius: var(--radius-md);
		cursor: pointer;
		font-size: 14px;
		color: var(--text-secondary);
		transition: border-color var(--duration-fast) var(--ease-out);
	}
	.theme-option.active {
		border-color: var(--accent);
		color: var(--text);
	}
	.theme-option input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.swatch {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 1px solid var(--border-strong);
	}
	.swatch-light {
		background: var(--swatch-light);
	}
	.swatch-dark {
		background: var(--swatch-dark);
	}
	.success {
		margin: 0;
		font-size: 13px;
		color: var(--accent);
	}
</style>
