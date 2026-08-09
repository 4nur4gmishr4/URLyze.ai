# Extraction

`extract/index.ts` routes a URL to the right extractor by hostname.

## YouTube

`extract/youtube.ts` uses **youtubei.js**, imported dynamically so its ~15 MB
bundle is isolated to the endpoint's function (`config.split = true`).

- `Innertube.create({ cache: UniversalCache(false), generate_session_locally: true })`
- `getInfo(id)` → title, channel, duration, thumbnail
- `getTranscript()` → full transcript; when unavailable, falls back to the
  short description and marks the result `isFallback: true` (quality `LIMITED`).

## Webpage

`extract/webpage.ts` fetches through the SSRF-hardened `fetchSafe`, then parses
with Cheerio:

1. **Metadata pass** on `<head>` before any removal — og:/twitter:title,
   description, author, published time, canonical URL, `html lang`.
2. **Boilerplate removal** — script/style/iframe/nav/footer/forms/ads/cookie
   banners/newsletter/subscribe/social/related/comments removed by selector.
3. **Primary container** — `<article>` → `<main>` → `[role=main]`, collecting
   `h1-h4`, `p`, `li`, `blockquote`.
4. **Density fallback** when no container yields > 40 chars — pick the
   `<div>`/`<section>` subtree with the most text.

Output is collapsed to single spaces, sliced to 30 000 chars, hashed for
duplicate detection, and word-counted for the quality bucket.

## Quality buckets

`content/quality.ts` classifies completeness — an honest trust indicator, not a
confidence percentage:

| Bucket | Condition |
|---|---|
| `HIGH` | not a fallback and ≥ 500 words |
| `GOOD` | not a fallback and ≥ 80 words |
| `LIMITED` | fallback (description instead of transcript) or < 80 words |

## Failure taxonomy

Empty remaining content → `EMPTY_CONTENT`; non-HTML content-type →
`UNSUPPORTED_CONTENT_TYPE`; 429/403 from the source → `BLOCKED_BY_SOURCE`; other
4xx/5xx → `HTTP_ERROR`; fetch timeout → `TIMEOUT`.
