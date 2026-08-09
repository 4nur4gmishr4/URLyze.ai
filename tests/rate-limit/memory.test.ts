import { describe, it, expect } from 'vitest';
import { MemoryRateLimiter } from '$lib/server/rate-limit/memory';

describe('rate-limit/memory', () => {
	it('allows requests up to the limit', () => {
		const rl = new MemoryRateLimiter(3, 60);
		for (let i = 0; i < 3; i++) {
			const res = rl.limit('a', 1000);
			expect(res.success).toBe(true);
			expect(res.remaining).toBe(3 - i - 1);
		}
	});

	it('blocks when the window is exhausted', () => {
		const rl = new MemoryRateLimiter(2, 60);
		rl.limit('a', 1000);
		rl.limit('a', 1000);
		const res = rl.limit('a', 1000);
		expect(res.success).toBe(false);
		expect(res.remaining).toBe(0);
	});

	it('tracks keys independently', () => {
		const rl = new MemoryRateLimiter(1, 60);
		expect(rl.limit('a', 1000).success).toBe(true);
		expect(rl.limit('a', 1000).success).toBe(false);
		expect(rl.limit('b', 1000).success).toBe(true);
	});

	it('reopens the window after it expires', () => {
		const rl = new MemoryRateLimiter(1, 60);
		expect(rl.limit('a', 0).success).toBe(true);
		expect(rl.limit('a', 0).success).toBe(false);
		// 61s later the old hit has aged out.
		expect(rl.limit('a', 61_000).success).toBe(true);
	});

	it('reports a positive reset value even when blocked', () => {
		const rl = new MemoryRateLimiter(1, 10);
		rl.limit('a', 0);
		const res = rl.limit('a', 5_000);
		expect(res.success).toBe(false);
		expect(res.reset).toBeGreaterThan(0);
	});
});
