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
	<span class="kicker" data-hero>One URL in, three ways out.</span>
	<h1 class="headline" data-hero>
		Turn any link into
		<br />
		<span class="typewrap"><Typewriter words={['an executive sketch.', 'study notes.', 'a slide outline.']} /></span>
	</h1>
	<p class="sub" data-hero>
		Paste an article or a YouTube video. We read it, Gemini distills it, and you
		get three ready-to-use artifacts — executive sketch, study notes, slide outline.
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

	<p class="trust-line" data-hero>
		<span class="dot" aria-hidden="true"></span>
		No account. Free. Works in your language.
	</p>
</div>

<style>
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--space-md);
		padding: var(--space-xxl) var(--space-md) var(--space-xl);
		max-width: 720px;
		margin: 0 auto;
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
	.trust-line {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		margin: var(--space-xs) 0 0;
		font-size: 13px;
		color: var(--text-faint);
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
