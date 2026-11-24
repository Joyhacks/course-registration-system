import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STAFF } from '../js/lib/catalogue.js';
import * as rules from '../js/lib/rules.js';
import { buildDemoData, DEMO_STUDENT, makeRef } from '../js/lib/seed.js';

const now = new Date('2026-11-24T10:00:00');
const data = buildDemoData(now);
const term = data.term;
const at = '2026-11-24T10:00:00.000Z';
const tobi = data.students.find((s) => s.matric === DEMO_STUDENT);
const ndAdviser = STAFF.find((s) => s.id === 'adv-nd');
const hndAdviser = STAFF.find((s) => s.id === 'adv-hnd');
const hod = STAFF.find((s) => s.role === 'hod');
const required = rules.requiredCodes(tobi, term.semester);

test('carryovers come first and are required', () => {
  assert.equal(required[0], 'COM 113');
  const check = rules.checkSelection(tobi, required.slice(1), term);
  assert.equal(check.ok, false);
  assert.match(check.problems[0], /Carryover COM 113/);
});

test('compulsory courses cannot be left out', () => {
  const check = rules.checkSelection(tobi, required.filter((c) => c !== 'COM 211'), term);
  assert.ok(check.problems.some((p) => p.includes('COM 211 is compulsory')));
});

test('unit limits are enforced both ways', () => {
  assert.equal(rules.totalUnits(required), 22);
  assert.equal(rules.checkSelection(tobi, [...required, 'COM 216'], term).ok, true);
  const over = rules.checkSelection(tobi, [...required, 'COM 216', 'EED 216'], term);
  assert.ok(over.problems.some((p) => p.includes('most allowed is 24')));
  const tiny = { ...tobi, carryovers: [] };
  const under = rules.checkSelection(tiny, ['COM 211'], { ...term, minUnits: 15 });
  assert.ok(under.problems.some((p) => p.includes('least allowed is 15')));
});

test('courses from another level are refused', () => {
  const check = rules.checkSelection(tobi, [...required, 'COM 411'], term);
  assert.ok(check.problems.some((p) => p.includes('COM 411 is not offered')));
});

test('duplicates are refused', () => {
  assert.equal(rules.checkSelection(tobi, [...required, 'COM 211'], term).ok, false);
});

test('a full journey: draft, submit, return, resubmit, approve', () => {
  let reg = rules.saveDraft({ registration: null, student: tobi, codes: required, term, at });
  assert.equal(reg.status, 'draft');
  reg = rules.submit({ registration: reg, student: tobi, codes: [...required, 'COM 216'], term, at, ref: 'CRF/X/1' });
  assert.equal(reg.status, 'submitted');
  assert.equal(reg.ref, 'CRF/X/1');
  assert.throws(() => rules.saveDraft({ registration: reg, student: tobi, codes: required, term, at }), /can no longer be changed/);
  assert.throws(() => rules.returnToStudent({ registration: reg, student: tobi, staff: ndAdviser, note: '', at }), /what to change/);
  reg = rules.returnToStudent({ registration: reg, student: tobi, staff: ndAdviser, note: 'Swap the elective.', at });
  assert.equal(reg.status, 'returned');
  reg = rules.saveDraft({ registration: reg, student: tobi, codes: required, term, at });
  assert.equal(reg.status, 'returned', 'saving keeps the returned note visible');
  reg = rules.submit({ registration: reg, student: tobi, codes: [...required, 'EED 216'], term, at, ref: 'CRF/X/2' });
  assert.equal(reg.ref, 'CRF/X/1', 'the form keeps its first reference');
  assert.equal(reg.note, '');
  reg = rules.approve({ registration: reg, student: tobi, staff: hod, at });
  assert.equal(reg.status, 'approved');
  assert.deepEqual(reg.history.map((h) => h.action), ['saved', 'submitted', 'returned', 'saved', 'submitted', 'approved']);
});

test('only an adviser for the level can review', () => {
  const reg = rules.submit({ registration: null, student: tobi, codes: required, term, at, ref: 'R' });
  assert.throws(() => rules.approve({ registration: reg, student: tobi, staff: hndAdviser, at }), /do not advise/);
  assert.throws(() => rules.approve({ registration: null, student: tobi, staff: ndAdviser, at }), /Only a submitted/);
});

test('nothing can be saved outside the registration window', () => {
  const closed = { ...term, closes: '2026-11-01' };
  assert.equal(rules.windowState(closed, '2026-11-24'), 'closed');
  assert.throws(() => rules.submit({ registration: null, student: tobi, codes: required, term: closed, at, ref: 'R' }), /closed/);
});

test('demo data follows the rules', () => {
  for (const student of data.students) {
    const reg = data.registrations[student.matric];
    if (!reg || reg.status === 'draft') continue;
    assert.ok(rules.checkSelection(student, reg.courses, term).ok, `${student.matric} breaks a rule`);
  }
  assert.equal(data.registrations[DEMO_STUDENT], undefined, 'the demo student starts unregistered');
  assert.ok(rules.windowState(term, '2026-11-24') === 'open');
});

test('form references are readable', () => {
  assert.equal(makeRef(term, 7), 'CRF/CSC/2526/1/0007');
});
