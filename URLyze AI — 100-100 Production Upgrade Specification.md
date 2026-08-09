# URLyze AI — 100/100 Production Upgrade Specification

**Document type:** Product + UX + UI + Architecture + Security + QA Implementation Specification  
**Project:** URLyze AI  
**Target:** Production-quality, portfolio-grade, zero additional development/infrastructure cost  
**Current architecture:** SvelteKit 5 + Svelte 5 + Drizzle + Neon Postgres + Gemini REST + Upstash Ratelimit + Vitest  
**Design foundation:** Mistral-inspired editorial design system  
**Primary principle:** Improve the existing product without turning it into a bloated AI platform.

---

# 1. Executive Objective

URLyze AI currently converts a YouTube video or web article into three artifacts:

1. Executive Sketch
2. Study Notes
3. Slide Outline

The existing README defines the core product as:

> one URL → three artifacts

with server-side content extraction, Gemini generation, persistence, and downloadable `.txt`, `.md`, and `.pptx` outputs. The current v2 architecture uses SvelteKit 5, native server endpoints, Drizzle/Neon, Zod, Gemini REST, hardened extraction, Upstash rate limiting, Motion/GSAP, micromark, and Vitest. 
The goal of this specification is **not to add dozens of features**.

The goal is to make the existing experience:

- clearer
- safer
- more reliable
- more trustworthy
- more accessible
- more responsive
- more polished
- more differentiated
- easier to maintain
- cheaper to operate
- better for recruiters and real users

while preserving the core product:

```text
                    URL
                     │
                     ▼
             Source Detection
                     │
                     ▼
             Content Extraction
                     │
                     ▼
             Content Validation
                     │
                     ▼
               AI Analysis
                     │
                     ▼
             Quality Validation
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   Executive      Study Notes   Slide Outline
    Sketch
       │             │             │
       └─────────────┼─────────────┘
                     ▼
                  History
                     │
              Download / Copy
```

---

# 2. Non-Negotiable Product Principles

## 2.1 Keep the core workflow

Do not turn URLyze into:

- a general AI chatbot
- an AI agent platform
- an AI workspace
- a multi-model playground
- a social network
- a collaboration suite
- a RAG platform
- a prompt marketplace

The core remains:

```text
Paste URL
    ↓
Analyze
    ↓
Understand
    ↓
Learn
    ↓
Present
```

The current three-artifact model is one of the strongest parts of the product and must remain central.

---

# 3. Product Positioning

## 3.1 Current positioning problem

The generic positioning:

> AI summarizer for YouTube and articles

is weak because the category is crowded.

URLyze should instead communicate:

> **Turn anything online into knowledge.**

Supporting statement:

> Paste a YouTube video or web article and URLyze transforms it into an executive summary, structured study notes, and presentation-ready slides.

## 3.2 Product mental model

URLyze should communicate three actions:

### UNDERSTAND

Executive Sketch

Quickly understand the source without consuming the entire thing.

### LEARN

Study Notes

Turn the source into structured, revision-friendly knowledge.

### USE

Slide Outline

Turn the knowledge into presentation-ready structure.

Therefore:

```text
SOURCE
  ↓
UNDERSTAND
  ↓
LEARN
  ↓
USE
```

---

# 4. Product Success Criteria

URLyze should pass all of the following.

## 4.1 First-use test

A new user should understand what the product does within 5 seconds.

## 4.2 Input test

The user should be able to submit a valid URL without instructions.

## 4.3 Processing test

The user should understand what URLyze is doing while waiting.

## 4.4 Result test

The user should immediately understand:

- what source was analyzed
- what content was extracted
- how reliable the analysis is
- what each artifact means
- how to copy/download it

## 4.5 Failure test

Every failure must answer:

1. What happened?
2. Why?
3. What should the user do next?

## 4.6 Recovery test

A failed analysis must not leave the application in a broken state.

## 4.7 Accessibility test

The entire application must be usable with keyboard navigation and screen readers.

---

# 5. Architecture — Preserve and Harden

The current target architecture is already appropriate:

| Layer | Technology |
|---|---|
| Framework | SvelteKit 5 |
| UI | Svelte 5 |
| Styling | Existing design-token system |
| API | Native `+server.ts` |
| Database | Neon PostgreSQL |
| ORM | Drizzle |
| Validation | Zod |
| AI | Gemini REST |
| Web extraction | hardened fetch + Cheerio |
| YouTube | youtubei.js |
| Rate limiting | Upstash Ratelimit |
| Markdown | micromark |
| Animation | Motion + GSAP |
| Testing | Vitest |

The existing README explicitly chose this architecture because it avoids unnecessary RPC and websocket complexity and fits Vercel/serverless deployment.

## 5.1 Do NOT introduce

Unless a future requirement genuinely demands it, do not add:

- Kubernetes
- Kafka
- RabbitMQ
- Redis queues
- microservices
- GraphQL
- tRPC
- separate Python service
- vector database
- Elasticsearch
- Elasticsearch-like search infrastructure
- dedicated worker infrastructure
- paid observability platforms

These would increase complexity without improving the core product enough.

---

# 6. Request Architecture

The analysis request should follow:

```text
POST /api/analyze

        │
        ▼
Validate request with Zod
        │
        ▼
Normalize URL
        │
        ▼
Determine source type
        │
        ├──── YouTube
        │        │
        │        ▼
        │   Extract transcript
        │
        └──── Web
                 │
                 ▼
           fetchSafe()
                 │
                 ▼
           Extract content
        │
        ▼
Validate extraction
        │
        ▼
Calculate content metadata
        │
        ▼
Check duplicate/cache
        │
        ▼
Prepare LLM input
        │
        ▼
Gemini model fallback chain
        │
        ▼
Parse response
        │
        ▼
Zod artifact validation
        │
        ▼
Quality checks
        │
        ▼
Persist analysis
        │
        ▼
Return result
```

