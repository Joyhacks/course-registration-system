import { PROGRAMMES } from '../lib/catalogue.js';
import { $, h, mount } from '../lib/dom.js';
import { formatDay, formatTime, plural } from '../lib/format.js';
import { icon } from '../lib/icons.js';
import { canEdit, checkSelection, optionsFor, statusOf, totalUnits, windowState } from '../lib/rules.js';
import { initPage } from '../lib/shell.js';
import * as store from '../lib/store.js';
import { button, confirmDialog, showEmpty, toast, withBusy } from '../lib/ui.js';
import { badgeFor, nameOf, notice, typeTag } from '../lib/views.js';

const user = await initPage({ active: 'register', kind: 'student' });
const term = store.term();
const registration = store.registration(user.matric);
const status = statusOf(registration);
const content = $('#content');

$('#page-meta').textContent = `${user.name}, ${user.matric}. ${user.level}, ${PROGRAMMES[user.level]}.`;

if (!canEdit(registration)) {
  mount($('#page-actions'), badgeFor(registration));
  showEmpty(content, {
    iconName: status === 'approved' ? 'check' : 'clock',
    title: status === 'approved' ? 'Your registration is approved' : 'Your registration is with your adviser',
    text: status === 'approved'
      ? 'It can no longer be changed here. If you need to add or drop a course, see your course adviser.'
      : `You submitted it ${formatTime(registration.submittedAt)}. If your adviser returns it, you can change it here.`,
    action: button(status === 'approved' ? 'Print course form' : 'View course form', { icon: 'file', href: 'form.html' }),
  });
} else if (windowState(term, store.today()) !== 'open') {
  showEmpty(content, {
    iconName: 'lock',
    title: 'Registration is closed',
    text: `Registration for this semester ran from ${formatDay(term.opens)} to ${formatDay(term.closes)}. See the Head of Department to have it reopened.`,
  });
} else {
  renderForm();
}

