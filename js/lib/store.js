// The demo's "database": one JSON document in localStorage, built from
// seed.js on the first visit. Every change goes through a rule in
// rules.js first, so the browser can't save a registration the rules
// would refuse. If storage is blocked, the data lives in memory until
// the tab closes.
import { STAFF, DEMO_PASSWORD } from './catalogue.js';
import * as rules from './rules.js';
import { buildDemoData, DATA_VERSION, makeRef } from './seed.js';

const KEY = 'bsp-cs-course-registration';
const SESSION_KEY = 'bsp-cs-course-registration-user';
let memory = null;
let memorySession = null;

function read() {
  if (memory) return memory;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && saved.version === DATA_VERSION) {
      memory = saved;
      return memory;
    }
  } catch {
    // Unreadable or blocked storage: start fresh below.
  }
  memory = buildDemoData();
  write();
  return memory;
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // Storage blocked (private mode, full disk). Keep working in memory.
  }
}

export function resetDemo() {
  memory = buildDemoData();
  write();
}

export function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ---------- Reading ----------

export const term = () => read().term;
export const students = () => read().students;
export const student = (matric) => read().students.find((item) => item.matric === matric) || null;
export const registration = (matric) => read().registrations[matric] || null;
export const staff = (id) => STAFF.find((member) => member.id === id) || null;

export function roster(levels) {
  return read()
    .students.filter((item) => levels.includes(item.level))
    .map((item) => ({ student: item, registration: registration(item.matric) }));
}

// ---------- Changing ----------

function put(record) {
  read().registrations[record.matric] = record;
  write();
  return record;
}

export function saveDraft(matric, codes) {
  return put(rules.saveDraft({ registration: registration(matric), student: student(matric), codes, term: term(), at: new Date().toISOString() }));
}

export function submit(matric, codes) {
  const data = read();
  const existing = registration(matric);
  const ref = existing?.ref || makeRef(data.term, data.refCounter + 1);
  const record = rules.submit({ registration: existing, student: student(matric), codes, term: data.term, at: new Date().toISOString(), ref });
  if (!existing?.ref) data.refCounter += 1;
  return put(record);
}

export function approve(matric, staffId) {
  return put(rules.approve({ registration: registration(matric), student: student(matric), staff: staff(staffId), at: new Date().toISOString() }));
}

export function returnToStudent(matric, staffId, note) {
  return put(rules.returnToStudent({ registration: registration(matric), student: student(matric), staff: staff(staffId), note, at: new Date().toISOString() }));
}

// ---------- Signing in ----------

export class SignInError extends rules.RuleError {}

export function signIn(username, password) {
  const name = String(username || '').trim();
  if (password !== DEMO_PASSWORD) throw new SignInError('That username and password do not match.');
  const member = STAFF.find((item) => item.email.toLowerCase() === name.toLowerCase());
  const found = member ? { kind: 'staff', id: member.id } : student(name.toUpperCase()) ? { kind: 'student', id: name.toUpperCase() } : null;
  if (!found) throw new SignInError('That username and password do not match.');
  memorySession = found;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(found));
  } catch {
    // Kept in memory for this page only.
  }
  return found;
}

export function signOut() {
  memorySession = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing stored.
  }
}

export function currentUser() {
  let session = memorySession;
  try {
    session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') || session;
  } catch {
    // Use the in-memory session.
  }
  if (!session) return null;
  if (session.kind === 'staff') {
    const member = staff(session.id);
    return member ? { kind: 'staff', ...member } : null;
  }
  const found = student(session.id);
  return found ? { kind: 'student', ...found } : null;
}
