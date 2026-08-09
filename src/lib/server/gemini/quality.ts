import type { Artifacts } from '$lib/types/analysis';

/**
 * Post-generation quality gate (spec §80).
 *
 * The model can return schema-valid JSON that is still garbage: empty strings,
 * a summary that repeats the notes verbatim, slides with no real points. This
 * gate rejects those before anything is persisted, so a bad generation can be
 * retried on the next model instead of being shown to the user.
 */

const MIN_SUMMARY_WORDS = 40;
const MIN_NOTES_CHARS = 120;
const MIN_POINTS_PER_SLIDE = 2;

function wordCount(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalized(text: string): string {
	return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** true when `notes` is mostly a copy of `summary` (a degenerate output). */
function isNearDuplicate(summary: string, notes: string): boolean {
	const aWords = new Set(normalized(summary).split(' ').filter(w => w.length > 3));
	const bWords = new Set(normalized(notes).split(' ').filter(w => w.length > 3));
	
	if (aWords.size === 0 || bWords.size === 0) return false;
	
	let intersection = 0;
	for (const word of aWords) {
		if (bWords.has(word)) intersection++;
	}
	
	const union = aWords.size + bWords.size - intersection;
	const jaccard = intersection / union;
	
	return jaccard > 0.8;
}

/** Validate a finished artifact set; returns an issue string or null when good. */
export function validateArtifacts(artifacts: Artifacts): string | null {
	const { summary, notes, pptContent } = artifacts;

	if (!summary.trim()) return 'summary is empty';
	if (wordCount(summary) < MIN_SUMMARY_WORDS) return 'summary is too short';

	if (!notes.trim()) return 'notes are empty';
	if (notes.trim().length < MIN_NOTES_CHARS) return 'notes are too short';

	if (!Array.isArray(pptContent) || pptContent.length === 0) return 'pptContent is empty';
	for (const slide of pptContent) {
		if (!slide.title.trim()) return 'a slide has no title';
		const points = (slide.points ?? []).filter((p) => p.trim());
		if (points.length < MIN_POINTS_PER_SLIDE) return 'a slide has too few points';
	}

	if (isNearDuplicate(summary, notes)) return 'summary duplicates notes';

	return null;
}
