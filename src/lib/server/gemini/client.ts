import { env } from '../env';
import { buildUserPrompt, SYSTEM_PROMPT, PROMPT_VERSION } from './prompt';
import { parseArtifacts } from './parse';
import { validateArtifacts } from './quality';
import { log } from '../logging';
import type { ExtractedContent, Artifacts } from '$lib/types/analysis';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const REQUEST_TIMEOUT_MS = 55_000;

interface GeminiResponse {
	candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export interface ArtifactResult {
	artifacts: Artifacts;
	/** The model that produced these artifacts (for provenance in the UI). */
	model: string;
	promptVersion: string;
}

/**
 * Ask Gemini to produce the three artifacts. Tries each model in GEMINI_MODELS
 * in order; returns null only if every model fails to return parseable,
 * schema-valid artifacts (caller surfaces AI_UNAVAILABLE).
 */
export async function generateArtifacts(content: ExtractedContent): Promise<ArtifactResult | null> {
	for (const model of env.GEMINI_MODELS) {
		const result = await tryModel(model, content);
		if (result) return result;
	}
	return null;
}

async function tryModel(model: string, content: ExtractedContent): Promise<ArtifactResult | null> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		const res = await fetch(`${API_BASE}/models/${model}:generateContent`, {
			method: 'POST',
			signal: controller.signal,
			headers: {
				'Content-Type': 'application/json',
				// Key in a header — never in the URL where it can leak into logs/proxies.
				'x-goog-api-key': env.GEMINI_API_KEY
			},
			body: JSON.stringify({
				contents: [
					{ role: 'user', parts: [{ text: SYSTEM_PROMPT }, { text: buildUserPrompt(content) }] }
				],
				generationConfig: {
					temperature: 0.4,
					maxOutputTokens: 8192,
					responseMimeType: 'application/json'
				}
			})
		});

		if (!res.ok) {
			// Do not log the body — it can echo the prompt/source content back.
			log.warn('gemini: request failed', { model, status: res.status });
			return null;
		}

		const data = (await res.json()) as GeminiResponse;
		const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
		if (!text) {
			log.warn('gemini: empty candidates', { model });
			return null;
		}
		const artifacts = parseArtifacts(text);
		if (!artifacts) return null;
		const issue = validateArtifacts(artifacts);
		if (issue) {
			log.warn('gemini: failed quality gate', { model, issue });
			return null;
		}
		log.info('gemini: ok', { model });
		return { artifacts, model, promptVersion: PROMPT_VERSION };
	} catch (err) {
		log.warn('gemini: request error', {
			model,
			reason: err instanceof DOMException && err.name === 'AbortError' ? 'timeout' : 'network'
		});
		return null;
	} finally {
		clearTimeout(timer);
	}
}
