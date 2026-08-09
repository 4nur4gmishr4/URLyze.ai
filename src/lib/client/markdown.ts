import type { AnalysisResult } from '$lib/types/analysis';

/**
 * Markdown rendering for LLM output.
 *
 * micromark defaults to `html: false`, so raw HTML in model output is never
 * passed through — the only XSS surface from generated content is closed.
 * Rendered lazily and cached per analysis so switching artifacts doesn't
 * re-parse the same text.
 */

const cache = new Map<string, string>();

/** Render an artifact's markdown to safe HTML, cached by analysis id. */
export async function renderMarkdown(analysisId: string, text: string): Promise<string> {
	const hit = cache.get(analysisId);
	if (hit !== undefined) return hit;

	const { micromark } = await import('micromark');
	const html = micromark(text, { allowDangerousHtml: false });
	cache.set(analysisId, html);
	return html;
}

/** Bounded-cache variant: drop the oldest entry once the cache grows large. */
export function pruneMarkdownCache(maxEntries = 30): void {
	if (cache.size <= maxEntries) return;
	const oldest = cache.keys().next().value;
	if (oldest !== undefined) cache.delete(oldest);
}

/** Type helper so callers pass the right artifact fields. */
export type MarkdownArtifact = Pick<AnalysisResult, 'id' | 'notes'>;