---

# 7. URL Normalization

Implement canonical URL normalization before analysis.

## 7.1 YouTube normalization

These should resolve to the same canonical video identity:

```text
https://www.youtube.com/watch?v=ABC
https://youtube.com/watch?v=ABC
https://youtu.be/ABC
https://m.youtube.com/watch?v=ABC
```

Canonical representation:

```text
YOUTUBE:ABC
```

Do not use the raw submitted URL as the only duplicate identifier.

## 7.2 Web URL normalization

Normalize:

- protocol
- hostname casing
- trailing slash
- irrelevant tracking parameters
- fragment identifiers where appropriate

Example:

```text
https://example.com/article?utm_source=x#section
```

can normalize to:

```text
https://example.com/article
```

Do not blindly remove query parameters that may affect actual content.

Maintain an allowlist of tracking parameters rather than deleting every query parameter.

---

# 8. Duplicate Analysis Prevention

Before invoking Gemini:

```text
canonical source
       ↓
existing analysis?
       │
   ┌───┴────┐
   │        │
  YES       NO
   │        │
reuse      analyze
```

If an existing analysis is found:

```text
This source was analyzed before.

[Open existing analysis]
[Analyze again]
```

This prevents:

- duplicate AI requests
- duplicate database rows
- unnecessary extraction
- unnecessary latency
- unnecessary API usage

---

# 9. Content Extraction — Web

The existing implementation extracts `h1`, `h2`, `h3`, and `p` content after removing common boilerplate.

Improve this using layered extraction.

## 9.1 Extraction priority

Use:

```text
<article>
<main>
[role="main"]
```

before generic paragraph extraction.

Then fallback to text-density heuristics.

## 9.2 Remove

Remove:

- script
- style
- noscript
- iframe
- nav
- footer
- advertisements
- cookie banners
- newsletter popups
- obvious tracking elements
- repeated navigation
- social sharing widgets

## 9.3 Preserve

Preserve:

- title
- headings
- paragraphs
- lists
- meaningful blockquotes
- table text where practical
- article metadata when available

## 9.4 Metadata

Extract:

```text
title
description
author
published date
modified date
domain
canonical URL
language
```

Do not invent missing metadata.

---

# 10. Web Extraction Failure Classification

Do not collapse every extraction problem into one generic error.

Create:

```text
INVALID_URL
UNSUPPORTED_URL
NETWORK_ERROR
TIMEOUT
HTTP_ERROR
BLOCKED_BY_SOURCE
EMPTY_CONTENT
CONTENT_TOO_LARGE
UNSUPPORTED_CONTENT_TYPE
EXTRACTION_FAILED
```

Example UI:

> **This page couldn't be analyzed**
>
> The website returned content that URLyze couldn't extract safely.
>
> Try another article URL.

---

# 11. Content-Type Validation

Before parsing:

Accept appropriate content types such as:

```text
text/html
application/xhtml+xml
```

Reject unsupported types unless explicitly implemented.

Never assume:

```text
HTTP 200 = article
```

---

# 12. Response Size Protection

Maintain a hard body limit.

The current v2 design already specifies a 2 MB cap.

Keep it.

Do not increase it casually.

Large pages should be handled by:

- early truncation
- intelligent extraction
- content prioritization

rather than unlimited downloads.

---

# 13. YouTube Extraction

The current system:

1. extracts video ID
2. gets video information
3. gets transcript
4. falls back to description
5. tags the result as YouTube.

Keep this.

Improve the user-facing states.

## 13.1 Full transcript

Display:

```text
✓ Full transcript available
```

## 13.2 Description fallback

Display:

```text
⚠ Transcript unavailable

This analysis uses the video's description.
Results may be less detailed.
```

## 13.3 No useful content

Do not ask Gemini to hallucinate.

Display:

```text
This video doesn't contain enough accessible
content for a reliable analysis.
```

---

# 14. Source Metadata Panel

Every result must show:

```text
SOURCE
YouTube / Web Article

TITLE
...

DOMAIN / CHANNEL
...

LANGUAGE
English

CONTENT
3,842 words

EXTRACTION
Full transcript
```

For YouTube:

```text
Duration
Channel
Published date
Transcript availability
```

For web:

```text
Domain
Author
Published date
Reading time
Article length
```

Only display fields that were actually extracted.

---

# 15. Analysis Quality Indicator

Do not claim numerical accuracy that you cannot measure.

Instead use qualitative states:

```text
High confidence
```

```text
Good
```

```text
Limited
```

Based on extraction completeness.

Example:

```text
Analysis quality
● High

Based on the complete transcript.
```

or:

```text
Analysis quality
● Limited

Based only on the video description.
```

This is a trust feature, not a fake AI confidence score.

---

# 16. LLM Prompt Architecture

Do not use one vague prompt.

Create structured instructions for each artifact.

The existing Gemini response contract is:

```json
{
  "summary": "...",
  "notes": "...",
  "pptContent": [
    {
      "title": "...",
      "points": ["..."]
    }
  ]
}
```

and the existing system already uses defensive JSON parsing and schema validation.

Keep this contract.

---

# 17. Executive Sketch Requirements

The summary must:

- identify the central thesis
- explain the main point
- preserve important facts
- preserve important numbers
- identify major conclusions
- avoid generic filler
- avoid unsupported claims
- avoid repeating the source title unnecessarily

Recommended structure:

```text
One-paragraph executive summary

Key insights:
1.
2.
3.
4.
5.

Bottom line:
...
```

