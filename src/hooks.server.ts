import type { Handle, HandleServerError } from '@sveltejs/kit';
import { building } from '$app/environment';
import { log } from '$lib/server/logging';

const IS_PROD = process.env.NODE_ENV === 'production';

/** Apply security headers to every response. */
const HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Frame-Options': 'DENY',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
};

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		// Strict-Dynamic-aware: inline scripts are allowed only with the nonce SvelteKit injects.
		filterSerializedResponseHeaders: (name) => name === 'content-type'
	});

	Object.entries(HEADERS).forEach(([name, value]) => response.headers.set(name, value));

	if (IS_PROD) {
		response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
	}

	return response;
};

/**
 * Only reached for unexpected errors — AppError is converted to `error()`
 * (HttpError) upstream, which bypasses this hook and keeps its status.
 * Never echo internal messages back to clients.
 */
export const handleError: HandleServerError = ({ error: e }) => {
	const message = e instanceof Error ? e.message : 'Unknown error';
	if (!building) {
		log.error('unhandled server error', { message });
	}
	return { code: 'INTERNAL', message: 'An unexpected error occurred' };
};
