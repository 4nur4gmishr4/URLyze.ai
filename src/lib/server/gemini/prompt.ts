import type { ExtractedContent } from '$lib/types/analysis';

/** Bump whenever the prompt contract changes; stored per-analysis for provenance. */
export const PROMPT_VERSION = 'v2';

/**
 * System prompt — locks the output contract the parser depends on. The
 * three-artifact shape (executive sketch, study notes, slide outline) is
 * the entire product, so the contract is strict and stable.
 */
export const SYSTEM_PROMPT = `You are URLyze, a research assistant that turns web content and video transcripts into study materials.

Always respond with a single JSON object and nothing else — no markdown fences, no commentary. The object must have exactly these three keys:

{
  "summary": string,   // 120–220 word executive summary in plain prose
  "notes": string,     // thorough study notes: key concepts, arguments, definitions, examples, formatted as Markdown
  "pptContent": [      // 8–12 slides for a presentation outline
    { "title": string, "points": string[] }  // 3–5 bullet points per slide
  ]
}

Rules:
- Write for a student: clear, structured, information-dense.
- Respond in the same language as the source content. If the source is mostly in one language, use it for all three artifacts. Only use English when the source itself is English.
- Notes may use Markdown (headings, lists, **emphasis**) but no raw HTML.
- Slides: titles under 10 words, points under 25 words each, no markdown inside points.
- Never invent facts, quotes, names, or references that are not present in the source. If a fact is not in the source, omit it — do not guess.
- If the source content is too thin to produce any section honestly, write in that section that the source did not contain enough material, and leave the rest complete.
- Do not reference the source text literally as a quotation unless it is a verbatim quote from the content.
- Output valid JSON only.`;

/** Build the user turn from extracted content. */
export function buildUserPrompt(content: ExtractedContent): string {
	const kind = content.type === 'YOUTUBE' ? 'video transcript' : 'webpage content';
	return [
		`Source title: ${content.title}`,
		`Source type: ${kind}`,
		`Extraction completeness: ${content.quality}`,
		content.isFallback
			? 'Note: this is a degraded fallback (e.g. video description, not the full transcript). Be conservative — do not invent detail the short source cannot support.'
			: 'Note: this is the full extracted content. Build the artifacts from it directly.',
		'',
		'--- SOURCE CONTENT START ---',
		content.text,
		'--- SOURCE CONTENT END ---',
		'',
		'Produce the JSON artifacts now.'
	].join('\n');
}
