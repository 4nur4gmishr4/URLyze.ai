import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '$lib/types/errors';

const envMock = vi.hoisted(() => ({
	GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
	GOOGLE_CLIENT_SECRET: 'super-secret' as string | undefined,
	GOOGLE_REDIRECT_URI: undefined as string | undefined,
	SESSION_SECRET: 'a-fixed-32+char-session-secret-for-tests'
}));

const joseMock = vi.hoisted(() => ({
	createRemoteJWKSet: vi.fn(() => ({ jwks: true })),
	jwtVerify: vi.fn()
}));

vi.mock('$lib/server/env', () => ({ env: envMock }));
vi.mock('$lib/server/logging', () => ({ log: { warn: vi.fn() } }));
vi.mock('jose', () => joseMock);

import {
	buildGoogleAuthUrl,
	exchangeCodeForIdToken,
	isGoogleAuthConfigured,
	googleRedirectUri,
	verifyIdToken
} from '$lib/server/auth/google';

/** A valid, fully-verified token payload (mocked jwtVerify). */
function validPayload() {
	return {
		sub: 'google-subject-123',
		email: 'User@Example.COM',
		email_verified: true,
		name: 'Example User',
		picture: 'https://example.com/pic.jpg',
		nonce: 'the-nonce',
		iss: 'https://accounts.google.com',
		aud: 'client-id.apps.googleusercontent.com'
	};
}

function mockVerified(payload: Record<string, unknown>) {
	joseMock.jwtVerify.mockResolvedValue({ payload, protectedHeader: { alg: 'RS256' } });
}

describe('google auth', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		envMock.GOOGLE_REDIRECT_URI = undefined;
	});

	it('is configured only when both id and secret exist', () => {
		expect(isGoogleAuthConfigured()).toBe(true);
		envMock.GOOGLE_CLIENT_SECRET = undefined;
		expect(isGoogleAuthConfigured()).toBe(false);
		envMock.GOOGLE_CLIENT_SECRET = 'super-secret';
	});

	it('buildGoogleAuthUrl pins client id, PKCE S256, state and nonce', () => {
		const url = buildGoogleAuthUrl({
			origin: 'https://urlyze.app',
			state: 'st',
			nonce: 'nn',
			codeChallenge: 'challenge'
		});
		expect(url).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
		expect(url).toContain('client_id=client-id.apps.googleusercontent.com');
		expect(url).toContain('code_challenge_method=S256');
		expect(url).toContain('scope=openid+email+profile');
		expect(url).toContain('state=st');
		expect(url).toContain('nonce=nn');
	});

	it('derives redirect uri from origin unless pinned', () => {
		expect(googleRedirectUri('https://urlyze.app')).toBe('https://urlyze.app/api/auth/google/callback');
		envMock.GOOGLE_REDIRECT_URI = 'https://fixed.example/cb';
		expect(googleRedirectUri('https://urlyze.app')).toBe('https://fixed.example/cb');
	});

	it('verifyIdToken returns trusted claims with lowercased email', async () => {
		mockVerified(validPayload());
		const identity = await verifyIdToken({ idToken: 'x', nonce: 'the-nonce' });
		expect(identity).toEqual({
			sub: 'google-subject-123',
			email: 'user@example.com',
			name: 'Example User',
			picture: 'https://example.com/pic.jpg'
		});
	});

	it('verifyIdToken rejects an invalid signature', async () => {
		joseMock.jwtVerify.mockRejectedValue(new Error('bad signature'));
		await expect(verifyIdToken({ idToken: 'x', nonce: 'the-nonce' })).rejects.toThrowError(AppError);
		await expect(verifyIdToken({ idToken: 'x', nonce: 'the-nonce' })).rejects.toMatchObject({
			code: 'AUTH_GOOGLE_INVALID'
		});
	});

	it('verifyIdToken rejects a nonce mismatch (replay attempt)', async () => {
		mockVerified(validPayload());
		await expect(verifyIdToken({ idToken: 'x', nonce: 'different-nonce' })).rejects.toMatchObject({
			code: 'AUTH_GOOGLE_INVALID'
		});
	});

	it('verifyIdToken rejects an unverified email', async () => {
		mockVerified({ ...validPayload(), email_verified: false });
		await expect(verifyIdToken({ idToken: 'x', nonce: 'the-nonce' })).rejects.toMatchObject({
			code: 'AUTH_GOOGLE_INVALID'
		});
	});

	it('verifyIdToken rejects a missing email claim', async () => {
		const { email, ...rest } = validPayload();
		void email;
		mockVerified(rest);
		await expect(verifyIdToken({ idToken: 'x', nonce: 'the-nonce' })).rejects.toMatchObject({
			code: 'AUTH_GOOGLE_INVALID'
		});
	});

	it('verifyIdToken falls back to email local part when name is absent', async () => {
		mockVerified({ ...validPayload(), name: undefined });
		const identity = await verifyIdToken({ idToken: 'x', nonce: 'the-nonce' });
		expect(identity.name).toBe('User');
	});

	it('exchangeCodeForIdToken posts client secret server-side and returns the token', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ id_token: 'id-token-here' })
		});
		vi.stubGlobal('fetch', fetchMock);

		const token = await exchangeCodeForIdToken({
			code: 'auth-code',
			origin: 'https://urlyze.app',
			codeVerifier: 'verifier'
		});
		expect(token).toBe('id-token-here');

		const body = new URLSearchParams(fetchMock.mock.calls[0][1].body as string);
		expect(body.get('client_secret')).toBe('super-secret');
		expect(body.get('code_verifier')).toBe('verifier');
		expect(body.get('grant_type')).toBe('authorization_code');
		vi.unstubAllGlobals();
	});

	it('exchangeCodeForIdToken surfaces Google rejection', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }));
		await expect(
			exchangeCodeForIdToken({ code: 'bad', origin: 'https://urlyze.app', codeVerifier: 'v' })
		).rejects.toMatchObject({ code: 'AUTH_GOOGLE_FAILED' });
		vi.unstubAllGlobals();
	});

	it('exchangeCodeForIdToken fails cleanly when Google is unreachable', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
		await expect(
			exchangeCodeForIdToken({ code: 'bad', origin: 'https://urlyze.app', codeVerifier: 'v' })
		).rejects.toMatchObject({ code: 'AUTH_GOOGLE_FAILED' });
		vi.unstubAllGlobals();
	});
});
