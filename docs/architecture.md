# Architecture

URLyze AI is a SvelteKit 5 app deployed to Vercel. One URL in → three artifacts
out (executive sketch, study notes, slide outline), with txt/md/pptx downloads
and server-backed history.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | SvelteKit 5 (Svelte 5 runes) | Fastest SSR + islands; `$state`/`$derived` ergonomics |
| Adapter | `@sveltejs/adapter-vercel` (Node 22) | Single-place deploy, `split: true` isolates the heavy YouTube bundle |
| ORM | Drizzle + Neon HTTP driver (`drizzle-orm/neon-http`) | No websocket pool on serverless; typed schema in TS |
| Validation | zod at every boundary | Requests, env, Gemini output all validated |
| Rate limit | Upstash sliding window (memory fallback in dev) | Public endpoint ⇒ must cap Gemini spend |
| AI | Gemini REST (`generativelanguage.googleapis.com`) | Direct HTTP, API key in header, model fallback chain |

## Request flow

```
POST /api/analyze { url }
  → zod validate body
  → HMAC session cookie → ownerId (anonymous ownership)
  → canonicalize URL (YouTube variants + tracking-param strip)
  → duplicate check: canonical OR content hash → serve cached row
  → SSRF guard: DNS-resolve + validate every hop is global unicast
  → extract (YouTube transcript | webpage text)
  → Gemini → artifacts (strict JSON, zod-validated)
  → quality gate → persist row → return AnalysisResult
```

## Directory map

```
src/lib/server/     server-only (never imported from client)
  env.schema.ts     pure zod env parser (unit-testable)
  env.ts            validated env singleton
  session.ts        anonymous ownership cookie
  security/         ip.ts, fetchSafe.ts, ssrf.ts — SSRF defense
  extract/          youtube.ts (youtubei.js), webpage.ts (cheerio)
  gemini/           client, prompt, parse, quality
  rate-limit/       upstash + in-memory fallback
  content/          hash.ts, quality.ts — dup detection + trust buckets
  db/               drizzle schema + queries
  url/normalize.ts  canonical URL identity
src/lib/client/     api wrapper, downloads, markdown, theme
src/lib/components/ Svelte components
src/routes/         (public)/ landing+legal, (app)/ dashboard/history/settings
```

## Route groups

- `(public)/` — Navbar + Footer shell: landing, privacy, terms.
- `(app)/` — Sidebar shell: dashboard (`?url=` analyze / `?id=` reopen),
  history (server-backed list, delete), settings (theme, clear history).
- `api/analyze` — the one heavy endpoint; `config.split = true` puts it in its
  own function bundle so the ~15 MB youtubei.js chunk stays isolated.

## State & theme

- Module-level `$state` in `theme.svelte.ts`. Svelte 5 forbids reassigning an
  exported module `$state`, so it is held as an object and mutated via
  `theme.value`; components read the property.
- Theme applied before first paint by an inline nonce'd script in `app.html` to
  avoid FOUC.
