import type { CheerioAPI } from 'cheerio';
import { fetchSafe, DEFAULT_MAX_BYTES } from '../security/fetchSafe';
import { AppError } from '$lib/types/errors';
import { contentHash, countWords } from '../content/hash';
import { classifyQuality } from '../content/quality';
import type { ExtractedContent, SourceMetadata } from '$lib/types/analysis';

const MAX_TEXT_CHARS = 30_000;
const MAX_HTML_BYTES = 3 * 1024 * 1024; // generous for metadata-rich pages, still bounded

/** Content types we know how to parse. Anything else → UNSUPPORTED_CONTENT_TYPE. */
const ACCEPTED_CONTENT_TYPES = ['text/html', 'application/xhtml+xml'];

/** Boilerplate selectors removed before reading any content. */
const REMOVE_SELECTORS = [
	'script',
	'style',
	'noscript',
	'iframe',
	'nav',
	'footer',
	'form',
	'button',
	'[role="navigation"]',
	'[role="banner"]',
	'[aria-hidden="true"]',
	'.ad',
	'.ads',
	'.advertisement',
	'.advert',
	'.banner-ad',
	'.cookie',
	'.cookies',
	'.cookie-banner',
	'.cookie-notice',
	'.newsletter',
	'.newsletter-form',
	'.newsletter-signup',
	'.subscribe',
	'.social-share',
	'.share-buttons',
	'.related',
	'.recommendations',
	'.skip-link',
	'.menu',
	'.breadcrumb',
	'.pagination',
	'.author-bio',
	'.comments',
	'.comment-section'
];

/** Selectors that mark the primary content container, in priority order. */
const CONTENT_SELECTORS = ['article', 'main', '[role="main"]'];

/** Metadata read from <head> before boilerplate removal. `title` is separate
 * from `SourceMetadata` because it lives on `ExtractedContent.title`. */
interface WebMetadata {
	title?: string;
	description?: string;
	author?: string;
	publishedAt?: string;
	canonicalUrl?: string;
	language?: string;
	domain: string;
}

/**
 * General webpage extractor.
 *
 * Layers:
 *  1. optional metadata pass (OG / Twitter / <head> tags)
 *  2. primary-container extraction (<article> → <main> → [role=main])
 *  3. density-based fallback when no container matches
 * Always through the SSRF-hardened fetch, with content-type + size guards.
 */
export async function extractWebpage(url: URL): Promise<ExtractedContent> {
	const res = await fetchSafe(url.href, { maxBytes: MAX_HTML_BYTES });

	if (!res.ok) {
		if (res.status === 429 || res.status === 403) {
			throw new AppError(
				'BLOCKED_BY_SOURCE',
				'The website blocked the request (rate-limited or bot-guarded)'
			);
		}
		if (res.status >= 400 && res.status < 500) {
			throw new AppError('HTTP_ERROR', `The page could not be found (HTTP ${res.status})`);
		}
		if (res.status >= 500) {
			throw new AppError('HTTP_ERROR', `The website returned a server error (HTTP ${res.status})`);
		}
	}

	const contentType = res.contentType?.toLowerCase() ?? '';
	if (!ACCEPTED_CONTENT_TYPES.some((t) => contentType.startsWith(t))) {
		// A non-HTML response (PDF, image, JSON…) is not something we parse.
		if (contentType && !contentType.startsWith('text/')) {
			throw new AppError(
				'UNSUPPORTED_CONTENT_TYPE',
				'That link points to a file type that cannot be analyzed'
			);
		}
	}

	const html = await res.text();
	const { load } = await import('cheerio');
	const $ = load(html);

	// 1. Metadata first — before boilerplate removal so <head> stays intact.
	const meta = readMetadata($, url);

	// 2. Remove boilerplate from the body copy.
	$(REMOVE_SELECTORS.join(',')).remove();

	// 3. Prefer an explicit content container.
	const text = extractFromContainer($) ?? extractByDensity($);

	const cleaned = text.replace(/\s+/g, ' ').trim();
	if (cleaned.length === 0) {
		throw new AppError('EMPTY_CONTENT', 'No readable content could be found on that page');
	}

	const sliced = cleaned.slice(0, MAX_TEXT_CHARS);
	const wordCount = countWords(sliced);
	const quality = classifyQuality({ isFallback: false, wordCount, sourceType: 'WEBPAGE' });

	const metadata: SourceMetadata = {
		domain: meta.domain,
		description: meta.description,
		author: meta.author,
		publishedAt: meta.publishedAt,
		canonicalUrl: meta.canonicalUrl,
		language: meta.language,
		wordCount
	};

	return {
		type: 'WEBPAGE',
		title: meta.title ?? 'Untitled page',
		text: sliced,
		isFallback: false,
		extractionLabel: 'Page text',
		metadata,
		contentHash: contentHash(sliced),
		wordCount,
		quality
	};
}

/** Pull metadata from <head> meta/OG/Twitter tags. Never invents values. */
function readMetadata($: CheerioAPI, url: URL): WebMetadata {
	const meta = (prop: string): string | undefined =>
		$(`meta[property="${prop}"], meta[name="${prop}"]`).first().attr('content')?.trim() || undefined;

	const title =
		meta('og:title') || meta('twitter:title') || $('title').first().text().trim() || undefined;
	const description = meta('og:description') || meta('description') || undefined;
	const author =
		meta('author') ||
		meta('og:article:author') ||
		meta('article:author') ||
		$('[rel="author"]').first().text().trim() ||
		undefined;
	const publishedAt =
		meta('article:published_time') ?? meta('datePublished') ?? meta('og:updated_time') ?? undefined;
	const canonicalUrl =
		$('link[rel="canonical"]').first().attr('href')?.trim() || meta('og:url') || undefined;
	const language =
		$('html').first().attr('lang')?.trim() || meta('og:locale') || meta('language') || undefined;

	return {
		title,
		description,
		author,
		publishedAt,
		canonicalUrl,
		language,
		domain: url.hostname.replace(/^www\./, '')
	};
}

/** Extract from the first matching primary container, in document order. */
function extractFromContainer($: CheerioAPI): string | null {
	for (const selector of CONTENT_SELECTORS) {
		const el = $(selector).first();
		if (el.length === 0) continue;
		const parts: string[] = [];
		el.find('h1, h2, h3, h4, p, li, blockquote').each((_, node) => {
			const text = $(node).text().replace(/\s+/g, ' ').trim();
			if (text.length >= 2) parts.push(text);
		});
		const text = parts.join('\n');
		if (text.trim().length > 40) return text;
	}
	return null;
}

/**
 * Density fallback: pick the <div>/<section> subtree with the most text.
 * Chosen when no <article>/<main> container exists or it came up empty.
 */
function extractByDensity($: CheerioAPI): string {
	let best: { score: number; text: string } = { score: 0, text: '' };
	$('div, section').each((_, el) => {
		const text = $(el).text().replace(/\s+/g, ' ').trim();
		if (text.length < 40) return;
		const score = text.length;
		if (score > best.score) best = { score, text };
	});
	return best.text;
}
