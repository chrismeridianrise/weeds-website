# The Weeds Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the site on a dark green ground modeled on rakishmusic.com, add the band's story/video/bios, surface ticket links near the top, add a mailing list, and launch at weedsmusic.com.

**Architecture:** Single static `index.html` with an inline Tailwind CDN config and inline CSS (no build step, matching the existing site). The show-data logic is extracted into `assets/js/shows.js` as pure exported functions covered by `node --test`; all DOM wiring lives in `assets/js/site.js`. Both load as ES modules. Deployment is Netlify from a GitHub remote.

**Tech Stack:** HTML, Tailwind CDN 3.x, GSAP 3.12.5 + ScrollTrigger, vanilla ES modules, `node --test` (Node ≥ 18, stdlib only — no test dependencies), Netlify + Netlify Forms.

## Global Constraints

Every task's requirements implicitly include this section.

- **Design tokens** — `ground` `#0E2417`, `surface` `#14311F`, `brand` `#1F703F`, `accent` `#FFCA57`, `hover` `#DB6F3D`, `cream` `#F2EFE8`, `muted` `rgba(242,239,232,0.62)`, `hairline` `rgba(242,239,232,0.12)`.
- **`brand` `#1F703F` must never be used for body text or any text below 18px.** It is permitted only for decorative rules and large-type accents. Eyebrow labels use `accent` or `muted`.
- **`accent` `#FFCA57` is the only bright color on the page.** At most one *filled* gold element is visible per viewport, and it is always the primary CTA — so the eye always lands on tickets first. Gold as a *text or icon* color is permitted and intended for small labels: eyebrows, instrument credits, show notes, social icons, and disclosure toggles. Never fill a non-CTA element with gold.
- **`hover` `#DB6F3D` never appears in a resting state.** It is a hover, focus, or error color only.
- All text/background pairs must meet WCAG AA: 4.5:1 for body text, 3:1 for text ≥ 18px bold or ≥ 24px.
- **No copy above the Our Story section may mention family or geography.** The only geographic reference on the page is "central coast of California", inside John's story text. The word "Carmel" appears nowhere — John's supplied description does not use it, and nothing should reintroduce it.
- Fonts unchanged: Cormorant Garamond (headings), Inter (body).
- `prefers-reduced-motion: reduce` must disable all reveal animation and transitions, as the site does today.
- No horizontal scroll at 320px viewport width. Buttons must not use `white-space: nowrap` — a long label plus uppercase and letter-spacing overflows a 320px viewport, and a wrapped button is better than a sideways-scrolling page.
- The string `weedstrio` must not appear anywhere in the shipped site.
- Never commit `.DS_Store`. If `git status` shows it, add it to `.gitignore` in that task's commit.
- **Do not fabricate biographical facts.** Only text John supplied may appear in the story and bios.

## Reference: content supplied by the band

Verbatim source text for Tasks 6 and 9 lives in the design spec at
`docs/superpowers/specs/2026-08-07-weeds-redesign-design.md`. The band
description and the three bios are reproduced in full in those tasks below.

## File Structure

| File | Responsibility |
|---|---|
| `index.html` | Markup, Tailwind config, inline CSS. Rewritten across Tasks 2–12. |
| `assets/js/shows.js` | **Create.** Pure show-data functions. No DOM access, no fetch. |
| `assets/js/site.js` | **Create.** All DOM wiring: nav, mobile menu, GSAP reveals, show rendering, video facade, mailing list. |
| `test/shows.test.js` | **Create.** `node --test` coverage of `shows.js`. |
| `package.json` | **Create.** `"type": "module"` and an `npm test` script. Declares no dependencies. |
| `assets/favicon.svg` | **Create.** Logo roundel at favicon scale. |
| `assets/images/video-poster.jpg` | **Create.** Local still for the video facade. |
| `netlify.toml` | **Create.** Deploy config and security headers. |
| `.gitignore` | **Create.** `.DS_Store`. |

`index.html` stays a single file. It has no build step, and splitting markup into
partials would introduce one for no benefit on a solo-maintained site. JavaScript
is extracted because it grows in this plan and because its logic is worth testing.

---

### Task 1: Extract show logic into a tested module

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `assets/js/shows.js`
- Test: `test/shows.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces, all named exports of `assets/js/shows.js`:
  - `parseGvizDate(raw: string) => Date | null`
  - `parseGvizResponse(text: string) => Array<{date: Date|null, venue: string, city: string, link: string, notes: string}>`
  - `partitionShows(rows, today: Date) => {upcoming: Array, past: Array}`
  - `nextShow(rows, today: Date) => row | null`
  - `hasTicketLink(row) => boolean`

`index.html` is not touched in this task. The existing inline show code keeps
running; it is replaced in Task 10.

- [ ] **Step 1: Create the package manifest and gitignore**

`package.json`:

```json
{
  "name": "weeds-website",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test test/"
  }
}
```

`.gitignore`:

```
.DS_Store
node_modules/
```

- [ ] **Step 2: Write the failing tests**

Create `test/shows.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGvizDate,
  parseGvizResponse,
  partitionShows,
  nextShow,
  hasTicketLink,
} from '../assets/js/shows.js';

test('parseGvizDate reads the Date(y,m,d) form with a zero-indexed month', () => {
  const d = parseGvizDate('Date(2026,7,14)');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 7);      // August
  assert.equal(d.getDate(), 14);
});

test('parseGvizDate reads a plain ISO date as local midnight', () => {
  const d = parseGvizDate('2026-08-14');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 7);
  assert.equal(d.getDate(), 14);
  assert.equal(d.getHours(), 0);
});

test('parseGvizDate returns null for junk and non-strings', () => {
  assert.equal(parseGvizDate('not a date'), null);
  assert.equal(parseGvizDate(null), null);
  assert.equal(parseGvizDate(42), null);
  assert.equal(parseGvizDate(''), null);
});

test('partitionShows puts today in upcoming, not past', () => {
  const today = new Date(2026, 7, 14, 15, 30);   // mid-afternoon
  const rows = [{ date: new Date(2026, 7, 14), venue: 'Tonight' }];
  const { upcoming, past } = partitionShows(rows, today);
  assert.equal(upcoming.length, 1);
  assert.equal(past.length, 0);
});

test('partitionShows sorts upcoming soonest-first and past most-recent-first', () => {
  const today = new Date(2026, 7, 14);
  const rows = [
    { date: new Date(2026, 8, 1),  venue: 'Later' },
    { date: new Date(2026, 7, 20), venue: 'Sooner' },
    { date: new Date(2026, 6, 1),  venue: 'Older' },
    { date: new Date(2026, 7, 1),  venue: 'Recent' },
  ];
  const { upcoming, past } = partitionShows(rows, today);
  assert.deepEqual(upcoming.map(r => r.venue), ['Sooner', 'Later']);
  assert.deepEqual(past.map(r => r.venue), ['Recent', 'Older']);
});

test('partitionShows drops rows missing a date or a venue', () => {
  const today = new Date(2026, 7, 14);
  const rows = [
    { date: null,                  venue: 'No date' },
    { date: new Date(2026, 7, 20), venue: '' },
    { date: new Date('nonsense'),  venue: 'Bad date' },
    { date: new Date(2026, 7, 20), venue: 'Good' },
  ];
  const { upcoming } = partitionShows(rows, today);
  assert.deepEqual(upcoming.map(r => r.venue), ['Good']);
});

test('nextShow returns the soonest upcoming show', () => {
  const today = new Date(2026, 7, 14);
  const rows = [
    { date: new Date(2026, 8, 1),  venue: 'Later' },
    { date: new Date(2026, 7, 20), venue: 'Sooner' },
  ];
  assert.equal(nextShow(rows, today).venue, 'Sooner');
});

test('nextShow returns null when nothing is upcoming', () => {
  const today = new Date(2026, 7, 14);
  const rows = [{ date: new Date(2026, 6, 1), venue: 'Past' }];
  assert.equal(nextShow(rows, today), null);
});

test('nextShow returns null for an empty sheet', () => {
  assert.equal(nextShow([], new Date(2026, 7, 14)), null);
});

test('hasTicketLink accepts http and https only', () => {
  assert.equal(hasTicketLink({ link: 'https://tickets.example/x' }), true);
  assert.equal(hasTicketLink({ link: 'http://tickets.example/x' }), true);
  assert.equal(hasTicketLink({ link: 'javascript:alert(1)' }), false);
  assert.equal(hasTicketLink({ link: 'tickets.example/x' }), false);
  assert.equal(hasTicketLink({ link: '' }), false);
  assert.equal(hasTicketLink({}), false);
});

