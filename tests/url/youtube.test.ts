import { describe, it, expect } from 'vitest';
import { parseVideoId } from '$lib/server/extract/youtube';

const v = (url: string) => parseVideoId(new URL(url));

describe('extract/youtube parseVideoId', () => {
	it('pulls the id from a watch URL', () => {
		expect(v('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
	});

	it('drops the www subdomain', () => {
		expect(v('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
			v('https://youtube.com/watch?v=dQw4w9WgXcQ')
		);
	});

	it('reads the id from a youtu.be short link', () => {
		expect(v('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
	});

	it('reads the id from a youtu.be link with extra path segments', () => {
		expect(v('https://youtu.be/dQw4w9WgXcQ?t=42')).toBe('dQw4w9WgXcQ');
	});

	it('reads the id from a shorts URL', () => {
		expect(v('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
	});

	it('reads the id from an embed URL', () => {
		expect(v('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
	});

	it('prefers the watch query param over the path', () => {
		expect(v('https://www.youtube.com/shorts/abcdefghijk?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
	});

	it('returns null for a watch URL with no id', () => {
		expect(v('https://www.youtube.com/watch')).toBeNull();
	});

	it('returns null for a bare youtube.com homepage', () => {
		expect(v('https://www.youtube.com/')).toBeNull();
	});

	it('returns null for non-youtube hosts', () => {
		expect(v('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull();
	});
});