---

# 18. Study Notes Requirements

Study notes must be structured.

Recommended:

```markdown
# Overview

## Core Idea

## Key Concepts

## Important Details

## Examples

## Definitions

## Relationships

## Practical Applications

## Key Takeaways

## Revision Checklist
```

The exact sections may adapt to the source.

Do not force irrelevant headings.

---

# 19. Slide Outline Requirements

Generate approximately:

```text
6–12 slides
```

depending on source complexity.

Rules:

- one idea per slide
- concise bullets
- no paragraph dumping
- logical progression
- introduction
- core content
- conclusion
- references when appropriate

Each slide:

```json
{
  "title": "string",
  "points": [
    "short point",
    "short point",
    "short point"
  ]
}
```

---

# 20. AI Hallucination Controls

The prompt must explicitly instruct:

```text
Do not invent:
- facts
- names
- statistics
- citations
- quotes
- conclusions
- examples presented as source facts
```

Distinguish:

```text
SOURCE CLAIM
```

from:

```text
AI INTERPRETATION
```

where relevant.

If information is absent:

> The source does not provide enough information to determine this.

Never fabricate.

---

# 21. Language Handling

Detect source language.

Default output language:

```text
same as source
```

Allow future optional setting:

```text
Output language:
Same as source
English
Hindi
...
```

Do not translate unless requested.

This keeps the default experience predictable.

---

# 22. Long Content Strategy

Do not simply discard the end of a long article.

The current system has an approximately 30k-character extraction limit.

Improve the strategy:

```text
Extract
   ↓
Normalize
   ↓
Prioritize:
  title
  introduction
  headings
  key sections
  conclusion
   ↓
Chunk if necessary
   ↓
Summarize chunks
   ↓
Synthesize final artifacts
```

Use the simplest implementation that fits Gemini's available context.

Do not add a vector database merely for this.

---

# 23. Source-Grounded Evidence Layer

This is the most valuable advanced improvement.

When possible, maintain internal source chunks:

```text
chunk_001
chunk_002
chunk_003
...
```

The generated artifacts can reference them internally.

Example:

```json
{
  "claim": "Backpropagation updates model weights...",
  "sourceChunk": "chunk_017"
}
```

The UI can eventually provide:

```text
Source
↗
```

which opens the relevant extracted content.

This gives URLyze a meaningful advantage over generic summarizers.

---

# 24. Result Dashboard

The dashboard must have strong hierarchy.

Recommended structure:

```text
SOURCE HEADER

Title
Source type
Metadata
Quality

ACTION BAR

[Copy] [Download] [Re-analyze]

────────────────────────────

EXECUTIVE SKETCH

Main summary
Key insights

────────────────────────────

STUDY NOTES

Structured notes

────────────────────────────

SLIDE OUTLINE

Slide 01
Slide 02
Slide 03
...
```

Do not give all three artifacts equal visual weight.

The Executive Sketch should be the initial overview.

---

# 25. Artifact Navigation

On long pages, provide:

```text
Executive Sketch
Study Notes
Slide Outline
```

as section navigation.

On desktop:

```text
sticky side navigation
```

On mobile:

```text
compact horizontal navigation
```

Do not create excessive tabs.

---

# 26. Copy Actions

Every artifact needs:

```text
Copy
```

After successful copying:

```text
✓ Copied
```

Return automatically to:

```text
Copy
```

after a short delay.

Use the Clipboard API.

Fallback gracefully if clipboard access is unavailable.

---

# 27. Download Actions

Maintain:

```text
Summary → .txt
Notes → .md
Slides → .pptx
```

as currently specified.

Improve:

- filename sanitization
- Unicode support
- long title handling
- duplicate filename prevention
- proper MIME types
- correct file extensions

Example:

```text
URLyze - How Neural Networks Learn.txt
URLyze - How Neural Networks Learn.md
URLyze - How Neural Networks Learn.pptx
```

---

# 28. PowerPoint Quality Requirements

PPT generation must include:

- title slide
- consistent typography
- consistent spacing
- readable font sizes
- slide numbers
- concise bullets
- no text overflow
- no empty slides
- conclusion
- source information where appropriate

Before generating:

```text
validate slide count
validate title
validate points
validate text length
```

Do not allow an LLM response to directly produce an unusable deck.

---

# 29. Regeneration

Provide:

```text
Re-analyze
```

and artifact-specific regeneration:

```text
Regenerate summary
Regenerate notes
Regenerate slides
```

Avoid forcing the user to submit the URL again.

---

# 30. Preset Transformations

Do not create a general chatbot.

Use bounded actions:

```text
Study Notes
[Standard]
[Exam Revision]
[Beginner Friendly]
[Technical]

Slides
[Academic]
[Business]
[Technical]
```

These can map directly to prompt variants.

No additional infrastructure is required.

---

# 31. Analysis Progress UX

Never show only:

```text
Loading...
```

Use:

```text
Analyzing your source

✓ URL validated
✓ Source identified
✓ Content extracted
● Creating knowledge artifacts
○ Preparing presentation
```

The exact steps should reflect actual backend progress where possible.

Do not fake progress.

---

# 32. Loading Skeletons

Use layout-preserving skeletons for:

- source header
- summary
- notes
- slides

Avoid a blank screen.

---

# 33. Error UX

Every error must have:

### Title

What happened.

### Explanation

Why it happened.

### Action

What the user can do.

Example:

```text
We couldn't extract this page.

The website returned content that URLyze
couldn't safely read.

[Try another URL]
```

Do not expose stack traces.

Do not expose API internals.

Do not expose Gemini error messages directly.

---