function renderForm() {
  const { carryovers, required, electives } = optionsFor(user, term.semester);
  const lockedCodes = [...carryovers, ...required].map((course) => course.code);
  const chosen = new Set(registration ? registration.courses : lockedCodes);
  lockedCodes.forEach((code) => chosen.add(code));
  let dirty = !registration;

  const electiveBoxes = new Map();

  function row(course, locked) {
    const id = `course-${course.code.replace(/\s/g, '')}`;
    const box = h('input', { type: 'checkbox', id, name: 'course', value: course.code, checked: chosen.has(course.code), disabled: locked, 'aria-describedby': locked ? `${id}-why` : `${id}-limit` });
    if (!locked) {
      box.addEventListener('change', () => {
        if (box.checked) chosen.add(course.code);
        else chosen.delete(course.code);
        dirty = true;
        update();
      });
      electiveBoxes.set(course.code, box);
    }
    return h(
      'li',
      { class: locked ? 'pick pick--locked' : 'pick' },
      h(
        'label',
        { class: 'pick__label', for: id },
        box,
        h('span', { class: 'pick__course' }, h('span', { class: 'code-chip' }, course.code), h('span', { class: 'pick__title' }, course.title)),
        h('span', { class: 'pick__meta' }, typeTag(course.type), h('span', { class: 'pick__units' }, plural(course.units, 'unit'))),
      ),
      locked
        ? h('p', { class: course.type === 'carryover' ? 'pick__why' : 'pick__why visually-hidden', id: `${id}-why` }, icon('lock', { size: 14 }), course.type === 'carryover' ? `Failed in ${course.level}. Must be registered.` : 'Compulsory for your level. Cannot be removed.')
        : h('p', { class: 'pick__why pick__why--limit', id: `${id}-limit`, hidden: true }),
    );
  }

  function group(title, intro, courses, locked) {
    if (!courses.length) return null;
    const units = totalUnits(courses.map((course) => course.code));
    return h(
      'section',
      { class: 'panel pick-group', 'aria-labelledby': `${title.replace(/\s/g, '')}-title` },
      h('div', { class: 'panel__head' }, h('div', {}, h('h2', { id: `${title.replace(/\s/g, '')}-title` }, title), h('p', { class: 'section__sub' }, intro)), h('span', { class: 'muted num' }, locked ? plural(units, 'unit') : `${courses.length} on offer`)),
      h('ul', { class: 'picks' }, courses.map((course) => row(course, locked))),
    );
  }

  const unitsValue = h('strong', { class: 'units__value num' });
  const meterFill = h('span', { class: 'units__fill' });
  const problemsLine = h('p', { class: 'save-bar__note', 'aria-live': 'polite' });
  const saveButton = button('Save draft', { icon: 'save', variant: 'secondary', onclick: () => withBusy(saveButton, 'Saving', save) });
  const submitButton = h('button', { class: 'btn btn--primary', type: 'button', onclick: () => withBusy(submitButton, 'Submitting', send) }, icon('send'), 'Submit', h('span', { class: 'hide-narrow' }, '\u00a0to adviser'));

  function update() {
    const codes = [...chosen];
    const units = totalUnits(codes);
    unitsValue.textContent = `${units} of ${term.maxUnits} units`;
    meterFill.style.width = `${Math.min(100, (units / term.maxUnits) * 100)}%`;
    meterFill.classList.toggle('units__fill--low', units < term.minUnits);

    // An elective that would go over the limit can't be ticked.
    for (const [code, box] of electiveBoxes) {
      const course = electives.find((item) => item.code === code);
      const blocked = !box.checked && units + course.units > term.maxUnits;
      box.disabled = blocked;
      const why = $(`#${box.id}-limit`);
      why.hidden = !blocked;
      why.textContent = blocked ? `Adding this would take you to ${units + course.units} units, over the ${term.maxUnits} limit.` : '';
    }

    const check = checkSelection(user, codes, term);
    problemsLine.textContent = check.ok ? `${plural(codes.length, 'course')}. Ready to submit.` : check.problems[0];
    problemsLine.classList.toggle('save-bar__note--ok', check.ok);
    submitButton.disabled = !check.ok;
  }

  async function save() {
    try {
      store.saveDraft(user.matric, [...chosen]);
      dirty = false;
      toast('Draft saved. Your adviser cannot see it until you submit it.');
    } catch (error) {
      toast(error.message, { error: true });
    }
  }

  async function send() {
    const codes = [...chosen];
    const ok = await confirmDialog({
      title: 'Submit your registration?',
      text: `${plural(codes.length, 'course')}, ${totalUnits(codes)} units. Your course adviser will check it. You cannot change it again unless it is returned to you.`,
      confirmLabel: 'Submit to adviser',
    });
    if (!ok) return;
    try {
      store.submit(user.matric, codes);
      dirty = false;
      window.location.assign('student.html?submitted=1');
    } catch (error) {
      toast(error.message, { error: true });
    }
  }

  window.addEventListener('beforeunload', (event) => {
    if (dirty) event.preventDefault();
  });

  mount(
    content,
    status === 'returned' ? notice('bad', `Returned by ${nameOf(registration.reviewerId)} on ${formatDay(registration.reviewedAt)}`, h('blockquote', { class: 'quote' }, registration.note)) : null,
    status === 'draft' ? notice('warn', 'Draft saved, not submitted', `Last saved ${formatTime(registration.updatedAt)}. Submit before ${formatDay(term.closes)}.`) : null,
    h(
      'div',
      { class: 'stack' },
      group('Carryover courses', 'Courses you did not pass at a lower level. They come first.', carryovers, true),
      group('Compulsory courses', `Every ${user.level} student takes these.`, required, true),
      group('Electives', `Optional. Pick any that fit within ${term.maxUnits} units.`, electives, false),
    ),
    h(
      'div',
      { class: 'save-bar' },
      h(
        'div',
        { class: 'save-bar__info units' },
        h('div', { class: 'units__row' }, h('span', { class: 'muted' }, 'Total'), unitsValue, h('span', { class: 'muted' }, `minimum ${term.minUnits}`)),
        h('span', { class: 'units__track', 'aria-hidden': 'true' }, meterFill),
        problemsLine,
      ),
      h('div', { class: 'save-bar__actions' }, saveButton, submitButton),
    ),
  );
  update();
}
