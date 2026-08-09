import { resolveAndValidate } from './ip';
import { log } from '../logging';
import { AppError } from '$lib/types/errors';

/**
 * SSRF orchestration: parse + scheme-check a user-supplied URL, then
 * validate every address it could resolve to before any request is made.
 */

/** Parse and validate a user-supplied URL. Throws on anything non-http(s). */
export function parseTargetUrl(raw: string): URL {
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		throw new AppError('INVALID_URL', 'That does not look like a valid URL');
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new AppError('UNSUPPORTED_URL', 'Only http and https links can be analyzed');
	}
	if (!url.hostname) {
		throw new AppError('INVALID_URL', 'That URL has no hostname');
	}
	return url;
}

/**
 * Validate that a URL's hostname resolves only to global unicast IPs.
 * Safe to call before every network hop (including redirect targets).
 */
export async function assertSafeHostname(hostname: string): Promise<void> {
	try {
		await resolveAndValidate(hostname);
	} catch (err) {
		log.warn('ssrf: blocked hostname', { host: hostname, reason: (err as Error).message });
		throw new AppError('BLOCKED_URL', 'This URL points to a private or unreachable address');
	}
}

/** Convenience: parse + hostname-validate in one step. */
export async function validateTarget(raw: string): Promise<URL> {
	const url = parseTargetUrl(raw);
	await assertSafeHostname(url.hostname);
	return url;
}