# 34. Rate Limit UX

The existing system uses Upstash sliding-window rate limiting.

When exceeded:

```text
You've reached the current analysis limit.

Please try again later.
```

Do not say:

```text
Upstash returned HTTP 429.
```

---

# 35. Anonymous History

The current README explicitly identifies the absence of a user table and the shared-history limitation.

Before adding full authentication, implement anonymous ownership.

Preferred approach:

```text
HTTP-only session cookie
        ↓
anonymousSessionId
        ↓
analysis ownership
```

Database:

```text
analyses
anonymousSessionId
```

Then:

```text
User A
  ↓
only sees User A analyses

User B
  ↓
only sees User B analyses
```

This requires no paid authentication provider.

---

# 36. Future Authentication

Authentication can later add:

```text
Google login
```

without changing the core analysis architecture.

Do not block the MVP on authentication.

---

# 37. Delete Analysis

Every history item should support:

```text
Delete
```

Confirmation:

```text
Delete this analysis?

This action cannot be undone.

[Cancel] [Delete]
```

After deletion:

```text
Analysis deleted.
```

---

# 38. History Search

History should support:

```text
Search analyses...
```

and:

```text
All
YouTube
Web
```

Sort:

```text
Newest
Oldest
```

Search:

- title
- domain
- source type

Do not build Elasticsearch.

Postgres is enough.

---

# 39. History Empty State

Use:

```text
Your knowledge history is empty.

Analyze your first source to see it here.

[Analyze a URL]
```

---

# 40. Database Improvements

Recommended `analyses` fields:

```text
id
ownerId / anonymousSessionId
originalUrl
canonicalUrl
sourceType
title
sourceMetadata
summary
notes
pptContent
contentHash
model
promptVersion
extractionQuality
createdAt
updatedAt
```

The existing core fields are already:

- id
- originalUrl
- sourceType
- title
- summary
- notes
- pptContent
- createdAt.

Add fields only when they provide real operational value.

---

# 41. Prompt Versioning

Store:

```text
promptVersion
```

Example:

```text
2026-08-v1
```

This allows you to understand why older analyses differ from new ones.

Also store:

```text
model
```

and optionally:

```text
extractionVersion
```

This is extremely useful for debugging.

---

# 42. Content Hashing

Create:

```text
contentHash
```

from normalized extracted content.

Then you can distinguish:

```text
same URL + same content
```

from:

```text
same URL + changed content
```

This makes caching safer.

---

# 43. Caching Strategy

Use existing Postgres before adding infrastructure.

Cache key concept:

```text
canonicalUrl
+
contentHash
+
promptVersion
+
model
```

If all match:

```text
reuse existing analysis
```

Do not re-run Gemini unnecessarily.

---

# 44. Security — Preserve Existing Defenses

The current v2 already addresses:

- leaked API keys
- SSRF
- rate limiting
- CSP
- security headers
- `any`
- environment validation.

Do not weaken these for convenience.

---

# 45. SSRF Requirements

The current design already specifies:

- DNS resolution
- IPv4/IPv6 checks
- IPv4-mapped IPv6 checks
- private range blocking
- loopback blocking
- link-local blocking
- metadata protection
- redirect re-validation
- maximum 3 redirects
- 10-second timeout
- 2 MB body cap.

Treat this as mandatory.

Never replace it with:

```ts
fetch(url)
```

for user-controlled URLs.

---

# 46. Redirect Security

Never automatically trust redirect destinations.

For every redirect:

```text
resolve hostname
       ↓
validate IP
       ↓
validate protocol
       ↓
follow
```

Repeat for every hop.

---

# 47. Gemini Key Security

The current v2 correctly moves the key to server-side environment variables and uses the `x-goog-api-key` header rather than putting the key in the URL.

Maintain:

```text
GEMINI_API_KEY
```

server-only.

Never:

```text
PUBLIC_GEMINI_API_KEY
```

Never expose it to the browser.

Rotate any key that was previously committed to source control.

---

# 48. Environment Validation

Validate startup configuration with Zod.

Required:

```text
DATABASE_URL
GEMINI_API_KEY
```

Conditional:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

The existing environment model is documented in the README.

---

# 49. Security Headers

Keep:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
X-Frame-Options
Permissions-Policy
HSTS
```

for production.

Test the CSP rather than simply adding a header and assuming it works.

---

# 50. Markdown Security

The current system uses micromark and explicitly avoids raw/unsafe HTML.

Maintain:

```text
LLM markdown
   ↓
safe parser
   ↓
safe HTML
```

Never inject raw LLM output with:

```text
{@html rawLLMOutput}
```

without sanitization.

---

# 51. Logging

Use structured logging:

```text
requestId
hostname
sourceType
duration
extractionDuration
llmDuration
status
errorType
model
contentLength
```

Never log:

- API keys
- full user URLs
- query strings
- transcripts
- full article contents
- cookies
- authentication tokens

The existing logging design already explicitly avoids full URLs, query strings, and secrets.

---

# 52. Request IDs

Every analysis should have:

```text
requestId
```

Example:

```text
ULZ-7F92A
```

If an error occurs:

> Something went wrong. Reference: ULZ-7F92A.

This is useful for debugging without exposing internal details.

---

# 53. Accessibility

Target WCAG AA.

## Keyboard

All controls must work with:

```text
Tab
Shift + Tab
Enter
Space
Escape
Arrow keys where appropriate
```

## Focus

Every interactive element requires visible focus.

## Semantics

Use:

```html
<header>
<nav>
<main>
<section>
<article>
<footer>
<button>
<label>
```

appropriately.

## Forms

Every input must have a programmatically associated label.

---

# 54. Screen Reader Requirements

Loading:

```text
aria-live="polite"
```

for meaningful status changes.

Errors:

```text
role="alert"
```

where appropriate.

Dialog:

```text
role="dialog"
aria-modal="true"
```

Buttons must describe their action.

Avoid:

```text
<button>...</button>
```

with icon-only controls that have no accessible name.

---

# 55. Reduced Motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Disable or significantly reduce:

- parallax
- large entrance animations
- animated gradients
- decorative movement

Keep functional transitions short.

The existing design notes suggest approximately 150–200ms transitions; use that as the default for ordinary interaction.

---

# 56. Responsive Design

The current DESIGN.md defines:

- <480px mobile
- 480–767px large mobile
- 768–1023px tablet
- 1024–1279px desktop
- ≥1280px wide desktop.

Preserve the breakpoint philosophy.

Do not merely shrink desktop layouts.

---

# 57. Mobile Dashboard

Mobile structure:

```text
Source
  ↓