test('parseGvizResponse maps columns by label and tolerates missing cells', () => {
  const payload = {
    table: {
      cols: [
        { label: 'Date' }, { label: 'Venue' }, { label: 'City' },
        { label: 'Ticket Link' }, { label: 'Notes' },
      ],
      rows: [
        { c: [
          { v: 'Date(2026,7,14)' }, { v: 'The Hall' }, { v: 'Berkeley' },
          { v: 'https://tickets.example/x' }, null,
        ] },
      ],
    },
  };
  const text = `/*O_o*/\ngoogle.visualization.Query.setResponse(${JSON.stringify(payload)});`;
  const rows = parseGvizResponse(text);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].venue, 'The Hall');
  assert.equal(rows[0].city, 'Berkeley');
  assert.equal(rows[0].notes, '');
  assert.equal(rows[0].date.getMonth(), 7);
});

test('parseGvizResponse returns an empty array when columns are missing', () => {
  const payload = { table: { cols: [{ label: 'Nope' }], rows: [{ c: [{ v: 'x' }] }] } };
  const text = `google.visualization.Query.setResponse(${JSON.stringify(payload)});`;
  assert.deepEqual(parseGvizResponse(text), []);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../assets/js/shows.js'`

- [ ] **Step 4: Write the implementation**

Create `assets/js/shows.js`:

```js
// Pure helpers for the Google Sheets gig list. No DOM, no network — so this
// module is testable under `node --test`.

/**
 * Google's gviz endpoint returns date-typed cells as "Date(Y,M,D)" (M is
 * zero-indexed) rather than the ISO string that was typed in. Handle both.
 */
export function parseGvizDate(raw) {
  if (typeof raw !== 'string' || raw === '') return null;
  const m = raw.match(/^Date\((\d+),(\d+),(\d+)\)$/);
  if (m) return new Date(Number(m[1]), Number(m[2]), Number(m[3]));
  const d = new Date(raw + 'T00:00:00');
  return isNaN(d) ? null : d;
}

/** Unwrap the JSONP-ish gviz envelope and map columns by header label. */
export function parseGvizResponse(text) {
  let json;
  try {
    json = JSON.parse(text.substring(text.indexOf('(') + 1, text.lastIndexOf(')')));
  } catch {
    return [];
  }
  const cols = (json?.table?.cols || []).map(c => (c.label || '').trim());
  const idx = {
    date:  cols.indexOf('Date'),
    venue: cols.indexOf('Venue'),
    city:  cols.indexOf('City'),
    link:  cols.indexOf('Ticket Link'),
    notes: cols.indexOf('Notes'),
  };
  if (idx.date === -1 || idx.venue === -1) return [];

  return (json?.table?.rows || []).map(row => {
    const cell = i => (i === -1 || !row.c?.[i] || row.c[i].v == null) ? '' : row.c[i].v;
    return {
      date:  parseGvizDate(cell(idx.date)),
      venue: String(cell(idx.venue)),
      city:  String(cell(idx.city)),
      link:  String(cell(idx.link)),
      notes: String(cell(idx.notes)),
    };
  });
}

/** Split into upcoming (soonest first) and past (most recent first). */
export function partitionShows(rows, today) {
  const cutoff = new Date(today);
  cutoff.setHours(0, 0, 0, 0);

  const valid = rows.filter(r =>
    r.date instanceof Date && !isNaN(r.date) && r.venue
  );

  return {
    upcoming: valid.filter(r => r.date >= cutoff).sort((a, b) => a.date - b.date),
    past:     valid.filter(r => r.date <  cutoff).sort((a, b) => b.date - a.date),
  };
}

/** The soonest upcoming show, or null. Drives the hero strip. */
export function nextShow(rows, today) {
  return partitionShows(rows, today).upcoming[0] ?? null;
}

/** Only http(s) links are rendered, so a sheet edit cannot inject a scheme. */
export function hasTicketLink(row) {
  return /^https?:\/\//i.test(row?.link || '');
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — 12 tests, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore assets/js/shows.js test/shows.test.js
git commit -m "feat: extract show-list logic into a tested module"
```

---

### Task 2: Design tokens and the dark ground

**Files:**
- Modify: `index.html:16-37` (Tailwind config), `index.html:40-180` (inline CSS), `index.html:181` (body class)

**Interfaces:**
- Consumes: nothing.
- Produces: Tailwind color names `ground`, `surface`, `brand`, `accent`, `hover`, `cream`, `muted`, `hairline`, and the CSS classes `.btn-primary`, `.btn-outline`, `.eyebrow`, `.rule`, used by every later task.

This task retints the existing page. Sections keep their current content; only
colors and button styles change. The page will look coherent but still say the
old copy — that is expected and correct at this stage.

- [ ] **Step 1: Replace the Tailwind color config**

In `index.html`, replace the `colors` block inside `tailwind.config`:

```js
colors: {
  ground:   '#0E2417',
  surface:  '#14311F',
  brand:    '#1F703F',
  accent:   '#FFCA57',
  hover:    '#DB6F3D',
  cream:    '#F2EFE8',
  muted:    'rgba(242,239,232,0.62)',
  hairline: 'rgba(242,239,232,0.12)',
},
```

- [ ] **Step 2: Replace the button and rule styles**

In the inline `<style>` block, replace the `.btn-primary` and `.btn-outline`
rules with:

```css
/* Primary = gold. Reserved for tickets and the one main CTA per section. */
.btn-primary {
  display: inline-block;
  background: #FFCA57;
  color: #0E2417;
  padding: 12px 28px;
  border-radius: 999px;
  font-family: Inter, system-ui, sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease;
  max-width: 100%;
}
/* Dark text on the orange hover: #F2EFE8 on #DB6F3D is only 2.88:1 and fails
   AA, while #0E2417 on #DB6F3D is 4.95:1 and passes. */
.btn-primary:hover { background: #DB6F3D; color: #0E2417; }
.btn-primary:focus-visible { outline: 2px solid #FFCA57; outline-offset: 3px; }

.btn-outline {
  display: inline-block;
  background: transparent;
  color: #F2EFE8;
  border: 1px solid rgba(242,239,232,0.32);
  padding: 12px 28px;
  border-radius: 999px;
  font-family: Inter, system-ui, sans-serif;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  transition: border-color 0.18s ease, color 0.18s ease;
  max-width: 100%;
}
.btn-outline:hover { border-color: #DB6F3D; color: #DB6F3D; }
.btn-outline:focus-visible { outline: 2px solid rgba(242,239,232,0.7); outline-offset: 3px; }

/* Eyebrow labels. Gold, never `brand` — #1F703F on #0E2417 fails AA at this size. */
.eyebrow {
  font-family: Inter, system-ui, sans-serif;
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #FFCA57;
}

.rule { border-top: 1px solid rgba(242,239,232,0.12); }
```

- [ ] **Step 3: Retint the remaining inline CSS**

Apply these substitutions throughout the `<style>` block:

| Old | New |
|---|---|
| `#dedad2` (track/member borders) | `rgba(242,239,232,0.12)` |
| `rgba(27,43,29,…)` in `#hero::before` | `rgba(14,36,23,…)`, same alpha stops |
| `rgba(27,43,29,0.18)` in `.photo-divider::after` | `rgba(14,36,23,0.45)` |
| `rgba(245,241,234,0.97)` in `#main-nav.scrolled` background | `rgba(14,36,23,0.94)` |
| `0 1px 16px rgba(27,43,29,0.1)` nav shadow | `0 1px 0 rgba(242,239,232,0.12)` |
| `.btn-primary:focus-visible { outline-color: #8c6030 }` | delete — now set in the rule above |
| `.btn-outline:focus-visible { outline-color: … }` | delete — now set in the rule above |

- [ ] **Step 4: Switch the body and section grounds**

Change the `<body>` class from `bg-parch font-body text-ink` to
`bg-ground font-body text-cream`.

Then replace every section background class:

| Selector | Old | New |
|---|---|---|
| `#music` | `bg-parch` | `bg-ground` |
| `#about` | `bg-linen` | `bg-surface` |
| `#shows` | `bg-parch` | `bg-ground` |
| `#contact` | `bg-grove` | `bg-surface` |
| `footer` | `bg-grove` | `bg-ground` |
| `#mobile-menu` | `bg-grove` | `bg-ground` |
| skip-nav link | `focus:bg-parch focus:text-ink` | `focus:bg-accent focus:text-ground` |

Also replace `border-rule` with `border-hairline` on `#music` and `#shows`.

- [ ] **Step 5: Retint text colors**

Replace every text color class and inline style that assumed a light ground:

- `text-ink` → `text-cream`
- `text-stone` → `text-muted`
- `text-fern` → `text-accent` (these are all eyebrow labels; see the constraint)
- `text-white` → `text-cream`
- `rgba(255,255,255,0.6)` / `0.65` inline styles → `rgba(242,239,232,0.62)`
- `rgba(255,255,255,0.8)` / `0.85` / `0.9` inline styles → `#F2EFE8`

- [ ] **Step 6: Verify in the browser**

```bash
python3 -m http.server 8899 --directory . &
```

Open `http://127.0.0.1:8899/index.html`. Confirm all of:

- No section still renders on a light background
- No text is dark-on-dark or invisible anywhere
- Buttons are gold pills; hovering turns them orange
- The nav is transparent over the hero and becomes solid dark green on scroll
- At a 320px viewport there is no horizontal scroll

- [ ] **Step 7: Check contrast**

In DevTools, inspect the computed color of body text, eyebrow labels, and button
labels against their backgrounds. Every pair must be ≥ 4.5:1 (≥ 3:1 for text
≥ 24px). `#F2EFE8` on `#0E2417` is ~15:1 and `#FFCA57` on `#0E2417` is ~10:1;
both pass comfortably. If any element still resolves to `#1F703F` on the dark
ground, fix it — that pair is ~2:1 and fails.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: retint site onto dark green ground with band palette"
```

---

### Task 3: Logo roundel and favicon

**Files:**
- Modify: `index.html` — add an inline `<svg>` symbol definition after `<body>`, and a `<link rel="icon">` in `<head>`
- Create: `assets/favicon.svg`

**Interfaces:**
- Consumes: nothing.
- Produces: an SVG `<symbol id="logo-roundel">` referenced by `<use href="#logo-roundel">`. Task 4 places it in the nav. It inherits `currentColor`, so the placing element sets the color.

**This task has a quality gate.** Hand-authored vector line art of a harp and a
mandolin has a real ceiling. Build it, render it, and judge it at both 200px and
16px. If it does not clear the bar, stop and report — the agreed fallback is the
typographic wordmark alone, with the roundel deferred to an illustrator. Do not
spend more than one revision pass trying to rescue it.

- [ ] **Step 1: Add the symbol definition**

Immediately after the opening `<body>` tag in `index.html`, before the skip-nav
link, insert:

```html
<!-- Logo roundel. Defined once, referenced with <use>. Inherits currentColor. -->
<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
  <defs>
    <path id="logo-arc" d="M 24 100 A 76 76 0 0 1 176 100" fill="none"/>
    <symbol id="logo-roundel" viewBox="0 0 200 200">
      <g fill="none" stroke="currentColor" stroke-width="2.4"
         stroke-linecap="round" stroke-linejoin="round">
        <circle cx="100" cy="100" r="90"/>

        <!-- Fiddle -->
        <path d="M56 120c-9 0-13 9-8 16-5 7-1 17 8 17s13-10 8-17c5-7 1-16-8-16z"/>
        <path d="M56 120V98"/>
        <circle cx="56" cy="95" r="3.2"/>

        <!-- Harp: pillar, curved neck, soundboard, three strings -->
        <path d="M87 156V110"/>
        <path d="M87 110c5-11 21-13 28-2"/>
        <path d="M115 108l-28 48"/>
        <path d="M93 121v25M99 126v16M105 131v7"/>

        <!-- Mandolin -->
        <path d="M144 156c-11 0-18-9-14-19 3-9 14-11 14-11s11 2 14 11c4 10-3 19-14 19z"/>
        <path d="M144 126V98"/>
        <path d="M138 98h12"/>
        <circle cx="144" cy="138" r="4.5"/>
      </g>
      <text font-family="Cormorant Garamond, Georgia, serif" font-size="21"
            letter-spacing="4" fill="currentColor">
        <textPath href="#logo-arc" startOffset="50%" text-anchor="middle">THE WEEDS</textPath>
      </text>
    </symbol>
  </defs>
</svg>
```

- [ ] **Step 2: Render it large and judge it**

Create a scratch page in the repo root. **The symbol markup must be pasted into
this file directly** — `<use href="/index.html#logo-roundel">` does not resolve,
because SVG `use` cannot reference an id inside an HTML document.

Create `logo-check.html`, pasting the entire `<svg width="0" height="0">…</svg>`
block from Step 1 verbatim as the first element inside `<body>`, then:

```html
<body style="background:#0E2417;display:flex;gap:40px;align-items:center;padding:40px">
  <!-- paste the Step 1 <svg width="0" height="0">…</svg> definition block here -->
  <svg viewBox="0 0 200 200" width="240" style="color:#FFCA57"><use href="#logo-roundel"/></svg>
  <svg viewBox="0 0 200 200" width="48"  style="color:#FFCA57"><use href="#logo-roundel"/></svg>
  <svg viewBox="0 0 200 200" width="16"  style="color:#FFCA57"><use href="#logo-roundel"/></svg>
</body>
```

Open `http://127.0.0.1:8899/logo-check.html` and screenshot it.

Judge against these, all of which must hold:

- No Celtic knotwork, no leaves, no shading, no fill, no tagline
- All three instruments are individually recognizable at 240px
- Stroke weight is visually even across the whole mark
- The wordmark arc is centered and its letters do not collide with the circle
- At 16px the roundel still reads as a deliberate mark, not mud

If it fails, **stop and report** rather than iterating further.

- [ ] **Step 3: Delete the scratch file**

```bash
rm logo-check.html
```

It must not be committed — confirm with `git status` that it is gone.

- [ ] **Step 4: Create the favicon**

At 16px the instruments are illegible, so the favicon uses the circle and a
single simplified form rather than a shrunken copy of the full mark.

Create `assets/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="28" fill="#0E2417"/>
  <g fill="none" stroke="#FFCA57" stroke-width="9"
     stroke-linecap="round" stroke-linejoin="round">
    <circle cx="100" cy="100" r="74"/>
    <path d="M100 142V72"/>
    <path d="M100 72c9-16 32-19 43-3"/>
    <path d="M143 69l-43 73"/>
  </g>
</svg>
```

- [ ] **Step 5: Link the favicon**

In `<head>`, after the `<title>`:

```html
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
```

- [ ] **Step 6: Verify the favicon**

Reload `http://127.0.0.1:8899/index.html` and confirm the browser tab shows the
gold mark on a dark square, legible as a distinct shape at tab size.

- [ ] **Step 7: Commit**

```bash
git add index.html assets/favicon.svg
git commit -m "feat: add flat line logo roundel and favicon"
```

---

### Task 4: Navigation with social row and Tickets pill

**Files:**
- Modify: `index.html:191-222` (nav and mobile menu)

**Interfaces:**
- Consumes: `<symbol id="logo-roundel">` from Task 3.
- Produces: nav anchors `#story`, `#music`, `#shows`, `#connect`. Tasks 6, 8, 10, and 11 must create sections with exactly those ids.

Social URLs: Instagram `https://www.instagram.com/weedsmusic` and Bandcamp
`https://weedsmusic.bandcamp.com`. **YouTube, Spotify, and Facebook URLs are not
yet confirmed by the band.** Render only the two confirmed links. Do not invent
URLs and do not add placeholder `#` links — a dead social icon is worse than an
absent one. Task 13 adds the rest once John supplies them.

- [ ] **Step 1: Replace the desktop nav**

Replace the contents of `<nav id="main-nav">` with:

```html
<div class="max-w-[1180px] mx-auto flex justify-between items-center h-[72px] px-6">

  <a href="#" class="flex items-center gap-3 text-cream hover:text-accent transition-colors" aria-label="The Weeds — home">
    <svg viewBox="0 0 200 200" width="34" height="34" aria-hidden="true"><use href="#logo-roundel"/></svg>
    <span class="font-body text-[11px] tracking-[3px] uppercase font-medium leading-none">The Weeds</span>
  </a>

  <div class="hidden md:flex items-center gap-7">
    <a href="#story"   class="text-sm text-cream/80 hover:text-accent transition-colors tracking-wide">Story</a>
    <a href="#music"   class="text-sm text-cream/80 hover:text-accent transition-colors tracking-wide">Music</a>
    <a href="#shows"   class="text-sm text-cream/80 hover:text-accent transition-colors tracking-wide">Shows</a>
    <a href="#connect" class="text-sm text-cream/80 hover:text-accent transition-colors tracking-wide">Contact</a>

    <span class="w-px h-4 bg-hairline" aria-hidden="true"></span>

    <div class="flex items-center gap-4">
      <a href="https://www.instagram.com/weedsmusic" target="_blank" rel="noopener"
         class="text-accent/75 hover:text-accent transition-colors" aria-label="The Weeds on Instagram">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/>
        </svg>
      </a>
      <a href="https://weedsmusic.bandcamp.com" target="_blank" rel="noopener"
         class="text-accent/75 hover:text-accent transition-colors" aria-label="The Weeds on Bandcamp">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M0 18.75l7.437-13.5H24l-7.438 13.5z"/>
        </svg>
      </a>
    </div>

    <a href="#shows" class="btn-primary ml-1">Tickets</a>
  </div>

  <button id="menu-toggle" class="md:hidden p-2 -mr-2" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden="true">
      <rect width="22" height="1.5" rx="0.75" fill="#F2EFE8"/>
      <rect y="6.25" width="22" height="1.5" rx="0.75" fill="#F2EFE8"/>
      <rect y="12.5" width="22" height="1.5" rx="0.75" fill="#F2EFE8"/>
    </svg>
  </button>
</div>
```

- [ ] **Step 2: Replace the mobile menu links**

Inside `<div id="mobile-menu">`, replace the anchors (keep the existing close
button and the wrapper element untouched):

```html
<a href="#story"   class="mobile-nav-link font-heading text-2xl text-cream/85 hover:text-accent transition-colors italic">Story</a>
<a href="#music"   class="mobile-nav-link font-heading text-2xl text-cream/85 hover:text-accent transition-colors italic">Music</a>
<a href="#shows"   class="mobile-nav-link font-heading text-2xl text-cream/85 hover:text-accent transition-colors italic">Shows</a>
<a href="#connect" class="mobile-nav-link font-heading text-2xl text-cream/85 hover:text-accent transition-colors italic">Contact</a>
<a href="#shows"   class="mobile-nav-link mt-2 btn-primary">Tickets</a>

<div class="flex items-center gap-6 mt-6">
  <a href="https://www.instagram.com/weedsmusic" target="_blank" rel="noopener"
     class="mobile-nav-link text-accent/75 hover:text-accent transition-colors" aria-label="The Weeds on Instagram">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/>
    </svg>
  </a>
  <a href="https://weedsmusic.bandcamp.com" target="_blank" rel="noopener"
     class="mobile-nav-link text-accent/75 hover:text-accent transition-colors" aria-label="The Weeds on Bandcamp">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M0 18.75l7.437-13.5H24l-7.438 13.5z"/>
    </svg>
  </a>
</div>
```

- [ ] **Step 3: Update the scroll-padding for the taller nav**

The nav grew from 68px to 72px. In the `<style>` block change:

```css
html { scroll-behavior: smooth; scroll-padding-top: 72px; }
```

- [ ] **Step 4: Verify**

At `http://127.0.0.1:8899/index.html`:

- The roundel renders in the nav at 34px and turns gold on hover
- The Tickets pill is gold and scrolls to the Shows section
- Both social icons open the correct `weedsmusic` URLs in a new tab
- Tab through the nav — every link and the menu button show a visible focus ring
- At 375px width the hamburger opens a full-screen menu containing all four
  links, the Tickets pill, and both social icons
- Clicking a mobile menu link closes the menu and scrolls to the section
- Anchors land below the nav rather than under it

Note: `#story` and `#connect` do not exist yet, so those two links will not
scroll. Tasks 6 and 11 create them. All other behavior must work now.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: rebuild nav with logo, social row, and Tickets pill"
```

---

### Task 5: Hero with next-show strip

**Files:**
- Modify: `index.html` (the `#hero` section), `index.html` (`<style>` block)
- Create: `assets/js/site.js`
- Modify: `index.html` (replace the trailing inline `<script>` with a module tag)

**Interfaces:**
- Consumes: `nextShow`, `hasTicketLink`, `parseGvizResponse` from `assets/js/shows.js` (Task 1).
- Produces: `assets/js/site.js` as the site's single DOM entry point, plus the module-scope helpers `escapeHtml(str) => string`, `formatShowDate(d: Date) => string`, and `renderNextShow(rows) => void`, all of which Task 10 calls from the same file. They are not exported — nothing imports `site.js`. Also produces `#hero-next-show`, the container the strip renders into.

`site.js` imports all four `shows.js` functions in Step 1 even though this task
only uses `nextShow` and `hasTicketLink`. That is deliberate: Task 10 uses the
other two, and one import line beats editing it twice.

This task moves the existing inline JavaScript into `assets/js/site.js`
unchanged, then adds the hero strip on top. The show-list rendering keeps
working exactly as it does today; Task 10 rewrites it to use `shows.js`.

- [ ] **Step 1: Move the inline script into a module**

Cut the entire body of the trailing `<script>` block in `index.html` into a new
file `assets/js/site.js`, unchanged. Replace the inline block with:

```html
<script type="module" src="assets/js/site.js"></script>
```

At the top of `assets/js/site.js`, add:

```js
import { parseGvizResponse, partitionShows, nextShow, hasTicketLink } from './shows.js';
```

- [ ] **Step 2: Verify nothing broke**

Reload the page. The nav, mobile menu, GSAP reveals, and the Shows list must all
behave exactly as before. Check the console for errors — a module script is
deferred by default, so any code that assumed synchronous execution before
`DOMContentLoaded` will now behave differently. There should be none, but confirm.

Commit this move on its own so the refactor is separable from the feature:

```bash
git add index.html assets/js/site.js
git commit -m "refactor: move inline site script into an ES module"
```

- [ ] **Step 3: Replace the hero markup**

Replace the contents of `<section id="hero">` with:

```html
<h1 class="sr-only">The Weeds</h1>
<div class="max-w-[1180px] mx-auto px-6 pb-14 md:pb-20 w-full">
  <div class="max-w-2xl">
    <p class="hero-eyebrow eyebrow mb-6">Irish Tradition &nbsp;&middot;&nbsp; Original Arrangements</p>

    <p class="hero-title font-heading text-cream text-4xl md:text-6xl leading-[1.08] mb-5">
      Traditional tunes,<br>modern hands.
    </p>

    <p class="hero-sub text-base md:text-lg leading-relaxed mb-9 text-cream/80">
      Fiddle, harp, and mandolin. Driving Irish jigs and reels, original
      compositions, and arrangements that carry the tradition somewhere new.
    </p>

    <!-- Populated by site.js from the gig sheet; stays empty when nothing is booked. -->
    <div id="hero-next-show"></div>

    <div class="hero-ctas flex flex-wrap gap-4">
      <a href="https://weedsmusic.bandcamp.com/album/supernatural" target="_blank" rel="noopener" class="btn-outline">Listen to Supernatural</a>
      <a href="#video" class="btn-outline">Watch the Video</a>
    </div>
  </div>
</div>
```

Note the hero CTAs are both outline style. The only gold button in the hero is
the Tickets button inside the next-show strip, so the eye goes there first.

- [ ] **Step 4: Add the strip styles**

In the `<style>` block:

```css
/* Next-show strip. Renders only when a show is actually booked. */
.next-show {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
  padding: 0.9rem 1.25rem;
  margin-bottom: 2.25rem;
  border: 1px solid rgba(242,239,232,0.18);
  border-radius: 6px;
  background: rgba(14,36,23,0.55);
  backdrop-filter: blur(6px);
}
.next-show__label {
  font-family: Inter, system-ui, sans-serif;
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #FFCA57;
}
.next-show__detail {
  font-family: Inter, system-ui, sans-serif;
  font-size: 0.9375rem;
  color: #F2EFE8;
  margin-right: auto;
}
```

- [ ] **Step 5: Render the strip**

Append to `assets/js/site.js`:

```js
/** Escape sheet-supplied text before it reaches innerHTML. */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const SHOWS_FORMAT = { month: 'short', day: 'numeric', year: 'numeric' };
const formatShowDate = d => d.toLocaleDateString('en-US', SHOWS_FORMAT);

/**
 * The hero strip is the band's top-priority element, but an empty one is worse
 * than none — so when nothing is upcoming we leave the container empty rather
 * than rendering an empty state. The Shows section carries that message instead.
 */
function renderNextShow(rows) {
  const el = document.getElementById('hero-next-show');
  if (!el) return;

  const show = nextShow(rows, new Date());
  if (!show) return;

  const where = show.city
    ? `${escapeHtml(show.venue)} · ${escapeHtml(show.city)}`
    : escapeHtml(show.venue);

  el.innerHTML = `
    <div class="next-show">
      <span class="next-show__label">Next Show</span>
      <span class="next-show__detail">${formatShowDate(show.date)} &middot; ${where}</span>
      ${hasTicketLink(show)
        ? `<a href="${escapeHtml(show.link)}" target="_blank" rel="noopener" class="btn-primary">Tickets</a>`
        : ''}
    </div>`;
}
```

- [ ] **Step 6: Call it from the existing fetch**

Inside the existing `loadShows()` function in `site.js`, immediately after the
`rows` array is built and before the upcoming/past rendering, add:

```js
renderNextShow(rows);
```

One fetch, two render targets — do not add a second network request.

- [ ] **Step 7: Verify with real sheet data**

Reload the page. Confirm:

- The strip shows the soonest upcoming show from the sheet, matching the first
  row of the Shows section below
- The Tickets button opens that show's ticket URL
- On desktop the strip is visible without scrolling; on a 375×667 viewport it is
  reachable within one scroll

- [ ] **Step 8: Verify the empty case**

Temporarily change `nextShow(rows, new Date())` to
`nextShow(rows, new Date(2099, 0, 1))` and reload. The strip must vanish
completely, leaving no border, no empty box, and no gap artifact. Revert the
change.

- [ ] **Step 9: Verify the row-without-tickets case**

Temporarily add `rows[0].link = ''` before `renderNextShow(rows)` and reload. The
strip must render with date and venue but no button, and must not leave a
dangling separator or empty flex gap. Revert the change.

- [ ] **Step 10: Commit**

```bash
git add index.html assets/js/site.js
git commit -m "feat: add hero next-show strip with ticket link"
```

---

### Task 6: Our Story section

**Files:**
- Modify: `index.html` — insert a new `<section id="story">` between `#hero` and `#music`

**Interfaces:**
- Consumes: the `#story` nav anchor from Task 4.
- Produces: `<section id="story">`.

The heading must lead with the music. The current "A family trio rooted in
tradition" leads with family, which the band explicitly asked to invert. The
family fact arrives inside John's own sentence, where they want it.

- [ ] **Step 1: Insert the section**

Immediately after the closing `</section>` of `#hero`:

```html
<!-- Our Story -->
<section id="story" class="bg-ground py-20 md:py-28 border-b border-hairline">
  <div class="max-w-[1180px] mx-auto px-6">
    <div class="max-w-3xl">
      <p class="reveal eyebrow mb-5">Our Story</p>
      <h2 class="reveal font-heading text-cream text-3xl md:text-5xl leading-[1.15] mb-8">
        A musical conversation that begins and ends in ancient Ireland.
      </h2>

      <p class="reveal text-muted text-base leading-relaxed mb-5">
        The Weeds are a dynamic trio rooted in traditions from Ireland and beyond.
        Hailing from the central coast of California, the Weeds consist of fiddler
        John Weed (Molly&rsquo;s Revenge / New World String Project) and sons, Tyler
        Weed (mandolin, Irish tenor banjo, guitar) and Evan Weed (Celtic harp,
        piano, melodica).
      </p>

      <p class="reveal text-muted text-base leading-relaxed mb-5">
        Their music infuses the driving energy of a jam session with a unique
        contemporary flavor, seamlessly blending traditional melodies with
        innovative, original compositions and arrangements. Enjoy a musical
        journey that begins and ends in ancient Ireland, venturing &lsquo;across
        the pond&rsquo; to explore influences from Appalachian mountain hollers to
        occasional hints of modern jazz.
      </p>

      <p class="reveal text-muted text-base leading-relaxed">
        The folk process unfolds as John enjoys a musical conversation with two of
        the next generation&rsquo;s rising stars. Hearing sophisticated arrangements
        of driving Irish jigs, reels, and slower heartfelt selections, you&rsquo;ll
        leave uplifted, knowing the future is in good hands as The Weeds raises
        your spirits, honoring this tradition with a vital, new voice.
      </p>
    </div>
  </div>
</section>
```

This is John's text verbatim, broken into three paragraphs for readability. Only
the paragraph breaks and typographic quotes were added. Do not otherwise reword it.

- [ ] **Step 2: Verify**

Reload and confirm:

- The Story nav link scrolls here and the heading lands below the nav
- The reveal animation fires on scroll, and is disabled under
  `prefers-reduced-motion` (toggle it in DevTools → Rendering → Emulate CSS media
  feature prefers-reduced-motion)
- "central coast of California" appears here and nowhere above this section

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add Our Story section with the band's description"
```

---

### Task 7: Video section with click-to-play facade

**Files:**
- Modify: `index.html` — insert `<section id="video">` after `#story`
- Modify: `index.html` (`<style>` block)
- Modify: `assets/js/site.js`
- Create: `assets/images/video-poster.jpg`

**Interfaces:**
- Consumes: the `#video` anchor used by the hero's "Watch the Video" button (Task 5).
- Produces: `<section id="video">` and the `.video-facade` pattern, reusable if more videos are added.

A bare YouTube iframe pulls roughly 1MB of third-party JavaScript on every page
load and sets cookies before the visitor has asked for anything. The facade
defers both until someone clicks play.

- [ ] **Step 1: Fetch the poster image**

```bash
curl -fsSL -o assets/images/video-poster.jpg \
  https://i.ytimg.com/vi/4eLVqORprSE/maxresdefault.jpg
file assets/images/video-poster.jpg
```

Expected: `JPEG image data`. If `maxresdefault.jpg` 404s, fall back to
`hqdefault.jpg`. Confirm the image actually shows The Weeds and is not a
generic grey placeholder — YouTube serves a 120×90 grey thumbnail when a
resolution is unavailable, and `curl -f` will not catch that. Check the
dimensions are at least 480px wide.

- [ ] **Step 2: Insert the section**

```html
<!-- Video -->
<section id="video" class="bg-surface py-20 md:py-28">
  <div class="max-w-[1180px] mx-auto px-6">
    <div class="max-w-3xl mb-12">
      <p class="reveal eyebrow mb-5">Watch</p>
      <h2 class="reveal font-heading text-cream text-3xl md:text-4xl leading-[1.2]">
        The Weeds, live.
      </h2>
    </div>

    <div class="reveal video-facade" data-video-id="4eLVqORprSE">
      <button type="button" class="video-facade__btn" aria-label="Play video: The Weeds, live">
        <img src="assets/images/video-poster.jpg" alt="" loading="lazy" decoding="async">
        <span class="video-facade__play" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </span>
      </button>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Add the styles**

```css
/* Click-to-play facade: avoids ~1MB of YouTube JS and pre-consent cookies. */
.video-facade {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background: #0E2417;
}
.video-facade__btn {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  cursor: pointer;
  background: none;
}
.video-facade__btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease, opacity 0.3s ease;
}
.video-facade__btn:hover img { transform: scale(1.03); opacity: 0.85; }
.video-facade__play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  width: 74px;
  height: 74px;
  padding-left: 4px;
  border-radius: 999px;
  background: #FFCA57;
  color: #0E2417;
  transition: background 0.18s ease, color 0.18s ease;
}
.video-facade__btn:hover .video-facade__play { background: #DB6F3D; color: #F2EFE8; }
.video-facade__btn:focus-visible { outline: 2px solid #FFCA57; outline-offset: 3px; }
.video-facade iframe { width: 100%; height: 100%; border: 0; display: block; }
```

- [ ] **Step 4: Wire up the swap**

Append to `assets/js/site.js`:

```js
/**
 * Swap the poster for a real iframe on click. autoplay=1 is safe here because
 * the swap is user-initiated, so the browser's autoplay policy permits it.
 */
document.querySelectorAll('.video-facade').forEach(facade => {
  const btn = facade.querySelector('.video-facade__btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const id = facade.dataset.videoId;
    if (!id) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
    iframe.title = 'The Weeds, live';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    facade.replaceChildren(iframe);
    iframe.focus();
  }, { once: true });
});
```

`youtube-nocookie.com` is deliberate — it is YouTube's no-tracking-cookie host.

- [ ] **Step 5: Verify**

- The poster renders at 16:9 with a gold play button, and no request to any
  `youtube.com` or `googlevideo.com` host appears in the Network tab on load
- Clicking play swaps in the iframe and the video starts
- After the swap, the Network tab shows requests to `youtube-nocookie.com`
- Tab to the play button: it takes focus and Enter plays the video
- The "Watch the Video" hero button scrolls here

- [ ] **Step 6: Commit**

```bash
git add index.html assets/js/site.js assets/images/video-poster.jpg
git commit -m "feat: add video section with click-to-play YouTube facade"
```

---

### Task 8: Music section retint and Bandcamp verification

**Files:**
- Modify: `index.html` (the `#music` section, roughly lines 243–336 before earlier edits shifted them)

**Interfaces:**
- Consumes: the `#music` nav anchor from Task 4.
- Produces: nothing consumed by later tasks.

The Bandcamp embed hardcodes `album=659904141` against the old `weedstrio`
account. If the album's id changed with the rename, the player renders empty and
nothing errors — so this must be checked by eye, not assumed.

- [ ] **Step 1: Verify the album id**

Open `https://weedsmusic.bandcamp.com/album/supernatural` and view source. Search
for `album=` in the embed metadata, or read the `og:video` / `twitter:player`
meta tag, which contains `EmbeddedPlayer/album=<id>`.

- If the id is still `659904141`, continue.
- If it differs, use the new id everywhere below.
- If the page 404s, **stop and report** — the band's Bandcamp URL is wrong and
  the music section cannot be completed.

- [ ] **Step 2: Update the embed**

In the `#music` section, replace the iframe `src` with the verified id and the
dark-ground colors:

```html
<iframe style="border:0;width:100%;height:120px"
        src="https://bandcamp.com/EmbeddedPlayer/album=659904141/size=small/bgcol=0E2417/linkcol=FFCA57/transparent=true/"
        seamless title="Supernatural by The Weeds">
  <a href="https://weedsmusic.bandcamp.com/album/supernatural">Supernatural by The Weeds</a>
</iframe>
```

- [ ] **Step 3: Update the section's Bandcamp links**

Every `weedstrio.bandcamp.com` URL in this section becomes
`weedsmusic.bandcamp.com`. Task 12 sweeps for stragglers, but fix the ones here now.

- [ ] **Step 4: Confirm the track list still reads correctly**

The `.track-row` borders were retinted in Task 2. Confirm each row separator is a
faint cream hairline on the dark ground, not an invisible or harsh line.

- [ ] **Step 5: Verify**

- The Bandcamp player renders with a dark background matching the section, gold
  links, and actually plays audio
- The player is not a blank box — a blank box means the album id is wrong
- "Buy or Stream on Bandcamp" opens the `weedsmusic` album page

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "fix: point Bandcamp embed and links at weedsmusic account"
```

---

### Task 9: The Trio — portraits with full bios

**Files:**
- Modify: `index.html` — replace the `#about` section, renaming it to `#trio`
- Modify: `index.html` (`<style>` block)

**Interfaces:**
- Consumes: nothing.
- Produces: `<section id="trio">`. No nav link points here — it sits between Music and Shows and is reached by scrolling. Do not add a nav link; the nav is already at its comfortable width.

Each bio runs 150–200 words. Stacked in full beneath three portraits they form a
wall of text exactly where the page should stay scannable. `<details>`/`<summary>`
gives the disclosure for free — it works without JavaScript and is keyboard
accessible and screen-reader announced by default.

- [ ] **Step 1: Add the disclosure styles**

```css
/* Bio disclosure. <details> so it works with JS disabled and is a11y-correct. */
.bio > summary {
  list-style: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.85rem;
  font-family: Inter, system-ui, sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #FFCA57;
  transition: color 0.18s ease;
}
.bio > summary::-webkit-details-marker { display: none; }
.bio > summary:hover { color: #DB6F3D; }
.bio > summary:focus-visible { outline: 2px solid #FFCA57; outline-offset: 3px; border-radius: 2px; }
.bio > summary::after {
  content: '';
  width: 6px; height: 6px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: translateY(-2px) rotate(45deg);
  transition: transform 0.2s ease;
}
.bio[open] > summary::after { transform: translateY(1px) rotate(-135deg); }
.bio > summary .bio__less { display: none; }
.bio[open] > summary .bio__more { display: none; }
.bio[open] > summary .bio__less { display: inline; }
.bio__body { margin-top: 0.85rem; }
.bio__body p + p { margin-top: 0.75rem; }
```

- [ ] **Step 2: Replace the section**

Replace the whole `<section id="about">` block with:

```html
<!-- The Trio -->
<section id="trio" class="bg-surface py-20 md:py-28">
  <div class="max-w-[1180px] mx-auto px-6">

    <div class="max-w-2xl mb-16">
      <p class="reveal eyebrow mb-5">The Trio</p>
      <h2 class="reveal font-heading text-cream text-3xl md:text-4xl leading-[1.2]">
        Three players, one shared language.
      </h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">

      <div class="reveal">
        <div class="member-photo">
          <img src="assets/images/member-john.jpg" alt="John Weed playing fiddle" loading="lazy" style="object-position: center 15%;">
        </div>
        <h3 class="font-heading text-cream text-2xl mb-1">John Weed</h3>
        <p class="text-accent text-[11px] tracking-[2px] uppercase font-body mb-3">Fiddle</p>
        <p class="text-muted text-sm leading-relaxed">
          Thirty years across Irish, Scottish, Swedish, and Old-Time fiddle, with a
          musical education that began in a long series of Irish sessions.
        </p>
        <details class="bio">
          <summary><span class="bio__more">Read more</span><span class="bio__less">Read less</span></summary>
          <div class="bio__body text-muted text-sm leading-relaxed">
            <p>
              John Weed, fiddler for The Weeds, Molly&rsquo;s Revenge and New World
              String Project, has spent the last 30 years immersed in various fiddle
              styles. With an affinity for folk traditions, John&rsquo;s exploration
              has emphasized Irish, Scottish, Swedish, and Old-Time fiddle.
            </p>
            <p>
              While he holds a bachelor&rsquo;s degree of music from CSU Chico, the
              musical education that charted his path began through a long series of
              Irish sessions. There, he learned the nuance of aural passing of
              melodies and the tradition of conversing in a deeply musical manner.
              John&rsquo;s passion for the vital expressiveness of the session lead
              to performing across the United States and internationally.
            </p>
            <p>
              In addition to being a full time performer and instructor, John is
              currently on faculty at Palenke Arts, a multicultural arts
              organization in Seaside, California.
            </p>
          </div>
        </details>
      </div>

      <div class="reveal">
        <div class="member-photo">
          <img src="assets/images/member-evan-2.png" alt="Evan Weed playing Celtic harp" loading="lazy" style="object-position: center 20%;">
        </div>
        <h3 class="font-heading text-cream text-2xl mb-1">Evan Weed</h3>
        <p class="text-accent text-[11px] tracking-[2px] uppercase font-body mb-3">Celtic Harp &middot; Piano &middot; Melodica</p>
        <p class="text-muted text-sm leading-relaxed">
          A 2025 National YoungArts winner in composition and jazz piano, and the
          third eighth grader in four decades to win a seat in the SFJazz High
          School All Star Big Band.
        </p>
        <details class="bio">
          <summary><span class="bio__more">Read more</span><span class="bio__less">Read less</span></summary>
          <div class="bio__body text-muted text-sm leading-relaxed">
            <p>
              Evan Weed is the youngest in the Weeds musical clan. Like Tyler, Evan
              grew up on the road, accompanying his father&rsquo;s touring bands to
              festivals, performing arts centers, house concerts, and many fiddle
              camps. During the pandemic, Evan completely immersed himself in a
              world of practice on piano, Celtic harp, jazz drumming, and Latin
              percussion.
            </p>
            <p>
              In addition to playing harp and melodica in John Weed&rsquo;s Celtic
              Teen Band &ldquo;The McMonarchs&rdquo;, Evan worked tirelessly on
              piano. Evan won a position in the nationally ranked SFJazz High School
              All Star Big Band, becoming only the third eighth grader in four
              decades to be selected. Evan was later presented SFJazz Education
              Award spring 2024, voted on by his peers and directors for superior
              dedication, attitude, and musicianship.
            </p>
            <p>
              Evan&rsquo;s original composition, &ldquo;Ask The Professor&rdquo;,
              was recently featured in the SFJazz winter concert after Evan arranged
              and orchestrated for the 19 piece big-band. Evan recently became a
              2025 National Young Arts Winner in the categories of composition and
              jazz piano.
            </p>
          </div>
        </details>
      </div>

      <div class="reveal">
        <div class="member-photo">
          <img src="assets/images/member-tyler.jpg" alt="Tyler Weed playing mandolin" loading="lazy" style="object-position: center 15%;">
        </div>
        <h3 class="font-heading text-cream text-2xl mb-1">Tyler Weed</h3>
        <p class="text-accent text-[11px] tracking-[2px] uppercase font-body mb-3">Mandolin &middot; Tenor Banjo &middot; Guitar</p>
        <p class="text-muted text-sm leading-relaxed">
          Equally at home in old-world fiddle styles and swing accompaniment, with
          a tenor banjo style built on ornate, percussive triplets over a driving
          groove.
        </p>
        <details class="bio">
          <summary><span class="bio__more">Read more</span><span class="bio__less">Read less</span></summary>
          <div class="bio__body text-muted text-sm leading-relaxed">
            <p>
              Tyler Weed was raised in a musical family. His journey began on guitar
              which quickly led to earning money backing his father on fiddle. He
              then discovered flat-picking melodies while also developing a passion
              for jazz. This allowed him to be equally comfortable playing in the
              old-world fiddle styles as well as using swing-accompaniment on Irish
              melodies. World Strides Heritage Festival presented Tyler with
              first-place Maestro Solo Guitar award in Anaheim, Ca. 2022.
            </p>
            <p>
              Heavily influenced by Bay Area mandolin great Marla Fibish, Tyler
              developed nuanced traditional Irish tunes on mandolin &mdash; picking
              patterns for the different dance tunes, tone projection, and styling,
              which continues in his playing today. Tyler represented the next
              generation of mandolin players at his performance at 2023 San
              Francisco Instrumental Festival of Mandolins.
            </p>
            <p>
              He has since journeyed into the world of tenor banjo. His banjo style
              can be characterized by ornate, percussive triplet stylings with a
              driving, yet hypnotic groove.
            </p>
          </div>
        </details>
      </div>

    </div>
  </div>
</section>
```

Each two-line pull is condensed strictly from that member's supplied bio. No fact
appears that John did not write.

- [ ] **Step 3: Update the stale `#about` anchor**

Grep for `#about` across `index.html`. The nav was already rewritten in Task 4 to
use `#story`, but the old hero had an "Our Story" button pointing at `#about`.
Confirm zero references remain:

```bash
grep -n '#about' index.html
```

Expected: no output.

- [ ] **Step 4: Verify**

- All three portraits load and are not stretched
- "Read more" expands the full bio in place and flips to "Read less"
- Tab reaches each summary; Enter and Space both toggle it
- With JavaScript disabled (DevTools → Settings → Debugger → Disable JavaScript),
  the disclosures still open
- At 375px the three cards stack cleanly with no overflow

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: rebuild trio section with full bios behind disclosures"
```

---

### Task 10: Shows section wired to the tested module

**Files:**
- Modify: `index.html` (the `#shows` section)
- Modify: `assets/js/site.js` (the `loadShows` function)

**Interfaces:**
- Consumes: `parseGvizResponse`, `partitionShows`, `hasTicketLink` from `shows.js` (Task 1); `escapeHtml`, `formatShowDate`, `renderNextShow` from Task 5; and `noMotion`, the module-scope `prefers-reduced-motion` boolean that moved into `site.js` with the original inline script in Task 5 Step 1.
- Produces: nothing consumed by later tasks.

The inline parsing logic moved to `shows.js` in Task 1 but `site.js` still runs
its own copy. This task deletes the duplicate.

- [ ] **Step 1: Replace `loadShows` with the module-backed version**

In `assets/js/site.js`, replace the whole `loadShows` function — including its
local `escapeHtml`, `parseGvizDate`, and `formatDate` helpers, which are now
duplicates — with:

```js
const SHEET_ID = '16qA-eK6T4PcSlP8tMrWN3BqQO4AXeQktJm9S2ReyTlc';

function showRow(r) {
  const where = r.city
    ? `${escapeHtml(r.venue)} &middot; ${escapeHtml(r.city)}`
    : escapeHtml(r.venue);
  return `
    <div class="show-row reveal flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p class="font-heading text-cream text-lg">${formatShowDate(r.date)}</p>
        <p class="text-muted text-sm">${where}</p>
        ${r.notes ? `<p class="text-accent text-xs uppercase tracking-[1px] mt-1">${escapeHtml(r.notes)}</p>` : ''}
      </div>
      ${hasTicketLink(r)
        ? `<a href="${escapeHtml(r.link)}" target="_blank" rel="noopener" class="btn-primary shrink-0">Tickets</a>`
        : ''}
    </div>`;
}

async function loadShows() {
  const upcomingList = document.getElementById('upcoming-shows-list');
  const pastWrap     = document.getElementById('past-shows-wrap');
  const pastList     = document.getElementById('past-shows-list');

  const showEmptyState = () => {
    upcomingList.innerHTML =
      '<p class="text-muted text-sm reveal">No shows currently scheduled &mdash; check back soon.</p>';
  };

  try {
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=1`
    );
    const rows = parseGvizResponse(await res.text());

    renderNextShow(rows);

    const { upcoming, past } = partitionShows(rows, new Date());

    if (upcoming.length === 0) {
      showEmptyState();
    } else {
      upcomingList.innerHTML = upcoming.map(showRow).join('');
    }

    if (past.length > 0) {
      pastWrap.classList.remove('hidden');
      pastList.innerHTML = past.map(r => `
        <p class="show-row reveal text-muted text-sm">
          ${formatShowDate(r.date)} &middot; ${escapeHtml(r.venue)}${r.city ? ', ' + escapeHtml(r.city) : ''}
        </p>`).join('');
    }

    if (!noMotion) {
      gsap.set('#upcoming-shows-list .reveal, #past-shows-list .reveal', { opacity: 0, y: 14 });
      ScrollTrigger.batch('#upcoming-shows-list .reveal, #past-shows-list .reveal', {
        start: 'top 90%',
        onEnter:     batch => gsap.to(batch, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power2.out' }),
        onLeaveBack: batch => gsap.to(batch, { opacity: 0, y: 8, duration: 0.25 }),
      });
    }
  } catch (err) {
    showEmptyState();
    console.error('Failed to load shows:', err);
  }
}
loadShows();
```

- [ ] **Step 2: Rename the row style**

The rows used `.member-card`, which was never about members. In the `<style>`
block rename it and retint:

```css
.show-row { border-top: 1px solid rgba(242,239,232,0.12); padding: 1.5rem 0; }
.show-row:last-child { border-bottom: 1px solid rgba(242,239,232,0.12); }
```

Delete the old `.member-card` rules and confirm nothing else references them:

```bash
grep -n 'member-card' index.html assets/js/site.js
```

Expected: no output.

- [ ] **Step 3: Update the section heading**

In `<section id="shows">`, keep the existing structure and update the header:

```html
<div class="max-w-2xl mb-16">
  <p class="reveal eyebrow mb-5">Shows</p>
  <h2 class="reveal font-heading text-cream text-3xl md:text-4xl leading-[1.2]">
    Catch them live.
  </h2>
