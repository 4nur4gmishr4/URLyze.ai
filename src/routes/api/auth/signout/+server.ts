import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearUserSession } from '$lib/server/auth/user-session';

/**
 * Sign out. Deliberately POST-only (a form action, not a link) so a foreign
 * site can't log the user out via a stray <img> or prefetch.
 */
export const POST: RequestHandler = (event) => {
	clearUserSession(event.cookies);
	redirect(303, '/');
};
