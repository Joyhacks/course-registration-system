// The frame around every signed-in page: checks who is signed in,
// then builds the school header and the navigation for their role.
import { SCHOOL } from './catalogue.js';
import { h } from './dom.js';
import { icon } from './icons.js';
import * as store from './store.js';
import { avatar, confirmDialog, toast } from './ui.js';

const NAV = {
  student: [
    { href: 'student.html', label: 'Overview', key: 'overview', icon: 'dashboard' },
    { href: 'register.html', label: 'Register courses', key: 'register', icon: 'listChecks' },
    { href: 'form.html', label: 'Course form', key: 'form', icon: 'file' },
  ],
  staff: [
    { href: 'adviser.html', label: 'Overview', key: 'overview', icon: 'dashboard' },
    { href: 'registrations.html', label: 'Registrations', key: 'registrations', icon: 'inbox' },
    { href: 'catalogue.html', label: 'Course catalogue', key: 'catalogue', icon: 'courses' },
  ],
};

// Call at the top of every page script with await. Sends anyone not
// allowed here back to the sign-in page (or their own overview); the
// page script then waits forever instead of running.
export async function initPage({ active, kind }) {
  const user = store.currentUser();
  if (!user) {
    window.location.replace('index.html');
    return new Promise(() => {});
  }
  if (kind && user.kind !== kind) {
    window.location.replace(user.kind === 'student' ? 'student.html' : 'adviser.html');
    return new Promise(() => {});
  }

  const nav = h('nav', { class: 'app-nav', id: 'app-nav', 'aria-label': 'Main' });
  const toggle = h(
    'button',
    {
      class: 'nav-toggle',
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': 'app-nav',
      'aria-label': 'Menu',
      onclick: () => {
        const open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.replaceChildren(icon(open ? 'close' : 'menu'));
      },
    },
    icon('menu'),
  );

  const roleLine = user.kind === 'student' ? user.matric : user.title;

  nav.append(
    h('p', { class: 'app-nav__label' }, user.kind === 'student' ? 'Student portal' : 'Staff portal'),
    h('ul', {}, NAV[user.kind].map((item) =>
      h('li', {}, h('a', { href: item.href, 'aria-current': item.key === active ? 'page' : null }, icon(item.icon), item.label)),
    )),
    h(
      'div',
      { class: 'app-user' },
      h(
        'div',
        { class: 'app-user__row' },
        avatar(user.name, 'deep'),
        h('div', { class: 'app-user__text' }, h('div', { class: 'app-user__name' }, user.name), h('div', { class: 'app-user__role' }, roleLine)),
        h('button', { class: 'signout', type: 'button', 'aria-label': 'Sign out', title: 'Sign out', onclick: signOut }, icon('logout')),
      ),
      h('button', { class: 'demo-reset', type: 'button', onclick: resetDemo }, icon('reset', { size: 16 }), 'Reset demo data'),
      h('p', { class: 'project-note' }, SCHOOL.projectNote),
    ),
  );

  const header = h(
    'header',
    { class: 'app-header' },
    h(
      'div',
      { class: 'app-header__bar' },
      h(
        'a',
        { class: 'brand', href: user.kind === 'student' ? 'student.html' : 'adviser.html' },
        h('img', { class: 'brand__crest', src: 'img/crest-96.png', alt: '', width: 44, height: 44 }),
        h('span', { class: 'brand__text' }, h('span', { class: 'brand__school', translate: 'no' }, SCHOOL.name), h('span', { class: 'brand__name' }, 'Course Registration')),
      ),
      toggle,
    ),
    nav,
  );

  document.querySelector('.app').prepend(header);
  return user;
}

function signOut() {
  store.signOut();
  window.location.assign('index.html');
}

async function resetDemo() {
  const ok = await confirmDialog({
    title: 'Reset the demo data?',
    text: 'Every registration goes back to how the demo started. Anything you changed in this browser is lost.',
    confirmLabel: 'Reset demo data',
    danger: true,
  });
  if (!ok) return;
  store.resetDemo();
  toast('Demo data reset.');
  setTimeout(() => window.location.reload(), 600);
}

// Reads and writes values in the address bar, so filters survive a
// refresh and can be shared as a link.
export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}

export function setParams(changes) {
  const url = new URL(window.location.href);
  for (const [name, value] of Object.entries(changes)) {
    if (value === '' || value === null || value === undefined) url.searchParams.delete(name);
    else url.searchParams.set(name, value);
  }
  window.history.replaceState(null, '', url);
}

// Builds the standard page header: gold eyebrow, title, green rule.
export function pageHead({ eyebrow, title, lead, actions }) {
  return h(
    'div',
    { class: 'page-head' },
    h('div', {}, eyebrow ? h('p', { class: 'eyebrow' }, eyebrow) : null, h('h1', {}, title), lead ? h('p', { class: 'page-head__lead' }, lead) : null),
    actions ? h('div', { class: 'page-head__actions' }, actions) : null,
  );
}
