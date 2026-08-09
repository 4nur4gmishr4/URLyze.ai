import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeCodeForIdToken, verifyIdToken } from '$lib/server/auth/google';
import { consumeOAuthStateCookie, stateMatches } from '$lib/server/auth/oauth-state';
import { upsertUserByGoogle } from '$lib/server/db/users';
import { setUserSession } from '$lib/server/auth/user-session';

/**
 * Google redirects back here after the consent screen.
 *
 * Order matters: consume (and thus invalidate) the one-shot state cookie, then
 * verify `state`, exchange the code with PKCE, verify the id_token signature
 * and claims, upsert the user, and only then set the session cookie.
 */
export const GET: RequestHandler = async (event) => {
	const stored = consumeOAuthStateCookie(event.cookies);
	const submittedState = event.url.searchParams.get('state');
	const code = event.url.searchParams.get('code');
	const denied = event.url.searchParams.get('error') !== null;

	// Reject anything that isn't exactly one successful, matching login.
	if (!stored || !submittedState || denied || !code || !stateMatches(stored, submittedState)) {
		error(400, { code: 'AUTH_STATE_MISMATCH', message: 'Google sign-in failed' });
	}

	const idToken = await exchangeCodeForIdToken({
		code,
		origin: event.url.origin,
		codeVerifier: stored.codeVerifier
	});
	const identity = await verifyIdToken({ idToken, nonce: stored.nonce });
	const user = await upsertUserByGoogle({
		sub: identity.sub,
		email: identity.email,
		name: identity.name,
		picture: identity.picture
	});
	setUserSession(event.cookies, user.id);

	redirect(303, '/');
};
