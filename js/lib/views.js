// Pieces shared by the student and staff pages.
import { STAFF, TYPE_LABELS } from './catalogue.js';
import { h } from './dom.js';
import { formatTime } from './format.js';
import { icon } from './icons.js';
import { STATUS, coursesInRegistration, statusOf, totalUnits } from './rules.js';
import { buildTable, courseCell, statusBadge } from './ui.js';

export function stat(iconName, value, label, tone = '') {
  return h(
    'div',
    { class: tone ? `stat stat--${tone}` : 'stat' },
    h('span', { class: 'stat__icon' }, icon(iconName)),
    h('div', {}, h('div', { class: 'stat__value' }, value), h('div', { class: 'stat__label' }, label)),
  );
}

export function badgeFor(registration) {
  const status = statusOf(registration);
  return statusBadge(status, STATUS[status].label);
}

export function typeTag(type) {
  return h('span', { class: `type-tag type-tag--${type}` }, TYPE_LABELS[type]);
}

// The four stages a registration goes through, with the current one marked.
export function stepper(registration) {
  const status = statusOf(registration);
  const reached = { none: 0, draft: 1, returned: 1, submitted: 2, approved: 4 }[status];
  const steps = ['Choose your courses', 'Submit to your adviser', 'Adviser approves', 'Print your course form'];
  return h(
    'ol',
    { class: 'steps' },
    steps.map((label, index) => {
      const state = index < reached ? 'done' : index === reached ? 'current' : 'todo';
      const returned = status === 'returned' && index === 1;
      return h(
        'li',
        { class: `steps__item steps__item--${returned ? 'returned' : state}`, 'aria-current': state === 'current' ? 'step' : null },
        h('span', { class: 'steps__mark', 'aria-hidden': 'true' }, state === 'done' ? icon('check', { size: 16 }) : String(index + 1)),
        h('span', { class: 'steps__label' }, label, h('span', { class: 'visually-hidden' }, state === 'done' ? ' (done)' : state === 'current' ? ' (now)' : '')),
      );
    }),
  );
}

// Table of the courses in a registration with the unit total in the footer.
export function coursesTable(student, codes, caption = 'Registered courses') {
  const courses = coursesInRegistration(student, codes);
  const table = buildTable({
    caption,
    columns: [
      { label: 'Course', primary: true, cell: (course) => courseCell(course) },
      { label: 'Type', cell: (course) => typeTag(course.type) },
      { label: 'Level', cell: (course) => course.level },
      { label: 'Units', numeric: true, cell: (course) => String(course.units) },
    ],
    rows: courses,
    rowClass: (course) => (course.type === 'carryover' ? 'row--carry' : null),
  });
  table.querySelector('table').append(
    h('tfoot', {}, h('tr', {}, h('th', { scope: 'row', colspan: 3 }, `Total, ${courses.length} courses`), h('td', { class: 'is-num' }, String(totalUnits(codes))))),
  );
  return table;
}

const ACTIONS = { saved: 'Saved as a draft', submitted: 'Submitted for approval', approved: 'Approved', returned: 'Returned for changes' };

export function nameOf(by, student) {
  const member = STAFF.find((item) => item.id === by);
  if (member) return member.name;
  return student && student.matric === by ? student.name : by;
}

// Timeline of what happened to a registration, newest first. Repeated
// draft saves are folded into the latest one.
export function history(registration, student) {
  const entries = [];
  for (const entry of registration.history || []) {
    const last = entries[entries.length - 1];
    if (entry.action === 'saved' && last?.action === 'saved') entries[entries.length - 1] = entry;
    else entries.push(entry);
  }
  return h(
    'ol',
    { class: 'timeline' },
    entries.reverse().map((entry) =>
      h(
        'li',
        { class: `timeline__item timeline__item--${entry.action}` },
        h('span', { class: 'timeline__what' }, ACTIONS[entry.action] || entry.action),
        h('span', { class: 'timeline__meta' }, `${nameOf(entry.by, student)}, ${formatTime(entry.at)}`),
        entry.note ? h('blockquote', { class: 'timeline__note' }, entry.note) : null,
      ),
    ),
  );
}

// Coloured notice box. tone: info, warn, bad, ok.
export function notice(tone, title, body, iconName = { info: 'info', warn: 'clock', bad: 'alert', ok: 'check' }[tone]) {
  return h(
    'div',
    { class: `notice notice--${tone}`, role: tone === 'bad' ? 'alert' : null },
    h('span', { class: 'notice__icon' }, icon(iconName)),
    h('div', {}, title ? h('p', { class: 'notice__title' }, title) : null, body ? h('div', { class: 'notice__body' }, body) : null),
  );
}
