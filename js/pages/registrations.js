import { $, h, mount } from '../lib/dom.js';
import { formatTime } from '../lib/format.js';
import { totalUnits } from '../lib/rules.js';
import { getParam, initPage, setParams } from '../lib/shell.js';
import * as store from '../lib/store.js';
import { asSearchField, buildField, buildTable, button, person, showEmpty } from '../lib/ui.js';
import { badgeFor } from '../lib/views.js';

const user = await initPage({ active: 'registrations', kind: 'staff' });
const rows = store.roster(user.levels);
const statusOf = (row) => row.registration?.status || 'none';

$('#page-meta').textContent = `${store.term().session}, first semester. ${user.levels.join(', ')}.`;

const TABS = [
  { key: '', label: 'All' },
  { key: 'submitted', label: 'Waiting' },
  { key: 'approved', label: 'Approved' },
  { key: 'returned', label: 'Returned' },
  { key: 'draft', label: 'Draft' },
  { key: 'none', label: 'Not started' },
];

const state = {
  status: TABS.some((tab) => tab.key === getParam('status')) ? getParam('status') : '',
  level: user.levels.includes(getParam('level')) ? getParam('level') : '',
  q: getParam('q'),
};

const search = asSearchField(buildField({ name: 'q', label: 'Search', required: false, plainLabel: true, placeholder: 'Name or matric number', value: state.q }));
const level = buildField({ name: 'level', label: 'Level', type: 'select', required: false, plainLabel: true, value: state.level, options: [{ value: '', label: 'All levels' }, ...user.levels.map((item) => ({ value: item, label: item }))] });
search.control.addEventListener('input', () => update({ q: search.control.value.trim() }));
level.control.addEventListener('change', () => update({ level: level.control.value }));

const tabs = h('nav', { class: 'tabs', 'aria-label': 'Filter by status' });
const results = h('div');

function update(changes) {
  Object.assign(state, changes);
  setParams(state);
  render();
}

function render() {
  const inScope = rows.filter((row) => !state.level || row.student.level === state.level);
  tabs.replaceChildren(
    ...TABS.map((tab) => {
      const count = inScope.filter((row) => !tab.key || statusOf(row) === tab.key).length;
      return h(
        'a',
        {
          href: `?status=${tab.key}`,
          'aria-current': state.status === tab.key ? 'page' : null,
          onclick: (event) => {
            event.preventDefault();
            update({ status: tab.key });
          },
        },
        tab.label,
        h('span', { class: 'count' }, String(count)),
      );
    }),
  );

  const q = state.q.toLowerCase();
  const shown = inScope
    .filter((row) => !state.status || statusOf(row) === state.status)
    .filter((row) => !q || row.student.name.toLowerCase().includes(q) || row.student.matric.toLowerCase().includes(q))
    .sort((a, b) => {
      // Waiting first (oldest first), then everyone else by name.
      const wa = statusOf(a) === 'submitted' ? 0 : 1;
      const wb = statusOf(b) === 'submitted' ? 0 : 1;
      if (wa !== wb) return wa - wb;
      if (wa === 0) return a.registration.submittedAt.localeCompare(b.registration.submittedAt);
      return a.student.name.localeCompare(b.student.name);
    });

  if (!shown.length) {
    showEmpty(results, { iconName: 'search', title: 'No students match', text: 'Try another status, level or search.' });
    return;
  }

  mount(
    results,
    buildTable({
      caption: 'Student course registrations',
      columns: [
        { label: 'Student', primary: true, cell: ({ student }) => person(student.name, student.matric) },
        { label: 'Level', cell: ({ student }) => student.level },
        { label: 'Units', numeric: true, cell: ({ registration }) => (registration ? String(totalUnits(registration.courses)) : '-') },
        { label: 'Status', cell: ({ registration }) => badgeFor(registration) },
        { label: 'Last change', cell: ({ registration }) => (registration ? formatTime(registration.updatedAt) : h('span', { class: 'muted' }, 'Not started')) },
        {
          label: 'Action',
          actions: true,
          cell: ({ student, registration }) =>
            button(registration?.status === 'submitted' ? 'Review' : 'Open', {
              variant: registration?.status === 'submitted' ? 'primary' : 'secondary',
              href: `review.html?matric=${encodeURIComponent(student.matric)}`,
              ariaLabel: `${registration?.status === 'submitted' ? 'Review' : 'Open'} ${student.name}`,
            }),
        },
      ],
      rows: shown,
    }),
    h('p', { class: 'table-note muted' }, `${shown.length} of ${inScope.length} students`),
  );
}

mount($('#content'), h('div', { class: 'toolbar' }, search.wrapper, level.wrapper), tabs, results);
render();

