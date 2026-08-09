import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	ApiError,
	analyze,
	listAnalyses,
	getAnalysis,
	deleteAnalysis,
	clearAllAnalyses
} from '$lib/client/api';
import type { AnalysisResult } from '$lib/types/analysis';

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

const RESULT: AnalysisResult = {
	id: 'row-1',
	title: 'The quick brown fox',
	sourceType: 'WEBPAGE',
	originalUrl: 'https://example.com/article',
	sourceMetadata: { domain: 'example.com', wordCount: 1200 },
	quality: 'HIGH',
	extractionLabel: 'Full article',
	model: 'gemini-2.5-flash',
	summary: 'A summary.',
	notes: 'Some notes.',
	pptContent: [{ title: 'Intro', points: ['a', 'b'] }],
	createdAt: '2026-08-09T12:00:00Z'
};

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('client/api', () => {
	describe('analyze', () => {
		it('POSTs the url and returns the artifacts', async () => {
			fetchMock.mockResolvedValue(jsonResponse(RESULT));
			const out = await analyze('https://example.com/article');
			expect(out.id).toBe(RESULT.id);
			const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
			expect(path).toBe('/api/analyze');
			expect(init.method).toBe('POST');
			expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
			expect(JSON.parse(String(init.body))).toEqual({ url: 'https://example.com/article' });
		});

		it('passes an abort signal through', async () => {
			fetchMock.mockResolvedValue(jsonResponse(RESULT));
			const controller = new AbortController();
			await analyze('https://example.com/x', controller.signal);
			expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBe(controller.signal);
		});

		it('throws ApiError(NETWORK_ERROR) when the fetch rejects', async () => {
			fetchMock.mockRejectedValue(new TypeError('failed to fetch'));
			const err = await analyze('https://example.com/x').then(() => null, (e) => e);
			expect(err).toBeInstanceOf(ApiError);
			expect(err.status).toBe(0);
			expect(err.code).toBe('NETWORK_ERROR');
		});
	});

	describe('error decoding', () => {
		it('carries status, code, message and requestId from the body', async () => {
			fetchMock.mockResolvedValue(
				jsonResponse(
					{ code: 'RATE_LIMITED', message: 'Slow down', detail: 'window', requestId: 'req-9' },
					429
				)
			);
			const err = await analyze('https://example.com/x').then(() => null, (e) => e);
			expect(err).toBeInstanceOf(ApiError);
			expect(err.status).toBe(429);
			expect(err.code).toBe('RATE_LIMITED');
			expect(err.message).toBe('Slow down');
			expect(err.requestId).toBe('req-9');
		});

		it('falls back to INTERNAL when the error body is not JSON', async () => {
			fetchMock.mockResolvedValue(new Response('oops', { status: 500 }));
			const err = await analyze('https://example.com/x').then(() => null, (e) => e);
			expect(err.status).toBe(500);
			expect(err.code).toBe('INTERNAL');
			expect(err.message).toBe('An unexpected error occurred');
		});
	});

	describe('listAnalyses', () => {
		it('sends only the params that are present', async () => {
			fetchMock.mockResolvedValue(jsonResponse({ rows: [], total: 0, limit: 50, offset: 0 }));
			await listAnalyses({});
			expect(fetchMock.mock.calls[0][0]).toBe('/api/analyses');
		});

		it('encodes search, sourceType, sort, limit and offset as query params', async () => {
			fetchMock.mockResolvedValue(jsonResponse({ rows: [], total: 0, limit: 10, offset: 20 }));
			await listAnalyses({
				search: 'gemini',
				sourceType: 'YOUTUBE',
				sort: 'oldest',
				limit: 10,
				offset: 20
			});
			const url = fetchMock.mock.calls[0][0] as string;
			expect(url).toContain('search=gemini');
			expect(url).toContain('sourceType=YOUTUBE');
			expect(url).toContain('sort=oldest');
			expect(url).toContain('limit=10');
			expect(url).toContain('offset=20');
		});
	});

	describe('single-row endpoints', () => {
		it('GETs one analysis by id (no method means GET)', async () => {
			fetchMock.mockResolvedValue(jsonResponse(RESULT));
			await getAnalysis('row-1');
			const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
			expect(path).toBe('/api/analyses/row-1');
			expect(init.method).toBeUndefined();
		});

		it('DELETEs one analysis', async () => {
			fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
			await deleteAnalysis('row-1');
			const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
			expect(path).toBe('/api/analyses/row-1');
			expect(init.method).toBe('DELETE');
		});

		it('DELETEs the whole history', async () => {
			fetchMock.mockResolvedValue(jsonResponse({ ok: true, deleted: 3 }));
			const out = await clearAllAnalyses();
			const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
			expect(path).toBe('/api/analyses');
			expect(init.method).toBe('DELETE');
			expect(out.deleted).toBe(3);
		});
	});
});
