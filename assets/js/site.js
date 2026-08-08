import { parseGvizResponse, partitionShows, nextShow, hasTicketLink } from './shows.js';

gsap.registerPlugin(ScrollTrigger);
const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Nav: swap to opaque on scroll
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// Hero entrance
if (!noMotion) {
  gsap.set(['.hero-eyebrow', '.hero-title', '.hero-sub', '.hero-ctas'], { opacity: 0, y: 18 });
  gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 })
    .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.5 }, 0)
    .to('.hero-title',   { opacity: 1, y: 0, duration: 0.5 }, 0.15)
    .to('.hero-sub',     { opacity: 1, y: 0, duration: 0.55 }, 0.25)
    .to('.hero-ctas',    { opacity: 1, y: 0, duration: 0.5 },  0.45);
}

// Scroll reveals
if (!noMotion) {
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
mobileMenu.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

// Shows: fetch gig list from Google Sheets and render Upcoming / Previous Engagements
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
