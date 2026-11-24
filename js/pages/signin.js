import { SCHOOL, STAFF, DEMO_PASSWORD } from '../lib/catalogue.js';
import { $, h } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { DEMO_STUDENT } from '../lib/seed.js';
import * as store from '../lib/store.js';
import { buildField, submitFields } from '../lib/ui.js';

const home = (user) => (user.kind === 'student' ? 'student.html' : 'adviser.html');

const signedIn = store.currentUser();
if (signedIn) window.location.replace(home(signedIn));

$('#school-address').replaceChildren(icon('mapPin', { size: 16 }), SCHOOL.address);

const fields = [
  buildField({ name: 'username', label: 'Matric number or email', autocomplete: 'username', help: 'For example BSP/CS/ND/25/014' }),
  buildField({ name: 'password', label: 'Password', type: 'password', autocomplete: 'current-password' }),
];
fields[0].control.setAttribute('autocapitalize', 'characters');
fields[0].control.setAttribute('spellcheck', 'false');

const formError = h('p', { class: 'form-error', role: 'alert', hidden: true });
const submitButton = h('button', { class: 'btn btn--primary btn--block', type: 'submit' }, icon('login'), 'Sign in');

const form = h(
  'form',
  {
    novalidate: true,
    onsubmit: async (event) => {
      event.preventDefault();
      await submitFields({
        fields,
        formError,
        button: submitButton,
        busyLabel: 'Signing in',
        onSubmit: async (values) => {
          const user = store.signIn(values.username, values.password);
          window.location.assign(user.kind === 'student' ? 'student.html' : 'adviser.html');
        },
      });
    },
  },
  formError,
  fields.map((field) => field.wrapper),
  submitButton,
);
$('#signin-form').replaceChildren(form);

const demoStudent = store.student(DEMO_STUDENT);
const accounts = [
  { who: demoStudent.name, role: `Student, ${demoStudent.level}`, username: demoStudent.matric },
  ...STAFF.map((member) => ({ who: member.name, role: member.title, username: member.email })),
];

$('#demo-list').replaceChildren(
  ...accounts.map((account) =>
    h(
      'button',
      {
        class: 'demo-login',
        type: 'button',
        onclick: () => {
          fields[0].control.value = account.username;
          fields[1].control.value = DEMO_PASSWORD;
          fields.forEach((field) => field.setError(''));
          submitButton.focus();
        },
      },
      h('span', { class: 'demo-login__who' }, account.who),
      h('span', { class: 'demo-login__role' }, account.role),
      h('span', { class: 'demo-login__user mono' }, account.username),
    ),
  ),
);

if (window.matchMedia('(pointer: fine)').matches) fields[0].control.focus();
