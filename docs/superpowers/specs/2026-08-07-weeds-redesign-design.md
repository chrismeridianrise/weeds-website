# The Weeds — Site Redesign Design Spec

**Date:** 2026-08-07
**Status:** Approved, ready for implementation planning

## Purpose

Rebuild the site on a dark green ground modeled on the current rakishmusic.com,
add the content John sent (band description, video, full bios), make ticket links
prominent, add a mailing list, and ship it live at weedsmusic.com.

## Background

The site exists at `~/weeds-website` as a single `index.html` (light parchment
theme, Tailwind CDN, GSAP ScrollTrigger). It has never been deployed. John
reported "I'm not seeing a link to performances" — the Shows section and nav link
both exist and are wired to the band's Google Sheet. He is looking at a stale
copy. **The absence of a deploy is the actual problem**, and it is in scope here.

rakishmusic.com has been redesigned since it was chosen as the reference. It is
now a dark slate ground (~`#16242a`) with tan accents: splash-style home page,
social icon row, full-bleed photography, newsletter signup, and inner pages with
social icons pinned top-right. "Emulate Rakish" therefore means dark, quiet, and
photo-led — not the warm tan/beige the current site was built against.

## Brief from the band

From the lads, verbatim in substance:

- Ticket links super accessible, near the top of the page
- A mailing list feature
- Professional but somewhat folky
- A professional touring trio that happens to be a family — **not** a family band.
  The music is the selling point
- Convey traditional music and tunes, with modern tunes and arrangements too
- Social media buttons at the top, like Rakish
- Videos embedded from YouTube
- Less emphasis on Carmel, California — true, but not top-of-site information
- Logo should convey traditional music played with modern arrangements and
  sensibilities, no tagline
- Tyler's logo draft is a starting point, but the Celtic-stylized elements come
  out and it currently reads too cartoony
- Photos of different band configurations would be good — **those photos do not
  exist yet**

## Design tension, and how it is resolved

The brief asks to avoid Celtic cliché. The supplied palette is green, gold, and
orange, which at equal weight reads as an Irish pub sign — the exact cliché.

Resolution: weight the palette rather than balance it. A deepened green becomes
the ground, gold is reserved almost entirely for ticket CTAs, and orange is held
back for hover and one secondary moment. Restraint is what makes it read
professional; three loud colors is what makes it read cartoony.

The same tension governs the logo. Removing the knotwork and the illustrative
shading from Tyler's badge is not an edit to that logo — it is a different logo
that preserves his *idea*. That is the accepted direction.

## Design tokens

Replace the existing Tailwind color config wholesale.

| Token | Hex | Role |
|---|---|---|
| `ground` | `#0E2417` | Page background, near-black green |
| `surface` | `#14311F` | Raised panels, cards |
| `brand` | `#1F703F` | Mid accents, rules, eyebrow text (band-supplied) |
| `accent` | `#FFCA57` | Ticket CTAs and primary buttons **only** (band-supplied) |
| `hover` | `#DB6F3D` | Hover states, one secondary moment (band-supplied) |
| `cream` | `#F2EFE8` | Primary text |
| `muted` | `rgba(242,239,232,0.62)` | Body text |
| `hairline` | `rgba(242,239,232,0.12)` | Rules, borders |

Fonts are unchanged: Cormorant Garamond (headings), Inter (body).

`brand` at `#1F703F` on `ground` at `#0E2417` is a low-contrast pair. It is
permitted for decorative rules and large-type accents, and **must not** be used
for body text or any text below 18px. Eyebrow labels use `accent` or `muted`
instead. All text/background pairs must meet WCAG AA (4.5:1 body, 3:1 large).

## Page structure

Single page with anchor navigation. Rakish is multi-page, but that is a
Squarespace artifact; one page keeps tickets within one scroll of anywhere on the
site. Sections in order:

### 1. Navigation

- Logo roundel + "THE WEEDS" wordmark, left
- Social icon row — Instagram, YouTube, Bandcamp, and any others supplied —
  rendered as inline SVG in `accent`, mirroring the Rakish treatment
- Anchor links: Story, Music, Shows, Contact
- Gold **Tickets** pill, right, anchoring to `#shows`
- Transparent over the hero, resolving to `ground` with a hairline on scroll
- Mobile: hamburger to a full-screen `ground` overlay, existing pattern retained

### 2. Hero

- Full-bleed band photograph with a `ground` wash for text legibility
- Eyebrow: `IRISH TRADITION · ORIGINAL ARRANGEMENTS` (replaces
  `CARMEL, CALIFORNIA · CELTIC FOLK`)
- Headline: "Traditional tunes, modern hands." Wording may be refined during
  implementation, but it must carry both halves — the tradition and the
  contemporary treatment — in one line, and must not mention family or geography
- **Next-show strip** directly beneath: the soonest upcoming show from the Google
  Sheet rendered as `date · venue · city` with a gold Tickets button. This is the
  band's top-priority ask. It reuses the existing sheet fetch — one request,
  two render targets
- Secondary link: *Watch the video*, anchoring to the video section
- When no upcoming shows exist, the strip is omitted entirely rather than
  rendering an empty state; the hero must not show a hole

### 3. Our Story

John's band description, placed high as he requested. Runs as supplied. Carmel
survives here, in body text, and nowhere above it.

