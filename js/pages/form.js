// The printable course registration form, laid out like the paper form
// a student takes to the department. Students see their own; staff open
// any student's with ?matric=.
import { PROGRAMMES, SCHOOL, STAFF } from '../lib/catalogue.js';
import { $, h, mount } from '../lib/dom.js';
import { formatDay, formatTime } from '../lib/format.js';
import { coursesInRegistration, statusOf, totalUnits } from '../lib/rules.js';
import { getParam, initPage } from '../lib/shell.js';
import * as store from '../lib/store.js';
import { avatar, button, showEmpty } from '../lib/ui.js';
import { badgeFor, typeTag } from '../lib/views.js';

const user = await initPage({ active: store.currentUser()?.kind === 'staff' ? 'registrations' : 'form' });

const isStaff = user.kind === 'staff';
const matric = isStaff ? getParam('matric') : user.matric;
const student = store.student(matric);
const content = $('#content');

if (isStaff) {
  mount($('#back'), h('a', { class: 'back-link', href: `review.html?matric=${encodeURIComponent(matric)}` }, 'Back to the review'));
}

if (!student || (isStaff && !user.levels.includes(student.level))) {
  showEmpty(content, { iconName: 'alert', title: 'Student not found', text: 'Check the link, or open the student from Registrations.', action: button('Registrations', { href: 'registrations.html' }) });
} else {
  render();
}

function render() {
  const term = store.term();
  const registration = store.registration(matric);
  const status = statusOf(registration);
  $('#page-meta').textContent = `${student.name}, ${student.matric}`;

  if (!registration) {
    showEmpty(content, {
      iconName: 'file',
      title: 'No course form yet',
      text: isStaff ? 'This student has not started registration.' : 'Your form appears here once you start registering courses.',
      action: isStaff ? null : button('Start registration', { icon: 'listChecks', href: 'register.html' }),
    });
    return;
  }

  mount($('#page-actions'), badgeFor(registration), button('Print', { icon: 'printer', variant: status === 'approved' ? 'primary' : 'secondary', onclick: () => window.print() }));

  const courses = coursesInRegistration(student, registration.courses);
  const reviewer = STAFF.find((member) => member.id === registration.reviewerId);
  const hod = STAFF.find((member) => member.role === 'hod');
  const approved = status === 'approved';

  const field = (label, value, wide = false) => h('div', { class: wide ? 'doc-field doc-field--wide' : 'doc-field' }, h('span', { class: 'doc-field__label' }, label), h('span', { class: 'doc-field__value' }, value || ''));

  const sheet = h(
    'article',
    { class: approved ? 'doc' : 'doc doc--unapproved', 'aria-label': 'Course registration form' },
    h(
      'header',
      { class: 'doc__head' },
      h('img', { class: 'doc__crest', src: 'img/crest-256.png', alt: '', width: 84, height: 84 }),
      h(
        'div',
        { class: 'doc__school' },
        h('p', { class: 'doc__name', translate: 'no' }, SCHOOL.name),
        h('p', { class: 'doc__address' }, SCHOOL.address),
        h('p', { class: 'doc__dept' }, `${SCHOOL.faculty}, ${SCHOOL.department}`),
      ),
      h('div', { class: 'doc__photo', 'aria-hidden': 'true' }, avatar(student.name), h('span', {}, 'Passport')),
    ),
    h('h2', { class: 'doc__title' }, 'Student course registration form'),
    h('p', { class: 'doc__session' }, `${term.session} session, first semester`),
    h(
      'div',
      { class: 'doc__fields' },
      field('Name', student.name, true),
      field('Matric number', student.matric),
      field('Programme', PROGRAMMES[student.level], true),
      field('Level', student.level),
      field('Mode of study', student.mode),
      field('Form reference', registration.ref || 'Given on submission', true),
    ),
    h(
      'table',
      { class: 'doc__table' },
      h('caption', { class: 'visually-hidden' }, 'Courses registered'),
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'S/N'), h('th', { scope: 'col' }, 'Code'), h('th', { scope: 'col' }, 'Course title'), h('th', { scope: 'col', class: 'doc__type' }, 'Type'), h('th', { scope: 'col', class: 'is-num' }, 'Units'))),
      h(
        'tbody',
        {},
        courses.map((course, index) =>
          h('tr', {}, h('td', { class: 'num' }, String(index + 1)), h('td', { class: 'nowrap' }, course.code), h('td', {}, course.title), h('td', { class: 'doc__type' }, typeTag(course.type)), h('td', { class: 'is-num' }, String(course.units))),
        ),
      ),
      h('tfoot', {}, h('tr', {}, h('th', { scope: 'row', colspan: 3 }, 'Total credit units'), h('td', { class: 'doc__type' }), h('td', { class: 'is-num' }, String(totalUnits(registration.courses))))),
    ),
    approved
      ? h('div', { class: 'doc__stamp', 'aria-label': 'Approved' }, h('span', { class: 'doc__stamp-word' }, 'Approved'), h('span', {}, SCHOOL.department), h('span', { class: 'num' }, formatDay(registration.reviewedAt)))
      : h('p', { class: 'doc__void' }, 'Not approved yet. This copy is not valid for submission.'),
    h(
      'div',
      { class: 'doc__signs' },
      sign('Student', student.name, registration.submittedAt ? `Submitted ${formatDay(registration.submittedAt)}` : 'Not submitted'),
      sign('Course adviser', reviewer && approved ? reviewer.name : '', approved ? `Approved ${formatDay(registration.reviewedAt)}` : ''),
      sign('Head of Department', hod.name, ''),
    ),
    h('footer', { class: 'doc__foot' }, h('span', {}, `Printed ${formatTime(new Date().toISOString())}`), h('span', {}, SCHOOL.projectNote)),
  );

  mount(content, sheet);
}

function sign(role, name, note) {
  return h('div', { class: 'doc-sign' }, h('span', { class: 'doc-sign__line' }), h('span', { class: 'doc-sign__role' }, role), h('span', { class: 'doc-sign__name' }, name || ' '), h('span', { class: 'doc-sign__note' }, note || ' '));
}