Executive Sketch
  ↓
Study Notes
  ↓
Slide Outline
```

Use:

- full-width content
- minimum 44px touch targets
- no horizontal overflow
- compact metadata
- sticky artifact actions where useful

The existing design already specifies 44px form inputs and mobile touch targets.

---

# 58. Design System

Use semantic tokens.

The current system defines:

- saturated orange
- cream
- yellow
- ink
- slate
- hairlines
- dark surfaces.

Continue using semantic variables:

```css
--color-primary
--color-primary-deep
--color-surface
--color-surface-cream
--color-text
--color-text-muted
--color-border
```

Components must not contain arbitrary raw hex values.

The README explicitly states that colors belong in semantic CSS variables.

---

# 59. Typography

The design currently uses:

- PP Editorial Old for hero/editorial display
- Inter for UI/body
- JetBrains Mono for code.

Maintain the hierarchy.

However:

## Font licensing requirement

Before deployment, verify that the selected display font is legally licensed for web distribution.

If not, replace it with a properly licensed editorial serif.

Never ship an unlicensed font merely to achieve visual fidelity.

---

# 60. Do Not Copy Mistral Branding Literally

The design foundation is Mistral-inspired.

The current DESIGN.md identifies the mountain-sunset photography and sunset stripe as Mistral's recognizable visual signature.

URLyze should therefore preserve:

- editorial typography
- warm palette
- restrained geometry
- atmospheric gradients
- generous whitespace

but develop its own identity.

## URLyze signature

Create a visual concept around:

```text
URL
 ↓
Transformation
 ↓
Knowledge
```

This can appear subtly through:

- diagrams
- transition animations
- source-to-artifact visual language
- URL input states
- artifact navigation

Do not imitate Mistral's logo, wordmark, copy, photography, or brand assets.

---

# 61. Color Usage

The current primary orange is:

```text
#FA520F
```

and cream:

```text
#FFF8E0
```

with the sunset palette documented in DESIGN.md.

Primary orange should remain reserved for:

- primary CTA
- active states
- links where appropriate
- important status
- signature visual treatment

Do not turn the entire application orange.

---

# 62. Geometry

Keep:

```text
Buttons: 8px
Cards: 12px
Large panels: 16–20px
Pills: badges/tabs only
```

The design explicitly rejects pill-shaped buttons and recommends sober editorial geometry.

---

# 63. Shadows

The design intentionally uses mostly flat surfaces.

Maintain:

```text
default:
border only

feature:
very subtle shadow

mockup:
stronger shadow

modal:
strongest shadow
```

Do not add generic "AI SaaS glow" everywhere.

---

# 64. Dark Mode

The current README promises strict light/dark/system modes.

The DESIGN.md notes that a published dark palette was not available and therefore dark tokens must be authored explicitly.

Create semantic dark tokens:

```text
dark.canvas
dark.surface
dark.surface-elevated
dark.border
dark.text
dark.text-muted
dark.primary
dark.cream
```

Do not simply invert colors.

---

# 65. Navigation

Desktop:

```text
URLyze
Analyze
History
Settings

                         Theme
```

Avoid copying Mistral's navigation structure literally.

For URLyze, navigation should serve the product.

Recommended:

```text
Home
History
Settings
```

and primary CTA:

```text
Analyze URL
```

---

# 66. Landing Page

Recommended structure:

```text
1. Navigation

2. Hero
   "Turn anything online into knowledge."

3. URL input

4. Three artifact explanation

5. How it works

6. Example analysis

7. Security/privacy explanation

8. Final CTA

9. Sunset/editorial visual signature

10. Footer
```

---

# 67. Hero

Hero should contain:

```text
Eyebrow:
KNOWLEDGE FROM ANY URL

Headline:
Turn anything online
into knowledge.

Description:
Transform YouTube videos and web articles
into summaries, study notes, and
presentation-ready slides.

URL input

Primary:
Analyze URL

Secondary:
See how it works
```

Do not overload the hero with technical claims.

---

# 68. How It Works

Three steps:

```text
01
PASTE

Paste a YouTube video or web article.

02
ANALYZE

URLyze extracts the source and
creates structured knowledge.

03
USE

