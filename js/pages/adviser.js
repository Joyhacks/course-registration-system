import { $, h, mount } from '../lib/dom.js';
import { daysBetween, formatDay, formatTime, greeting, plural } from '../lib/format.js';
import { totalUnits } from '../lib/rules.js';
import { initPage } from '../lib/shell.js';
import * as store from '../lib/store.js';
import { button, person, progressBar } from '../lib/ui.js';
import { stat } from '../lib/views.js';

const user = await initPage({ active: 'overview', kind: 'staff' });
const term = store.term();
const today = store.today();
const rows = store.roster(user.levels);
const statusCount = (status) => rows.filter((row) => (row.registration?.status || 'none') === status).length;

const waiting = rows
  .filter((row) => row.registration?.status === 'submitted')
  .sort((a, b) => a.registration.submittedAt.localeCompare(b.registration.submittedAt));
const notIn = rows.filter((row) => ['none', 'draft', 'returned'].includes(row.registration?.status || 'none')).length;

const surname = user.name.split(' ').slice(-1)[0];
const honorific = user.name.split(' ')[0];
$('#page-title').textContent = `${greeting()}, ${honorific} ${surname}`;
const daysLeft = daysBetween(today, term.closes);
$('#page-meta').textContent = `${user.title}. ${term.session} first semester registration closes ${formatDay(term.closes)}, in ${plural(daysLeft, 'day')}.`;

mount($('#page-actions'), button(waiting.length ? `Review ${plural(waiting.length, 'registration')}` : 'All registrations', { icon: 'inbox', href: waiting.length ? 'registrations.html?status=submitted' : 'registrations.html' }));

const levelRows = user.levels.map((level) => {
  const inLevel = rows.filter((row) => row.student.level === level);
  const approved = inLevel.filter((row) => row.registration?.status === 'approved').length;
  const submitted = inLevel.filter((row) => row.registration?.status === 'submitted').length;
  return h(
    'li',
    { class: 'level-row' },
    h('div', { class: 'level-row__head' }, h('a', { href: `registrations.html?level=${encodeURIComponent(level)}` }, level), h('span', { class: 'muted' }, `${submitted} waiting`)),
    progressBar(approved, inLevel.length, `${level} approved`),
  );
});

mount(
  $('#content'),
  h(
    'div',
    { class: 'stats' },
    stat('staff', String(rows.length), user.levels.length > 2 ? 'Students in the department' : `Students in ${user.levels.join(' and ')}`),
    stat('clock', String(waiting.length), 'Waiting for approval', waiting.length ? 'warn' : ''),
    stat('check', String(statusCount('approved')), 'Approved'),
    stat('alert', String(notIn), 'Not submitted yet', notIn ? 'alert' : ''),
  ),
  h(
    'div',
    { class: 'dash-grid' },
    h(
      'section',
      { class: 'panel', 'aria-labelledby': 'waiting-title' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'waiting-title' }, 'Waiting for approval'), h('span', { class: 'muted' }, 'Oldest first')),
      waiting.length
        ? h(
            'ul',
            { class: 'people' },
            waiting.slice(0, 7).map(({ student, registration }) =>
              h(
                'li',
                {},
                h(
                  'a',
                  { class: 'people__link', href: `review.html?matric=${encodeURIComponent(student.matric)}` },
                  person(student.name, `${student.matric}, ${student.level}`),
                  h('span', { class: 'people__value' }, h('span', { class: 'num' }, `${totalUnits(registration.courses)} units`), h('span', { class: 'muted' }, formatTime(registration.submittedAt))),
                ),
              ),
            ),
          )
        : h('div', { class: 'panel__body' }, h('p', { class: 'muted' }, 'Nothing waiting. New submissions appear here.')),
      waiting.length > 7 ? h('div', { class: 'panel__foot' }, h('a', { href: 'registrations.html?status=submitted' }, `See all ${waiting.length}`)) : null,
    ),
    h(
      'section',
      { class: 'panel', 'aria-labelledby': 'levels-title' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'levels-title' }, 'Approved by level')),
      h('ul', { class: 'level-list panel__body' }, levelRows),
      h('div', { class: 'panel__foot' }, h('p', { class: 'muted' }, `Unit limit this semester: ${term.minUnits} to ${term.maxUnits}. Registration opened ${formatDay(term.opens)}.`)),
    ),
  ),
);
