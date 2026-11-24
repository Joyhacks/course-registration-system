import { LEVELS, PROGRAMMES } from '../lib/catalogue.js';
import { $, h, mount } from '../lib/dom.js';
import { SEMESTER_LABELS } from '../lib/format.js';
import { coursesFor, totalUnits } from '../lib/rules.js';
import { getParam, initPage, setParams } from '../lib/shell.js';
import * as store from '../lib/store.js';
import { buildTable, courseCell } from '../lib/ui.js';
import { typeTag } from '../lib/views.js';

const user = await initPage({ active: 'catalogue', kind: 'staff' });
const term = store.term();
let level = LEVELS.includes(getParam('level')) ? getParam('level') : user.levels[0];

$('#page-meta').textContent = `Courses offered by the department, ${term.session} session.`;

const tabs = h('nav', { class: 'tabs', 'aria-label': 'Level' });
const body = h('div');

function render() {
  tabs.replaceChildren(
    ...LEVELS.map((item) =>
      h('a', {
        href: `?level=${encodeURIComponent(item)}`,
        'aria-current': item === level ? 'page' : null,
        onclick: (event) => {
          event.preventDefault();
          level = item;
          setParams({ level });
          render();
        },
      }, item),
    ),
  );

  mount(
    body,
    h('p', { class: 'section__sub' }, PROGRAMMES[level]),
    [1, 2].map((semester) => {
      const courses = coursesFor(level, semester);
      const fixed = courses.filter((course) => course.type !== 'elective');
      return h(
        'section',
        { class: 'panel section', 'aria-labelledby': `sem-${semester}` },
        h(
          'div',
          { class: 'panel__head' },
          h('h2', { id: `sem-${semester}` }, SEMESTER_LABELS[semester], semester === term.semester ? h('span', { class: 'badge badge--ok heading-badge' }, 'Open now') : null),
          h('span', { class: 'muted' }, `${totalUnits(fixed.map((course) => course.code))} compulsory units, ${courses.length - fixed.length} electives`),
        ),
        buildTable({
          caption: `${level}, ${SEMESTER_LABELS[semester]}`,
          columns: [
            { label: 'Course', primary: true, cell: (course) => courseCell(course) },
            { label: 'Type', cell: (course) => typeTag(course.type) },
            { label: 'Units', numeric: true, cell: (course) => String(course.units) },
          ],
          rows: courses,
        }),
      );
    }),
  );
}

mount($('#content'), tabs, body);
render();