Read, revise, present, copy,
or download the result.
```

---

# 69. Trust Section

Explain:

```text
Your source is fetched server-side.
Unsafe destinations are blocked.
AI output is validated.
API keys stay server-side.
```

These claims are supported by the current security architecture.

Avoid saying:

> 100% accurate.

Never make that claim.

---

# 70. SEO

Add:

```text
<title>
<meta name="description">
canonical
OpenGraph
Twitter metadata
favicon
robots.txt
sitemap.xml
```

Homepage title:

```text
URLyze — Turn Any URL Into Knowledge
```

Description:

```text
Turn YouTube videos and web articles into
executive summaries, study notes, and
presentation-ready slides.
```

---

# 71. Privacy

Create a real privacy page explaining:

- what URL is submitted
- what content is fetched
- what is stored
- how long it is stored
- whether generated artifacts are retained
- whether anonymous history exists
- how deletion works
- how AI processing works

Do not claim data deletion policies that the implementation does not actually enforce.

---

# 72. Terms

Create a simple Terms page covering:

- acceptable use
- prohibited abuse
- limitations
- third-party content
- AI-generated output
- no guarantee of accuracy
- service availability

Do not write legal guarantees you cannot support.

---

# 73. Responsible AI Disclaimer

Use concise language:

> URLyze generates AI-assisted summaries and study materials from the source content. AI-generated output can contain mistakes. Verify important facts against the original source.

Place this near results/downloads rather than hiding it exclusively in legal text.

---

# 74. Performance

Focus optimization on real bottlenecks.

Primary latency sources:

```text
source fetch
transcript extraction
Gemini
```

Therefore:

1. avoid duplicate analysis
2. cache where safe
3. minimize input size
4. remove boilerplate
5. use model fallback intelligently
6. lazy-load client-only PPT generation
7. minimize client JavaScript
8. avoid unnecessary animations

---

# 75. Client Bundle

SvelteKit is already chosen partly for smaller client payloads.

Do not import heavy libraries globally.

Especially:

```text
pptxgenjs
GSAP
large markdown tooling
```

Load only where required.

---

# 76. Animation

Use animation for hierarchy, not decoration.

Recommended:

```text
150–200ms
ease-out
```

Use:

- fade
- slight translate
- content reveal
- progress transitions

Avoid:

- excessive bouncing
- huge scaling
- perpetual motion
- decorative animations everywhere

---

# 77. Testing Strategy

Current Vitest coverage includes:

- IP security
- fetch safety
- Gemini parsing
- rate limiting
- environment validation.

Expand it.

## Unit tests

### URL normalization

Test:

- YouTube variants
- tracking parameters
- fragments
- invalid schemes
- malformed URLs

### IP validation

Test:

- localhost
- loopback
- private IPv4
- private IPv6
- link-local
- metadata
- mapped IPv6

### Fetch safety

Test:

- redirects
- redirect to private IP
- timeout
- body cap
- unsupported content type

### Extraction

Test:

- article
- empty HTML
- ad-heavy HTML
- malformed HTML
- nested article
- missing title

### Gemini parsing

Test:

- valid JSON
- fenced JSON
- malformed JSON
- missing field
- invalid field type
- partial output

### Artifacts

Test:

- summary
- notes
- slides
- empty slide
- excessive bullet length

---

# 78. Integration Tests

Test:

```text
POST /api/analyze
```

with:

```text
valid YouTube
valid web article
invalid URL
blocked URL
empty article
rate limited request
Gemini failure
database failure
duplicate URL
```

---

# 79. Regression Tests

Every production bug becomes a test.

Example:

```text
Bug:
YouTube shortened URLs incorrectly rejected.

Fix:
Add test.

Never regress.
```

---

# 80. Quality Gate

Before returning AI output:

```text
Zod validation
        ↓
artifact completeness
        ↓
content length validation
        ↓
slide validation
        ↓
empty-content detection
        ↓
duplicate-content detection
        ↓
return
```

If the artifact is invalid:

```text
retry/fallback
```

Do not display obviously broken AI output.

---

# 81. AI Model Fallback

The current model fallback chain should remain.

Example:

```text
Model A
  ↓ failure
Model B
  ↓ failure
Model C
```

But don't blindly retry every failure.

Retry only recoverable failures such as:

- temporary availability
- rate limits
- transient network failure

Do not retry malformed input indefinitely.

---

# 82. Retry Limits

Maximum:

```text
1 fallback attempt per model
```

Do not create retry loops.

---

# 83. Error Classification

Internally distinguish:

```text
CLIENT_ERROR
SOURCE_ERROR
EXTRACTION_ERROR
AI_ERROR
DATABASE_ERROR
RATE_LIMIT_ERROR
SECURITY_ERROR
```

The client receives safe user-facing messages.

---

# 84. Database Failure Behavior

If generation succeeds but persistence fails:

Do not lose the generated result unnecessarily.

Return the generated artifacts if safe and clearly tell the user:

> Your analysis was generated, but we couldn't save it to history.

This is better than throwing away successful work.

---

# 85. History Consistency

When reopening history:

```text
GET /api/analyses/:id
```

must load the stored artifacts directly.

The current architecture correctly intends reopening to avoid re-analysis.

Preserve this.

---

# 86. Never Re-fetch a Stored Analysis Automatically

Opening an existing analysis should never:

```text
fetch URL
↓
re-extract
↓
re-run Gemini
```

It should:

```text
database
↓
render stored artifact
```

This is essential for consistency and cost control.

---

# 87. Download Reproducibility

A downloaded artifact should correspond exactly to the displayed artifact.

Do not regenerate the AI output during download.

---

# 88. Settings

Keep settings deliberately small.

Recommended:

```text
Appearance
Light
Dark
System

Output language
Same as source

