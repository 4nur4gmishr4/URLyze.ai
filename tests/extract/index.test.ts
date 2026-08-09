import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExtractedContent } from '$lib/types/analysis';

const { youtubeMock, webpageMock } = vi.hoisted(() => ({
	youtubeMock: vi.fn(),
	webpageMock: vi.fn()
}));

vi.mock('$lib/server/extract/youtube', () => ({ extractYouTube: youtubeMock }));
vi.mock('$lib/server/extract/webpage', () => ({ extractWebpage: webpageMock }));

import { extractContent } from '$lib/server/extract/index';

function youtubeResult(): ExtractedContent {
	return {
		type: 'YOUTUBE',
		title: 'A video',
		text: 'transcript text',
		isFallback: false,
		extractionLabel: 'Transcript',
		metadata: { videoId: 'abc123', channelName: 'Channel' },
		contentHash: 'hash-1',
		wordCount: 100,
		quality: 'HIGH'
	};
}

function webpageResult(): ExtractedContent {
	return {
		type: 'WEBPAGE',
		title: 'An article',
		text: 'article body',
		isFallback: false,
		extractionLabel: 'Full article',
		metadata: { domain: 'example.com' },
		contentHash: 'hash-2',
		wordCount: 200,
		quality: 'HIGH'
	};
}

beforeEach(() => {
	youtubeMock.mockReset();
	webpageMock.mockReset();
	youtubeMock.mockResolvedValue(youtubeResult());
	webpageMock.mockResolvedValue(webpageResult());
});

describe('server/extract/index', () => {
	it('routes a youtube.com watch link to the transcript extractor', async () => {
		await extractContent(new URL('https://www.youtube.com/watch?v=abc123'));
		expect(youtubeMock).toHaveBeenCalledTimes(1);
		expect(webpageMock).not.toHaveBeenCalled();
	});

	it('routes youtu.be short links to the transcript extractor', async () => {
		await extractContent(new URL('https://youtu.be/abc123'));
		expect(youtubeMock).toHaveBeenCalledTimes(1);
		expect(webpageMock).not.toHaveBeenCalled();
	});

	it('routes music.youtube.com to the transcript extractor', async () => {
		await extractContent(new URL('https://music.youtube.com/watch?v=abc123'));
		expect(youtubeMock).toHaveBeenCalledTimes(1);
		expect(webpageMock).not.toHaveBeenCalled();
	});

	it('matches hosts case-insensitively', async () => {
		await extractContent(new URL('https://WWW.YOUTUBE.COM/watch?v=abc123'));
		expect(youtubeMock).toHaveBeenCalledTimes(1);
	});

	it('sends everything else to the webpage scraper', async () => {
		await extractContent(new URL('https://example.com/article'));
		expect(webpageMock).toHaveBeenCalledTimes(1);
		expect(youtubeMock).not.toHaveBeenCalled();
	});

	it('passes the parsed URL to the chosen extractor', async () => {
		const url = new URL('https://youtu.be/abc123');
		await extractContent(url);
		expect(youtubeMock).toHaveBeenCalledWith(url);
	});

	it('returns the extractor result', async () => {
		const out = await extractContent(new URL('https://youtu.be/abc123'));
		expect(out.type).toBe('YOUTUBE');
	});
});
