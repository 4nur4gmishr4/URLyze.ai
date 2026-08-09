import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Scroll-reveal Svelte action.
 *
 * Fades a section up as it enters the viewport. When the node contains
 * `[data-reveal-item]` children, those animate in sequence instead of the whole
 * block. Skips entirely under `prefers-reduced-motion`; ScrollTrigger is killed
 * on destroy so a section can never fire after it is removed.
 *
 * SSR-safe: actions only run on the client, and the guard double-checks for
 * unit-test environments where `window` does not exist.
 */
export function scrollReveal(
	node: HTMLElement,
	opts?: { y?: number; stagger?: number; duration?: number }
): { destroy: () => void } {
	if (typeof window === 'undefined') return { destroy: () => {} };
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return { destroy: () => {} };
	}

	gsap.registerPlugin(ScrollTrigger);

	const items = Array.from(node.querySelectorAll<HTMLElement>('[data-reveal-item]'));
	const targets: gsap.TweenTarget[] = items.length ? items : [node];

	const tween = gsap.from(targets, {
		y: opts?.y ?? 20,
		opacity: 0,
		duration: opts?.duration ?? 0.6,
		stagger: items.length ? opts?.stagger ?? 0.08 : 0,
		ease: 'power2.out',
		scrollTrigger: {
			trigger: node,
			start: 'top 86%',
			once: true
		}
	});

	return {
		destroy() {
			tween.scrollTrigger?.kill();
			tween.kill();
		}
	};
}
