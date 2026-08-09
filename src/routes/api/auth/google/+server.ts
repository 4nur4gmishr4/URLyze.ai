import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildGoogleAuthUrl, isGoogleAuthConfigured } from '$lib/server/auth/google';
import { newOAuthState, pkceChallenge, setOAuthStateCookie } from '$lib/server/auth/oauth-state';

/**
 * Start "Continue with Google".
 * Redirects the browser to Google with a fresh state/nonce/PKCE pair parked in
 * a signed, short-lived cookie so the callback can prove this login is real.
 */
export const GET: RequestHandler = (event) => {
	if (!isGoogleAuthConfigured()) {
		error(503, { code: 'AUTH_GOOGLE_CONFIG', message: 'Google sign-in is not configured' });
	}

	const state = newOAuthState();
	setOAuthStateCookie(event.cookies, state);
	redirect(
		302,
		buildGoogleAuthUrl({
			origin: event.url.origin,
			state: state.state,
			nonce: state.nonce,
			codeChallenge: pkceChallenge(state.codeVerifier)
		})
	);
};
