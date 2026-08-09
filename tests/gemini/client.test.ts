import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ExtractedContent } from '$lib/types/analysis';

const envMock = vi.hoisted(() => ({
	GEMINI_API_KEY: 'test-key',
	GEMINI_MODELS: ['gemini-2.5-flash', 'gemini-2.0-flash']
}));

const { logMock } = vi.hoisted(() => ({
	logMock: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

vi.mock('$lib/server/env', () => ({ env: envMock }));
vi.mock('$lib/server/logging', () => ({ log: logMock }));

import { generateArtifacts } from '$lib/server/gemini/client';

const CONTENT: ExtractedContent = {
	type: 'WEBPAGE',
	title: 'Test article',
	text: 'A reasonably long body of text to summarize.',
	isFallback: false,
	extractionLabel: 'Full article',
	metadata: { domain: 'example.com' },
	contentHash: 'hash',
	wordCount: 10,
	quality: 'HIGH'
};

/** A generation that passes both the zod schema and the quality gate. */
const VALID_ARTIFACTS = {
	summary: Array.from({ length: 45 }, () => 'word').join(' '),
	notes: 'Notes with ' + 'detail '.repeat(60) + 'enough length.',
	pptContent: [
		{ title: 'Intro', points: ['First point', 'Second point'] },
		{ title: 'Body', points: ['Alpha', 'Beta', 'Gamma'] }
	]
};

function geminiResponse(text: string, status = 200): Response {
	return new Response(
		JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
		{ status, headers: { 'content-type': 'application/json' } }
	);
}

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('server/gemini/client', () => {
	it('returns artifacts plus provenance from the first model', async () => {
		fetchMock.mockResolvedValue(geminiResponse(JSON.stringify(VALID_ARTIFACTS)));
		const result = await generateArtifacts(CONTENT);
		expect(result?.artifacts).toEqual(VALID_ARTIFACTS);
		expect(result?.model).toBe('gemini-2.5-flash');
		expect(result?.promptVersion).toBe('v2');
	});

	it('sends the API key in a header, never in the URL', async () => {
		fetchMock.mockResolvedValue(geminiResponse(JSON.stringify(VALID_ARTIFACTS)));
		await generateArtifacts(CONTENT);
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(
			'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
		);
		expect(url).not.toContain('test-key');
		const headers = init.headers as Record<string, string>;
		expect(headers['x-goog-api-key']).toBe('test-key');
	});

	it('falls back to the next model when the first returns an error status', async () => {
		fetchMock
			.mockResolvedValueOnce(geminiResponse('', 500))
			.mockResolvedValueOnce(geminiResponse(JSON.stringify(VALID_ARTIFACTS)));
		const result = await generateArtifacts(CONTENT);
		expect(result?.model).toBe('gemini-2.0-flash');
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('falls back when the first model returns unparseable text', async () => {
		fetchMock
			.mockResolvedValueOnce(geminiResponse('not json at all'))
			.mockResolvedValueOnce(geminiResponse(JSON.stringify(VALID_ARTIFACTS)));
		const result = await generateArtifacts(CONTENT);
		expect(result?.model).toBe('gemini-2.0-flash');
	});

	it('falls back when the first model fails the quality gate', async () => {
		const garbage = {
			summary: 'too short',
			notes: 'x'.repeat(200),
			pptContent: [{ title: 'Title', points: ['a', 'b'] }]
		};
		fetchMock
			.mockResolvedValueOnce(geminiResponse(JSON.stringify(garbage)))
			.mockResolvedValueOnce(geminiResponse(JSON.stringify(VALID_ARTIFACTS)));
		const result = await generateArtifacts(CONTENT);
		expect(result?.model).toBe('gemini-2.0-flash');
	});

	it('returns null when every model fails', async () => {
		fetchMock.mockResolvedValue(geminiResponse('not json'));
		expect(await generateArtifacts(CONTENT)).toBeNull();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('returns null on a network failure', async () => {
		fetchMock.mockRejectedValue(new TypeError('boom'));
		expect(await generateArtifacts(CONTENT)).toBeNull();
	});

	it('returns null on a timeout (abort)', async () => {
		fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'));
		expect(await generateArtifacts(CONTENT)).toBeNull();
	});

	it('returns null when candidates are empty', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ candidates: [] }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);
		expect(await generateArtifacts(CONTENT)).toBeNull();
	});
});
