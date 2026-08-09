import { describe, it, expect } from 'vitest';
import { classifyQuality } from '$lib/server/content/quality';

describe('content/quality', () => {
	it('classifies a fallback extraction as LIMITED regardless of size', () => {
		expect(
			classifyQuality({ isFallback: true, wordCount: 5000, sourceType: 'YOUTUBE' })
		).toBe('LIMITED');
		expect(
			classifyQuality({ isFallback: true, wordCount: 10, sourceType: 'YOUTUBE' })
		).toBe('LIMITED');
	});

	it('classifies large complete extractions as HIGH', () => {
		expect(
			classifyQuality({ isFallback: false, wordCount: 500, sourceType: 'WEBPAGE' })
		).toBe('HIGH');
		expect(
			classifyQuality({ isFallback: false, wordCount: 10_000, sourceType: 'WEBPAGE' })
		).toBe('HIGH');
	});

	it('classifies medium extractions as GOOD', () => {
		expect(
			classifyQuality({ isFallback: false, wordCount: 80, sourceType: 'WEBPAGE' })
		).toBe('GOOD');
		expect(
			classifyQuality({ isFallback: false, wordCount: 499, sourceType: 'WEBPAGE' })
		).toBe('GOOD');
	});

	it('classifies short complete extractions as LIMITED', () => {
		expect(
			classifyQuality({ isFallback: false, wordCount: 79, sourceType: 'WEBPAGE' })
		).toBe('LIMITED');
		expect(classifyQuality({ isFallback: false, wordCount: 0, sourceType: 'WEBPAGE' })).toBe(
			'LIMITED'
		);
	});
});
