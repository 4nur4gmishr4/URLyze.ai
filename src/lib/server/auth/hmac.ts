import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { env } from '$lib/server/env';

/**
 * Shared HMAC signing for server-only cookies (anonymous sessions, OAuth
 * state, user sessions). One secret, one code path, so the comparison logic
 * can't drift between cookie types.
 *
 * `SESSION_SECRET` is optional in dev (ephemeral per-process secret) but
 * required in production; failing loudly beats silently forging cookies.
 */

function secret(): string {
	if (env.SESSION_SECRET) return env.SESSION_SECRET;
	if (process.env.NODE_ENV !== 'production') return devSecret;
	throw new Error('SESSION_SECRET is required in production');
}

const devSecret = randomUUID();

/** `value.signature` — signature is HMAC over the value, preventing tampering. */
export function sign(value: string): string {
	const sig = createHmac('sha256', secret()).update(value).digest('base64url');
	return `${value}.${sig}`;
}

/** Returns the original value when the signature is valid, else null. */
export function verify(raw: string): string | null {
	const dot = raw.lastIndexOf('.');
	if (dot <= 0) return null;
	const value = raw.slice(0, dot);
	const sig = raw.slice(dot + 1);
	const expected = createHmac('sha256', secret()).update(value).digest('base64url');
	// Constant-time compare so the signature can't leak via timing.
	if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
		return null;
	}
	return value;
}

/** Constant-time string equality, for comparing user-supplied tokens. */
export function safeEqual(a: string, b: string): boolean {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	return ab.length === bb.length && timingSafeEqual(ab, bb);
}
