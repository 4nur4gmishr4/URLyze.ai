# URLyze AI

**Turn any URL — a YouTube video or a web article — into three ready-to-use artifacts: an executive summary, detailed study notes, and a slide outline.**

URLyze AI is a server-rendered web app. You paste a URL; the server fetches the actual content behind that URL (the video transcript or the article text), sends it to Google's Gemini models, and returns three AI-generated documents you can read on-screen and download as `.txt`, `.md`, and `.pptx`.

This README documents **everything the system does** — the full user flow, the server-side analysis pipeline, every artifact, the data model, security posture, stack, and how to run/deploy it.

---

## 1. What the system does — at a glance

```
Paste a URL
    │
    ▼
[Server] fetch + extract content from the URL
    │        (YouTube → transcript | Webpage → article text)
    ▼
[Server] Gemini LLM summarizes & restructures the content
    │
    ▼
{ summary, notes, pptContent }
    │
    ├──► 3 result tiles on screen
    ├──► download .txt (summary) / .md (notes) / .pptx (slides)
    └──► saved to history (database)
```

The whole job is: **input = one URL → output = three artifacts**. There is no accounts system, no payments, no background jobs. One call in, one result out.

---

## 2. Core workflow (step by step)

1. **Landing page** — the user is greeted by a hero section and a single URL input ("Paste a URL to start sketching insights").
2. **Submit** — submitting the form navigates to the **dashboard** with the URL as a query parameter (`/dashboard?url=<encoded>`).
3. **Auto-analyze** — the dashboard sees the URL and immediately fires one analysis request to the server. No second click needed.
4. **Extraction (server-side)** — the server determines whether the URL is a YouTube video or a regular web page, then pulls the *actual content*:
   - **YouTube** → the video's transcript (with the description as a fallback).
   - **Webpage** → the page's visible text (headings and paragraphs, with boilerplate stripped).
5. **Summarization (server-side)** — the extracted text is sent to Gemini, which returns three structured artifacts (below).
6. **Rendering** — the dashboard displays three result tiles: **Executive Sketch**, **Study Notes**, and **Slide Outline**.
7. **Downloads** — each tile has a download button producing a real file (`.txt`, `.md`, `.pptx`).
8. **History** — every analysis is persisted. The history page lists past analyses; opening one shows its saved artifacts instantly (no re-analysis).

---

## 3. Features in detail

### 3.1 The three output artifacts

Every analysis produces exactly three artifacts:

| Artifact | What it is | Format | Download |
|---|---|---|---|
| **Executive Summary** ("Executive Sketch") | A plain-text, high-level summary of the content's main point | Plain text | `.txt` |
| **Study Notes** | A full, structured study guide — headings, bullet points, key concepts — suitable for revision | Markdown (rendered on screen) | `.md` |
| **Slide Outline** | A list of slides, each with a title and bullet points — a ready-to-build presentation skeleton | JSON array `[{ title, points[] }]` | `.pptx` |

### 3.2 Downloads

- **Summary** → a `.txt` file named after the source's title.
- **Notes** → a `.md` file (re-usable in any markdown editor).
- **Slides** → a real, styled PowerPoint `.pptx` (generated client-side with `pptxgenjs`, no server round-trip needed for the file itself).

### 3.3 History

- Every analysis is saved (server-side, in Postgres).
- The **History page** lists all past analyses (title, source URL, date, type, preview).
- Re-opening a past analysis loads its stored artifacts **instantly from the database** — it does **not** re-fetch or re-analyze the URL.
- The **Settings page** is the hub for app preferences (theme, etc.).

### 3.4 Theme

- Strict **light** and **dark** modes (plus system preference), applied with no flash-of-unstyled-content.
- Toggle lives in the navbar/sidebar.

---

## 4. The analysis pipeline (deep dive)

This is the heart of the system. It runs server-side in four stages.

### Stage 1 — URL routing

The server inspects the hostname of the submitted URL:

- Hosts like `youtube.com`, `youtu.be`, `m.youtube.com`, `youtube-nocookie.com` → **YouTube path**.
- Everything else (must be `http`/`https`) → **webpage path**.
- Invalid schemes, malformed URLs, or non-http(s) URLs are rejected outright.

### Stage 2 — Content extraction

**YouTube path** (`youtubei.js` library):
1. Extract the video ID from the URL.
2. `Innertube.create({ cache: UniversalCache(false), generate_session_locally: true })` — in-memory session, no persistent cache (required on serverless runtimes).
3. `getInfo(id)` → video metadata + the `short_description`.
4. `getTranscript()` → the video's full captions, concatenated into plain text.
5. **Fallback**: if no transcript is available (auto-captions disabled, etc.), the video description is used.
6. Result is tagged `sourceType: "YOUTUBE"`.

