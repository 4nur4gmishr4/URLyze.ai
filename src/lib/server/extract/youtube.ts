import { AppError } from '$lib/types/errors';
import { contentHash, countWords } from '../content/hash';
import { classifyQuality } from '../content/quality';
import type { ExtractedContent, SourceMetadata } from '$lib/types/analysis';

const MAX_TEXT_CHARS = 30_000;

/**
 * YouTube transcript extractor.
 *
 * youtubei.js is ~15.6MB and is isolated behind a dynamic import so the route
 * can `split: true` and keep it out of every other bundle. Cached off for the
 * Vercel Node runtime (in-memory only — never persisted to disk).
 */
export async function extractYouTube(url: URL): Promise<ExtractedContent> {
	const videoId = parseVideoId(url);
	if (!videoId) {
		throw new AppError('INVALID_URL', 'Could not find a video ID in that YouTube URL');
	}

	const { Innertube, UniversalCache } = await import('youtubei.js');
	const yt = await Innertube.create({
		cache: new UniversalCache(false),
		generate_session_locally: true
	});

	const info = await yt.getInfo(videoId);
	const title = info.basic_info.title?.trim() || 'Untitled video';
	const metadata: SourceMetadata = {
		videoId,
		channelName: info.basic_info.channel?.name ?? undefined,
		channelUrl: info.basic_info.channel?.url ?? undefined,
		durationSeconds: info.basic_info.duration ?? undefined,
		wordCount: 0 // updated after extraction
	};

	// Transcript first; the description is a degraded fallback, never the reverse.
	try {
		const transcriptInfo = await info.getTranscript();
		const panel = transcriptInfo.transcript.content;
		const segments = panel?.body?.initial_segments ?? [];
		const text = segments
			.map((segment) => {
				if ('snippet' in segment && segment.snippet) return segment.snippet.text;
				return '';
			})
			.filter(Boolean)
			.join(' ');
		if (text.trim().length > 0) {
			const sliced = text.slice(0, MAX_TEXT_CHARS);
			const wordCount = countWords(sliced);
			const quality = classifyQuality({ isFallback: false, wordCount, sourceType: 'YOUTUBE' });
			return {
				type: 'YOUTUBE',
				title,
				text: sliced,
				isFallback: false,
				extractionLabel: 'Full transcript',
				metadata: { ...metadata, wordCount },
				contentHash: contentHash(sliced),
				wordCount,
				quality
			};
		}
	} catch {
		// Fall through to the description.
	}

	const description = info.basic_info.short_description ?? '';
	if (description.trim().length === 0) {
		throw new AppError(
			'EMPTY_CONTENT',
			'This video has no transcript or description that can be analyzed'
		);
	}
	const sliced = description.slice(0, MAX_TEXT_CHARS);
	const wordCount = countWords(sliced);
	const quality = classifyQuality({ isFallback: true, wordCount, sourceType: 'YOUTUBE' });
	return {
		type: 'YOUTUBE',
		title,
		text: sliced,
		isFallback: true,
		extractionLabel: 'Video description (transcript unavailable)',
		metadata: { ...metadata, wordCount },
		contentHash: contentHash(sliced),
		wordCount,
		quality
	};
}

/** Extract a video ID from common YouTube URL shapes (watch, youtu.be, short, embed). */
export function parseVideoId(url: URL): string | null {
	const host = url.hostname.replace(/^www\./, '');
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
