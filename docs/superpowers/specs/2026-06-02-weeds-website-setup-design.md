# The Weeds Website — Setup Design

**Date:** 2026-06-02
**Status:** Approved

## Overview

Set up The Weeds band website as an independent, deployable project — separate from the Meridian Rise site — with proper version control, Netlify hosting, and Claude Code documentation.

## Site

**Name:** The Weeds
**Description:** Celtic folk trio from Carmel, California (fiddle, harp, mandolin)
**Project root:** `/Users/christopherbeem/weeds-website/`
**Stack:** Plain HTML + Tailwind CDN + GSAP ScrollTrigger (same pattern as MR site)
**Album:** Supernatural (debut)

### Theme

Light parchment theme (`index-standalone.html`) is the default. Design tokens:

| Token | Value | Usage |
|---|---|---|
| `grove` | `#1b2b1d` | Dark accents |
| `moss` | `#2d4a31` | Mid greens |
| `fern` | `#4a7c52` | Interactive elements |
| `amber` | `#8c6030` | Warm accents |
| `parch` | `#f5f1ea` | Page background |
| `linen` | `#ede9e0` | Section backgrounds |
| `ink` | `#1a1a18` | Body text |
| `stone` | `#7a7870` | Muted text |
| `rule` | `#dedad2` | Borders/dividers |
| Heading font | Cormorant Garamond | Display/hero |
| Body font | Inter | Everything else |

Dark theme (`index-dark.html`) is archived and not deployed.

## File Changes

- `index.html` (current dark) → renamed to `index-dark.html`
- `index-standalone.html` → renamed to `index.html` (becomes default)
- `index-offline.html` → kept as-is (font-embedded offline version)

## Infrastructure

| Item | Detail |
|---|---|
| Version control | Git, initialized in project root |
| Remote | Personal GitHub account (repo created manually by user) |
| Hosting | Netlify, connected to GitHub repo via UI |
| Deploy | Auto-deploy on push to `main` |
| Domain | None yet — Netlify subdomain for now |

### Setup sequence

1. `git init` + `.gitignore` in project root
2. User creates GitHub repo on personal account, provides URL
3. Add remote + initial push
4. User connects Netlify to repo in UI
5. Auto-deploy from `main` is live

## Documentation

Two outputs:

1. **Skill file** — `~/.claude/skills/weeds-website.md` (mirrors `meridianrise-website` pattern): project root, design tokens, page structure, deploy workflow, open items. Loaded in future sessions when working on the site.

2. **DESIGN.md** — in project root, documents design tokens and component patterns for human reference.

## Open Items

- Band feedback on light vs dark theme pending
- No domain purchased yet
- No contact/booking form wired up