**Webpage path** (`fetchSafe` + `cheerio`):
1. Fetch the page with a browser-like User-Agent and a hard timeout.
2. Strip `script`, `style`, `nav`, `footer`, `iframe`, and `.ad*`/`.ads` elements.
3. Collect the meaningful text — `h1`, `h2`, `h3`, and `p` nodes — in document order.
4. Trim to a maximum length (~30k chars) to fit the LLM context window.
5. Result is tagged `sourceType: "WEBPAGE"`.

### Stage 3 — LLM summarization (Gemini)

1. The extracted text is wrapped in a carefully-crafted prompt that instructs the model to return **strict JSON** with exactly three fields:
   ```json
   {
     "summary":    "...executive summary text...",
     "notes":      "...study notes in markdown...",
     "pptContent": [ { "title": "...", "points": ["...", "..."] } ]
   }
   ```
2. **Model fallback chain**: the configured model list is tried in order (e.g. `gemini-2.5-flash` → `gemini-2.0-flash` → …). If one model fails, the next is tried — resilience against a model being temporarily unavailable or rate-limited.
3. The response is **parsed defensively**: code fences are stripped, the JSON is parsed, and the shape is validated against a zod schema. Partial/edge-case responses degrade gracefully (fields may be returned empty rather than the whole request failing).

### Stage 4 — Persistence

The result `{ id, title, sourceType, summary, notes, pptContent, createdAt }` is written to the `analyses` table in Postgres (Neon, hosted on Vercel). The dashboard's history and the history page read from this table.

---

## 5. Data model

Single table — `analyses`:

| Column | Type | Description |
|---|---|---|
| `id` | uuid (pk) | Unique analysis id |
| `originalUrl` | text | The URL the user submitted |
| `sourceType` | text | `YOUTUBE` or `WEBPAGE` |
| `title` | text | Derived title of the source |
| `summary` | text | Executive summary artifact |
| `notes` | text | Study notes artifact (markdown) |
| `pptContent` | jsonb | Slide outline artifact `[{ title, points[] }]` |
| `createdAt` | timestamp | When the analysis ran |

There is no user table — this is a public, single-tenant tool.

---

## 6. Tech stack

### Current (v1 — the original Next.js app, being replaced)

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion, GSAP |
| API | tRPC v11 (mutation + query routers) |
| DB | Prisma ORM + Postgres |
| Auth | NextAuth v5 beta (scaffolded, not used) |
| Extraction | axios + cheerio (web), youtubei.js (YouTube) |
| AI | Google Gemini REST |
| Files | file-saver, pptxgenjs |

**v1 had real problems that motivated the rewrite:** a hardcoded Gemini API key committed to git, an open server-side fetch of any user-supplied URL (SSRF), no rate limiting on a public endpoint, heavy `any` usage, three competing design systems, a diverged Prisma setup, and history that re-analyzed on every open.

### Target (v2 — the rewrite, in progress)

| Layer | Tech | Why |
|---|---|---|
| Framework | SvelteKit 5 (Svelte 5 runes) + `@sveltejs/adapter-vercel` | Smallest client payloads, fastest initial load, first-class Vercel deploy |
| API | Native `+server.ts` endpoints (no tRPC) | 1 real endpoint doesn't justify an RPC layer |
| DB | Drizzle ORM + Neon (Postgres, HTTP driver) | Typed, tree-shakeable, HTTP-per-query — no websocket dependency on serverless |
| Validation | zod at every boundary | Strict input/output contracts |
| AI | Google Gemini via REST (API key in header, never in URL) | Same model family, hardened transport |
| Extraction | `fetchSafe` (hardened fetch) + cheerio, youtubei.js | SSRF-guarded network access |
| Rate limit | Upstash Ratelimit (Redis sliding window) | Correct across multiple Vercel instances |
| Animations | `motion` (framework-agnostic core) + GSAP | Light, buttery reveals |
| Markdown | micromark | Safe rendering of LLM output (no raw HTML) |
| Tests | vitest | Unit coverage of security + parsing logic |
| Design | `DESIGN.md` (mistral.ai) | French editorial minimalism — PP Editorial Old + Inter, orange/cream sunset palette, strict light+dark |

---

## 7. Security posture

### What the rewrite eliminates (v1 vulnerabilities)

1. **Hardcoded API key** — the Gemini key was committed to the repo and embedded in source. **The leaked key must be rotated in Google Cloud Console.** v2 loads it only from the server environment (`GEMINI_API_KEY`) and sends it as an `x-goog-api-key` header — never in the URL, never in client code.
2. **Server-Side Request Forgery (SSRF)** — v1 would `axios.get()` any user URL with no guard, meaning a request to `http://169.254.169.254/` (cloud metadata) or internal IPs would reach internal infrastructure. v2 adds a **DNS-resolution IP guard**: every fetch resolves the hostname's A/AAAA records and refuses any non-unicast IP (private, loopback, link-local, metadata ranges), re-validating on every redirect hop.
3. **No rate limiting** — v1 exposed an unthrottled public endpoint that hits a paid AI API (cost-abuse vector). v2 rate-limits per client IP with a Redis-backed sliding window.
4. **No CSP / security headers** — v2 ships Content-Security-Policy (nonce-based), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and HSTS (production).
5. **`any` everywhere** — v2 is strictly typed with zero `any`.
6. **Unvalidated env access** — v2 validates all env vars with zod and fails fast.

