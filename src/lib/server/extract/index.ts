import { extractWebpage } from './webpage';
import { extractYouTube } from './youtube';
import type { ExtractedContent } from '$lib/types/analysis';

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
 * Route a URL to the right extractor. YouTube gets its own transcript path;
 * everything else is scraped as a general webpage.
 */
export async function extractContent(url: URL): Promise<ExtractedContent> {
	const host = url.hostname.toLowerCase();
	if (YOUTUBE_HOSTS.has(host)) {
		return extractYouTube(url);
	}
	return extractWebpage(url);
}
