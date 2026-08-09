import { describe, it, expect } from 'vitest';
import { buildUserPrompt, PROMPT_VERSION, SYSTEM_PROMPT } from '$lib/server/gemini/prompt';
import type { ExtractedContent } from '$lib/types/analysis';

const content = (over: Partial<ExtractedContent> = {}): ExtractedContent => ({
	type: 'WEBPAGE',
	title: 'The Title',
	text: 'The article body text.',
	isFallback: false,
	extractionLabel: 'Page text',
	metadata: { domain: 'example.com' },
	contentHash: 'x',
	wordCount: 10,
	quality: 'LIMITED',
	...over
});

describe('gemini/prompt', () => {
	it('embeds the source title and type', () => {
		const prompt = buildUserPrompt(content());
		expect(prompt).toContain('Source title: The Title');
		expect(prompt).toContain('Source type: webpage content');
	});

	it('labels YouTube sources as video transcripts', () => {
		const prompt = buildUserPrompt(content({ type: 'YOUTUBE' }));
		expect(prompt).toContain('Source type: video transcript');
	});

	it('warns the model about degraded fallback extraction', () => {
		const prompt = buildUserPrompt(content({ isFallback: true }));
		expect(prompt).toMatch(/degraded fallback/i);
		expect(prompt).toMatch(/do not invent detail/i);
	});

	it('delimits the source content clearly', () => {
		const prompt = buildUserPrompt(content({ text: 'SENSITIVE CONTENT HERE' }));
		expect(prompt).toContain('--- SOURCE CONTENT START ---');
		expect(prompt).toContain('SENSITIVE CONTENT HERE');
		expect(prompt).toContain('--- SOURCE CONTENT END ---');
	});

	it('asks for JSON artifacts', () => {
		expect(buildUserPrompt(content())).toContain('Produce the JSON artifacts now.');
	});

	it('declares a stable prompt version', () => {
		expect(PROMPT_VERSION).toMatch(/^v\d+$/);
	});

	it('locks the output contract to exactly three keys', () => {
		expect(SYSTEM_PROMPT).toContain('"summary"');
		expect(SYSTEM_PROMPT).toContain('"notes"');
		expect(SYSTEM_PROMPT).toContain('"pptContent"');
		expect(SYSTEM_PROMPT).toMatch(/single JSON object/);
	});
});