</div>
```

Also update the two sub-labels from `text-stone` to `text-muted`.

- [ ] **Step 4: Run the unit tests**

Run: `npm test`
Expected: PASS — the `shows.js` tests still pass, unchanged.

- [ ] **Step 5: Verify in the browser**

- The upcoming list matches the sheet, soonest first
- The hero strip's show is the same as the first upcoming row
- Tickets buttons are gold and open the correct URLs
- Previous Engagements appears only when past shows exist
- Only one network request goes to `docs.google.com` — check the Network tab.
  Two means `loadShows` is being called twice

- [ ] **Step 6: Verify the failure path**

In the Network tab, block `docs.google.com`, then reload. The Shows section must
show "No shows currently scheduled", the hero strip must stay empty, and the
page must not throw. Unblock.

- [ ] **Step 7: Commit**

```bash
git add index.html assets/js/site.js
git commit -m "refactor: drive shows section from the tested shows module"
```

---

### Task 11: Connect section with the mailing list

**Files:**
- Modify: `index.html` — replace `<section id="contact">` with `<section id="connect">`
- Modify: `index.html` (`<style>` block)
- Modify: `assets/js/site.js`

**Interfaces:**
- Consumes: the `#connect` nav anchor from Task 4.
- Produces: `<section id="connect">` and a Netlify form named `mailing-list`.

