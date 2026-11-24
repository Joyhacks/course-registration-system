import { PROGRAMMES, STAFF } from '../lib/catalogue.js';
import { $, h, mount } from '../lib/dom.js';
import { daysBetween, firstName, formatDay, formatTime, greeting, plural } from '../lib/format.js';
import { canEdit, statusOf, totalUnits, windowState } from '../lib/rules.js';
import { getParam, initPage, setParams } from '../lib/shell.js';
import * as store from '../lib/store.js';
import { button, toast } from '../lib/ui.js';
import { badgeFor, coursesTable, nameOf, notice, stat, stepper } from '../lib/views.js';

const user = await initPage({ active: 'overview', kind: 'student' });
const term = store.term();
const today = store.today();
const registration = store.registration(user.matric);
const status = statusOf(registration);
const adviser = STAFF.find((member) => member.role === 'adviser' && member.levels.includes(user.level));
const open = windowState(term, today) === 'open';
const daysLeft = daysBetween(today, term.closes);

$('#page-title').textContent = `${greeting()}, ${firstName(user.name)}`;
$('#page-meta').textContent = `${user.level}, ${PROGRAMMES[user.level]}. ${term.session} session, first semester.`;

const primary = canEdit(registration) && open
  ? button(status === 'none' ? 'Start registration' : 'Continue registration', { icon: 'listChecks', href: 'register.html' })
  : button(status === 'approved' ? 'Print course form' : 'View course form', { icon: status === 'approved' ? 'printer' : 'file', href: 'form.html' });
mount($('#page-actions'), primary);

const codes = registration?.courses || [];

// What the student should know first, depending on where they are.
const NEXT = {
  none: () => (open ? notice('info', 'You have not registered yet', `Registration closes on ${formatDay(term.closes)}. Your carryover and compulsory courses are already filled in for you.`) : null),
  draft: () => notice('warn', 'Your registration is saved but not submitted', `Your adviser cannot see it until you submit it. Submit before ${formatDay(term.closes)}.`),
  submitted: () => notice('info', 'Waiting for your course adviser', `Submitted ${formatTime(registration?.submittedAt)}. ${adviser.name} will check it. You will be able to print your form once it is approved.`, 'clock'),
  returned: () => notice('bad', `${nameOf(registration?.reviewerId)} returned your registration`, h('div', {}, h('blockquote', { class: 'quote' }, registration?.note), h('p', {}, 'Make the change, then submit again.'))),
  approved: () => notice('ok', 'Your registration is approved', `Approved by ${nameOf(registration?.reviewerId)} on ${formatDay(registration?.reviewedAt)}. Print two copies of your course form: one for you and one for the department.`),
}[status]();

mount(
  $('#content'),
  h(
    'section',
    { class: 'panel panel--pad journey', 'aria-labelledby': 'journey-title' },
    h('div', { class: 'journey__head' }, h('h2', { id: 'journey-title' }, `Registration for ${term.session}, first semester`), badgeFor(registration)),
    stepper(registration),
    NEXT,
  ),
  h(
    'div',
    { class: 'stats section' },
    stat('layers', `${totalUnits(codes)} / ${term.maxUnits}`, 'Units registered'),
    stat('courses', String(codes.length), 'Courses'),
    stat('alert', String(user.carryovers.length), user.carryovers.length === 1 ? 'Carryover course' : 'Carryover courses', user.carryovers.length ? 'warn' : ''),
    stat('calendar', open ? plural(daysLeft, 'day') : 'Closed', open ? 'Until registration closes' : `Closed ${formatDay(term.closes)}`, open && daysLeft <= 7 ? 'warn' : ''),
  ),
  h(
    'div',
    { class: 'dash-grid' },
    h(
      'section',
      { class: 'panel', 'aria-labelledby': 'courses-title' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'courses-title' }, 'Your courses this semester'), codes.length ? h('span', { class: 'muted' }, `Last change ${formatTime(registration.updatedAt)}`) : null),
      codes.length
        ? coursesTable(user, codes)
        : h('div', { class: 'panel__body' }, h('p', { class: 'muted' }, 'No courses yet. Start your registration to choose them.')),
    ),
    h(
      'section',
      { class: 'panel', 'aria-labelledby': 'window-title' },
      h('div', { class: 'panel__head' }, h('h2', { id: 'window-title' }, 'This semester')),
      h(
        'dl',
        { class: 'detail-list panel__body' },
        h('dt', {}, 'Opened'), h('dd', {}, formatDay(term.opens)),
        h('dt', {}, 'Closes'), h('dd', {}, formatDay(term.closes)),
        h('dt', {}, 'Unit limit'), h('dd', {}, `${term.minUnits} to ${term.maxUnits} units`),
        h('dt', {}, 'Course adviser'), h('dd', {}, adviser.name, h('br'), h('a', { href: `mailto:${adviser.email}` }, 'Send an email')),
        h('dt', {}, 'Mode'), h('dd', {}, user.mode),
      ),
      h(
        'div',
        { class: 'panel__foot' },
        h('h3', {}, 'Department notices'),
        h(
          'ul',
          { class: 'notices' },
          h('li', {}, 'Carryover courses must be registered before new courses, and they count towards your unit limit.'),
          h('li', {}, `After ${formatDay(term.closes)}, only the Head of Department can reopen registration for you.`),
          h('li', {}, 'Bring a printed copy of your approved form to your first lecture of each course.'),
        ),
      ),
    ),
  ),
);

if (getParam('submitted')) {
  toast('Submitted to your course adviser.');
  setParams({ submitted: '' });
}
