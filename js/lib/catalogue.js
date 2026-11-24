// The department's course catalogue and the people in the demo.
// Course codes and titles follow the usual layout of an NBTE
// Computer Science curriculum (ND and HND). Names are fictional.

export const SCHOOL = Object.freeze({
  name: 'Best Solution Polytechnic, Akure',
  motto: 'Technology: Skill for Self Reliance',
  address: 'P.O. Box 518, Km 12, Ondo Road, Akure, Ondo State',
  department: 'Department of Computer Science',
  faculty: 'School of Information and Communication Technology',
  presenter: 'Adaramodu Femi Daniel',
  presenterMatric: 'BSP/CSC/ND/24/001',
  projectNote: 'Final year project by Adaramodu Femi Daniel (BSP/CSC/ND/24/001), Department of Computer Science. Not an official BESTPOTECH system.',
});

export const LEVELS = Object.freeze(['ND I', 'ND II', 'HND I', 'HND II']);

export const PROGRAMMES = Object.freeze({
  'ND I': 'National Diploma (ND) Computer Science',
  'ND II': 'National Diploma (ND) Computer Science',
  'HND I': 'Higher National Diploma (HND) Computer Science',
  'HND II': 'Higher National Diploma (HND) Computer Science',
});

// type: core (must take), gns (general studies, must take), elective (optional)
const c = (code, title, units, level, semester, type = 'core') => ({ code, title, units, level, semester, type });

export const COURSES = Object.freeze([
  // ND I
  c('COM 111', 'Introduction to Computing', 3, 'ND I', 1),
  c('COM 112', 'Introduction to Digital Electronics', 3, 'ND I', 1),
  c('COM 113', 'Introduction to Programming', 3, 'ND I', 1),
  c('COM 114', 'Statistics for Computing I', 2, 'ND I', 1),
  c('COM 115', 'Computer Application Packages I', 3, 'ND I', 1),
  c('MTH 111', 'Logic and Linear Algebra', 2, 'ND I', 1),
  c('GNS 101', 'Use of English I', 2, 'ND I', 1, 'gns'),
  c('GNS 111', 'Citizenship Education I', 2, 'ND I', 1, 'gns'),
  c('OTM 111', 'Office Practice', 2, 'ND I', 1, 'elective'),
  c('MTH 112', 'Functions', 2, 'ND I', 1, 'elective'),
  c('COM 121', 'Programming Using C', 3, 'ND I', 2),
  c('COM 122', 'Introduction to the Internet', 3, 'ND I', 2),
  c('COM 123', 'Programming Language (Java)', 3, 'ND I', 2),
  c('COM 124', 'Data Structures and Algorithms', 3, 'ND I', 2),
  c('COM 125', 'Introduction to Systems Analysis', 3, 'ND I', 2),
  c('GNS 102', 'Communication in English I', 2, 'ND I', 2, 'gns'),
  c('MTH 122', 'Trigonometry and Analytical Geometry', 2, 'ND I', 2, 'elective'),

  // ND II
  c('COM 211', 'Programming Language (C++)', 3, 'ND II', 1),
  c('COM 212', 'Introduction to Systems Programming', 3, 'ND II', 1),
  c('COM 213', 'Unified Modelling Language', 3, 'ND II', 1),
  c('COM 214', 'File Organisation and Management', 3, 'ND II', 1),
  c('COM 215', 'Computer Packages II', 3, 'ND II', 1),
  c('MTH 211', 'Calculus', 2, 'ND II', 1),
  c('GNS 201', 'Use of English II', 2, 'ND II', 1, 'gns'),
  c('COM 216', 'Web Design', 2, 'ND II', 1, 'elective'),
  c('EED 216', 'Practice of Entrepreneurship', 2, 'ND II', 1, 'elective'),
  c('COM 221', 'Web Development', 3, 'ND II', 2),
  c('COM 222', 'Seminar on Computing', 2, 'ND II', 2),
  c('COM 223', 'Basic Hardware Maintenance', 3, 'ND II', 2),
  c('COM 224', 'Management Information Systems', 3, 'ND II', 2),
  c('COM 225', 'Project', 4, 'ND II', 2),
  c('GNS 202', 'Communication in English II', 2, 'ND II', 2, 'gns'),

  // HND I
  c('COM 311', 'Operating Systems I', 3, 'HND I', 1),
  c('COM 312', 'Database Design I', 3, 'HND I', 1),
  c('COM 313', 'Object Oriented Programming', 3, 'HND I', 1),
  c('COM 314', 'Software Engineering', 3, 'HND I', 1),
  c('COM 315', 'Computer Architecture', 3, 'HND I', 1),
  c('STA 311', 'Statistical Methods', 2, 'HND I', 1),
  c('GNS 301', 'Use of English III', 2, 'HND I', 1, 'gns'),
  c('COM 316', 'Mobile Application Development', 3, 'HND I', 1, 'elective'),
  c('EED 316', 'Entrepreneurship Development', 2, 'HND I', 1, 'elective'),
  c('COM 321', 'Operating Systems II', 3, 'HND I', 2),
  c('COM 322', 'Database Design II', 3, 'HND I', 2),
  c('COM 323', 'Assembly Language Programming', 3, 'HND I', 2),
  c('COM 324', 'Systems Analysis and Design', 3, 'HND I', 2),
  c('COM 325', 'Data Communication and Networks', 3, 'HND I', 2),
  c('GNS 302', 'Communication in English III', 2, 'HND I', 2, 'gns'),

  // HND II
  c('COM 411', 'Compiler Construction', 3, 'HND II', 1),
  c('COM 412', 'Computer Graphics and Animation', 3, 'HND II', 1),
  c('COM 413', 'Project Management', 2, 'HND II', 1),
  c('COM 414', 'Artificial Intelligence', 3, 'HND II', 1),
  c('COM 415', 'Multimedia Systems', 3, 'HND II', 1),
  c('COM 416', 'Research Methodology', 2, 'HND II', 1),
  c('GNS 401', 'Communication in English IV', 2, 'HND II', 1, 'gns'),
  c('COM 417', 'Cloud Computing', 3, 'HND II', 1, 'elective'),
  c('COM 418', 'Cyber Security', 3, 'HND II', 1, 'elective'),
  c('COM 421', 'Project', 6, 'HND II', 2),
  c('COM 422', 'Seminar', 2, 'HND II', 2),
  c('COM 423', 'Data Mining and Warehousing', 3, 'HND II', 2),
  c('COM 424', 'Human Computer Interaction', 3, 'HND II', 2),
  c('GNS 402', 'Use of English IV', 2, 'HND II', 2, 'gns'),
]);

export const COURSE_BY_CODE = new Map(COURSES.map((course) => [course.code, course]));

export const TYPE_LABELS = Object.freeze({ core: 'Compulsory', gns: 'General studies', elective: 'Elective', carryover: 'Carryover' });

// Staff who sign in to review registrations.
export const STAFF = Object.freeze([
  { id: 'adv-nd', name: 'Mrs. Bisi Ogunleye', email: 'b.ogunleye@demo.school', role: 'adviser', title: 'Course adviser, ND', levels: ['ND I', 'ND II'] },
  { id: 'adv-hnd', name: 'Mr. Segun Falade', email: 's.falade@demo.school', role: 'adviser', title: 'Course adviser, HND', levels: ['HND I', 'HND II'] },
  { id: 'hod', name: 'Dr. Kunle Ajayi', email: 'hod.cs@demo.school', role: 'hod', title: 'Head of Department', levels: [...LEVELS] },
]);

// One shared password for every demo account. Shown on the sign-in page.
export const DEMO_PASSWORD = 'demo2026';
