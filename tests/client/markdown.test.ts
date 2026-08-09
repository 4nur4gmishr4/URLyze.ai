import { describe, it, expect } from 'vitest';
import { renderMarkdown, pruneMarkdownCache } from '$lib/client/markdown';

describe('client/markdown', () => {
	// Runs first so the module cache starts empty: the oldest entry is the
	// one this test seeded itself, which makes the eviction deterministic.
	it('evicts the oldest entry when over the cap', async () => {
		for (let i = 0; i < 33; i++) {
			await renderMarkdown(`prune-${i}`, `# Item ${i}`);
		}
		pruneMarkdownCache(30);
		// The oldest entry (prune-0) was evicted, so a new call re-renders.
		expect(await renderMarkdown('prune-0', '# Evicted')).toContain('Evicted');
		// A newer entry is still cached, so old content wins.
		expect(await renderMarkdown('prune-5', '# Changed')).toContain('Item 5');
	});

	it('keeps the cache untouched while under the cap', async () => {
		await renderMarkdown('keep-1', '# Keep');
		pruneMarkdownCache(30);
		expect(await renderMarkdown('keep-1', '# Changed')).toContain('Keep');
	});

	it('renders markdown to HTML', async () => {
		const html = await renderMarkdown('md-1', '# Title\n\nSome **bold** text.');
		expect(html).toContain('<h1>Title</h1>');
		expect(html).toContain('<strong>bold</strong>');
	});

	it('never passes raw HTML through from model output', async () => {
		const html = await renderMarkdown('md-2', 'hello <script>alert(1)</script> world');
		expect(html).not.toContain('<script>');
		expect(html).toContain('hello');
		expect(html).toContain('world');
	});

	it('caches per analysis id', async () => {
		const first = await renderMarkdown('md-3', '# Original');
		const again = await renderMarkdown('md-3', '# Changed');
		expect(again).toBe(first);
		expect(again).toContain('Original');
	});
});
