<script lang="ts">
	import { onMount } from 'svelte';
	import Typewriter from './Typewriter.svelte';
	import UrlInput from './UrlInput.svelte';
	import AnalyzeButton from './AnalyzeButton.svelte';
	import { gsap } from 'gsap';

	/**
	 * Landing hero: headline, typewriter tagline, and the URL entry form.
	 * GSAP does a light staggered entrance — disabled under reduced motion and
	 * skipped entirely on first paint so content is never hidden.
	 */

	let { loading, error, onsubmit }: {
		loading: boolean;
		error: string;
		onsubmit: (url: string) => void;
	} = $props();

	let root: HTMLDivElement;
	let reducedMotion = false;

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reducedMotion || !root) return;

		const ctx = gsap.context(() => {
			gsap.from('[data-hero]', {
				y: 18,
				opacity: 0,
				duration: 0.7,
				stagger: 0.08,
				ease: 'power2.out'
			});
		}, root);
		return () => ctx.revert();
	});
</script>

<div bind:this={root} class="hero" data-hero-root>
	<span class="kicker" data-hero>One link in, three documents out.</span>
	<h1
		class="headline"
		data-hero
		aria-label="Turn any link into an executive sketch, study notes, or a slide outline."
	>
		Turn any link into
		<br />
		<span class="typewrap"><Typewriter words={['an executive sketch.', 'study notes.', 'a slide outline.']} /></span>
	</h1>
	<p class="sub" data-hero>
		Paste an article, a blog post, or a YouTube video. We read the whole thing for
		you, pull out the key ideas, and hand back three clean documents. One for a
		fast read, one for real studying, one for presenting to other people.
	</p>

	<form
		data-hero
		class="analyze-form"
		onsubmit={(e) => {
			e.preventDefault();
			onsubmit((e.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>('input')?.value ?? '');
		}}
	>
		<UrlInput {error} disabled={loading} onsubmit={onsubmit} />
		<AnalyzeButton {loading} disabled={loading} />
	</form>

	<div class="perks" data-hero>
		<span class="perk">
			<span class="dot" aria-hidden="true"></span>
			No account needed
		</span>
		<span class="perk">
			<span class="dot" aria-hidden="true"></span>
			Free to use
		</span>
		<span class="perk">
			<span class="dot" aria-hidden="true"></span>
			Works with any language
		</span>
	</div>
</div>

<style>
	.hero {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: var(--space-md);
		padding: var(--space-xxl) var(--space-md);
		min-height: 100vh;
		min-height: calc(100svh - 69px);
		overflow: hidden;
	}
	.hero::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.06;
		background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
		background-size: 128px 128px;
		/* Grain covers the full screen and fades out at the bottom, just
		   above the How it works section. */
		-webkit-mask-image: linear-gradient(to bottom, black 55%, transparent 100%);
		mask-image: linear-gradient(to bottom, black 55%, transparent 100%);
	}
	.kicker {
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
	}
	.headline {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(32px, 6vw, 56px);
		line-height: 1.08;
		letter-spacing: -0.03em;
		font-weight: 400;
	}
	.typewrap {
		color: var(--accent);
	}
	.sub {
		margin: 0;
		max-width: 520px;
		font-size: 16px;
		line-height: 1.65;
		color: var(--text-secondary);
	}
	.analyze-form {
		display: flex;
		gap: var(--space-sm);
		align-items: flex-start;
		width: 100%;
		max-width: 640px;
		margin-top: var(--space-sm);
	}
	.analyze-form :global(.url-form) {
		flex: 1;
	}
	.perks {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: var(--space-md);
		margin: var(--space-xs) 0 0;
	}
	.perk {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: 13px;
		color: var(--text-secondary);
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--accent);
	}

	@media (max-width: 640px) {
		.analyze-form {
			flex-direction: column;
		}
		.analyze-form :global(.analyze-btn) {
			width: 100%;
		}
	}
</style>
