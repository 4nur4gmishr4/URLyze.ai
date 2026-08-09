import { describe, it, expect, vi } from 'vitest';

// rate-limit/index.ts builds its limiter at import time from the validated
// env. Give it a memory config so importing the module is side-effect safe.
vi.mock('$lib/server/env', () => ({
	env: { RATE_LIMITER: 'memory', RATE_LIMIT_MAX: 5, RATE_LIMIT_WINDOW_S: 60 }
}));

import { ipKey } from '$lib/server/rate-limit';

import type { RequestEvent } from '@sveltejs/kit';

/** Build a mock RequestEvent. */
function mockEvent(ip?: string, shouldThrow = false): RequestEvent {
	return {
		getClientAddress: () => {
			if (shouldThrow) throw new Error('Not available');
			return ip ?? '127.0.0.1';
		}
	} as unknown as RequestEvent;
}

describe('rate-limit ipKey', () => {
	it('uses getClientAddress from the event', () => {
		expect(ipKey(mockEvent('1.2.3.4'))).toBe('1.2.3.4');
	});

	it('returns unknown-ip when getClientAddress throws', () => {
		expect(ipKey(mockEvent('1.2.3.4', true))).toBe('unknown-ip');
	});
});
