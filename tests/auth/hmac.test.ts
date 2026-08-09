import { describe, it, expect, vi } from 'vitest';

const envMock = vi.hoisted(() => ({
	SESSION_SECRET: 'a-fixed-32+char-session-secret-for-tests'
}));
vi.mock('$lib/server/env', () => ({ env: envMock }));

import { sign, verify, safeEqual } from '$lib/server/auth/hmac';

describe('hmac', () => {
	it('produces value.signature and verifies it back', () => {
		const token = sign('user:abc-123');
		expect(token).toMatch(/^user:abc-123\.[A-Za-z0-9_-]+$/);
		expect(verify(token)).toBe('user:abc-123');
	});

	it('returns null for a value without the signature separator', () => {
		expect(verify('user:abc-123')).toBeNull();
		expect(verify('')).toBeNull();
	});

	it('rejects a tampered signature', () => {
		const [value, sig] = sign('user:abc-123').split('.');
		const flipped = (sig as string).replace(/./, (c) => (c === 'A' ? 'B' : 'A'));
		expect(verify(`${value}.${flipped}`)).toBeNull();
	});

	it('rejects a tampered value', () => {
		const good = sign('user:abc-123');
		const tampered = good.replace('user:abc-123', 'user:abc-999');
		expect(verify(tampered)).toBeNull();
	});

	it('safeequal agrees on identical strings and disagrees otherwise', () => {
		expect(safeEqual('abc', 'abc')).toBe(true);
		expect(safeEqual('abc', 'abd')).toBe(false);
		expect(safeEqual('abc', 'abcd')).toBe(false);
	});
});
