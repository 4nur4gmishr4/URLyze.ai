import { describe, it, expect, vi } from 'vitest';
import { extractWebpage } from '$lib/server/extract/webpage';
import { AppError } from '$lib/types/errors';

const { fetchSafe } = vi.hoisted(() => ({ fetchSafe: vi.fn() }));
vi.mock('$lib/server/security/fetchSafe', () => ({ fetchSafe }));

const HTML = `<!doctype html>
<html lang="en">
<head>
	<title>Real Title</title>
	<meta name="description" content="A page description" />
	<meta property="og:title" content="Open Graph Title" />
	<meta property="og:locale" content="en_US" />
	<meta property="article:published_time" content="2026-01-01T00:00:00Z" />
</head>
<body>
	<nav><a href="/">Home</a></nav>
	<article>
		<h1>Heading</h1>
		<p>This is the first paragraph of the article body.</p>
		<p>And a second paragraph with some more useful text.</p>
		<ul><li>Bullet one</li><li>Bullet two</li></ul>
	</article>
	<script>console.log('nope')</script>
	<footer>Copyright 2026</footer>
	<div class="cookie-banner">Accept cookies</div>
</body>
</html>`;

function mockFetchSafe(response: Partial<{ status: number; ok: boolean; contentType: string; html: string }>) {
	fetchSafe.mockResolvedValue({
		status: response.status ?? 200,
		ok: response.ok ?? (response.status ?? 200) < 400,
		contentType: response.contentType ?? 'text/html',
		text: async () => response.html ?? ''
	});
}

describe('extract/webpage', () => {
	const TARGET_URL = new URL('https://example.com/article');

	it('extracts metadata, content, and quality', async () => {
		mockFetchSafe({ html: HTML });
		const out = await extractWebpage(TARGET_URL);

		expect(out.type).toBe('WEBPAGE');
		expect(out.title).toBe('Open Graph Title'); // og:title wins over <title>
		expect(out.metadata.description).toBe('A page description');
		expect(out.metadata.language).toBe('en'); // html lang attribute wins over og:locale
		expect(out.metadata.publishedAt).toBe('2026-01-01T00:00:00Z');
		expect(out.metadata.domain).toBe('example.com');

		expect(out.text).toContain('Heading');
		expect(out.text).toContain('first paragraph');
		// Boilerplate removed.
		expect(out.text).not.toContain('Home');
		expect(out.text).not.toContain('Copyright');
		expect(out.text).not.toContain('cookies');
		expect(out.text).not.toContain('console.log');

		expect(out.wordCount).toBeGreaterThan(0);
		expect(out.isFallback).toBe(false);
		expect(['HIGH', 'GOOD', 'LIMITED']).toContain(out.quality);
	});

	it('falls back to density extraction when no container matches', async () => {
		mockFetchSafe({
			html: '<div><p>Only a div paragraph to grab, hopefully long enough to pass the threshold.</p></div>'
		});
		const out = await extractWebpage(TARGET_URL);
		expect(out.text).toContain('Only a div paragraph');
	});

	it('throws EMPTY_CONTENT when nothing readable remains', async () => {
		mockFetchSafe({ html: '<html><body><nav>only nav</nav><script>x()</script></body></html>' });
		const err = await extractWebpage(TARGET_URL).then(() => null, (e) => e);
		expect(err instanceof AppError && err.code).toBe('EMPTY_CONTENT');
	});

	it('throws UNSUPPORTED_CONTENT_TYPE for non-HTML content', async () => {
		mockFetchSafe({ contentType: 'application/pdf', html: '%PDF-1.4' });
		const err = await extractWebpage(TARGET_URL).then(() => null, (e) => e);
		expect(err instanceof AppError && err.code).toBe('UNSUPPORTED_CONTENT_TYPE');
	});

	it('surfaces blocked-by-source on 429/403', async () => {
		mockFetchSafe({ status: 429, ok: false });
		const err = await extractWebpage(TARGET_URL).then(() => null, (e) => e);
		expect(err instanceof AppError && err.code).toBe('BLOCKED_BY_SOURCE');
	});

	it('surfaces HTTP_ERROR on other 4xx/5xx', async () => {
		mockFetchSafe({ status: 404, ok: false });
		const err = await extractWebpage(TARGET_URL).then(() => null, (e) => e);
		expect(err instanceof AppError && err.code).toBe('HTTP_ERROR');
	});
});
