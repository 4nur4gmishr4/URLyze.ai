import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

const envMock = vi.hoisted(() => ({
	SESSION_SECRET: 'a-fixed-32+char-session-secret-for-tests'
}));
vi.mock('$lib/server/env', () => ({ env: envMock }));

const dbMock = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock('$lib/server/db', () => ({ db: dbMock }));
vi.mock('$lib/server/db/schema', () => ({ users: { table: 'users' } }));
vi.mock('drizzle-orm', () => ({ eq: vi.fn((a, b) => ({ op: 'eq', a, b })) }));

import {
	USER_SESSION_COOKIE,
	USER_SESSION_MAX_AGE,
	clearUserSession,
	getSessionUser,
	ownerIdForUser,
	readUserSessionId,
	setUserSession
} from '$lib/server/auth/user-session';

/** Cookie jar shaped like SvelteKit's Cookies interface, tracking set values. */
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

describe('user-session', () => {
	it('writes a signed HttpOnly session cookie with a 30-day life', () => {
		const { jar, cookies } = makeCookies();
		setUserSession(asCookies(cookies), 'user-id-1');
		const raw = jar.get(USER_SESSION_COOKIE) as string;
		expect(raw).toMatch(/^user-id-1\.[A-Za-z0-9_-]+$/);
		expect(cookies.set.mock.calls[0][2]).toMatchObject({
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: USER_SESSION_MAX_AGE,
			path: '/'
		});
	});

	it('readUserSessionId round-trips a valid cookie', () => {
		const { cookies } = makeCookies();
		setUserSession(asCookies(cookies), 'user-id-1');
		expect(readUserSessionId(asCookies(cookies))).toBe('user-id-1');
	});

	it('readUserSessionId returns null when the cookie is missing', () => {
		const { cookies } = makeCookies();
		expect(readUserSessionId(asCookies(cookies))).toBeNull();
	});

	it('readUserSessionId rejects a tampered cookie', () => {
		const { jar, cookies } = makeCookies();
		setUserSession(asCookies(cookies), 'user-id-1');
		jar.set(USER_SESSION_COOKIE, 'user-id-1.badsig');
		expect(readUserSessionId(asCookies(cookies))).toBeNull();
	});

	it('clearUserSession removes the cookie', () => {
		const { jar, cookies } = makeCookies();
		setUserSession(asCookies(cookies), 'user-id-1');
		clearUserSession(asCookies(cookies));
		expect(jar.has(USER_SESSION_COOKIE)).toBe(false);
	});

	it('ownerIdForUser namespaces the user scope', () => {
		expect(ownerIdForUser('abc')).toBe('user:abc');
	});

	it('getSessionUser returns null with no cookie (no database touch)', async () => {
		const { cookies } = makeCookies();
		expect(await getSessionUser(asCookies(cookies))).toBeNull();
		expect(dbMock.select).not.toHaveBeenCalled();
	});

	it('getSessionUser hydrates the user row', async () => {
		const { cookies } = makeCookies();
		setUserSession(asCookies(cookies), 'row-id-42');
		dbMock.select.mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([
						{ id: 'row-id-42', name: 'Ada', email: 'ada@example.com', picture: 'pic.png' }
					])
				})
			})
		});
		expect(await getSessionUser(asCookies(cookies))).toEqual({
			id: 'row-id-42',
			name: 'Ada',
			email: 'ada@example.com',
			picture: 'pic.png'
		});
	});

	it('getSessionUser returns null when the account is gone', async () => {
		const { cookies } = makeCookies();
		setUserSession(asCookies(cookies), 'gone-user');
		dbMock.select.mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) })
			})
		});
		expect(await getSessionUser(asCookies(cookies))).toBeNull();
	});
});
