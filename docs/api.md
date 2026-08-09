# API

Three endpoints. All are ownership-scoped by the anonymous HMAC session cookie
(`ensureSessionId` sets it if absent) and return `x-request-id` where useful.

## POST /api/analyze

Analyze a URL end-to-end.

Request:
```json
{ "url": "https://example.com/article" }
```

Pipeline: validate → rate-limit → session → canonicalize → dup-by-canonical →
SSRF-guard → extract → dup-by-content-hash → Gemini → quality gate → persist.

Responses:
- `200` — `AnalysisResult` (below). If a duplicate was served, `wasDuplicate: true`.
- `400` — invalid body / malformed URL
- `422` — non-http scheme, SSRF-blocked, empty content
- `415` — unsupported content type
- `423` — blocked by the source (429/403)
- `429` — rate-limited
- `502/503/504` — source / AI failures

Error body:
```json
{ "code": "BLOCKED_URL", "message": "This URL points to a private or unreachable address", "detail": "…", "requestId": "…" }
```

`AnalysisResult`:
```ts
{
  id: string; title: string; sourceType: "YOUTUBE" | "WEBPAGE";
  originalUrl: string; sourceMetadata: SourceMetadata;
  quality: "HIGH" | "GOOD" | "LIMITED"; extractionLabel: string;
  model: string; summary: string; notes: string;
  pptContent: { title: string; points: string[] }[];
  createdAt: string; wasDuplicate?: boolean;
}
```

The endpoint is `config.split = true` (own Vercel function) so the ~15 MB
youtubei.js bundle stays isolated. `maxDuration: 120`, `memory: 2048`.

## GET /api/analyses

History list for the current visitor.

Query params: `search`, `sourceType` (`YOUTUBE|WEBPAGE`), `sort`
(`newest|oldest`, default newest), `limit` (≤ 100, default 50), `offset`.

```json
{ "rows": [ /* AnalysisSummary[] */ ], "total": 12, "limit": 50, "offset": 0 }
```

## DELETE /api/analyses

Clear the current visitor's entire history (settings page).

```json
{ "ok": true, "deleted": 12 }
```

## GET /api/analyses/:id

Reopen a saved analysis. Returns `AnalysisResult`; `404` when the id is not this
visitor's (or doesn't exist).

## DELETE /api/analyses/:id

Delete one analysis. Returns `{ "ok": true }` or `404`.

## Client wrapper

`src/lib/client/api.ts` — typed fetch wrappers with `ApiError` (carries `code`,
`message`, `requestId`) and an `AbortController` on `analyze` for cancelling.
