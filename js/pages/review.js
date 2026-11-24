import { PROGRAMMES } from '../lib/catalogue.js';
import { $, h, mount } from '../lib/dom.js';
import { formatTime } from '../lib/format.js';
import { icon } from '../lib/icons.js';
import { carryoversFor, optionsFor, statusOf, totalUnits } from '../lib/rules.js';
import { getParam, initPage } from '../lib/shell.js';
import * as store from '../lib/store.js';
import { avatar, button, confirmDialog, formDialog, showEmpty, toast } from '../lib/ui.js';
import { badgeFor, coursesTable, history, nameOf, notice } from '../lib/views.js';

const user = await initPage({ active: 'registrations', kind: 'staff' });
const matric = getParam('matric');
const content = $('#content');

mount($('#back'), h('a', { class: 'back-link', href: 'registrations.html' }, icon('back', { size: 16 }), 'Registrations'));

const student = store.student(matric);
if (!student || !user.levels.includes(student.level)) {
  $('#page-title').textContent = 'Student not found';
  showEmpty(content, { iconName: 'alert', title: 'This student is not on your list', text: 'You can only review students on the levels you advise.', action: button('Back to registrations', { href: 'registrations.html' }) });
} else {
  render();
}

// Checks the adviser would do by hand, done for them. Each line says
// what was checked and whether it passed.
function checks(registration) {
  const codes = new Set(registration.courses);
  const term = store.term();
  const carry = carryoversFor(student);
  const required = optionsFor(student, term.semester).required;
  const units = totalUnits(registration.courses);
  const missingCarry = carry.filter((course) => !codes.has(course.code));
  const missingRequired = required.filter((course) => !codes.has(course.code));
  const list = [
    carry.length
      ? { ok: !missingCarry.length, text: missingCarry.length ? `Missing carryover ${missingCarry.map((c) => c.code).join(', ')}` : `Carryovers registered (${carry.map((c) => c.code).join(', ')})` }
      : { ok: true, text: 'No carryover courses' },
    { ok: !missingRequired.length, text: missingRequired.length ? `Missing compulsory ${missingRequired.map((c) => c.code).join(', ')}` : `All ${required.length} compulsory courses registered` },
    { ok: units >= term.minUnits && units <= term.maxUnits, text: `${units} units, limit ${term.minUnits} to ${term.maxUnits}` },
  ];
  return h(
    'ul',
    { class: 'checks' },
    list.map((item) => h('li', { class: item.ok ? 'checks__item checks__item--ok' : 'checks__item checks__item--bad' }, icon(item.ok ? 'check' : 'alert', { size: 18 }), h('span', {}, item.text, h('span', { class: 'visually-hidden' }, item.ok ? ' (passed)' : ' (problem)')))),
  );
}

function render() {
  const registration = store.registration(matric);
  const status = statusOf(registration);
  $('#page-title').textContent = student.name;
  $('#page-meta').textContent = `${student.matric}. ${student.level}, ${PROGRAMMES[student.level]}. ${student.mode}.`;
  document.title = `${student.name} | Review registration`;

  const actions = [];
  if (status === 'submitted') {
    actions.push(button('Return to student', { icon: 'undo', variant: 'secondary', onclick: sendBack }), button('Approve', { icon: 'check', onclick: approve }));
  } else if (status === 'approved') {
    actions.push(button('Undo approval', { icon: 'undo', variant: 'secondary', onclick: sendBack }), button('Course form', { icon: 'printer', href: `form.html?matric=${encodeURIComponent(matric)}` }));
  }
  mount($('#page-actions'), badgeFor(registration), ...actions);

  if (!registration) {
    showEmpty(content, { iconName: 'clock', title: 'Not started', text: `${student.name} has not started registering for this semester.` });
    return;
  }

  const banner = {
    draft: notice('info', 'Draft, not submitted', `${student.name} saved a draft ${formatTime(registration.updatedAt)} but has not submitted it. You can approve it once it is submitted.`),
    returned: notice('bad', `Returned by ${nameOf(registration.reviewerId)}`, h('blockquote', { class: 'quote' }, registration.note)),
    approved: notice('ok', `Approved by ${nameOf(registration.reviewerId)}`, `${formatTime(registration.reviewedAt)}. The student can print the form.`),
    submitted: null,
  }[status];

  mount(
    content,
    banner,
    h(
      'div',
      { class: 'review-grid' },
      h(
        'section',
        { class: 'panel', 'aria-labelledby': 'courses-title' },
        h('div', { class: 'panel__head' }, h('h2', { id: 'courses-title' }, 'Courses'), registration.ref ? h('span', { class: 'muted mono' }, registration.ref) : null),
        coursesTable(student, registration.courses),
      ),
      h(
        'div',
        { class: 'stack' },
        h(
          'section',
          { class: 'panel', 'aria-labelledby': 'checks-title' },
          h('div', { class: 'panel__head' }, h('h2', { id: 'checks-title' }, 'Checks')),
          h('div', { class: 'panel__body' }, checks(registration)),
        ),
        h(
          'section',
          { class: 'panel', 'aria-labelledby': 'student-title' },
          h('div', { class: 'panel__head' }, h('h2', { id: 'student-title' }, 'Student')),
          h(
            'div',
            { class: 'panel__body profile' },
            avatar(student.name),
            h('dl', { class: 'detail-list' }, h('dt', {}, 'Matric'), h('dd', { class: 'mono' }, student.matric), h('dt', {}, 'Level'), h('dd', {}, student.level), h('dt', {}, 'Mode'), h('dd', {}, student.mode)),
          ),
        ),
        h(
          'section',
          { class: 'panel', 'aria-labelledby': 'history-title' },
          h('div', { class: 'panel__head' }, h('h2', { id: 'history-title' }, 'History')),
          h('div', { class: 'panel__body' }, history(registration, student)),
        ),
      ),
    ),
  );
}

async function approve() {
  const registration = store.registration(matric);
  const ok = await confirmDialog({
    title: `Approve ${student.name}'s registration?`,
    text: `${registration.courses.length} courses, ${totalUnits(registration.courses)} units. The student can then print the course form.`,
    confirmLabel: 'Approve',
  });
  if (!ok) return;
  try {
    store.approve(matric, user.id);
    toast(`Approved. ${student.name} can print the form now.`);
    render();
    $('#page-actions .btn')?.focus();
  } catch (error) {
    toast(error.message, { error: true });
  }
}

async function sendBack() {
  const approved = statusOf(store.registration(matric)) === 'approved';
  const saved = await formDialog({
    title: approved ? 'Undo approval and return' : 'Return to student',
    intro: `${student.name} will see your note and can change the courses, then submit again.`,
    fields: [{ name: 'note', label: 'What needs to change', type: 'textarea', rows: 4, help: 'Be specific. The student sees exactly what you write.' }],
    submitLabel: 'Return to student',
    busyLabel: 'Returning',
    onSubmit: async ({ note }) => {
      try {
        store.returnToStudent(matric, user.id, note);
      } catch (error) {
        error.fields = { note: error.message };
        throw error;
      }
    },
  });
  if (saved) {
    toast(`Returned to ${student.name}.`);
    render();
  }
}
