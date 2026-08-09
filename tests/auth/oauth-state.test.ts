import { describe, it, expect, vi } from 'vitest';
import type { Cookies } from '@sveltejs/kit';

const envMock = vi.hoisted(() => ({
	SESSION_SECRET: 'a-fixed-32+char-session-secret-for-tests'
}));
vi.mock('$lib/server/env', () => ({ env: envMock }));

import {
	OAUTH_STATE_COOKIE,
	consumeOAuthStateCookie,
	newOAuthState,
	pkceChallenge,
	setOAuthStateCookie,
	stateMatches
} from '$lib/server/auth/oauth-state';

/** In-memory cookie jar shaped like SvelteKit's Cookies interface. */
function makeCookies() {
	const jar = new Map<string, string>();
	return {
		jar,
		cookies: {
			get: vi.fn((name: string) => jar.get(name)),
			getAll: vi.fn(() => [...jar.entries()].map(([name, value]) => ({ name, value }))),
			set: vi.fn((name: string, value: string, opts: Record<string, unknown>) => {
				void opts;
				jar.set(name, value);
			}),
			delete: vi.fn((name: string) => {
				jar.delete(name);
			}),
			serialize: vi.fn((name: string, value: string) => `${name}=${value}`)
		}
	};
}

type MockCookies = ReturnType<typeof makeCookies>['cookies'];

/** Cast the loose mock jar to the real Cookies type only at the call boundary. */
function asCookies(cookies: MockCookies): Cookies {
	return cookies as unknown as Cookies;
}

describe('oauth-state', () => {
	it('newOAuthState returns three distinct random values', () => {
		const a = newOAuthState();
		const b = newOAuthState();
		expect(a.state).not.toBe(a.nonce);
		expect(a.state).not.toBe(a.codeVerifier);
		expect(a.state).not.toBe(b.state);
		expect(a.nonce).not.toBe(b.nonce);
		expect(a.codeVerifier).not.toBe(b.codeVerifier);
	});

	it('pkce challenge is a stable base64url sha256', () => {
		const first = pkceChallenge('the-verifier');
		const second = pkceChallenge('the-verifier');
		expect(first).toBe(second);
		expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
	});

	it('set then consume round-trips the same state and deletes the cookie', () => {
		const { jar, cookies } = makeCookies();
		const state = newOAuthState();
		setOAuthStateCookie(asCookies(cookies), state);

		expect(jar.has(OAUTH_STATE_COOKIE)).toBe(true);
		const readBack = consumeOAuthStateCookie(asCookies(cookies));
		expect(readBack).toEqual(state);
		expect(jar.has(OAUTH_STATE_COOKIE)).toBe(false);
	});

	it('consume is single-use: the second read returns null', () => {
		const { cookies } = makeCookies();
		setOAuthStateCookie(asCookies(cookies), newOAuthState());
		expect(consumeOAuthStateCookie(asCookies(cookies))).not.toBeNull();
		expect(consumeOAuthStateCookie(asCookies(cookies))).toBeNull();
	});

	it('consume returns null when no cookie exists', () => {
		const { cookies } = makeCookies();
		expect(consumeOAuthStateCookie(asCookies(cookies))).toBeNull();
	});

	it('consume rejects a tampered cookie payload', () => {
		const { jar, cookies } = makeCookies();
		setOAuthStateCookie(asCookies(cookies), newOAuthState());
		const raw = jar.get(OAUTH_STATE_COOKIE) as string;
		const tampered = raw.replace('{"state"', '{"state" ');
		jar.set(OAUTH_STATE_COOKIE, tampered);
		expect(consumeOAuthStateCookie(asCookies(cookies))).toBeNull();
	});

	it('stateMatches uses constant-time equality', () => {
		const state = newOAuthState();
		expect(stateMatches(state, state.state)).toBe(true);
		expect(stateMatches(state, 'something-else')).toBe(false);
	});
});