Default study mode
Standard
```

Do not create an enormous settings page.

---

# 89. Accessibility QA Checklist

Before release:

```text
[ ] Keyboard-only navigation
[ ] Visible focus
[ ] Screen reader labels
[ ] Form labels
[ ] Dialog focus trapping
[ ] Escape closes dialogs
[ ] Contrast
[ ] Reduced motion
[ ] 44px touch targets
[ ] No keyboard traps
[ ] No inaccessible icon buttons
[ ] Errors announced
[ ] Loading state announced
```

---

# 90. Mobile QA Checklist

Test at:

```text
320px
360px
375px
390px
412px
430px
768px
```

Verify:

```text
[ ] no horizontal overflow
[ ] URL input usable
[ ] buttons reachable
[ ] notes readable
[ ] slide cards readable
[ ] download actions accessible
[ ] navigation usable
[ ] dialogs fit
[ ] dark mode works
```

---

# 91. Browser QA

Test:

```text
Chrome
Firefox
Edge
Safari
```

At minimum test:

- URL submission
- clipboard
- downloads
- theme
- history
- dialogs
- responsive layout

---

# 92. Free Development Policy

No new paid tooling is required for the improvements in this document.

Use:

```text
SvelteKit
Svelte
TypeScript
Drizzle
Neon
Gemini available free quota where applicable
Upstash available free tier where applicable
Vitest
Cheerio
youtubei.js
micromark
Motion
GSAP
PptxGenJS
Git
GitHub
Vercel free tier where applicable
```

However:

**"Completely free" does not mean unlimited production usage is free.**

Gemini, Neon, Upstash, Vercel, and other services may impose quotas or change free-tier limits.

The correct goal is:

> **Zero additional development cost and zero mandatory paid infrastructure.**

Do not design the architecture assuming unlimited free usage.

---

# 93. Cost-Control Rules

Implement:

```text
duplicate detection
content hashing
rate limiting
content size limits
model fallback
request timeouts
download generation client-side
no unnecessary background jobs
```

These directly reduce operating cost.

---

# 94. No Paid Observability

Use structured logs and request IDs.

Do not add paid:

- Datadog
- New Relic
- Sentry paid
- LogRocket
- analytics platforms

unless future scale genuinely requires them.

---

# 95. No Paid Search Infrastructure

Use PostgreSQL queries for history search.

Do not add:

```text
Elasticsearch
Algolia
Typesense Cloud
```

---

# 96. No Paid Authentication Requirement

Start with anonymous HTTP-only sessions.

Add OAuth later only when account functionality is necessary.

---

# 97. Portfolio Presentation

The project should demonstrate:

### Frontend

- SvelteKit
- Svelte 5
- responsive design
- accessibility
- state management
- animations
- design system

### Backend

- API design
- input validation
- extraction pipeline
- database persistence
- rate limiting

### AI

- structured generation
- fallback models
- schema validation
- prompt engineering
- hallucination controls
- source grounding

### Security

- SSRF defense
- DNS validation
- redirect validation
- CSP
- secret management
- rate limiting
- safe Markdown

### Testing

- unit tests
- integration tests
- security tests
- parser tests
- regression tests

This makes URLyze significantly stronger as a portfolio project.

---

# 98. README Upgrade

The README should eventually contain:

```text
1. Product overview
2. Screenshots
3. Architecture diagram
4. Core workflow
5. Feature list
6. Security model
7. AI pipeline
8. Extraction architecture
9. Database schema
10. API documentation
11. Local setup
12. Environment variables
13. Testing
14. Deployment
15. Design system
16. Known limitations
17. Roadmap
```

The existing README already has most technical sections; the upgrade should add stronger product explanation, screenshots, architecture visualization, and operational details.

---

# 99. Architecture Documentation

Create:

```text
docs/
├── architecture.md
├── security.md
├── extraction.md
├── ai-pipeline.md
├── database.md
├── api.md
├── testing.md
├── deployment.md
└── design.md
```

Each document should answer one engineering question.

---

# 100. Final Definition of Done

URLyze is considered **100/100 relative to its intended scope** only when all of these are true:

## Product

```text
[ ] Product value understood in <5 seconds
[ ] One URL → three artifacts remains central
[ ] No unnecessary feature bloat
[ ] Clear differentiation
```

## UX

```text
[ ] Excellent first-use experience
[ ] Intelligent URL input
[ ] Real progress feedback
[ ] Excellent result hierarchy
[ ] Copy actions
[ ] Download actions
[ ] Regeneration
[ ] Searchable history
[ ] Clear errors
```

## AI

```text
[ ] Structured prompts
[ ] Strict schemas
[ ] Defensive parsing
[ ] Model fallback
[ ] Hallucination controls
[ ] Language detection
[ ] Quality classification
[ ] Long-content handling
[ ] Source grounding where possible
```

## Extraction

```text
[ ] Secure URL validation
[ ] YouTube extraction
[ ] Web extraction
[ ] Metadata extraction
[ ] Content-type validation
[ ] Size limits
[ ] Timeouts
[ ] Redirect validation
[ ] Failure classification
```

## Security

```text
[ ] SSRF protection
[ ] DNS/IP validation
[ ] Redirect revalidation
[ ] API key server-only
[ ] CSP
[ ] Security headers
[ ] Rate limiting
[ ] Safe Markdown
[ ] Environment validation
[ ] Sanitized logs
```

## Database

```text
[ ] Ownership
[ ] Canonical URLs
[ ] Duplicate prevention
[ ] Content hashes
[ ] Prompt versioning
[ ] Model tracking
[ ] Deletion
[ ] Correct history retrieval
```

## UI

```text
[ ] Editorial visual system
[ ] URLyze-specific identity
[ ] Responsive
[ ] Light mode
[ ] Dark mode
[ ] Proper typography
[ ] Consistent geometry
[ ] Controlled shadows
[ ] No visual clutter
```

## Accessibility

```text
[ ] Keyboard navigation
[ ] Visible focus
[ ] Screen-reader labels
[ ] Correct semantics
[ ] WCAG AA contrast
[ ] Reduced motion
[ ] Accessible dialogs
[ ] Accessible forms
```

## Performance

```text
[ ] Small client bundle
[ ] Lazy loading
[ ] Duplicate avoidance
[ ] Efficient extraction
[ ] Efficient AI prompts
[ ] No unnecessary network calls
```

## Testing

```text
[ ] Unit tests
[ ] Security tests
[ ] Extraction tests
[ ] AI parser tests
[ ] API integration tests
[ ] Regression tests
[ ] Download tests
```

## Deployment

```text
[ ] Production environment validated
[ ] Secrets configured correctly
[ ] Database migrations reproducible
[ ] Rate limiter configured
[ ] Security headers verified
[ ] Error behavior verified
[ ] Production build passes
```

---

# 101. Priority Implementation Order

Do NOT implement randomly.

Follow this sequence.

## Phase 1 — Foundation

```text
1. URL normalization
2. duplicate detection
3. anonymous ownership
4. database schema improvements
5. error taxonomy
6. environment validation
```

## Phase 2 — Extraction

```text
7. web extraction improvements
8. YouTube failure states
9. metadata extraction
10. content quality calculation
11. content hashing
```

## Phase 3 — AI

```text
12. prompt redesign
13. structured artifact requirements
14. output validation
15. quality gate
16. language detection
17. long-content handling
```

## Phase 4 — UX

```text
18. analysis progress
19. result hierarchy
20. copy
21. downloads
22. regeneration
23. history
24. delete
25. search/filter
```

## Phase 5 — Security

```text
26. SSRF tests
27. redirect tests
28. CSP validation
29. security header validation
30. sanitized logging
31. request IDs
```

## Phase 6 — Accessibility

```text
32. keyboard navigation
33. focus management
34. screen readers
35. reduced motion
36. contrast
37. touch targets
```

## Phase 7 — Visual Polish

```text
38. URLyze-specific branding
39. landing page
40. dashboard
41. loading states
42. empty states
43. dark mode
44. responsive layouts
45. animation polish
```

## Phase 8 — QA

```text
46. unit tests
47. integration tests
48. regression tests
49. browser testing
50. mobile testing
51. production build
52. deployment verification
```

---

# 102. What NOT To Do

Do not:

```text
❌ Add a chatbot just because it is an AI product
❌ Add agents
❌ Add RAG infrastructure prematurely
❌ Add Kubernetes
❌ Add microservices
❌ Add Kafka
❌ Add unnecessary paid APIs
❌ Add 20 export formats
❌ Add team collaboration
❌ Add social feeds
❌ Add unnecessary dashboards
❌ Add fake AI confidence percentages
❌ Claim 100% factual accuracy
❌ Hide extraction failures
❌ silently hallucinate missing content
❌ expose API errors
❌ expose API keys
❌ re-analyze history entries
❌ copy Mistral branding literally
❌ use unlicensed fonts
❌ use excessive animations
❌ use pill buttons everywhere
❌ sacrifice security for convenience
```

---

# 103. Final Product Architecture

The final system should remain conceptually simple:

```text
                         URLYZE AI
                            │
                            ▼
                    ┌───────────────┐
                    │ URL INPUT     │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ ZOD VALIDATOR │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ URL NORMALIZER │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ CACHE / DUP    │
                    │ CHECK          │
                    └───────┬───────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
          ┌───────────┐           ┌───────────┐
          │ YOUTUBE   │           │ WEB       │
          │ EXTRACTOR │           │ EXTRACTOR │
          └─────┬─────┘           └─────┬─────┘
                │                       │
                └───────────┬───────────┘
                            ▼
                   ┌─────────────────┐
                   │ CONTENT QUALITY │
                   │ + METADATA      │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ GEMINI PIPELINE │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ ZOD + QUALITY   │
                   │ VALIDATION      │
                   └────────┬────────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
             SUMMARY      NOTES       SLIDES
                │           │           │
                └───────────┼───────────┘
                            ▼
                     ┌────────────┐
                     │ POSTGRES   │
                     └─────┬──────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
             HISTORY               RESULT
                                      │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                       COPY        .TXT/.MD      .PPTX