Netlify detects forms by parsing the deployed HTML at build time, so the form
must exist as static markup with `data-netlify="true"`. The AJAX submit is an
enhancement layered on top; the native POST is the fallback if JavaScript fails.

**The booking email address is not yet confirmed.** `info@weedstrio.com` dies with
the old domain. Use `info@weedsmusic.com` as the working assumption, and flag it
in the Task 13 launch checklist for confirmation before DNS goes live. Do not
ship an unconfirmed address without that flag.

- [ ] **Step 1: Add the form styles**

```css
.field {
  flex: 1 1 240px;
  min-width: 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(242,239,232,0.32);
  padding: 0.75rem 0.25rem;
  color: #F2EFE8;
  font-family: Inter, system-ui, sans-serif;
  font-size: 0.9375rem;
  border-radius: 0;
}
.field::placeholder { color: rgba(242,239,232,0.45); }
.field:focus { outline: none; border-bottom-color: #FFCA57; }
.field:focus-visible { outline: 2px solid #FFCA57; outline-offset: 4px; border-radius: 2px; }
```

- [ ] **Step 2: Replace the section**

```html
<!-- Connect -->
<section id="connect" class="bg-surface py-20 md:py-28">
  <div class="max-w-[1180px] mx-auto px-6">
    <div class="flex flex-col md:flex-row gap-16 md:gap-20">

      <div class="md:w-1/2">
        <p class="reveal eyebrow mb-5">Mailing List</p>
        <h2 class="reveal font-heading text-cream text-3xl md:text-4xl leading-[1.2] mb-5">
          Hear about shows first.
        </h2>
        <p class="reveal text-muted text-sm leading-relaxed mb-8">
          Tour dates, new recordings, and the occasional tune. No more than a few
          times a year.
        </p>

        <form id="mailing-list-form" name="mailing-list" method="POST"
              data-netlify="true" netlify-honeypot="bot-field"
              class="reveal flex flex-wrap items-end gap-4">
          <input type="hidden" name="form-name" value="mailing-list">
          <p class="hidden" aria-hidden="true">
            <label>Leave this field empty: <input name="bot-field" tabindex="-1" autocomplete="off"></label>
          </p>
          <label for="ml-email" class="sr-only">Email address</label>
          <input id="ml-email" class="field" type="email" name="email" required
                 autocomplete="email" placeholder="Email address">
          <button type="submit" class="btn-primary">Sign Up</button>
        </form>
        <p id="mailing-list-status" role="status" aria-live="polite" class="text-sm mt-4"></p>
      </div>

      <div class="md:w-1/2">
        <p class="reveal eyebrow mb-5">Bookings</p>
        <h2 class="reveal font-heading text-cream text-3xl md:text-4xl leading-[1.2] mb-5">
          Bring The Weeds to your stage.
        </h2>
        <p class="reveal text-muted text-sm leading-relaxed mb-8">
          Concerts, festivals, house concerts, and workshops. Reach out and the
          band will get back to you.
        </p>

        <div class="reveal flex flex-col gap-6">
          <a href="mailto:info@weedsmusic.com" class="btn-outline self-start">Email the Band</a>

          <div class="flex items-center gap-6 pt-2">
            <a href="https://www.instagram.com/weedsmusic" target="_blank" rel="noopener"
               class="text-accent/75 hover:text-accent transition-colors" aria-label="The Weeds on Instagram">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="https://weedsmusic.bandcamp.com" target="_blank" rel="noopener"
               class="text-accent/75 hover:text-accent transition-colors" aria-label="The Weeds on Bandcamp">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M0 18.75l7.437-13.5H24l-7.438 13.5z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
```

