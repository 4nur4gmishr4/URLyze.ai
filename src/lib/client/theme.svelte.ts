import { browser } from '$app/environment';

/**
 * Theme state (Svelte 5 runes).
 *
 * The inline script in `src/app.html` already sets `data-theme` before first
 * paint to prevent FOUC — this store just keeps the UI in sync after
 * hydration and persists the user's choice.
 *
 * A module-level `$state` binding may not be reassigned once exported
 * (compile error in Svelte 5), so it is held as an object and mutated via
 * `value`. Components read `theme.value`.
 */

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'urlyze-theme';

function storedTheme(): Theme | null {
	if (!browser) return null;
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		if (v === 'light' || v === 'dark') return v;
	} catch {
		// localStorage unavailable (private mode / disabled) — use OS default.
	}
	return null;
}

function initialTheme(): Theme {
	return storedTheme() ?? (browser && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

/** Reactive theme store. Mutate `theme.value`; never reassign the binding. */
export const theme = $state<{ value: Theme }>({ value: initialTheme() });

/** Persist and apply the theme. `theme.value` is already reactive for the UI. */
export function setTheme(next: Theme): void {
	theme.value = next;
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, next);
	} catch {
		// Best-effort; the attribute still applies for this session.
	}
	document.documentElement.dataset.theme = next;
}

export function toggleTheme(): void {
	setTheme(theme.value === 'dark' ? 'light' : 'dark');
}
