import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { env } from './env';
import { log } from './logging';

/**
 * Anonymous ownership.
 *
 * No auth, no accounts — each visitor gets an HMAC-signed session cookie whose
 * value is an opaque id that scopes every analysis row. The signature prevents
 * forging someone else's id; the id itself is a random UUID, never guessable.
 *
 * Security properties:
 *  - The cookie is `HttpOnly` (JS can't read it), `SameSite=Lax` (no cross-site
 *    sends), and scoped to the API path so it isn't sent on every asset request.
 *  - Sessions never persist server-side, so there is no store to leak or purge.
 */

export const SESSION_COOKIE = 'urlyze_sid';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year, sliding-renewed on use
const COOKIE_PATH = '/api';

function secret(): string {
	if (env.SESSION_SECRET) return env.SESSION_SECRET;
	// Dev fallback: ephemeral per-process secret so local runs work without
	// config. All sessions reset on restart — acceptable for local only.
	if (process.env.NODE_ENV !== 'production') return devSecret;
	throw new Error('SESSION_SECRET is required in production');
}

const devSecret = randomUUID();

/** `id.signature` — signature is HMAC over the id, preventing tampering. */
function sign(id: string): string {
	return `${id}.${createHmac('sha256', secret()).update(id).digest('base64url')}`;
}

/** Returns the id when the cookie is present and its signature is valid. */
function verify(raw: string): string | null {
	const dot = raw.lastIndexOf('.');
	if (dot <= 0) return null;
	const id = raw.slice(0, dot);
	const sig = raw.slice(dot + 1);
	const expected = createHmac('sha256', secret()).update(id).digest('base64url');
	// Constant-time compare to avoid leaking the signature via timing.
	if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
		return null;
	}
	return id;
}

/**
 * Get the visitor's existing session id, or create one (writing the cookie
 * when created). Call at the top of every ownership-scoped API handler.
 */
export function ensureSessionId(event: RequestEvent): string {
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
