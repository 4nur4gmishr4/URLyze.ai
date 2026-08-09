# Database

Drizzle ORM over **Neon Postgres** via the HTTP driver (`drizzle-orm/neon-http`).
One shared `db` instance per server (`db/index.ts`); no websocket pool to manage
on Vercel's serverless runtime.

## Schema — `analyses`

| column | type | notes |
|---|---|---|
| `id` | uuid PK | `defaultRandom()` |
| `owner_id` | varchar(64) | anonymous session id — every query is scoped by it |
| `original_url` | text | the URL the user submitted |
| `canonical_url` | text | `YOUTUBE:<id>` or `WEB:<normalized href>` — dup key #1 |
| `source_type` | enum | `YOUTUBE` / `WEBPAGE` |
| `title` | text | source title |
| `extraction_label` | text | e.g. "Full transcript" — shown in the EXTRACTION row |
| `source_metadata` | jsonb | YouTube/Web facts (channel, duration, author, …) |
| `summary` / `notes` | text | artifacts |
| `ppt_content` | text | JSON string of `Slide[]` |
| `content_hash` | varchar(64) | sha-256 of normalized text — dup key #2 |
| `model` | varchar(100) | which Gemini model produced it |
| `prompt_version` | varchar(32) | provenance for prompt changes |
| `extraction_quality` | enum | `HIGH` / `GOOD` / `LIMITED` — trust indicator |
| `created_at` / `updated_at` | timestamptz | `defaultNow()` |

`source_metadata` is JSONB on purpose — its shape evolves without migrations.

## Duplicate detection

Two keys, checked in order in the analyze endpoint:

1. **Canonical URL** — same normalized identity (all YouTube shapes collapse to
   a video id; tracking params stripped) → serve the cached row.
2. **Content hash** — same extracted text reached via a different link shape
   (e.g. an AMP mirror) → serve the cached row.

Both are scoped by `ownerId` — a visitor's cache is never another visitor's.

## Queries

`db/analyses.ts` — every read/write takes `ownerId` and `and(eq(ownerId), …)`,
so cross-visitor access is structurally impossible:

- `findAnalysisByCanonical`, `findAnalysisByContentHash` — dedup lookups
- `insertAnalysis` — persist a finished analysis
- `getAnalysisById` — NOT_FOUND when it isn't this visitor's
- `deleteAnalysisById`, `deleteAllAnalyses` — single row / clear history
- `listAnalyses` — search (`ILIKE` on title + original url), source-type
  filter, newest/oldest sort, `limit` (≤ 100) + `offset`

## Migrations

`drizzle-kit` generates SQL migrations into `drizzle/` (tracked in git). Run:

```
npm run db:generate   # diff schema → new migration
npm run db:migrate    # apply
```

## Env

`DATABASE_URL` must be a `postgresql://` URL (Neon HTTP driver requirement).
The schema is validated by zod in `env.schema.ts`; `env.ts` fails fast if it is
missing at runtime (build uses a placeholder so `vite build` works credentialless).
