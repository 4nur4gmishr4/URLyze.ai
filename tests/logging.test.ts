import { describe, it, expect, vi, afterEach } from 'vitest';
import { sanitizeUrl, log } from '$lib/server/logging';

describe('logging', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('sanitizeUrl', () => {
		it('reduces a URL to its hostname', () => {
			expect(sanitizeUrl('https://example.com/path?utm=x&secret=1')).toBe('example.com');
		});

		it('drops the port and path — hostname only', () => {
			expect(sanitizeUrl('https://example.com:8080/x')).toBe('example.com');
		});

		it('returns a placeholder for unparseable input', () => {
			expect(sanitizeUrl('not a url')).toBe('<invalid-url>');
		});
	});

	describe('log.write', () => {
		it('logs a plain message without meta', () => {
			const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
			log.info('hello');
			expect(spy).toHaveBeenCalledWith('[urlyze:info] hello');
		});

		it('appends JSON meta when provided', () => {
			const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
			log.info('analyzed', { host: 'example.com', count: 2 });
			expect(spy).toHaveBeenCalledWith('[urlyze:info] analyzed', '{"host":"example.com","count":2}');
		});

		it('routes warn and error to the matching console channel', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const error = vi.spyOn(console, 'error').mockImplementation(() => {});
			log.warn('careful');
			log.error('boom');
			expect(warn).toHaveBeenCalledWith('[urlyze:warn] careful');
			expect(error).toHaveBeenCalledWith('[urlyze:error] boom');
		});
	});
});
