import { randomUUID } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { log } from './logging';
import { sign, verify } from './auth/hmac';
import { readUserSessionId, ownerIdForUser } from './auth/user-session';

/**
 * Ownership scoping.
 *
 * Every analysis row is scoped to an opaque owner id. Visitors without an
 * account get an HMAC-signed anonymous cookie; signed-in users get the stable
 * `user:<id>` scope so their history follows them across devices. The
 * signature prevents forging someone else's id; the id itself is a random
 * UUID, never guessable.
 *
 * Security properties:
 *  - The anonymous cookie is `HttpOnly` (JS can't read it), `SameSite=Lax` (no
 *    cross-site sends), and scoped to the API path so it isn't sent on every
 *    asset request.
 *  - The user session cookie is signed the same way and readable on all pages
 *    so the header can show who is signed in.
 */

export const SESSION_COOKIE = 'urlyze_sid';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year, sliding-renewed on use
const COOKIE_PATH = '/api';

/**
 * Get the owner id for this request. Prefers a signed-in account; otherwise
 * returns (and creates on first visit) the anonymous session id.
 */
export function ensureSessionId(event: RequestEvent): string {
	const userId = readUserSessionId(event.cookies);
	if (userId) return ownerIdForUser(userId);

	const existing = event.cookies.get(SESSION_COOKIE);
	if (existing) {
		const id = verify(existing);
		if (id) {
			renewCookie(event, id);
			return id;
		}
		log.warn('session: rejected invalid cookie signature');
	}

	const id = randomUUID();
	event.cookies.set(SESSION_COOKIE, sign(id), {
		path: COOKIE_PATH,
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: SESSION_MAX_AGE
	});
	return id;
}

/** Slide the expiry forward so active visitors never get logged out. */
function renewCookie(event: RequestEvent, id: string): void {
	event.cookies.set(SESSION_COOKIE, sign(id), {
		path: COOKIE_PATH,
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: SESSION_MAX_AGE
	});
}
