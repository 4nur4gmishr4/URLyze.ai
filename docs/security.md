# Security

The app accepts arbitrary URLs from anyone and fetches them server-side — the
classic SSRF surface. Every defense below is load-bearing; none is decorative.

## SSRF protection

A user-supplied URL is never fetched directly.

1. **Scheme + hostname validation** (`security/ssrf.ts`): only `http:`/`https:`
   with a non-empty hostname.
2. **DNS validation before every request** (`security/ip.ts`): the hostname is
   resolved with `node:dns/promises` `lookup({ all: true, verbatim: true })`,
   and every A/AAAA record must be a **global unicast** address
   (`ipaddr.range(addr, 'unicast')`). This blocks private ranges, loopback,
   link-local, CGNAT, multicast, broadcast, unspecified, and reserved space —
   including `169.254.169.254` (cloud metadata).
3. **IPv4-mapped IPv6 is unwrapped** (`::ffff:1.2.3.4` → `1.2.3.4`) before
   range checks, so the guard cannot be bypassed by address encoding.
4. **Redirects are followed manually** (`security/fetchSafe.ts`), max 3 hops,
   re-resolving and re-validating each hop's hostname. A redirect to a private
   address or a non-http scheme is rejected.

## Request hardening

- **Rate limiting**: Upstash sliding window keyed by client IP (in-memory
  fallback for local dev only). Public endpoint ⇒ bounds Gemini cost.
- **Body caps**: `fetchSafe` enforces a 2 MiB (web 3 MiB) ceiling and 10 s
  timeout via `AbortController`. Oversized pages → `CONTENT_TOO_LARGE`.
- **Content-type gate**: only `text/html`/`application/xhtml+xml` is parsed;
  PDFs, images, JSON → `UNSUPPORTED_CONTENT_TYPE`.
- **Ownership**: anonymous HMAC-signed session cookie → `ownerId` scopes every
  DB query. Visitors only ever see their own history.
- **No secrets in code**: Gemini key goes in the `x-goog-api-key` header, never
  in a URL. `.env` is gitignored; the committed `.env.example` holds placeholders.
- **CSP**: nonce mode via `kit.csp` — `script-src 'self' 'strict-dynamic'`,
  `style-src 'self' 'unsafe-inline'`. Inline theme script carries the nonce.
- **Response headers** (`hooks.server.ts`): `nosniff`, `strict-origin-when-cross-origin`,
  `X-Frame-Options: DENY`, `Permissions-Policy` (camera/mic/geolocation off),
  HSTS on production only.

## Error handling

`AppError(code, message, detail?)` maps each code to an HTTP status
(`types/errors.ts`) and a coarse category. `handleError` never echoes internal
messages back; the client sees a stable code + requestId. Logging is sanitized:
hostnames and error types only, never full URLs, query strings, or keys.
