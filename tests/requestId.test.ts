import { describe, it, expect } from 'vitest';
import { newRequestId } from '$lib/server/requestId';

describe('requestId', () => {
	it('returns a ULZ-XXXXX shaped id', () => {
		expect(newRequestId()).toMatch(/^ULZ-[A-Z2-9]{5}$/);
	});

	it('never emits the ambiguous letters I, O, 1, or 0', () => {
		for (let i = 0; i < 500; i++) {
			const id = newRequestId();
			expect(id).not.toMatch(/[IO10]/);
		}
	});

	it('produces distinct ids across many calls', () => {
		const seen = new Set<string>();
		for (let i = 0; i < 1000; i++) seen.add(newRequestId());
		expect(seen.size).toBe(1000);
	});

	it('is exactly 9 characters long (ULZ- + 5)', () => {
		for (let i = 0; i < 100; i++) {
			expect(newRequestId().length).toBe(9);
		}
	});
});