- [ ] **Step 3: Wire the AJAX submit**

Append to `assets/js/site.js`:

```js
/**
 * Netlify accepts a urlencoded POST to any path on the site. Submitting via
 * fetch keeps the visitor on the page instead of bouncing to Netlify's default
 * success screen. The plain form POST remains the no-JS fallback.
 */
const mlForm   = document.getElementById('mailing-list-form');
const mlStatus = document.getElementById('mailing-list-status');

mlForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const submit = mlForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  mlStatus.style.color = 'rgba(242,239,232,0.62)';
  mlStatus.textContent = 'Signing up…';

  try {
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(mlForm)).toString(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    mlForm.hidden = true;
    mlStatus.style.color = '#FFCA57';
    mlStatus.textContent = 'Thanks — you’re on the list.';
  } catch (err) {
    submit.disabled = false;
    mlStatus.style.color = '#DB6F3D';
    mlStatus.textContent = 'Something went wrong. Please email info@weedsmusic.com instead.';
    console.error('Mailing list signup failed:', err);
  }
});
```

- [ ] **Step 4: Verify locally**

The Python dev server returns 501 for POST, so the error path is what you can
test locally. Confirm:

- Submitting an invalid email triggers the browser's native validation and does
  not call fetch
- Submitting a valid email shows "Signing up…" then the orange error message,
  and re-enables the button
