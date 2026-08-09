import type { LayoutServerLoad } from './$types';
import { getSessionUser } from '$lib/server/auth/user-session';

/**
 * Expose the signed-in user (or null) to every page so the header and sidebar
 * can render the right account state. Zero database work when no user cookie
 * exists, which keeps local dev and anonymous traffic fast.
 */
export const load: LayoutServerLoad = async ({ cookies }) => {
	return { user: await getSessionUser(cookies) };
};
