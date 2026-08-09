import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { AppError } from '$lib/types/errors';
import { env } from '$lib/server/env';
import { log } from '$lib/server/logging';

/**
 * Google OAuth 2.0 (Authorization Code + PKCE).
 *
 * The flow never exposes the client secret to the browser. Identity comes from
 * the id_token, which we verify against Google's published JWKS (signature,
 * issuer, audience, expiry, nonce) before trusting a single claim. PKCE binds
 * the code exchange to this login attempt, and the `nonce` inside the id_token
 * proves the token belongs to this attempt even if the auth code leaks.
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
// Google historically issued id_tokens from both forms.
const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

export interface GoogleIdentity {
	sub: string;
	email: string;
	name: string;
	picture?: string;
}

function clientId(): string {
	const id = env.GOOGLE_CLIENT_ID;
	if (!id) throw new AppError('AUTH_GOOGLE_CONFIG', 'Google sign-in is not configured');
	return id;
}

function clientSecret(): string {
	const secret = env.GOOGLE_CLIENT_SECRET;
	if (!secret) throw new AppError('AUTH_GOOGLE_CONFIG', 'Google sign-in is not configured');
	return secret;
}

export function isGoogleAuthConfigured(): boolean {
	return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

/** Exact redirect URI Google must have registered. Derived from the request
 * origin when not pinned via GOOGLE_REDIRECT_URI. */
export function googleRedirectUri(origin: string): string {
	return env.GOOGLE_REDIRECT_URI ?? `${origin}/api/auth/google/callback`;
}

/** Authorization URL the browser is redirected to. */
export function buildGoogleAuthUrl(opts: {
	origin: string;
	state: string;
	nonce: string;
	codeChallenge: string;
}): string {
	const params = new URLSearchParams({
		client_id: clientId(),
		redirect_uri: googleRedirectUri(opts.origin),
		response_type: 'code',
		scope: 'openid email profile',
		state: opts.state,
		nonce: opts.nonce,
		code_challenge: opts.codeChallenge,
		code_challenge_method: 'S256',
		access_type: 'online'
	});
	return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Exchange the auth code for an id_token (server-to-server, never leaked). */
export async function exchangeCodeForIdToken(opts: {
	code: string;
	origin: string;
	codeVerifier: string;
}): Promise<string> {
	const body = new URLSearchParams({
		code: opts.code,
		client_id: clientId(),
		client_secret: clientSecret(),
		redirect_uri: googleRedirectUri(opts.origin),
		grant_type: 'authorization_code',
		code_verifier: opts.codeVerifier
	});

	let res: Response;
	try {
		res = await fetch(GOOGLE_TOKEN_URL, {
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				accept: 'application/json'
			},
			body: body.toString()
		});
	} catch {
		throw new AppError('AUTH_GOOGLE_FAILED', 'Could not reach Google to finish sign-in');
	}

	if (!res.ok) {
		log.warn('oauth: token exchange rejected', { status: res.status });
		throw new AppError('AUTH_GOOGLE_FAILED', 'Google rejected the sign-in attempt');
	}

	const data = (await res.json().catch(() => null)) as { id_token?: string } | null;
	if (!data?.id_token) {
		throw new AppError('AUTH_GOOGLE_FAILED', 'Google did not return a session token');
	}
	return data.id_token;
}

/** Verify the id_token and return the claims we actually trust. */
export async function verifyIdToken(opts: {
	idToken: string;
	nonce: string;
}): Promise<GoogleIdentity> {
	let payload: JWTPayload;
	try {
		const result = await jwtVerify(opts.idToken, jwks, {
			issuer: GOOGLE_ISSUERS,
			audience: clientId()
		});
		payload = result.payload;
	} catch {
		throw new AppError('AUTH_GOOGLE_INVALID', 'Google sign-in could not be verified');
	}

	// Every check below is mandatory — a token that fails any is rejected.
	if (payload.nonce !== opts.nonce) {
		throw new AppError('AUTH_GOOGLE_INVALID', 'Sign-in attempt expired, please try again');
	}
	if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
		throw new AppError('AUTH_GOOGLE_INVALID', 'Sign-in is missing the subject claim');
	}
	if (typeof payload.email !== 'string' || payload.email.length === 0) {
		throw new AppError('AUTH_GOOGLE_INVALID', 'Sign-in is missing the email claim');
	}
	if (payload.email_verified !== true) {
		throw new AppError('AUTH_GOOGLE_INVALID', 'Sign-in requires a verified Google email');
	}

	return {
		sub: payload.sub,
		email: payload.email.toLowerCase(),
		name: typeof payload.name === 'string' && payload.name ? payload.name : payload.email.split('@')[0],
		picture: typeof payload.picture === 'string' && payload.picture ? payload.picture : undefined
	};
}