- The status message is announced by a screen reader (`role="status"` with
  `aria-live="polite"` is already set)
- The honeypot paragraph is invisible and not tabbable

The success path can only be verified on Netlify — that is Task 13, Step 6.

- [ ] **Step 5: Update the remaining `#contact` references**

```bash
grep -n '#contact' index.html
```

Expected: no output. The nav was already pointed at `#connect` in Task 4.

- [ ] **Step 6: Commit**

```bash
git add index.html assets/js/site.js
git commit -m "feat: add Connect section with Netlify Forms mailing list"
```

---

### Task 12: Purge stale references and update metadata

**Files:**
- Modify: `index.html` (`<head>` and `<footer>`)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Sweep for the dead handle**

```bash
grep -rn 'weedstrio' --exclude-dir=.git --exclude-dir=docs --exclude-dir=.superpowers .
```

Expected: no output. Every hit is a bug — replace `weedstrio.bandcamp.com` with
`weedsmusic.bandcamp.com`, `instagram.com/weedstrio` with
`instagram.com/weedsmusic`, and `info@weedstrio.com` with `info@weedsmusic.com`.

Re-run until clean.

- [ ] **Step 2: Update the head metadata**

```html
<title>The Weeds — Irish Traditional Music, Modern Arrangements</title>
<meta name="description" content="The Weeds are a touring trio playing traditional Irish music with modern arrangements — fiddle, Celtic harp, mandolin, and tenor banjo. Debut album Supernatural out now.">
<link rel="canonical" href="https://weedsmusic.com/">
<meta property="og:title" content="The Weeds">
<meta property="og:description" content="Traditional tunes, modern hands. Fiddle, Celtic harp, and mandolin.">
<meta property="og:image" content="https://weedsmusic.com/assets/images/band-photo.jpg">
<meta property="og:url" content="https://weedsmusic.com/">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

`og:image` must be an absolute URL — relative paths are ignored by every major
scraper, which is why the current relative value never worked.

- [ ] **Step 3: Update the footer**

```html
<footer class="bg-ground border-t border-hairline py-8">
  <div class="max-w-[1180px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted">
    <span class="font-heading italic text-sm text-cream/70">The Weeds</span>
    <span>&copy; 2026 The Weeds</span>
    <a href="https://weedsmusic.bandcamp.com" target="_blank" rel="noopener"
       class="hover:text-accent transition-colors">Bandcamp</a>
  </div>