### Active defenses in v2

- **SSRF guard** (`security/ip.ts`, `security/fetchSafe.ts`): DNS resolution with `node:dns` (`lookup({ all: true, verbatim: true })`), `ipaddr.js` range checks covering IPv4, IPv6, and IPv4-mapped-IPv6 (`::ffff:1.2.3.4`), manual redirect following (max 3 hops) with per-hop re-validation, 10s timeout, 2MB body cap.
- **Rate limiting** (`rate-limit/upstash.ts`): sliding window keyed by client IP; in-memory fallback for local development only.
- **CSP nonce mode**: inline scripts/`style` attributes are allowed only with a per-request nonce; everything else is denied.
- **Sanitized logging** (`logging.ts`): never logs full URLs, query strings, or secrets — only hostnames and error types.
- **Safe markdown**: LLM output is rendered with `micromark` (outputs only safe HTML, no raw/unsafe HTML pass-through).
- **Zod everywhere**: URL shape, request bodies, Gemini responses, and env are all schema-validated.

---

## 8. Environment variables

`.env` (local) / Vercel project settings (production):

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon Postgres connection string |
| `GEMINI_API_KEY` | ✅ | Google AI Studio key (server-only) |
| `GEMINI_MODELS` | — | Comma-separated model fallback chain (default: `gemini-2.5-flash,gemini-2.0-flash`) |
| `RATE_LIMITER` | — | `upstash` (default) or `memory` (local dev) |
| `RATE_LIMIT_MAX` | — | Requests allowed per window (default `20`) |
| `RATE_LIMIT_WINDOW_S` | — | Window length in seconds (default `3600`) |
| `UPSTASH_REDIS_REST_URL` | conditionally | Required when `RATE_LIMITER=upstash` |
| `UPSTASH_REDIS_REST_TOKEN` | conditionally | Required when `RATE_LIMITER=upstash` |

---

## 9. Deployment (Vercel, single place)

The app is a single Vercel project:

- **Framework preset**: SvelteKit via `@sveltejs/adapter-vercel`.
- **Database**: Neon Postgres (connect via the `DATABASE_URL` in Vercel project env vars).
- **Rate limiter**: Upstash Redis (URL + token in env vars).
- **Function configuration**: the analyze endpoint is split into its own function (`split: true`) with a longer max duration (120s) and higher memory so the heavy `youtubei.js` bundle is isolated from all other routes and cold-start latency stays low elsewhere.
- Deploy with `git push` (auto-deploy) or the Vercel CLI: `vercel --prod`.

---

## 10. Local development

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, GEMINI_API_KEY, ...
npm run db:generate         # Drizzle schema -> SQL migration
npm run db:migrate          # apply migrations
npm run dev                 # start Vite dev server
```

Scripts: `dev` · `build` · `preview` · `check` (svelte-check) · `test` (vitest) · `db:generate` / `db:migrate` / `db:push` / `db:studio`.

---

## 11. Design system

The UI follows `DESIGN.md` (generated from mistral.ai via `npx getdesign@latest add mistral.ai`):

- **Palette**: saturated orange primary (`#fa520f`), deep orange pressed (`#cc3a05`), cream surfaces (`#fff8e0`), warm hairlines, ink/charcoal text — a sunset palette.
- **Type**: PP Editorial Old (near-serif, editorial) for hero displays; Inter for everything else; JetBrains Mono for code.
- **Geometry**: sober and editorial — 8px button radius, 12px card radius, *no* pill buttons (pills reserved for badges).
- **Signature**: the horizontal sunset-stripe gradient band at the foot of every page.
- **Modes**: strict light and dark token sets (dark authored explicitly, since the brand has not published a dark palette).

All colors live as semantic CSS custom properties in `src/styles/tokens.css`; components never use raw hex values.

---

## 12. Testing

`npm test` (vitest) covers the security-critical and parsing logic:

- `security/ip.ts` — private/loopback/link-local/cloud-metadata ranges, IPv4-mapped-IPv6 normalization.
- `security/fetchSafe.ts` — redirect re-validation, size/time caps.
- `gemini/parse.ts` — code fences, malformed JSON, partial responses.
- `rate-limit/memory.ts` — window accounting.
- `env.ts` — missing required vars fail fast.

---

## 13. Roadmap / known limitations

- **Non-streaming responses**: v1 returns a complete JSON body; streaming (SSE) is a drop-in enhancement later without changing the endpoint contract.
- **Public history**: with no auth, the history table is shared. Per-user history is a future feature (add an auth provider then).
- **YouTube captions availability**: videos without captions or descriptions fall back to a minimal extraction and the LLM produces what it can.
