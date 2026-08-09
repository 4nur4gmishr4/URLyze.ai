# Design

The UI is a translation of the mistral.ai brand reference captured in
`DESIGN.md` (generated via `npx getdesign add mistral.ai`): warm cream
surfaces, a saturated sunset-orange primary, editorial serif display type, and
a strict light **and** dark mode.

## Tokens

`src/styles/tokens.css` defines **50 semantic custom properties** in two blocks:
`:root[data-theme='light']` follows DESIGN.md verbatim, and
`:root[data-theme='dark']` is an authored counterpart (Mistral hasn't published
a dark set). Components consume `var(--token)` only — **no raw hex in
components**, so a palette change is a single-file edit.

Key tokens:

| token | value | use |
|---|---|---|
| `--primary` | `#fa520f` | CTA, links, focus ring, active nav |
| `--cream` / `--cream-soft` / `--cream-deeper` | `#fff8e0` family | warm accent surfaces, sunset cards |
| `--sunset-gradient` | primary→sunshine→yellow→cream | hero stripe, brand moments |
| `--ink` / `--steel` / `--stone` | greys | text hierarchy |
| `--canvas` / `--surface` | white / `#fafafa` | app background layers |

Type is Fraunces (display, 400/500) for headings and Inter (400/500/600) for
UI, loaded from Google Fonts in `global.css`.

## Theme system

`src/lib/client/theme.svelte.ts` is a Svelte 5 module store (`$state` object —
the `.value` property is mutated, never the binding, because Svelte forbids
reassigning exported module state):

- reads `localStorage` → `prefers-color-scheme`, defaulting to system;
- `setTheme()` writes the attribute **and** localStorage, so the store and DOM
  never drift;
- an **inline script in `src/app.html`** (carrying the CSP nonce) applies the
  saved theme before first paint — no flash of the wrong theme.

`src/lib/components/ThemeToggle.svelte` reads `theme.value` for both its label
and its icon branch.

## Motion

Deliberately light, in the spirit of the brand:

- **GSAP** only in `LandingHero.svelte` (entrance timeline, sunset stripe).
- **motion** (framework-agnostic `animate`/`inView`) in `LandingHero.svelte`
  and `Typewriter.svelte` for scroll reveals and the typing effect.
- `global.css` kills all animation and transition under
  `prefers-reduced-motion: reduce`, and long transitions are avoided so nothing
  feels sluggish. No animation library is imported on the server — everything
  is gated on `browser`.

## Layout

- `(public)/` shell — `Navbar` + `Footer`: landing, privacy, terms.
- `(app)/` shell — `Sidebar` + content: dashboard, history, settings.
- Mobile collapses the sidebar; all tiles and result columns are responsive.
