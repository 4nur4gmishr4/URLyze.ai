<script lang="ts">
	import { theme, toggleTheme } from '$lib/client/theme.svelte';
</script>

<button
	class="theme-toggle"
	onclick={toggleTheme}
	aria-label={theme.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
	title={theme.value === 'dark' ? 'Light mode' : 'Dark mode'}
>
	{#if theme.value === 'dark'}
		<span class="icon sun" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<circle cx="12" cy="12" r="4" />
				<line x1="12" y1="2" x2="12" y2="5" />
				<line x1="12" y1="19" x2="12" y2="22" />
				<line x1="2" y1="12" x2="5" y2="12" />
				<line x1="19" y1="12" x2="22" y2="12" />
				<line x1="4.9" y1="4.9" x2="7" y2="7" />
				<line x1="17" y1="17" x2="19.1" y2="19.1" />
				<line x1="4.9" y1="19.1" x2="7" y2="17" />
				<line x1="17" y1="7" x2="19.1" y2="4.9" />
			</svg>
		</span>
	{:else}
		<span class="icon moon" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
			</svg>
		</span>
	{/if}
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--surface-1);
		color: var(--text-secondary);
		transition: color var(--duration-fast) var(--ease-out),
			border-color var(--duration-fast) var(--ease-out);
	}
	.theme-toggle:hover {
		color: var(--accent);
		border-color: var(--border-strong);
	}
	.icon {
		display: inline-flex;
	}
</style>
