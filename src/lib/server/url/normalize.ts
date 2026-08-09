import { AppError } from '$lib/types/errors';
import type { CanonicalIdentity } from '$lib/types/analysis';

/**
 * Canonical URL normalization.
 *
 * Different submitted URLs that point at the same content must collapse to a
 * single identity so duplicate detection works. YouTube variants (watch /
 * youtu.be / m. / shorts) all resolve to the video ID; web URLs get tracking
 * parameters stripped against an allowlist and standard casing fixes applied.
 */

/** Hosts that always mean YouTube (plus the shared-nocookie variant). */
const YOUTUBE_HOSTS = new Set([
	'youtube.com',
	'www.youtube.com',
	'm.youtube.com',
	'music.youtube.com',
	'youtu.be',
	'youtube-nocookie.com',
	'www.youtube-nocookie.com'
]);

/**
 * Tracking/clicking parameters that never affect page content. Anything else
 * is kept — many sites use query params to render different content.
 */
const TRACKING_PARAMS = new Set([
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_term',
	'utm_content',
	'utm_id',
	'utm_cid',
	'utm_reader',
	'gclid',
	'fbclid',
	'gbraid',
	'wbraid',
	'igshid',
	'igsh',
	'mc_cid',
	'mc_eid',
	'cmpid',
	'spMailingId',
	'spUserID',
	'spJobID',
	'spReportId',
	's_cid',
	'vero_conv',
	'vero_id',
	'yclid',
	'li_fat_id',
	'wickedid',
	'wt_mc',
	'_hsenc',
	'_hsmi',
	'hsCtaTracking',
	'mkt_tok',
	'piwik_campaign',
	'piwik_kwd',
	'pk_campaign',
	'pk_kwd',
	'oly_anon_id',
	'oly_enc_id',
	'_ga',
	'_gl',
	'source',
	'via',
	'linkId'
]);

/** Is this hostname a YouTube property (after dropping a leading www.)? */
export function isYouTubeHost(hostname: string): boolean {
	return YOUTUBE_HOSTS.has(hostname.toLowerCase());
}

/** Strip leading `www.` for identity purposes. */
export function bareHost(hostname: string): string {
	return hostname.toLowerCase().replace(/^www\./, '');
}

/** Extract the video ID for canonical identity; null when not a video URL. */
export function extractVideoId(url: URL): string | null {
	const host = bareHost(url.hostname);
	if (host === 'youtu.be') {
		return url.pathname.split('/').filter(Boolean)[0] ?? null;
	}
	if (host.endsWith('youtube.com')) {
		const v = url.searchParams.get('v');
		if (v) return v;
		const segments = url.pathname.split('/').filter(Boolean);
		if (segments[0] === 'shorts' || segments[0] === 'embed') return segments[1] ?? null;
	}
	return null;
}

/** Build the canonical `YOUTUBE:<id>` identity and its canonical URL. */
export function canonicalizeYouTube(url: URL): CanonicalIdentity {
	const videoId = extractVideoId(url);
	if (!videoId) {
		throw new AppError('INVALID_URL', 'Could not find a video ID in that YouTube URL');
	}
	return {
		canonical: `YOUTUBE:${videoId}`,
		url: `https://www.youtube.com/watch?v=${videoId}`
	};
}

/** Remove known tracking params; keep everything else (it may change content). */
function stripTrackingParams(url: URL): URL {
	const copy = new URL(url);
	for (const key of [...copy.searchParams.keys()]) {
		if (TRACKING_PARAMS.has(key.toLowerCase())) copy.searchParams.delete(key);
	}
	return copy;
}

/** Canonicalize a general web URL: scheme, host casing, default port, trailing slash. */
export function canonicalizeWeb(url: URL): CanonicalIdentity {
	const normalized = stripTrackingParams(url);
	normalized.hostname = url.hostname.toLowerCase();
	normalized.hash = '';
	// https is canonical; http://example.com and https://example.com are the same site.
	normalized.protocol = 'https:';
	if (normalized.pathname.length > 1 && normalized.pathname.endsWith('/')) {
		normalized.pathname = normalized.pathname.replace(/\/+$/, '');
	}
	// Collapse empty query into no query.
	if (normalized.search === '?') normalized.search = '';
	const href = normalized.href;
	return { canonical: `WEB:${href}`, url: href };
}

/** Parse + validate a URL strictly enough for canonicalization. */
export function parseUrl(raw: string): URL {
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		throw new AppError('INVALID_URL', 'That does not look like a valid URL');
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new AppError('UNSUPPORTED_URL', 'Only http and https links can be analyzed');
	}
	if (!url.hostname || url.hostname.length === 0) {
		throw new AppError('INVALID_URL', 'That URL has no hostname');
	}
	return url;
}

/** Canonical identity for any submitted URL (YouTube or web). */
export function canonicalize(raw: string): CanonicalIdentity {
	const url = parseUrl(raw);
	return isYouTubeHost(url.hostname) ? canonicalizeYouTube(url) : canonicalizeWeb(url);
}
