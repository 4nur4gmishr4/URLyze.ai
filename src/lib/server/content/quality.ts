import type { ExtractionQuality } from '$lib/types/analysis';

/**
 * Extraction quality classification.
 *
 * This is a trust feature, not a fake AI-confidence percentage. It answers
 * "how complete was the source content this analysis was built from?" with
 * three honest buckets the UI can show next to a result.
 */

export interface QualityInput {
	/** true when the extractor had to fall back to a weaker source. */
	isFallback: boolean;
	wordCount: number;
	sourceType: 'YOUTUBE' | 'WEBPAGE';
}

const MIN_WORDS_HIGH = 500;
const MIN_WORDS_GOOD = 80;

/** Classify extraction completeness into HIGH / GOOD / LIMITED. */
export function classifyQuality(input: QualityInput): ExtractionQuality {
	if (input.isFallback) {
		// Fallbacks (description instead of transcript) are honest LIMTIED.
		return 'LIMITED';
	}
	if (input.wordCount >= MIN_WORDS_HIGH) return 'HIGH';
	if (input.wordCount >= MIN_WORDS_GOOD) return 'GOOD';
	return 'LIMITED';
}
