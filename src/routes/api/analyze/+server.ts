import { json, error } from '@sveltejs/kit';
import { analyzeRequestSchema } from '$lib/types/analysis';
import { canonicalize } from '$lib/server/url/normalize';
import { validateTarget } from '$lib/server/security/ssrf';
import { extractContent } from '$lib/server/extract';
import { generateArtifacts } from '$lib/server/gemini/client';
import { enforceRateLimit } from '$lib/server/rate-limit';
import { ensureSessionId } from '$lib/server/session';
import { newRequestId } from '$lib/server/requestId';
import {
	insertAnalysis,
	findAnalysisByCanonical,
	findAnalysisByContentHash,
	serializeAnalysis
} from '$lib/server/db/analyses';
import { log } from '$lib/server/logging';
import { AppError } from '$lib/types/errors';

// Isolate the ~15.6MB youtubei.js bundle to this function's Vercel deployment.
export const config = {
	split: true,
	maxDuration: 120,
	memory: 2048
};

/**
 * POST /api/analyze
 *
 * Full pipeline: validate → rate-limit → anonymous session → canonicalize →
 * duplicate-check → SSRF-guard → extract → Gemini → quality-gate → persist.
 *
 * Duplicate handling returns the stored analysis with `wasDuplicate: true`
 * (no re-analysis, no extra Gemini cost) unless the source content changed —
 * tracked by both canonical URL and content hash.
 */
export async function POST(event) {
	const requestId = newRequestId();
	try {
		const parsed = analyzeRequestSchema.safeParse(await event.request.json().catch(() => null));
		if (!parsed.success) {
			throw new AppError('VALIDATION', 'Invalid request — a URL is required');
		}

		await enforceRateLimit(event.request);

		const ownerId = ensureSessionId(event);

		// Canonicalize before any network I/O so duplicate detection uses a
		// stable identity (all YouTube URL shapes → one video id).
		const identity = canonicalize(parsed.data.url);

		const existing = await findAnalysisByCanonical(ownerId, identity.canonical);
		if (existing) {
			log.info('analyze: duplicate by canonical url', { id: existing.id, requestId });
			return json(serializeAnalysis(existing, true), { headers: { 'x-request-id': requestId } });
		}

		// SSRF-hardened fetch target; validated URL is used for extraction.
		const url = await validateTarget(identity.url);
		log.info('analyze: started', { host: url.hostname, requestId });

		const content = await extractContent(url);

		// Content-level dedup: same page reached via a different link shape.
		const byHash = await findAnalysisByContentHash(ownerId, content.contentHash);
		if (byHash) {
			log.info('analyze: duplicate by content hash', { id: byHash.id, requestId });
			return json(serializeAnalysis(byHash, true), { headers: { 'x-request-id': requestId } });
		}

		const generated = await generateArtifacts(content);
		if (!generated) {
			throw new AppError(
				'AI_UNAVAILABLE',
				'The AI service is unavailable right now — please try again shortly'
			);
		}

		const [row] = await insertAnalysis({
			ownerId,
			originalUrl: parsed.data.url,
			canonicalUrl: identity.canonical,
			sourceType: content.type,
			title: content.title,
			extractionLabel: content.extractionLabel,
			sourceMetadata: content.metadata,
			summary: generated.artifacts.summary,
			notes: generated.artifacts.notes,
			pptContent: JSON.stringify(generated.artifacts.pptContent),
			contentHash: content.contentHash,
			model: generated.model,
			promptVersion: generated.promptVersion,
			extractionQuality: content.quality
		});

		log.info('analyze: complete', { id: row.id, requestId });
		return json(serializeAnalysis(row), { headers: { 'x-request-id': requestId } });
	} catch (e) {
		if (e instanceof AppError) {
			log.warn('analyze: failed', { code: e.code, requestId });
			throw error(e.status, { code: e.code, message: e.message, detail: e.detail });
		}
		log.error('analyze: unexpected', { requestId });
		throw e;
	}
}
