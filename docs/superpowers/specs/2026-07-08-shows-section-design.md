# Shows Section — Google Sheets–Powered Gig List

**Date:** 2026-07-08
**Status:** Approved

## Overview

Add a "Shows" section to The Weeds website listing upcoming gigs and past engagements. The band manages gig data themselves by editing a Google Sheet — no code changes or redeploys needed when a show is added, changed, or removed.

## Data Source

**Google Sheet**, shared as "Anyone with the link can view."

Columns (header row + one example row for the band to follow):

| Date | Venue | City | Ticket Link | Notes |
|---|---|---|---|---|
| `2026-08-15` | Sunset Center | Carmel, CA | `https://...` | Early show |

- `Date` must be ISO format (`YYYY-MM-DD`) for reliable parsing and sorting.
- `Ticket Link` and `Notes` are optional per row.

The sheet itself doesn't exist yet — it will be created during implementation, with its ID and sheet/tab name substituted into the fetch URL in the site code.

## Fetch Mechanism

The site fetches the sheet via Google's built-in `gviz/tq` JSON endpoint:

```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={SHEET_NAME}
```

Chosen over "publish to web as CSV" because CSV parsing breaks on commas inside `Venue` or `Notes` text; the gviz endpoint returns structured JSON directly (wrapped in a JS callback that must be stripped before `JSON.parse`). No Apps Script deployment, no API key, no backend.

Fetched client-side on page load via vanilla `fetch()`. If the fetch fails or returns no rows, the section falls back gracefully (see Empty State below) rather than breaking the page.

## Page Structure

**New nav entry:** `Music → About → Shows → Contact`, added to both desktop nav and mobile menu, following the existing `<a href="#shows">` pattern used by `#music`/`#about`/`#contact`.

**New section** `<section id="shows">`, placed between About and Contact, using `bg-parch` with `border-b border-rule` — alternates from the preceding `bg-linen` About section, matching the site's existing pattern of alternating section backgrounds.

Two subsections sharing one data fetch, split client-side by comparing each row's `Date` to today:

### Upcoming Shows
- Sorted soonest-first
- Each gig rendered as a card: formatted date (e.g. "Aug 15, 2026"), venue + city, a "Tickets" button (`btn-outline`, matching the existing secondary-action style used by "Our Story" in the hero) shown only if `Ticket Link` is present, and `Notes` shown as small text (e.g. "Sold out", "All ages")
- Follows the visual weight of the existing `.member-card` pattern (border-top rule, consistent vertical padding) rather than introducing a new card style

### Previous Engagements
- All past-dated rows, sorted most-recent-first
- Compact text list: date · venue · city only — no ticket button (stale links), no notes (less relevant after the fact)

### Empty State
If there are zero upcoming rows (sheet fetch succeeds but nothing is upcoming, or fetch fails entirely): show "No shows currently scheduled — check back soon" in place of the Upcoming Shows list. Previous Engagements still renders independently if past data is available.

## Out of Scope

- No admin UI beyond the Google Sheet itself
- No pagination/cap on Previous Engagements — full history is shown
- No calendar/ICS export
- No images per gig entry
