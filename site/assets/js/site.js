import { parseGvizResponse, partitionShows, nextShow, hasTicketLink } from './shows.js';

// Both CDN scripts load before this module, but a blocked/failed CDN request
// must not take nav, shows, video, and the mailing-list form down with it —
// .reveal has no default opacity:0, so skipping animation just skips animation.
const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
if (hasGsap) gsap.registerPlugin(ScrollTrigger);
const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Footer copyright year, so it doesn't go stale every January.
const copyrightYear = document.getElementById('copyright-year');
if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

// Nav: swap to opaque on scroll
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// Hero entrance
if (!noMotion && hasGsap) {
  gsap.set(['.hero-eyebrow', '.hero-title', '.hero-ctas'], { opacity: 0, y: 18 });
  gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 })
    .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.5 }, 0)
    .to('.hero-title',   { opacity: 1, y: 0, duration: 0.5 }, 0.15)
    .to('.hero-ctas',    { opacity: 1, y: 0, duration: 0.5 },  0.4);
}

// Scroll reveals
if (!noMotion && hasGsap) {
  gsap.set('.reveal', { opacity: 0, y: 14 });
  ScrollTrigger.batch('.reveal', {
    start: 'top 90%',
    onEnter:     batch => gsap.to(batch, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power2.out' }),
    onLeaveBack: batch => gsap.to(batch, { opacity: 0, y: 8, duration: 0.25 }),
  });
}

// Mobile menu
const menuToggle  = document.getElementById('menu-toggle');
const mobileMenu  = document.getElementById('mobile-menu');
const menuClose   = document.getElementById('menu-close');

function openMenu() {
  mobileMenu.classList.add('open');
  mobileMenu.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-label', 'Close menu');
  menuToggle.setAttribute('aria-expanded', 'true');
  menuClose.focus();
}
function closeMenu() {
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  menuToggle.setAttribute('aria-label', 'Open menu');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.focus();
}

menuToggle.addEventListener('click', openMenu);
menuClose.addEventListener('click', closeMenu);
document.querySelectorAll('.mobile-nav-link').forEach(l => l.addEventListener('click', closeMenu));
mobileMenu.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeMenu(); return; }
  if (e.key !== 'Tab') return;
  const focusables = mobileMenu.querySelectorAll('a, button');
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

// Shows: fetch gig list from Google Sheets and render Upcoming / Previous Engagements
const SHEET_ID = '16qA-eK6T4PcSlP8tMrWN3BqQO4AXeQktJm9S2ReyTlc';

// Declared above loadShows()'s call site on purpose. `const` is not hoisted, so
// while these lived below it the code only worked because `await fetch` yielded
// and let module evaluation finish before anything dereferenced them. Removing
// the await, or hoisting the render, would have thrown a TDZ ReferenceError that
// loadShows()'s own catch would swallow into the empty state — presenting as
// "shows silently stopped working" with the cause hidden.
const SHOWS_FORMAT = { month: 'short', day: 'numeric', year: 'numeric' };
const formatShowDate = d => d.toLocaleDateString('en-US', SHOWS_FORMAT);

/** target=_blank makes sense for a ticket page but just leaves a stray blank tab behind a mail client. */
const ticketLinkAttrs = link => /^mailto:/i.test(link) ? '' : 'target="_blank" rel="noopener"';

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
        ? `<a href="${escapeHtml(r.link)}" ${ticketLinkAttrs(r.link)} class="btn-primary shrink-0">Tickets</a>`
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
    // Without this, a 401 (sheet un-shared) or 404 yields non-JSON,
    // parseGvizResponse returns [], and the page shows "No shows currently
    // scheduled" — indistinguishable from an empty sheet, with nothing logged.
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

    if (!noMotion && hasGsap) {
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

/** Escape sheet-supplied text before it reaches innerHTML. */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

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
        ? `<a href="${escapeHtml(show.link)}" ${ticketLinkAttrs(show.link)} class="btn-primary">Tickets</a>`
        : ''}
    </div>`;
}

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
    iframe.title = 'The Weeds perform Castle Kelly';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    facade.replaceChildren(iframe);
    iframe.focus();
  }, { once: true });
});

/**
 * The mailing list writes straight to the weed-gigs Sheet via an Apps Script
 * web app (doPost appends a row to the "Mailing List" tab). Submitting via
 * fetch keeps the visitor on the page instead of bouncing to Google's own
 * response page. The endpoint URL lives on the form's `action` (also the
 * no-JS fallback target) so it's defined in exactly one place.
 */
const mlForm   = document.getElementById('mailing-list-form');
const mlStatus = document.getElementById('mailing-list-status');

// Guarded on mlStatus too: every mlStatus use below is an assignment target, and
// `mlStatus?.style.color = …` is a SyntaxError, so the null-safety has to live
// here rather than at each deref. Neither element is optional today.
if (mlStatus) mlForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const submit = mlForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  mlStatus.style.color = 'rgba(242,239,232,0.62)';
  mlStatus.textContent = 'Signing up…';

  try {
    const res = await fetch(mlForm.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(mlForm)).toString(),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);

    mlForm.hidden = true;
    mlStatus.style.color = '#FFCA57';
    mlStatus.textContent = 'Thanks — you’re on the list.';
  } catch (err) {
    submit.disabled = false;
    mlStatus.style.color = '#E37B42';
    mlStatus.textContent = err.message === 'invalid email'
      ? 'That doesn’t look like a valid email address — mind double-checking it?'
      : 'Something went wrong. Please email realjweed@hotmail.com instead.';
    console.error('Mailing list signup failed:', err);
  }
});
