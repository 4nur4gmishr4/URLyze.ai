<script lang="ts">
	import Logo from './Logo.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	/**
	 * Site header: animated logo, page links, theme toggle, and the analyze CTA.
	 * Sticky in every viewport so it stays visible while scrolling. On mobile the
	 * links collapse into a hamburger panel; transparent mode (hero) gains a solid
	 * background the moment the page scrolls.
	 */

	let { transparent = false }: { transparent?: boolean } = $props();

	let menuOpen = $state(false);
	let scrolled = $state(false);

	$effect(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 8;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	const links = [
		{ href: '/#how', label: 'How it works' },
		{ href: '/#trust', label: 'Why URLyze' },
		{ href: '/history', label: 'History' },
		{ href: '/privacy', label: 'Privacy' }
	];
</script>

<header
	class:transparent
	class:scrolled
	class:menu-open={menuOpen}
	class="navbar"
>
	<a href="/" class="brand" aria-label="URLyze home">
		<Logo size={30} />
		<span class="brand-name">URLyze</span>
	</a>

	<nav class="nav-links" aria-label="Main navigation">
		{#each links as link (link.href)}
			<a href={link.href} onclick={() => (menuOpen = false)}>{link.label}</a>
		{/each}
	</nav>

	<div class="navbar-actions">
		<ThemeToggle />
		<a href="/dashboard" class="btn btn-primary navbar-cta">Analyze a link</a>
		<button
			type="button"
			class="menu-toggle"
			aria-label={menuOpen ? 'Close menu' : 'Open menu'}
			aria-expanded={menuOpen}
			aria-controls="mobile-menu"
			onclick={() => (menuOpen = !menuOpen)}
		>
			<span class="bar" aria-hidden="true"></span>
			<span class="bar" aria-hidden="true"></span>
			<span class="bar" aria-hidden="true"></span>
		</button>
	</div>

	{#if menuOpen}
		<nav id="mobile-menu" class="mobile-menu" aria-label="Mobile navigation">
			{#each links as link (link.href)}
				<a href={link.href} onclick={() => (menuOpen = false)}>{link.label}</a>
			{/each}
			<a href="/dashboard" class="btn btn-primary mobile-cta" onclick={() => (menuOpen = false)}>
				Analyze a link
			</a>
		</nav>
	{/if}
</header>

<style>
	.navbar {
		position: sticky;
		top: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-xxl);
		border-bottom: 1px solid var(--border-soft);
		background: var(--bg);
	}
	.navbar.transparent {
		background: transparent;
		border-bottom-color: transparent;
	}
	.navbar.scrolled,
	.navbar.menu-open {
		background: var(--bg);
		border-bottom-color: var(--border-soft);
		box-shadow: 0 6px 24px rgb(0 0 0 / 0.06);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--text);
		text-decoration: none;
	}
	.brand-name {
		font-family: var(--font-display);
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.5px;
	}

	.nav-links {
		display: none;
		gap: var(--space-lg);
	}
	.nav-links a {
		font-size: 14px;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color 0.15s ease;
	}
	.nav-links a:hover {
		color: var(--accent);
	}

	.navbar-actions {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.navbar-cta {
		display: none;
	}

	.menu-toggle {
		display: inline-flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px;
		border: none;
		background: transparent;
		cursor: pointer;
	}
	.bar {
		width: 20px;
		height: 2px;
		border-radius: 2px;
		background: var(--text);
		transition: transform 0.2s ease, opacity 0.2s ease;
	}
	.menu-open .menu-toggle .bar:nth-child(1) {
		transform: translateY(6px) rotate(45deg);
	}
	.menu-open .menu-toggle .bar:nth-child(2) {
		opacity: 0;
	}
	.menu-open .menu-toggle .bar:nth-child(3) {
		transform: translateY(-6px) rotate(-45deg);
	}

	.mobile-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md) var(--space-xxl) var(--space-lg);
		background: var(--bg);
		border-bottom: 1px solid var(--border-soft);
		box-shadow: 0 12px 24px rgb(0 0 0 / 0.08);
	}
	.mobile-menu a {
		font-size: 15px;
		color: var(--text);
		text-decoration: none;
		padding: var(--space-xs) 0;
	}
	.mobile-menu a:hover {
		color: var(--accent);
	}
	.mobile-cta {
		justify-content: center;
		margin-top: var(--space-xs);
	}

	@media (min-width: 900px) {
		.nav-links {
			display: flex;
		}
		.navbar-cta {
			display: inline-flex;
		}
		.menu-toggle {
			display: none;
		}
		.mobile-menu {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.navbar {
			padding: var(--space-sm) var(--space-md);
		}
		.mobile-menu {
			padding: var(--space-md);
		}
	}
</style>
