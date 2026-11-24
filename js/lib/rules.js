// Course registration rules. Pure functions with no browser code, so
// they run the same in the page and in the tests (node --test).
import { COURSES, COURSE_BY_CODE } from './catalogue.js';

export class RuleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RuleError';
  }
}

export const STATUS = Object.freeze({
  none: { label: 'Not started', tone: 'neutral' },
  draft: { label: 'Draft', tone: 'neutral' },
  submitted: { label: 'Awaiting approval', tone: 'warn' },
  returned: { label: 'Returned for changes', tone: 'bad' },
  approved: { label: 'Approved', tone: 'ok' },
});

export function statusOf(registration) {
  return registration ? registration.status : 'none';
}

export function canEdit(registration) {
  return ['none', 'draft', 'returned'].includes(statusOf(registration));
}

export function coursesFor(level, semester) {
  return COURSES.filter((course) => course.level === level && course.semester === semester);
}

// Carryovers are failed courses from earlier levels. They must be
// registered before anything else, and they count towards the unit limit.
export function carryoversFor(student) {
  return (student.carryovers || [])
    .map((code) => COURSE_BY_CODE.get(code))
    .filter(Boolean)
    .map((course) => ({ ...course, type: 'carryover' }));
}

// What this student is offered this semester, split the way the form shows it.
export function optionsFor(student, semester) {
  const offered = coursesFor(student.level, semester);
  return {
    carryovers: carryoversFor(student),
    required: offered.filter((course) => course.type !== 'elective'),
    electives: offered.filter((course) => course.type === 'elective'),
  };
}

export function requiredCodes(student, semester) {
  const { carryovers, required } = optionsFor(student, semester);
  return [...carryovers, ...required].map((course) => course.code);
}

export function totalUnits(codes) {
  return codes.reduce((sum, code) => sum + (COURSE_BY_CODE.get(code)?.units || 0), 0);
}

// The courses in a registration, in form order: carryovers, then the
// level's courses in catalogue order.
export function coursesInRegistration(student, codes) {
  const carry = new Set(student.carryovers || []);
  const picked = new Set(codes);
  return [
    ...carryoversFor(student).filter((course) => picked.has(course.code)),
    ...COURSES.filter((course) => picked.has(course.code) && !carry.has(course.code)),
  ];
}

// Checks a selection against the rules. Returns every problem at once
// so the student sees the full list, not one error at a time.
export function checkSelection(student, codes, term) {
  const problems = [];
  const unique = new Set(codes);
  if (unique.size !== codes.length) problems.push('A course is listed twice.');

  const allowed = new Set([...requiredCodes(student, term.semester), ...optionsFor(student, term.semester).electives.map((course) => course.code)]);
  for (const code of unique) {
    if (!allowed.has(code)) problems.push(`${code} is not offered to ${student.level} this semester.`);
  }

  for (const course of carryoversFor(student)) {
    if (!unique.has(course.code)) problems.push(`Carryover ${course.code} must be registered.`);
  }
  for (const course of optionsFor(student, term.semester).required) {
    if (!unique.has(course.code)) problems.push(`${course.code} is compulsory for ${student.level}.`);
  }

  const units = totalUnits([...unique]);
  if (units > term.maxUnits) problems.push(`Total is ${units} units. The most allowed is ${term.maxUnits}.`);
  if (units < term.minUnits) problems.push(`Total is ${units} units. The least allowed is ${term.minUnits}.`);

  return { ok: problems.length === 0, problems, units };
}

export function windowState(term, today) {
  if (today < term.opens) return 'not-open';
  if (today > term.closes) return 'closed';
  return 'open';
}

function stamp(registration, entry) {
  return { ...registration, updatedAt: entry.at, history: [...(registration.history || []), entry] };
}

// ---------- Transitions. Each returns a new record or throws RuleError. ----------

export function saveDraft({ registration, student, codes, term, at }) {
  if (!canEdit(registration)) throw new RuleError('This registration can no longer be changed.');
  if (windowState(term, at.slice(0, 10)) !== 'open') throw new RuleError('Registration is closed.');
  const base = registration || {
    matric: student.matric,
    session: term.session,
    semester: term.semester,
    createdAt: at,
    history: [],
  };
  const status = registration?.status === 'returned' ? 'returned' : 'draft';
  return stamp({ ...base, status, courses: [...new Set(codes)] }, { at, by: student.matric, action: 'saved' });
}

export function submit({ registration, student, codes, term, at, ref }) {
  if (!canEdit(registration)) throw new RuleError('This registration has already been submitted.');
  if (windowState(term, at.slice(0, 10)) !== 'open') throw new RuleError('Registration is closed.');
  const check = checkSelection(student, codes, term);
  if (!check.ok) throw new RuleError(check.problems[0]);
  const base = registration || { matric: student.matric, session: term.session, semester: term.semester, createdAt: at, history: [] };
  return stamp(
    { ...base, status: 'submitted', courses: [...new Set(codes)], submittedAt: at, ref: base.ref || ref, note: '' },
    { at, by: student.matric, action: 'submitted' },
  );
}

function assertReviewer(staff, student) {
  if (!staff || !staff.levels.includes(student.level)) throw new RuleError('You do not advise this level.');
}

export function approve({ registration, student, staff, at }) {
  assertReviewer(staff, student);
  if (statusOf(registration) !== 'submitted') throw new RuleError('Only a submitted registration can be approved.');
  return stamp({ ...registration, status: 'approved', reviewedAt: at, reviewerId: staff.id, note: '' }, { at, by: staff.id, action: 'approved' });
}

export function returnToStudent({ registration, student, staff, note, at }) {
  assertReviewer(staff, student);
  if (!['submitted', 'approved'].includes(statusOf(registration))) throw new RuleError('Only a submitted or approved registration can be returned.');
  const reason = String(note || '').trim();
  if (reason.length < 5) throw new RuleError('Tell the student what to change.');
  return stamp(
    { ...registration, status: 'returned', reviewedAt: at, reviewerId: staff.id, note: reason },
    { at, by: staff.id, action: 'returned', note: reason },
  );
}
