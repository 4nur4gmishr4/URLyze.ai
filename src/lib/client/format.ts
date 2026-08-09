/**
 * Small formatting helpers shared across components. Pure functions so they
 * are easy to test and keep presentational components free of logic.
 */

/** `2026-08-09T12:00:00Z` → `9 Aug 2026` (stable, no locale ambiguity). */
export function formatDate(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Relative time like `2h ago` for the history list. */
export function relativeTime(iso: string): string {
	const then = new Date(iso).getTime();
	const diff = Date.now() - then;
	if (Number.isNaN(then)) return '';
	const min = Math.floor(diff / 60_000);
	if (min < 1) return 'just now';
	if (min < 60) return `${min}m ago`;
	const hr = Math.floor(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const day = Math.floor(hr / 24);
	if (day < 30) return `${day}d ago`;
	const mo = Math.floor(day / 30);
	return `${mo}mo ago`;
}

/** 1243 → `1,243 words`. */
export function formatWordCount(n: number | undefined): string {
	if (n === undefined) return '';
	return `${n.toLocaleString('en-US')} words`;
}

/** 7542 → `~13 min read` (200 wpm). */
export function readingMinutes(n: number | undefined): string {
	if (n === undefined) return '';
	const min = Math.max(1, Math.round(n / 200));
	return `~${min} min read`;
}

/** `e.g. 4200` → `1h 10m` for a video duration in seconds. */
export function formatDuration(totalSeconds: number | undefined): string {
	if (totalSeconds === undefined) return '';
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	if (h > 0) return `${h}h ${m}m`;
	return `${m}m`;
}