### 4. Video

YouTube embed of `https://youtu.be/4eLVqORprSE` (video id `4eLVqORprSE`).

Implemented as a click-to-play facade: a poster image with a play control that
swaps in the iframe on click. A bare iframe costs roughly 1MB of third-party
JavaScript on every page load and sets cookies before consent. The facade
defers both until the visitor asks for the video.

Structured so additional videos can be added later without rework.

### 5. Music

Existing Supernatural section and Bandcamp embed, retinted for the dark ground.
The Bandcamp iframe's `bgcol` and `linkcol` parameters must be updated from the
parchment values to `0E2417` / `FFCA57`.

### 6. The Trio

Three portraits — John, Evan, Tyler — each with name, instruments, a two-line
pull, and a **Read more** disclosure expanding the full bio inline.

The two-line pull must be condensed from the supplied bio for that member. No
biographical fact may be introduced that John did not supply.

The supplied bios run 150–200 words each. Stacked in full beneath three
portraits they form a wall of text exactly where the page should stay scannable.
The disclosure keeps every word while preserving the scan. Implemented with
`<details>`/`<summary>` so it works without JavaScript and is accessible by
default.

The grid accepts the different-instrumentation photos whenever they are taken. No
placeholder gallery is built for them now.

### 7. Shows

Existing Google Sheet-driven list, retinted. Upcoming shows and Previous
Engagements as today. Tickets buttons in `accent`.

Sheet ID `16qA-eK6T4PcSlP8tMrWN3BqQO4AXeQktJm9S2ReyTlc`, columns `Date`,
`Venue`, `City`, `Ticket Link`, `Notes`. Unchanged — no schema migration needed.

### 8. Connect

- **Mailing list** — Netlify Forms. No third-party account, no API key, no cost
  at this volume. Requires `netlify` and `netlify-honeypot` attributes on the
  form and a success state
- Booking email (address pending, see Open Questions)
- Social links

### 9. Footer

Wordmark, copyright, social links. Carmel does not appear.

## Logo

Flat single-weight line roundel in `accent`:

- Circular frame
- "THE WEEDS" arched along the top on a text path
- Fiddle, harp, and mandolin as line silhouettes below
- No knotwork, no leaves, no shading, no fill, no tagline
- Hand-authored inline SVG, so it inherits `currentColor` and costs no request
- Must remain legible at 16px for the favicon

**Accepted risk:** hand-authored vector line art of a harp and mandolin has a
quality ceiling without a drawing tool. The deliverable is clean and disciplined;
it may not be beautiful. If it does not clear the bar on review, the fallback is
the typographic wordmark alone, with the roundel deferred to a real illustrator.
This decision is made at review time, not now.

## Content changes

| Location | From | To |
|---|---|---|
| Hero eyebrow | `CARMEL, CALIFORNIA · CELTIC FOLK` | `IRISH TRADITION · ORIGINAL ARRANGEMENTS` |
| About heading | "A family trio rooted in tradition." | Music-led heading; family emerges from John's text |
| About body | Existing summary | John's supplied band description |
| Member bios | Two-line summaries | John's supplied full bios, behind a disclosure |
| Footer | "© 2026 The Weeds · Carmel, California" | "© 2026 The Weeds" |

## Stale references

Every `weedstrio` reference is dead and must be replaced. Ten occurrences:

- `weedstrio.bandcamp.com` → `weedsmusic.bandcamp.com`
  (lines 201, 220, 235, 260, 263, 267, 446, 451, 467)
- `@weedstrio` / `instagram.com/weedstrio` → `@weedsmusic` /
  `instagram.com/weedsmusic` (line 437)
- `info@weedstrio.com` → pending (lines 429, 430)
- Bandcamp album id `659904141` must be re-verified against the new
  `weedsmusic.bandcamp.com/album/supernatural` page; a moved album breaks the
  embed silently

Implementation must grep for `weedstrio` and confirm zero matches before shipping.

## Deployment

1. Connect the repository to a GitHub remote (none exists today)
2. Netlify site from that repository, publish directory = repo root
3. Point `weedsmusic.com` DNS at Netlify; enable HTTPS
4. Confirm Netlify Forms receives a test submission
5. Update `og:image`, `og:url`, and canonical to the live domain

## Out of scope

- Different-instrumentation photography (does not exist yet)
- A store or merch page
- An EPK page
- Multi-page architecture
- Any change to the Google Sheet schema

## Open questions

Do not block design or implementation; do block launch.

1. **Booking email address** — `info@weedstrio.com` presumably dies with the old
   domain. Needed for the Connect section
2. **Is `weedsmusic.com` registered, and with which registrar?** DNS access is
   required to point it at Netlify
3. **Additional social URLs** — Instagram and Bandcamp are known. YouTube,
   Spotify, and Facebook are unconfirmed, and the header row needs its final set

## Success criteria

- Ticket links reachable without scrolling on desktop and after one scroll on mobile
- Site reads professional-folky; no visitor would call it a family band site
- Zero `weedstrio` references remain
- Mailing list accepts a real submission
- Live at weedsmusic.com over HTTPS
- Lighthouse accessibility ≥ 95; all text meets WCAG AA
- No horizontal scroll at 320px
- `prefers-reduced-motion` respected, as today
