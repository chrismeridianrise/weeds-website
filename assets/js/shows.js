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
