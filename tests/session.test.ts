import { describe, it, expect, vi, beforeEach } from 'vitest';

const envMock = vi.hoisted(() => ({
	SESSION_SECRET: 'a-fixed-32+char-session-secret-for-tests'
}));
const logMock = vi.hoisted(() => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn() }));
vi.mock('$lib/server/env', () => ({ env: envMock }));
vi.mock('$lib/server/logging', () => ({ log: logMock }));

import { ensureSessionId, SESSION_COOKIE, SESSION_MAX_AGE } from '$lib/server/session';

/** Mocked cookie jar whose get/set keep their vi.fn type for .mock assertions. */
interface MockCookies {
	get: ReturnType<typeof vi.fn>;
	set: ReturnType<typeof vi.fn>;
}

/** Minimal RequestEvent-shaped object with a cookie jar we can inspect. */
function makeEvent(): { cookies: MockCookies } {
	const jar = new Map<string, string>();
	return {
		cookies: {
			get: vi.fn((name: string) => jar.get(name) ?? null),
			set: vi.fn((name: string, value: string, opts: Record<string, unknown>) => {
				jar.set(name, value);
				void opts;
			})
		}
	};
}

/** Cast the mock jar to the real RequestEvent shape only at the call boundary. */
function asRequestEvent(event: { cookies: MockCookies }): Parameters<typeof ensureSessionId>[0] {
	return event as unknown as Parameters<typeof ensureSessionId>[0];
}

describe('session', () => {
	beforeEach(() => {
		logMock.warn.mockClear();
	});

	it('creates a session id and writes a signed cookie', () => {
		const event = makeEvent();
		const id = ensureSessionId(asRequestEvent(event));
		expect(id).toMatch(/^[0-9a-f-]{36}$/); // uuid
		const [name, value, opts] = event.cookies.set.mock.calls[0];
		expect(name).toBe(SESSION_COOKIE);
		expect(value).toMatch(/^[0-9a-f-]{36}\.[A-Za-z0-9_-]+$/); // id.signature
		expect(opts.httpOnly).toBe(true);
		expect(opts.sameSite).toBe('lax');
		expect(opts.secure).toBe(true);
		expect(opts.maxAge).toBe(SESSION_MAX_AGE);
	});

	it('reuses a valid cookie instead of minting a new id', () => {
		const first = makeEvent();
		const id1 = ensureSessionId(asRequestEvent(first));

		const second = makeEvent();
		second.cookies.get.mockReturnValue(first.cookies.set.mock.calls[0][1]);
		const id2 = ensureSessionId(asRequestEvent(second));

		expect(id2).toBe(id1);
	});

	it('rejects a cookie with a tampered signature', () => {
		const event = makeEvent();
		ensureSessionId(asRequestEvent(event));
		const good = event.cookies.set.mock.calls[0][1] as string;
		const [id, sig] = good.split('.');
		// Flip one character in the signature.
		const badSig = (sig ?? '').replace(/./, (c) => (c === 'A' ? 'B' : 'A'));
		const fresh = makeEvent();
		fresh.cookies.get.mockReturnValue(`${id}.${badSig}`);
		const newId = ensureSessionId(asRequestEvent(fresh));
		expect(newId).not.toBe(id);
		expect(logMock.warn).toHaveBeenCalled();
	});

	it('rejects a cookie missing the signature separator', () => {
		const event = makeEvent();
		ensureSessionId(asRequestEvent(event));
		const [id] = (event.cookies.set.mock.calls[0][1] as string).split('.');
		const fresh = makeEvent();
		fresh.cookies.get.mockReturnValue(id); // bare id, no .sig
		expect(ensureSessionId(asRequestEvent(fresh))).not.toBe(id);
	});
});
