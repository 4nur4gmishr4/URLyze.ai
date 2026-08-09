import { createHash, randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { sign, verify, safeEqual } from './hmac';

/**
 * One-shot OAuth state cookie.
 *
 * On the way to Google we stash `state` (CSRF protection), `nonce` (binds the
 * returned id_token to this login attempt), and the PKCE `code_verifier` in a
 * short-lived HttpOnly cookie. The callback reads it once, verifies the HMAC,
 * and deletes it immediately, so a stolen value can't be replayed.
 */

export const OAUTH_STATE_COOKIE = 'urlyze_oauth';
const COOKIE_PATH = '/api/auth';
const MAX_AGE = 10 * 60; // 10 minutes is plenty to click through Google.

export interface OAuthState {
	state: string;
	nonce: string;
	codeVerifier: string;
}

/** Fresh random values for one login attempt. */
export function newOAuthState(): OAuthState {
	return {
		state: randomBytes(24).toString('base64url'),
		nonce: randomBytes(24).toString('base64url'),
		codeVerifier: randomBytes(32).toString('base64url')
	};
}

/** RFC 7636 S256 challenge: base64url(sha256(verifier)). */
export function pkceChallenge(codeVerifier: string): string {
	return createHash('sha256').update(codeVerifier).digest('base64url');
}

function pack(s: OAuthState): string {
	return sign(JSON.stringify(s));
}

function unpack(raw: string): OAuthState | null {
	const value = verify(raw);
	if (!value) return null;
	try {
		const parsed = JSON.parse(value) as Partial<OAuthState>;
		if (
			typeof parsed.state === 'string' &&
			typeof parsed.nonce === 'string' &&
			typeof parsed.codeVerifier === 'string'
		) {
			return { state: parsed.state, nonce: parsed.nonce, codeVerifier: parsed.codeVerifier };
		}
	} catch {
		// Malformed payload — treat as absent.
	}
	return null;
}

/** Write the state cookie for the outgoing redirect. */
export function setOAuthStateCookie(cookies: Cookies, state: OAuthState): void {
	cookies.set(OAUTH_STATE_COOKIE, pack(state), {
		path: COOKIE_PATH,
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: MAX_AGE
	});
}

/**
 * Read, verify, and delete the state cookie. Single-use by design. Returns
 * null when missing, expired, tampered, or already consumed.
 */
export function consumeOAuthStateCookie(cookies: Cookies): OAuthState | null {
	const raw = cookies.get(OAUTH_STATE_COOKIE);
	if (raw === undefined || raw === null) return null;
	cookies.delete(OAUTH_STATE_COOKIE, { path: COOKIE_PATH });
	const state = unpack(raw);
	return state;
}

/** True when the callback's `state` param matches the cookie we issued. */
export function stateMatches(stored: OAuthState, submitted: string): boolean {
	return safeEqual(stored.state, submitted);
}
