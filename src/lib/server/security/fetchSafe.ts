import { assertSafeHostname } from './ssrf';
import { log } from '../logging';
import { AppError } from '$lib/types/errors';

export interface FetchSafeOptions {
	timeoutMs?: number;
	maxBytes?: number;
	maxRedirects?: number;
	headers?: Record<string, string>;
	/** Override the browser User-Agent (youtubei.js sends its own). */
	userAgent?: string;
}

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB
export const DEFAULT_MAX_REDIRECTS = 3;

export const BROWSER_USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** SSRF-hardened fetch with manual redirect control, timeout, and size cap. */
export async function fetchSafe(
	rawUrl: string,
	opts: FetchSafeOptions = {}
): Promise<FetchResult> {
	const {
		timeoutMs = DEFAULT_TIMEOUT_MS,
		maxBytes = DEFAULT_MAX_BYTES,
		maxRedirects = DEFAULT_MAX_REDIRECTS,
		headers = {},
		userAgent = BROWSER_USER_AGENT
	} = opts;

	const startUrl = parseHttpUrl(rawUrl);
	await assertSafeHostname(startUrl.hostname);

	let current = startUrl;
	let hops = 0;

	while (hops <= maxRedirects) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);

		let res: Response;
		try {
			res = await fetch(current.href, {
				signal: controller.signal,
				redirect: 'manual',
				headers: { 'User-Agent': userAgent, Accept: '*/*', ...headers }
			});
		} catch (err) {
			clearTimeout(timer);
			if (err instanceof AppError) throw err;
			if (err instanceof DOMException && err.name === 'AbortError') {
				throw new AppError('TIMEOUT', 'The source took too long to respond');
			}
			log.warn('fetchSafe: network failure', { host: current.hostname });
			throw new AppError('NETWORK_ERROR', 'Could not reach the source website');
		}
		clearTimeout(timer);

		// Follow redirects manually, re-validating each hop's destination.
		if (res.status >= 300 && res.status < 400) {
			const location = res.headers.get('Location');
			if (!location) return buildResult(res, maxBytes);
			let next: URL;
			try {
				next = new URL(location, current);
			} catch {
				throw new AppError('BLOCKED_URL', 'The source returned an invalid redirect');
			}
			if (next.protocol !== 'http:' && next.protocol !== 'https:') {
				throw new AppError('BLOCKED_URL', 'The source redirected to an unsupported scheme');
			}
			await assertSafeHostname(next.hostname);
			current = next;
			hops++;
			continue;
		}

		return buildResult(res, maxBytes);
	}

	throw new AppError('BLOCKED_URL', 'The source redirected too many times');
}

export interface FetchResult {
	status: number;
	ok: boolean;
	contentType: string | null;
	text: () => Promise<string>;
	arrayBuffer: () => Promise<ArrayBuffer>;
}

function buildResult(res: Response, maxBytes: number): FetchResult {
	return {
		status: res.status,
		ok: res.ok,
		contentType: res.headers.get('content-type'),
		text: async () => {
			const buf = await readCapped(res, maxBytes);
			return new TextDecoder('utf-8', { fatal: false }).decode(buf);
		},
		arrayBuffer: async () => readCapped(res, maxBytes)
	};
}

async function readCapped(res: Response, maxBytes: number): Promise<ArrayBuffer> {
	const buf = await res.arrayBuffer();
	if (buf.byteLength > maxBytes) {
		throw new AppError('CONTENT_TOO_LARGE', 'The source page is too large to analyze');
	}
	return buf;
}

/** Parse a raw URL, rejecting anything that isn't http(s). */
function parseHttpUrl(raw: string): URL {
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
