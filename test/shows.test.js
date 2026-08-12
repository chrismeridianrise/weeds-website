import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGvizDate,
  parseGvizResponse,
  partitionShows,
  nextShow,
  hasTicketLink,
} from '../site/assets/js/shows.js';

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

test('hasTicketLink accepts http, https, and mailto only', () => {
  assert.equal(hasTicketLink({ link: 'https://tickets.example/x' }), true);
  assert.equal(hasTicketLink({ link: 'http://tickets.example/x' }), true);
  assert.equal(hasTicketLink({ link: 'mailto:reserve@example.com' }), true);
  assert.equal(hasTicketLink({ link: 'javascript:alert(1)' }), false);
  assert.equal(hasTicketLink({ link: 'tickets.example/x' }), false);
  assert.equal(hasTicketLink({ link: 'https:foo' }), false);
  assert.equal(hasTicketLink({ link: 'http:javascript:alert(1)' }), false);
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
