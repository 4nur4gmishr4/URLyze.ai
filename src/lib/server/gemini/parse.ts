import { artifactsSchema, type Artifacts } from '$lib/types/analysis';
import { log } from '../logging';

/** Strip markdown code fences if the model wrapped the JSON anyway. */
export function stripCodeFences(raw: string): string {
	const trimmed = raw.trim();
	const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
	return fenced ? fenced[1].trim() : trimmed;
}

/**
 * Parse and validate the model's raw text into `Artifacts`.
 * Degrades gracefully: returns null on any unrecoverable failure so the
 * caller can surface AI_UNAVAILABLE rather than crash.
 */
export function parseArtifacts(raw: string): Artifacts | null {
	const candidate = stripCodeFences(raw);
	let parsed: unknown;
	try {
		parsed = JSON.parse(candidate);
	} catch {
		log.warn('gemini: model returned non-JSON', { snippet: candidate.slice(0, 120) });
		return null;
	}
	const result = artifactsSchema.safeParse(parsed);
	if (!result.success) {
		log.warn('gemini: model JSON failed schema validation', {
			issues: result.error.issues.slice(0, 3).map((i) => i.path.join('.'))
		});
		return null;
	}
	return result.data;
}