</footer>
```

Carmel is gone from the footer, per the constraint.

- [ ] **Step 4: Confirm the geography constraint holds**

```bash
grep -n -i 'carmel' index.html
```

Expected: exactly zero matches — John's story text says "central coast of
California", not "Carmel". If any match appears outside the story section, remove it.

- [ ] **Step 5: Full-page verification**

Walk the whole page at 1440px and at 375px:

- Every section renders on `ground` or `surface`, alternating sensibly
- No text is illegible against its background
- Nav anchors all resolve: Story, Music, Shows, Contact
- No console errors
- No horizontal scroll at 320px
- Lighthouse accessibility score ≥ 95 (DevTools → Lighthouse → Accessibility)

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "chore: purge weedstrio references and update page metadata"
```

---

### Task 13: Deploy to weedsmusic.com

**Files:**
- Create: `netlify.toml`
- Modify: `index.html` (only if the band supplies more social URLs)

**Interfaces:**
- Consumes: everything above.
- Produces: a live site.

**This task is blocked on information only John can supply.** Complete Steps 1–2,
then stop and report if the answers are not yet available. Do not guess a
registrar and do not invent social URLs.

- [ ] **Step 1: Add the Netlify config**

Create `netlify.toml`:

```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

There is no build command — the site is static and Tailwind runs from the CDN.

```bash
git add netlify.toml
git commit -m "chore: add Netlify config"
```

- [ ] **Step 2: Confirm the outstanding details with John**

Three answers are needed. Report and stop if any is missing:

1. **Booking email.** The plan currently ships `info@weedsmusic.com` as an
   assumption. Confirm it exists and receives mail, or supply the real address.
2. **Registrar for `weedsmusic.com`.** Needed to change nameservers or add DNS
   records. Confirm the domain is registered at all.
3. **Remaining social URLs** — YouTube, Spotify, Facebook. Only Instagram and
   Bandcamp are live in the nav today.

- [ ] **Step 3: Add any newly supplied social links**

If John supplies more URLs, add matching icons to all three social rows — desktop
nav, mobile menu, and the Connect section. Keep the order consistent across all
three. Each needs an `aria-label` in the form "The Weeds on <Platform>".

- [ ] **Step 4: Create the GitHub remote**

The repository has no remote today.

```bash
gh repo create weeds-website --private --source=. --remote=origin
git push -u origin main
```

- [ ] **Step 5: Connect Netlify**

Create a Netlify site from the GitHub repository. Publish directory `.`, no build
command. Deploy and open the generated `*.netlify.app` URL.

Verify on the deployed URL, not locally:

- The Shows section loads from the sheet over HTTPS
- The Bandcamp player renders
- The video facade swaps in the iframe on click

- [ ] **Step 6: Verify Netlify Forms end to end**

This is the first point at which the mailing list success path can be tested.

- Confirm the `mailing-list` form appears under Netlify → Forms. If it does not,
  Netlify did not detect it — check that `data-netlify="true"` survived into the
  deployed HTML
- Submit a real address on the live site
- Confirm the inline "Thanks — you're on the list." message appears and the form
  hides
- Confirm the submission appears in the Netlify Forms dashboard
- Enable an email notification to the band's address so signups are not stranded
  in the dashboard

- [ ] **Step 7: Point the domain**

Add `weedsmusic.com` as a custom domain in Netlify. Update the registrar's
nameservers or add the records Netlify specifies. Enable HTTPS once DNS resolves.

Confirm:

- `https://weedsmusic.com` serves the site
- `http://weedsmusic.com` redirects to HTTPS
- `www.weedsmusic.com` resolves

