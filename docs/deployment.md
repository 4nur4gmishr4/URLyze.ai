# Deployment

SvelteKit with `@sveltejs/adapter-vercel` — one project on Vercel, no other
infra to babysit. The `/api/analyze` function is `split: true` so the
youtubei.js bundle (~15.6 MB) only ships to the one function that needs it.

## One-time setup

1. **Environment variables** — set these in the Vercel project (Settings →
   Environment Variables). All are zod-validated at first server import; the
   deploy fails fast if a required one is missing.

   | var | required | notes |
   |---|---|---|
   | `DATABASE_URL` | yes | Neon `postgresql://` URL (HTTP driver requirement) |
   | `GEMINI_API_KEY` | yes | Google AI Studio key. **Rotate if it ever leaked.** |
   | `GEMINI_MODELS` | no | comma-separated fallback chain, default `gemini-2.5-flash,gemini-2.0-flash` |
   | `RATE_LIMITER` | no | `upstash` (prod default) or `memory` (local dev only) |
   | `RATE_LIMIT_MAX` | no | requests per window per visitor, default `20` |
   | `RATE_LIMIT_WINDOW_S` | no | window seconds, default `3600` |
   | `UPSTASH_REDIS_REST_URL` | when upstash | free Upstash Redis REST URL |
   | `UPSTASH_REDIS_REST_TOKEN` | when upstash | Upstash REST token |
   | `SESSION_SECRET` | no | ≥ 32 chars; if unset a random per-boot secret is used and sessions reset on redeploy |

2. **Database migrations** — `npm run db:migrate` against the production
   database before the first deploy (or `db:push` for a scratch DB). Migrations
   live in `drizzle/` and are tracked in git.

3. **Design/SEO placeholders** — `static/sitemap.xml`, `src/app.html` OG tags,
   and the `urlyze.ai` references assume a production domain. Swap them for the
   real one when going live.

## Runtime characteristics

- **Node 22.x** runtime (`runtime: 'nodejs22.x'` in `svelte.config.js`).
- `/api/analyze` runs as its own function: `maxDuration: 120`, `memory: 2048`.
  Gemini has a 55 s client timeout so the function returns before the hard
  ceiling even on slow model fallback.
- **Memory limiter is for dev only** — on serverless it's per-instance and
  resets when instances spin down. Production must use `RATE_LIMITER=upstash`.
- HSTS (`Strict-Transport-Security`) is set only when `process.env.NODE_ENV ===
  'production'` — locally it would break `http://localhost`.

## Commands

```
npm run build      # vite build, must pass locally before pushing
npm run check      # svelte-check (TS + runes analysis)
npm test           # 76 unit tests, no network
npm run preview    # serve the production build locally
```

## Deploy

```
vercel --prod          # or: push to the linked git repo, Vercel builds it
```

The build placeholder in `src/lib/server/env.ts` (`$app/environment`'s
`building` flag) lets `vite build` succeed with no credentials in the
environment; real values are read from `$env/dynamic/private` at runtime.

## Security headers (set by `hooks.server.ts`)

CSP is nonce-based via `kit.csp` (inline styles carry the page nonce), plus
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Frame-Options: DENY`, `Permissions-Policy`, and production-only HSTS. See
`docs/security.md`.
