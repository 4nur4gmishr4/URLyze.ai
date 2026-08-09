<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from './ThemeToggle.svelte';
	import AccountMenu from './AccountMenu.svelte';
	import type { SessionUser } from '$lib/types/session';

	/** App navigation. Collapses to a top bar on small screens. */

	let { user }: { user: SessionUser | null } = $props();
	const links = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'spark' },
		{ href: '/history', label: 'History', icon: 'clock' },
		{ href: '/settings', label: 'Settings', icon: 'gear' }
	];

	// Keep icon rendering in a lookup so the markup stays tidy.
	const ICONS: Record<string, string> = {
		spark: '<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z"/>',
		clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
	};
</script>

<aside class="sidebar">
	<a href="/" class="brand" aria-label="URLyze home">
		<span class="brand-mark" aria-hidden="true">◒</span>
		<span class="brand-name">URLyze</span>
	</a>

	<nav class="nav" aria-label="Main">
		{#each links as link (link.href)}
			<a
				href={link.href}
				class:active={page.url.pathname === link.href}
				class="nav-link"
				aria-current={page.url.pathname === link.href ? 'page' : undefined}
			>
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{@html ICONS[link.icon]}</svg>
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>

	<div class="sidebar-footer">
		<div class="account"><AccountMenu {user} /></div>
		<ThemeToggle />
	</div>
</aside>

<style>
	.sidebar {
		position: sticky;
		top: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xxl);
		padding: var(--space-lg) var(--space-md);
		border-right: 1px solid var(--border-soft);
		background: var(--surface-2);
		height: 100vh;
		flex-shrink: 0;
		width: 220px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--text);
		text-decoration: none;
	}
	.brand-mark {
		font-size: 22px;
		line-height: 1;
		color: var(--accent);
	}
	.brand-name {
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 500;
		letter-spacing: -0.5px;
	}
	.nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-xxs);
	}
	.nav-link {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: 14px;
		font-weight: 500;
		text-decoration: none;
		transition: background-color var(--duration-fast) var(--ease-out),
			color var(--duration-fast) var(--ease-out);
	}
	.nav-link:hover {
		background: var(--surface-accent-soft);
		color: var(--text);
	}
	.nav-link.active {
		background: var(--surface-accent);
		color: var(--accent);
	}
	.sidebar-footer {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-md);
	}
	.account {
		width: 100%;
	}

	@media (max-width: 768px) {
		.sidebar {
			position: static;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			height: auto;
			border-right: none;
			border-bottom: 1px solid var(--border-soft);
			gap: var(--space-md);
			padding: var(--space-sm) var(--space-md);
		}
		.nav {
			flex-direction: row;
			gap: var(--space-xxs);
		}
		.nav-link {
			padding: var(--space-xs) var(--space-sm);
		}
		.sidebar-footer {
			margin-top: 0;
		}
		.account {
			display: none;
		}
		.brand-name {
			display: none;
		}
	}
</style>
