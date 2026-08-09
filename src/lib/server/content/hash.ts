import { createHash } from 'node:crypto';

/**
 * Deterministic content hashing.
 *
 * Same URL + same normalized content must produce the same hash so we can
 * distinguish "same source, unchanged" (cache hit) from "same source, edited"
 * (must re-analyze). Whitespace is collapsed so tiny formatting changes don't
 * spuriously invalidate a cached analysis.
 */

/** Normalize text enough that formatting drift doesn't change the hash. */
export function normalizeForHash(text: string): string {
	return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** sha-256 hex digest of the normalized content. */
export function contentHash(text: string): string {
	return createHash('sha256').update(normalizeForHash(text)).digest('hex');
}

/** Word count of the extracted text (approximate, split on whitespace). */
export function countWords(text: string): number {
	const trimmed = text.trim();
	if (trimmed.length === 0) return 0;
	return trimmed.split(/\s+/).length;
}
