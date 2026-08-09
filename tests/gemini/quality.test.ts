import { describe, it, expect } from 'vitest';
import { validateArtifacts } from '$lib/server/gemini/quality';
import type { Artifacts } from '$lib/types/analysis';

const valid = (over: Partial<Artifacts> = {}): Artifacts => ({
	summary:
		'A study of five hundred students found that distributed practice improved recall by twenty percent over cramming, and that the benefit held across three subject areas, suggesting educators should redesign homework schedules around short repeated sessions rather than long single blocks.',
	notes: 'This note body is deliberately long. It covers the core concepts, the main arguments, and a few worked examples so the markdown artifact is substantial and genuinely useful for revision.',
	pptContent: [
		{
			title: 'Introduction',
			points: ['The context and the problem', 'The thesis of the talk', 'Why it matters']
		}
	],
	...over
});

describe('gemini/quality', () => {
	it('passes a complete artifact set', () => {
		expect(validateArtifacts(valid())).toBeNull();
	});

	it('rejects an empty summary', () => {
		expect(validateArtifacts(valid({ summary: '   ' }))).toMatch(/summary is empty/);
	});

	it('rejects a summary under 40 words', () => {
		const short = 'way too short';
		expect(validateArtifacts(valid({ summary: short }))).toMatch(/summary is too short/);
	});

	it('rejects empty notes', () => {
		expect(validateArtifacts(valid({ notes: '' }))).toMatch(/notes are empty/);
	});

	it('rejects notes under 120 chars', () => {
		expect(validateArtifacts(valid({ notes: 'tiny notes' }))).toMatch(/notes are too short/);
	});

	it('rejects missing pptContent', () => {
		expect(validateArtifacts(valid({ pptContent: [] }))).toMatch(/pptContent is empty/);
	});

	it('rejects a slide without a title', () => {
		const artifacts = valid();
		artifacts.pptContent[0].title = '';
		expect(validateArtifacts(artifacts)).toMatch(/no title/);
	});

	it('rejects a slide with fewer than two non-empty points', () => {
		const artifacts = valid({ pptContent: [{ title: 'Slide', points: ['only one', '   '] }] });
		expect(validateArtifacts(artifacts)).toMatch(/too few points/);
	});

	it('rejects notes that mostly duplicate the summary', () => {
		// notes = summary + a small tail → >60% overlap → detected as degenerate echo.
		const summary = valid().summary;
		const notes = `${summary}. With a single extra sentence bolted on the end for length.`;
		expect(validateArtifacts(valid({ notes }))).toMatch(/summary duplicates notes/);
	});

	it('allows whitespace-heavy points to be ignored', () => {
		const artifacts = valid({
			pptContent: [{ title: 'Slide', points: ['real point', '   ', 'another real point'] }]
		});
		expect(validateArtifacts(artifacts)).toBeNull();
	});
});