- [ ] **Step 8: Final launch check**

- Every success criterion in the spec is met
- `grep -rn 'weedstrio' --exclude-dir=.git --exclude-dir=docs --exclude-dir=.superpowers .` returns nothing
- Sharing the URL in a messaging app shows the band photo and title from the OG tags
- Tickets are reachable without scrolling on desktop

- [ ] **Step 9: Commit and tag**

Never use `git add -A` here — the working tree contains untracked `.claude/`
and `.codex/` tool directories that must not ship. Stage explicitly:

```bash
git status --short          # confirm nothing unexpected is staged
git add index.html netlify.toml
git commit -m "chore: launch weedsmusic.com"
git tag -a v1.0 -m "Site launch"
git push origin HEAD --tags
```

---

## Self-Review

**Spec coverage.** Every spec section maps to a task: tokens → 2; page structure
nav/hero/story/video/music/trio/shows/connect/footer → 4, 5, 6, 7, 8, 9, 10, 11,
12; logo → 3; content changes → 5, 6, 9, 12; stale references → 8, 11, 12;
deployment → 13; out-of-scope items are built nowhere. The three open questions
are carried into Task 13 Step 2 as an explicit blocking gate rather than being
silently assumed.

**Known deviation from the spec.** The spec named the trio section `#trio` only
implicitly; the plan renames `#about` to `#trio` and adds no nav link for it,
since the nav is already at four links plus a Tickets pill. Flagged here rather
than buried.

**Testing note.** Only `shows.js` has automated tests. The rest is verified by
browser checklist, which is proportionate for a single-page static site with no
existing test infrastructure — but it does mean visual regressions are caught by
eye, not by CI. Accepted.
