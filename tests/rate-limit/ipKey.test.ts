import { describe, it, expect, vi } from 'vitest';

// rate-limit/index.ts builds its limiter at import time from the validated
// env. Give it a memory config so importing the module is side-effect safe.
vi.mock('$lib/server/env', () => ({
	env: { RATE_LIMITER: 'memory', RATE_LIMIT_MAX: 5, RATE_LIMIT_WINDOW_S: 60 }
}));

import { ipKey } from '$lib/server/rate-limit';

/** Build a Request with the given headers (a HeadersInit keeps types simple). */
function req(headers: Record<string, string>): Request {
	return new Request('https://urlyze.ai/api/analyze', { headers });
}

describe('rate-limit ipKey', () => {
	it('uses the first IP in x-forwarded-for', () => {
		expect(ipKey(req({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4');
	});

	it('trims whitespace around a single forwarded IP', () => {
		expect(ipKey(req({ 'x-forwarded-for': '  203.0.113.9  ' }))).toBe('203.0.113.9');
	});

	it('falls back to cf-connecting-ip when forwarded is missing', () => {
		expect(ipKey(req({ 'cf-connecting-ip': '198.51.100.7' }))).toBe('198.51.100.7');
	});

	it('prefers x-forwarded-for even when cf-connecting-ip exists', () => {
		expect(
			ipKey(req({ 'x-forwarded-for': '10.0.0.1', 'cf-connecting-ip': '198.51.100.7' }))
		).toBe('10.0.0.1');
	});

	it('ignores an empty forwarded list and uses the cf header', () => {
		expect(ipKey(req({ 'x-forwarded-for': '  ', 'cf-connecting-ip': '198.51.100.7' }))).toBe(
			'198.51.100.7'
		);
	});

	it('shares a bucket for requests with no IP headers', () => {
		expect(ipKey(req({}))).toBe('unknown-ip');
	});

	it('handles IPv6 in the forwarded chain', () => {
		expect(ipKey(req({ 'x-forwarded-for': '2001:db8::1, 5.6.7.8' }))).toBe('2001:db8::1');
	});
});