```

---

# 104. Final Standard

The final URLyze experience should make the user think:

> "I pasted a link and got something genuinely useful."

The recruiter should think:

> "This student understands full-stack architecture, AI integration, security, extraction, validation, UX, and testing."

The engineer reviewing the repository should think:

> "This isn't vibe-coded."

And the product should still be understandable in one sentence:

> **URLyze turns YouTube videos and web articles into structured knowledge you can understand, study, and present.**

That is the target.

---

# 105. Final Decision

**Current URLyze architecture:** GOOD  
**Current product scope:** GOOD  
**Current visual foundation:** GOOD  
**Current security direction:** VERY GOOD  
**Current differentiation:** NEEDS WORK  
**Current history/privacy model:** NEEDS FIXING  
**Current extraction robustness:** NEEDS WORK  
**Current accessibility specification:** INCOMPLETE  
**Current AI quality controls:** NEEDS STRENGTHENING  

### Target

**Do not make URLyze bigger.**

Make it **harder to break, easier to understand, safer to use, more transparent, more accessible, and more polished.**

That is the path to a genuinely 10/10 implementation without introducing paid infrastructure or unnecessary technology.

The existing README already provides a strong foundation: the v2 stack, security posture, extraction pipeline, data model, deployment approach, and testing strategy are all established. 
The DESIGN.md likewise provides a coherent visual system with defined tokens, typography, spacing, component geometry, responsive rules, and accessibility-relevant touch-target guidance. 
**Implementation priority:** reliability → security → AI quality → UX → accessibility → visual polish → differentiation.

**Do not reverse that order.**