import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { SessionUser } from '$lib/types/session';
import { sign, verify } from './hmac';

/**
 * Signed user session cookie.
 *
 * Unlike the anonymous sid (scoped to /api) this cookie is readable on every
 * page so the header can show who is signed in. The value is just the user's
 * UUID plus an HMAC; freshness is fetched from the users table on demand.
 *
 * The db client is imported lazily (only inside getSessionUser) so importing
 * this module never requires DATABASE_URL. That keeps cookie-only code paths
 * (and their unit tests) free of the Neon client at module load.
 */

export const USER_SESSION_COOKIE = 'urlyze_user';
export const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const COOKIE_PATH = '/';

function readUserId(cookies: Cookies): string | null {
	const raw = cookies.get(USER_SESSION_COOKIE);
	if (raw === undefined || raw === null) return null;
	const value = verify(raw);
	return value ?? null;
}

/** Read the logged-in user's id without a database round-trip. */
export function readUserSessionId(cookies: Cookies): string | null {
	return readUserId(cookies);
}

/** Owner scoping id for rows written while signed in. */
export function ownerIdForUser(userId: string): string {
	return `user:${userId}`;
}

/** Set the user session cookie after a successful login. */
export function setUserSession(cookies: Cookies, userId: string): void {
	cookies.set(USER_SESSION_COOKIE, sign(userId), {
		path: COOKIE_PATH,
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: USER_SESSION_MAX_AGE
	});
}

/** Remove the user session cookie on sign-out. */
export function clearUserSession(cookies: Cookies): void {
	cookies.delete(USER_SESSION_COOKIE, { path: COOKIE_PATH });
}

/** Hydrate the signed-in user for the UI, or null when not signed in. */
export async function getSessionUser(cookies: Cookies): Promise<SessionUser | null> {
	const userId = readUserId(cookies);
	if (!userId) return null;

	const { db } = await import('$lib/server/db');
	const { users } = await import('$lib/server/db/schema');
	const { eq } = await import('drizzle-orm');

	const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	const row = rows[0];
	if (!row) {
		// Account deleted mid-session — drop the stale cookie.
		return null;
	}
	return {
		id: row.id,
		name: row.name,
		email: row.email,
		picture: row.picture ?? undefined
	};
}
