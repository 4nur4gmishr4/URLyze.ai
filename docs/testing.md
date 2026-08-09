# Testing

Vitest, `tests/**/*.test.ts`, node environment. Run with `npm test`.

## Coverage

| file | what it proves |
|---|---|
| `tests/url/normalize.test.ts` | YouTube variants collapse to one id; tracking params stripped; content-affecting params kept; www. + http→https normalization; scheme/hostname validation errors |
| `tests/security/ip.test.ts` | `::ffff:` unwrap; global-unicast allow; private/loopback/link-local/cloud-metadata/unspecified/multicast/broadcast block |
| `tests/security/fetchSafe.test.ts` | SSRF block on private resolution (no fetch attempted); cloud-metadata block; manual redirect re-validation; redirect to private / non-http scheme blocked; redirect cap; body size cap; bad-URL rejection. DNS and fetch are mocked (`node:dns/promises` + global `fetch`) |
| `tests/content/hash.test.ts` | deterministic hashing; whitespace-drift-stable; word counting |
| `tests/content/quality.test.ts` | HIGH/GOOD/LIMITED buckets; fallback always LIMITED |
| `tests/extract/webpage.test.ts` | metadata precedence (og:title over `<title>`); boilerplate removal; container → density fallback; EMPTY_CONTENT / UNSUPPORTED_CONTENT_TYPE / BLOCKED_BY_SOURCE / HTTP_ERROR paths. `fetchSafe` mocked, Cheerio runs for real |
| `tests/gemini/parse.test.ts` | code-fence stripping; valid/fenced JSON parsed; malformed and schema-invalid output → null |
| `tests/rate-limit/memory.test.ts` | window admit/block; per-key independence; window expiry reopen; reset value |
| `tests/env.test.ts` | required-var failure; upstash credentials requirement; defaults; model-list split; SESSION_SECRET length; invalid enum |

## Principles

- **Pure functions tested, I/O mocked.** The heavy/live paths (real Gemini,
  real Neon, real youtubei.js) are deliberately not in the unit suite — the
  extract/gemini logic is layered so their pure pieces are testable in
  isolation.
- **Network never touched.** `fetchSafe` and webpage tests stub DNS + fetch;
  nothing leaves the machine.
- Tests assert **error codes**, not message strings, so copy changes don't
  break them.

## Commands

```
npm test           # one run
npm run test:watch # watch mode
```
