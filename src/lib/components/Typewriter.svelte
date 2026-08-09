<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * Typewriter text effect for the landing hero. Cycles through a list of
	 * words, typing then pausing then deleting. Respects reduced motion by
	 * rendering the last word instantly.
	 */

	let {
		words,
		typeSpeed = 60,
		deleteSpeed = 30,
		pause = 1600
	}: {
		words: string[];
		typeSpeed?: number;
		deleteSpeed?: number;
		pause?: number;
	} = $props();

	let displayed = $state('');
	let reducedMotion = $state(false);

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reducedMotion) {
			displayed = words[words.length - 1] ?? '';
			return;
		}

		let wordIndex = 0;
		let charIndex = 0;
		let deleting = false;
		let timer: ReturnType<typeof setTimeout>;

		function tick(): void {
			const word = words[wordIndex % words.length];
			if (!word) return;

			if (deleting) {
				charIndex -= 1;
			} else {
				charIndex += 1;
			}

			displayed = word.slice(0, charIndex);

			let delay = deleting ? deleteSpeed : typeSpeed;
			if (!deleting && charIndex === word.length) {
				delay = pause;
				deleting = true;
			} else if (deleting && charIndex === 0) {
				deleting = false;
				wordIndex += 1;
				delay = typeSpeed;
			}

			timer = setTimeout(tick, delay);
		}

		timer = setTimeout(tick, typeSpeed);
		return () => clearTimeout(timer);
	});
</script>

<span class="typewriter" aria-live="off">
	{displayed}
	<span class="caret" aria-hidden="true"></span>
</span>

<style>
	.typewriter {
		white-space: nowrap;
	}
	.caret {
		display: inline-block;
		width: 2px;
		height: 1em;
		background: var(--accent);
		vertical-align: text-bottom;
		margin-left: 2px;
		animation: blink 1s step-end infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.caret {
			animation: none;
			opacity: 0;
		}
	}
</style>
