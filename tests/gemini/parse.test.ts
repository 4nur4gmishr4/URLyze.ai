import { describe, it, expect } from 'vitest';
import { parseArtifacts, stripCodeFences } from '$lib/server/gemini/parse';

const VALID = {
	summary: 'An executive sketch of the article.',
	notes: 'Point one.\nPoint two.',
	pptContent: [
		{ title: 'Intro', points: ['What this is'] },
		{ title: 'Takeaways', points: ['A', 'B'] }
	]
};

describe('gemini/parse', () => {
	describe('stripCodeFences', () => {
		it('removes json fenced blocks', () => {
			expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
		});

		it('removes bare fenced blocks', () => {
			expect(stripCodeFences('```\n{"a":1}\n```')).toBe('{"a":1}');
		});

		it('leaves unfenced text untouched', () => {
			expect(stripCodeFences('{"a":1}')).toBe('{"a":1}');
		});
	});

	describe('parseArtifacts', () => {
		it('parses plain JSON', () => {
			expect(parseArtifacts(JSON.stringify(VALID))).toEqual(VALID);
		});

		it('parses fenced JSON', () => {
			expect(parseArtifacts(`~~~json\n${JSON.stringify(VALID)}\n~~~`)).toBeNull(); // non ``` fences are not unwrapped
		});

		it('parses triple-backtick fenced JSON', () => {
			expect(parseArtifacts('```json\n' + JSON.stringify(VALID) + '\n```')).toEqual(VALID);
		});

		it('returns null for non-JSON output', () => {
			expect(parseArtifacts('Sure, here is a summary: ...')).toBeNull();
		});

		it('returns null for schema-invalid JSON', () => {
			const missing = { summary: 'only summary' };
			expect(parseArtifacts(JSON.stringify(missing))).toBeNull();
		});

		it('returns null for an empty string', () => {
			expect(parseArtifacts('')).toBeNull();
		});
	});
});
