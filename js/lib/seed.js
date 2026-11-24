// Builds the demo data: one semester's registration window, a class
// list for each level and registrations at every stage of review.
// The same names come out every time (seeded random numbers); only the
// dates move, so the window is always open on the day of the demo.
import { LEVELS, STAFF } from './catalogue.js';
import { optionsFor, requiredCodes, totalUnits } from './rules.js';

export const DATA_VERSION = 3;

const FIRST = ['Adaeze', 'Ayomide', 'Chinedu', 'Damilola', 'Ebuka', 'Fatima', 'Funmilayo', 'Ibrahim', 'Ifeoluwa', 'Ikechukwu', 'Kehinde', 'Mariam', 'Nkechi', 'Oluwaseun', 'Opeyemi', 'Precious', 'Ridwan', 'Samuel', 'Temitope', 'Tunde', 'Uche', 'Victoria', 'Yusuf', 'Zainab', 'Bolaji', 'Chiamaka', 'David', 'Esther', 'Gbenga', 'Halima', 'Jide', 'Kemi', 'Lateef', 'Moses', 'Ngozi', 'Rotimi'];
const LAST = ['Adebayo', 'Okonkwo', 'Bello', 'Eze', 'Ogundipe', 'Abubakar', 'Olaniyan', 'Nwosu', 'Akinola', 'Ibe', 'Salami', 'Okafor', 'Adewale', 'Musa', 'Ojo', 'Afolabi', 'Babatunde', 'Chukwu', 'Ilesanmi', 'Oyebanji', 'Ajibade', 'Fashola', 'Obi', 'Lawal', 'Ayodele', 'Komolafe', 'Oladipo', 'Uzor', 'Alabi', 'Olowe'];

const MATRIC_PREFIX = { 'ND I': 'ND/26', 'ND II': 'ND/25', 'HND I': 'HND/26', 'HND II': 'HND/25' };

// Earlier failed courses a student might be carrying.
const CARRY_POOL = { 'ND II': ['COM 113', 'COM 112', 'MTH 111'], 'HND II': ['COM 311', 'COM 315', 'STA 311'] };

// The account the sign-in page offers first: ND II with one carryover
// and nothing registered yet, so the whole journey can be shown.
export const DEMO_STUDENT = 'BSP/CS/ND/25/014';

function random(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function isoDay(base, offsetDays) {
  const date = new Date(base);
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isoTime(base, offsetDays, hour, minute) {
  const date = new Date(base);
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function buildDemoData(now = new Date()) {
  const rand = random(20262027);
  const pick = (list) => list[Math.floor(rand() * list.length)];

  const term = {
    session: '2026/2027',
    semester: 1,
    opens: isoDay(now, -16),
    closes: isoDay(now, 18),
    minUnits: 15,
    maxUnits: 24,
  };

  const students = [];
  const usedNames = new Set();
  let serial = 3;
  for (const level of LEVELS) {
    for (let i = 0; i < 10; i += 1) {
      let name;
      do name = `${pick(FIRST)} ${pick(LAST)}`;
      while (usedNames.has(name));
      usedNames.add(name);
      serial += 1 + Math.floor(rand() * 3);
      const pool = CARRY_POOL[level];
      const carryovers = pool && rand() < 0.3 ? [pick(pool)] : [];
      students.push({
        matric: `BSP/CS/${MATRIC_PREFIX[level]}/${String(serial).padStart(3, '0')}`,
        name,
        level,
        mode: rand() < 0.8 ? 'Full-time' : 'Part-time',
        carryovers,
      });
    }
  }

  // The demo student, placed in ND II.
  const demoIndex = students.findIndex((student) => student.level === 'ND II');
  students[demoIndex] = { matric: DEMO_STUDENT, name: 'Tobi Oyelaran', level: 'ND II', mode: 'Full-time', carryovers: ['COM 113'] };

  const registrations = {};
  let refCounter = 0;
  const adviserFor = (level) => STAFF.find((member) => member.role === 'adviser' && member.levels.includes(level));

  students.forEach((student, index) => {
    if (student.matric === DEMO_STUDENT) return;
    const roll = rand();
    // Roughly: 40% approved, 30% awaiting, 8% returned, 10% draft, 12% not started.
    let status;
    if (roll < 0.4) status = 'approved';
    else if (roll < 0.7) status = 'submitted';
    else if (roll < 0.78) status = 'returned';
    else if (roll < 0.88) status = 'draft';
    else return;

    const { electives } = optionsFor(student, term.semester);
    const codes = requiredCodes(student, term.semester);
    for (const elective of electives) {
      if (rand() < 0.55 && totalUnits([...codes, elective.code]) <= term.maxUnits) codes.push(elective.code);
    }
    // A returned student without carryovers was sent back for having no elective.
    if (status === 'returned' && !student.carryovers.length) codes.length = requiredCodes(student, term.semester).length;

    const startDay = -15 + Math.floor(rand() * 12);
    const createdAt = isoTime(now, startDay, 9 + Math.floor(rand() * 8), Math.floor(rand() * 60));
    const record = { matric: student.matric, session: term.session, semester: term.semester, status, courses: codes, createdAt, updatedAt: createdAt, history: [{ at: createdAt, by: student.matric, action: 'saved' }], note: '' };

    if (status !== 'draft') {
      const submittedAt = isoTime(now, Math.min(startDay + 1, -1), 10 + (index % 7), (index * 7) % 60);
      refCounter += 1;
      Object.assign(record, { submittedAt, updatedAt: submittedAt, ref: makeRef(term, refCounter) });
      record.history.push({ at: submittedAt, by: student.matric, action: 'submitted' });
    }
    if (status === 'approved' || status === 'returned') {
      const adviser = adviserFor(student.level);
      const reviewedAt = isoTime(now, Math.min(startDay + 2, 0) - 1, 12 + (index % 5), (index * 11) % 60);
      Object.assign(record, { reviewedAt, updatedAt: reviewedAt, reviewerId: adviser.id });
      if (status === 'returned') {
        record.note = student.carryovers.length
          ? 'Your carryover list needs checking against your last result. See me in the department office, then submit again.'
          : 'Add one elective. Students on your level should carry at least one this semester. Then submit again.';
        record.history.push({ at: reviewedAt, by: adviser.id, action: 'returned', note: record.note });
      } else {
        record.history.push({ at: reviewedAt, by: adviser.id, action: 'approved' });
      }
    }
    registrations[student.matric] = record;
  });

  return { version: DATA_VERSION, createdAt: now.toISOString(), term, students, registrations, refCounter };
}

export function makeRef(term, counter) {
  const years = term.session.replace(/^20(\d\d)\/20(\d\d)$/, '$1$2');
  return `CRF/CS/${years}/${term.semester}/${String(counter).padStart(4, '0')}`;
}
