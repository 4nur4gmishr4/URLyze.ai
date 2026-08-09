# AI pipeline

`gemini/client.ts` calls the Gemini REST API directly — no SDK — so the model
fallback chain, timeout, and error handling stay explicit.

## Request

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
x-goog-api-key: <key>          # header, never a URL param
{
  contents: [{ role: "user", parts: [SYSTEM_PROMPT, buildUserPrompt(content)] }],
  generationConfig: { temperature: 0.4, maxOutputTokens: 8192, responseMimeType: "application/json" }
}
```

- **Key in a header** so it cannot leak into logs, proxies, or referrers.
- **55 s timeout** via `AbortController` (the endpoint allows `maxDuration: 120`).
- **Model fallback chain** from `GEMINI_MODELS` (comma-separated, e.g.
  `gemini-2.5-flash,gemini-2.0-flash`). Each is tried in order; the first model
  that returns parseable, schema-valid, quality-gated artifacts wins. If every
  model fails → `AI_UNAVAILABLE`.

## Prompt

`prompt.ts` ships a system prompt + a user prompt built from the extracted
content. The content is the **only** thing Gemini sees about the source — title,
type, extraction label, language, and the text — never the raw URL or the
owner's session. `PROMPT_VERSION` is stamped on every row for prompt A/Bs.

## Parse

`parse.ts` strips markdown code fences (in case the model wraps JSON anyway),
`JSON.parse`s, then validates against `artifactsSchema` (zod):
`{ summary: string, notes: string, pptContent: [{ title, points[] }] }`.

## Quality gate

`quality.ts` rejects schema-valid-but-garbage output before anything is
persisted, so the next model in the chain gets a chance:

- summary ≥ 40 words, notes ≥ 120 chars
- ≥ 1 slide, every slide ≥ 2 non-empty points and a title
- notes must not be a near-duplicate of summary (degenerate echo output)

## Provenance

Every stored analysis records `model` and `promptVersion` so a bad generation
can be traced to the exact prompt + model that produced it.
