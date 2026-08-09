import { describe, it, expect } from 'vitest';
import {
	canonicalize,
	canonicalizeWeb,
	canonicalizeYouTube,
	extractVideoId,
	isYouTubeHost,
	parseUrl
} from '$lib/server/url/normalize';
import { AppError } from '$lib/types/errors';

describe('url normalize', () => {
	describe('isYouTubeHost', () => {
		it('recognizes youtube.com and youtu.be variants', () => {
			expect(isYouTubeHost('youtube.com')).toBe(true);
			expect(isYouTubeHost('www.youtube.com')).toBe(true);
			expect(isYouTubeHost('m.youtube.com')).toBe(true);
			expect(isYouTubeHost('music.youtube.com')).toBe(true);
			expect(isYouTubeHost('youtu.be')).toBe(true);
			expect(isYouTubeHost('youtube-nocookie.com')).toBe(true);
		});

		it('rejects non-YouTube hosts', () => {
			expect(isYouTubeHost('example.com')).toBe(false);
			expect(isYouTubeHost('notyoutube.com')).toBe(false);
		});
	});

	describe('extractVideoId', () => {
		it('reads the v= parameter', () => {
			expect(extractVideoId(new URL('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))).toBe(
				'dQw4w9WgXcQ'
			);
		});

		it('reads youtu.be short links', () => {
			expect(extractVideoId(new URL('https://youtu.be/dQw4w9WgXcQ'))).toBe('dQw4w9WgXcQ');
		});

		it('reads shorts and embed paths', () => {
			expect(extractVideoId(new URL('https://youtube.com/shorts/AbCd123'))).toBe('AbCd123');
			expect(extractVideoId(new URL('https://www.youtube.com/embed/dQw4w9WgXcQ'))).toBe(
				'dQw4w9WgXcQ'
			);
		});

		it('returns null when not a video URL', () => {
			expect(extractVideoId(new URL('https://www.youtube.com/feed'))).toBeNull();
		});
	});

	describe('canonicalizeYouTube', () => {
		it('collapses all watch variants to one identity', () => {
			const watch = canonicalizeYouTube(new URL('https://www.youtube.com/watch?v=AbCd123'));
			const short = canonicalizeYouTube(new URL('https://youtu.be/AbCd123'));
			const shorts = canonicalizeYouTube(new URL('https://youtube.com/shorts/AbCd123'));
			expect(watch).toEqual({ canonical: 'YOUTUBE:AbCd123', url: 'https://www.youtube.com/watch?v=AbCd123' });
			expect(short.canonical).toBe(watch.canonical);
			expect(shorts.canonical).toBe(watch.canonical);
		});

		it('throws INVALID_URL when no video id exists', () => {
			expect(() => canonicalizeYouTube(new URL('https://www.youtube.com/feed'))).toThrowError(
				AppError
			);
		});
	});

	describe('canonicalizeWeb', () => {
		it('strips tracking parameters but keeps content-affecting ones', () => {
			const out = canonicalizeWeb(
				new URL('https://example.com/article?a=1&utm_source=x&gclid=yyy&id=42')
			);
			expect(out.canonical).toBe('WEB:https://example.com/article?a=1&id=42');
			expect(out.url).toBe('https://example.com/article?a=1&id=42');
		});

		it('lowercases hostname, drops hash and trailing slash, forces https', () => {
			const out = canonicalizeWeb(new URL('http://EXAMPLE.com/Article/?x=1#frag'));
			expect(out.url).toBe('https://example.com/Article?x=1');
		});

		it('collapses empty query to none', () => {
			expect(canonicalizeWeb(new URL('https://example.com/page?')).url).toBe(
				'https://example.com/page'
			);
		});
	});

	describe('parseUrl', () => {
		it('accepts http and https', () => {
			expect(parseUrl('http://example.com').protocol).toBe('http:');
			expect(parseUrl('https://example.com').protocol).toBe('https:');
		});

		it('throws INVALID_URL for malformed input', () => {
			expect(() => parseUrl('not a url')).toThrowError(AppError);
		});

		it('throws UNSUPPORTED_URL for non-http schemes', () => {
			const err = (() => {
				try {
					parseUrl('ftp://example.com');
				} catch (e) {
					return e;
				}
			})() as AppError;
			expect(err.code).toBe('UNSUPPORTED_URL');
		});
	});

	describe('canonicalize', () => {
		it('routes YouTube and web correctly', () => {
			expect(canonicalize('https://youtu.be/AbCd123').canonical).toBe('YOUTUBE:AbCd123');
			expect(canonicalize('https://example.com/x').canonical.startsWith('WEB:')).toBe(true);
		});

		it('collapses a utm-laden submission to the clean identity', () => {
			// utm_* is stripped; `ref` is not a known tracking param and www. is
			// preserved for web URLs, so both survive canonicalization.
			const out = canonicalize('https://www.example.com/post?utm_campaign=news&ref=home');
			expect(out.canonical).toBe('WEB:https://www.example.com/post?ref=home');
		});
	});
});
