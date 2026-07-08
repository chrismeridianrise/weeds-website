# Shows Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Shows" section to the site (`index.html`) that lists upcoming gigs and previous engagements, sourced live from a Google Sheet the band edits directly — no redeploy needed for gig updates.

**Architecture:** A single JS function (`loadShows`), added to the existing inline `<script>` block at the bottom of `index.html`, fetches the sheet via Google's `gviz/tq` JSON endpoint on page load, splits rows into upcoming/past by comparing dates to today, and renders both lists into two empty containers already present in the new `#shows` section markup. No build step, no new files — follows the site's existing single-file pattern (all CSS/JS inline in `index.html`).

**Tech Stack:** Plain HTML/CSS/JS + Tailwind CDN + GSAP ScrollTrigger (existing site stack, no new dependencies). Data source: Google Sheets `gviz/tq` public JSON endpoint (no API key).

## Global Constraints

- Sheet ID: `16qA-eK6T4PcSlP8tMrWN3BqQO4AXeQktJm9S2ReyTlc` (from spec: `docs/superpowers/specs/2026-07-08-shows-section-design.md`)
- Sheet columns (header row, exact labels): `Date`, `Venue`, `City`, `Ticket Link`, `Notes` — `Date` must be ISO format (`YYYY-MM-DD`)
- Design tokens/fonts per `docs/superpowers/specs/2026-06-02-weeds-website-setup-design.md`: `grove #1b2b1d`, `fern #3d6845` (current value in code, not the older `#4a7c52` in that doc), `parch #f5f1ea`, `linen #ede9e0`, `ink #1a1a18`, `stone #63615b`, `rule #dedad2`; headings in Cormorant Garamond, body in Inter
- `.btn-primary` (amber fill) is the button style used on light backgrounds (see `#music` section's "Buy or Stream on Bandcamp"); `.btn-outline` (white/transparent) is only used on dark backgrounds (hero) — the Tickets button must use `.btn-primary`
- No test framework exists in this repo (plain static HTML site) — verification is manual: local HTTP server + browser check, matching how the rest of the site was built

---

### Task 1: Seed the Google Sheet with a header row and example data

**Files:** None (external Google Sheet, not a repo file)

**Interfaces:**
- Produces: a publicly-readable Google Sheet at `https://docs.google.com/spreadsheets/d/16qA-eK6T4PcSlP8tMrWN3BqQO4AXeQktJm9S2ReyTlc/` whose first sheet/tab has header row `Date | Venue | City | Ticket Link | Notes` in row 1, plus one example upcoming row and one example past row in rows 2–3, that Task 2's `loadShows()` function reads by column label.

The sheet is currently empty (confirmed via `curl "https://docs.google.com/spreadsheets/d/16qA-eK6T4PcSlP8tMrWN3BqQO4AXeQktJm9S2ReyTlc/gviz/tq?tqx=out:json"` — returns a single blank column, zero rows) and already shared "Anyone with the link can view" (the curl call succeeded without auth).

- [ ] **Step 1: Open the sheet in the browser**

Navigate to `https://docs.google.com/spreadsheets/d/16qA-eK6T4PcSlP8tMrWN3BqQO4AXeQktJm9S2ReyTlc/edit`. Confirm it loads in edit mode (not "Request access") — this requires being signed into the Google account that owns/can-edit the sheet.

- [ ] **Step 2: Fill row 1 (headers) and rows 2–3 (example data)**

Click cell A1 and enter the following grid (Tab between columns, Enter/Return to drop to the next row's first cell):

| Date | Venue | City | Ticket Link | Notes |
|---|---|---|---|---|
| 2026-09-12 | Example Venue | Example City, CA | https://example.com/tickets | EXAMPLE ROW — edit or delete |
| 2026-04-01 | Example Past Venue | Example City, CA | | EXAMPLE ROW — edit or delete |

The first data row is a future date (after today, 2026-07-08) so it demonstrates the Upcoming Shows list; the second is a past date so it demonstrates Previous Engagements. Both are explicitly labeled as examples in the Notes/venue text so the band doesn't mistake them for real bookings.

- [ ] **Step 3: Verify via the gviz JSON endpoint**

Run: `curl -s "https://docs.google.com/spreadsheets/d/16qA-eK6T4PcSlP8tMrWN3BqQO4AXeQktJm9S2ReyTlc/gviz/tq?tqx=out:json&headers=1"`

Expected: JSON containing `"cols":[{"label":"Date"...},{"label":"Venue"...},{"label":"City"...},{"label":"Ticket Link"...},{"label":"Notes"...}]` and two rows in `table.rows` matching the data entered above.

---

### Task 2: Add the Shows section (nav, markup, JS render logic) to `index.html`

**Files:**
- Modify: `index.html:197-199` (desktop nav links)
- Modify: `index.html:215-217` (mobile nav links)
- Modify: `index.html:384-386` (insert new section between `#about` and `#contact`)
- Modify: `index.html:509-510` (add `loadShows()` call at end of existing `<script>` block, before `</script>`)

**Interfaces:**
- Consumes: sheet data from Task 1 at the fixed Sheet ID above; existing global `noMotion` boolean and `gsap`/`ScrollTrigger` already set up earlier in the same `<script>` block (`index.html:444`, `index.html:443`)
- Produces: `#shows` section in the DOM with two child containers, `#upcoming-shows-list` and `#past-shows-list`, populated at runtime by `loadShows()`

- [ ] **Step 1: Add "Shows" to desktop nav**

In `index.html`, current lines 197-199:
```html
        <a href="#music"   class="text-sm text-white/80 hover:text-white transition-colors tracking-wide" style="text-shadow:0 1px 4px rgba(0,0,0,0.4);">Music</a>
        <a href="#about"   class="text-sm text-white/80 hover:text-white transition-colors tracking-wide" style="text-shadow:0 1px 4px rgba(0,0,0,0.4);">About</a>
        <a href="#contact" class="text-sm text-white/80 hover:text-white transition-colors tracking-wide" style="text-shadow:0 1px 4px rgba(0,0,0,0.4);">Contact</a>
```

Replace with:
```html
        <a href="#music"   class="text-sm text-white/80 hover:text-white transition-colors tracking-wide" style="text-shadow:0 1px 4px rgba(0,0,0,0.4);">Music</a>
        <a href="#about"   class="text-sm text-white/80 hover:text-white transition-colors tracking-wide" style="text-shadow:0 1px 4px rgba(0,0,0,0.4);">About</a>
        <a href="#shows"   class="text-sm text-white/80 hover:text-white transition-colors tracking-wide" style="text-shadow:0 1px 4px rgba(0,0,0,0.4);">Shows</a>
        <a href="#contact" class="text-sm text-white/80 hover:text-white transition-colors tracking-wide" style="text-shadow:0 1px 4px rgba(0,0,0,0.4);">Contact</a>
```

- [ ] **Step 2: Add "Shows" to mobile nav**

Current lines 215-217:
```html
    <a href="#music"   class="mobile-nav-link font-heading text-2xl text-white/80 hover:text-white transition-colors italic">Music</a>
    <a href="#about"   class="mobile-nav-link font-heading text-2xl text-white/80 hover:text-white transition-colors italic">About</a>
    <a href="#contact" class="mobile-nav-link font-heading text-2xl text-white/80 hover:text-white transition-colors italic">Contact</a>
```

Replace with:
```html
    <a href="#music"   class="mobile-nav-link font-heading text-2xl text-white/80 hover:text-white transition-colors italic">Music</a>
    <a href="#about"   class="mobile-nav-link font-heading text-2xl text-white/80 hover:text-white transition-colors italic">About</a>
    <a href="#shows"   class="mobile-nav-link font-heading text-2xl text-white/80 hover:text-white transition-colors italic">Shows</a>
    <a href="#contact" class="mobile-nav-link font-heading text-2xl text-white/80 hover:text-white transition-colors italic">Contact</a>
```

- [ ] **Step 3: Insert the `#shows` section markup between About and Contact**

Current lines 384-386:
```html
    </div>
  </section>

  <!-- Contact / Connect -->
```

Replace with:
```html
    </div>
  </section>

  <!-- Shows -->
  <section id="shows" class="bg-parch py-20 md:py-28 border-b border-rule">
    <div class="max-w-[1100px] mx-auto px-6">

      <!-- Section header -->
      <div class="max-w-2xl mb-16">
        <p class="reveal text-fern text-[11px] tracking-[3px] uppercase font-body mb-5">Shows</p>
        <h2 class="reveal font-heading text-ink text-3xl md:text-4xl leading-[1.2] mb-6">
          Catch them live.
        </h2>
      </div>

      <!-- Upcoming shows -->
      <div class="mb-16">
        <p class="reveal text-[11px] tracking-[3px] uppercase font-body text-stone mb-4">Upcoming</p>
        <div id="upcoming-shows-list"></div>
      </div>

      <!-- Previous engagements -->
      <div id="past-shows-wrap" class="hidden">
        <p class="reveal text-[11px] tracking-[3px] uppercase font-body text-stone mb-4">Previous Engagements</p>
        <div id="past-shows-list"></div>
      </div>

    </div>
  </section>

  <!-- Contact / Connect -->
```

- [ ] **Step 4: Add the `loadShows()` function and call it**

Current end of the closing `<script>` block, lines 506-510:
```javascript
    menuToggle.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);
    document.querySelectorAll('.mobile-nav-link').forEach(l => l.addEventListener('click', closeMenu));
    mobileMenu.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  </script>
```

Replace with:
```javascript
    menuToggle.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);
    document.querySelectorAll('.mobile-nav-link').forEach(l => l.addEventListener('click', closeMenu));
    mobileMenu.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

    // Shows: fetch gig list from Google Sheets and render Upcoming / Previous Engagements
    async function loadShows() {
      const SHEET_ID = '16qA-eK6T4PcSlP8tMrWN3BqQO4AXeQktJm9S2ReyTlc';
      const upcomingList = document.getElementById('upcoming-shows-list');
      const pastWrap = document.getElementById('past-shows-wrap');
      const pastList = document.getElementById('past-shows-list');

      function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, c => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
      }

      // Google's gviz endpoint returns date-typed cells as "Date(Y,M,D)" (M is
      // 0-indexed) rather than the ISO string that was typed in — handle both.
      function parseGvizDate(raw) {
        if (typeof raw !== 'string') return null;
        const m = raw.match(/^Date\((\d+),(\d+),(\d+)\)$/);
        if (m) return new Date(Number(m[1]), Number(m[2]), Number(m[3]));
        const d = new Date(raw + 'T00:00:00');
        return isNaN(d) ? null : d;
      }

      function formatDate(d) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      function showEmptyState() {
        upcomingList.innerHTML = '<p class="text-stone text-sm reveal">No shows currently scheduled — check back soon.</p>';
      }

      try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=1`);
        const text = await res.text();
        const json = JSON.parse(text.substring(text.indexOf('(') + 1, text.lastIndexOf(')')));
        const cols = json.table.cols.map(c => (c.label || '').trim());
        const idx = {
          date:  cols.indexOf('Date'),
          venue: cols.indexOf('Venue'),
          city:  cols.indexOf('City'),
          link:  cols.indexOf('Ticket Link'),
          notes: cols.indexOf('Notes'),
        };

        const rows = (json.table.rows || []).map(row => {
          const cell = i => (i === -1 || !row.c[i] || row.c[i].v == null) ? '' : row.c[i].v;
          return {
            date:  parseGvizDate(cell(idx.date)),
            venue: String(cell(idx.venue)),
            city:  String(cell(idx.city)),
            link:  String(cell(idx.link)),
            notes: String(cell(idx.notes)),
          };
        }).filter(r => r.date && r.venue);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = rows.filter(r => r.date >= today).sort((a, b) => a.date - b.date);
        const past = rows.filter(r => r.date < today).sort((a, b) => b.date - a.date);

        if (upcoming.length === 0) {
          showEmptyState();
        } else {
          upcomingList.innerHTML = upcoming.map(r => {
            const linkOk = /^https?:\/\//i.test(r.link);
            return `
              <div class="member-card reveal flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p class="font-heading text-ink text-lg">${formatDate(r.date)}</p>
                  <p class="text-stone text-sm">${escapeHtml(r.venue)}${r.city ? ' &middot; ' + escapeHtml(r.city) : ''}</p>
                  ${r.notes ? `<p class="text-fern text-xs uppercase tracking-[1px] mt-1">${escapeHtml(r.notes)}</p>` : ''}
                </div>
                ${linkOk ? `<a href="${escapeHtml(r.link)}" target="_blank" rel="noopener" class="btn-primary shrink-0">Tickets</a>` : ''}
              </div>`;
          }).join('');
        }

        if (past.length > 0) {
          pastWrap.classList.remove('hidden');
          pastList.innerHTML = past.map(r => `
            <p class="track-row reveal text-stone text-sm">${formatDate(r.date)} &middot; ${escapeHtml(r.venue)}${r.city ? ', ' + escapeHtml(r.city) : ''}</p>
          `).join('');
        }

        if (!noMotion) {
          gsap.set('#shows .reveal', { opacity: 0, y: 14 });
          ScrollTrigger.batch('#shows .reveal', {
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
  </script>
```

- [ ] **Step 5: Serve the site locally and verify in the browser**

Run: `cd /Users/christopherbeem/weeds-website && python3 -m http.server 8931` (skip if already running), then load `http://localhost:8931/index.html` in the browser and scroll to (or click nav link) "Shows".

Expected:
- Nav (desktop and mobile) shows Music / About / Shows / Contact, and clicking "Shows" scrolls to the new section
- "Upcoming" shows one card: "Sep 12, 2026", "Example Venue · Example City, CA", "EXAMPLE ROW — edit or delete", and a "Tickets" button linking to `https://example.com/tickets`
- "Previous Engagements" shows one line: "Apr 1, 2026 · Example Past Venue, Example City, CA"
- No console errors (check via browser dev tools or `read_console_messages`)

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add Shows section backed by Google Sheets gig list"
```
