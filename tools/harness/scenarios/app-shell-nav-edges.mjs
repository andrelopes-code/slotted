import assert from 'node:assert/strict';

import { buildReactPage } from '../react-page.mjs';
import { launch } from '../shoot.mjs';

/**
 * The navigation column of `app-shell`, read in Chrome with classic scrollbars:
 *
 * - a seam colour written on the banner recolours the banner's seam, and
 *   `transparent` removes it;
 * - a full-width child of `nav-header`, `nav-body` and `nav-footer` ends on
 *   one right edge, though only the body scrolls;
 * - a full-width `Button` and a default `IconButton` in `nav-body`, focused
 *   from the keyboard, draw their focus ring inside the body's clip box, with
 *   the column open and closed to the rail.
 *
 * The requests came from an application: a banner whose seam a region could
 * not drop, an account row in the foot ten pixels wider than the destinations
 * above it, and a "New" button whose ring the scrolling body cut on both sides.
 *
 * The page is the binding from source (`tools/harness/react-page.mjs`), four
 * shells of 1440 by 480 pixels stacked in one document.
 *
 * Run: node tools/harness/scenarios/app-shell-nav-edges.mjs
 * Exits non-zero when an assertion fails.
 */

const entry = `
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AppShell,
  AppShellBanner,
  AppShellMain,
  AppShellNav,
  AppShellNavBody,
  AppShellNavFooter,
  AppShellNavHeader,
  AppShellNavToggle,
} from '@slotted/react/app-shell';
import { Button, IconButton } from '@slotted/react/button';
import {
  SideNavigation,
  SideNavigationItem,
  SideNavigationLabel,
  SideNavigationLink,
  SideNavigationList,
} from '@slotted/react/side-navigation';

const frame = (probe, children) =>
  h('div', { 'data-probe': probe, style: { blockSize: '480px', inlineSize: '1440px' } }, children);

const destinations = h(
  SideNavigation,
  { 'aria-label': 'Main navigation', defaultValue: 'orders' },
  h(
    SideNavigationList,
    null,
    ['orders', 'customers', 'invoices'].map((value) =>
      h(
        SideNavigationItem,
        { key: value, value },
        h(SideNavigationLink, { href: '#' + value }, h(SideNavigationLabel, null, value)),
      ),
    ),
  ),
);

const column = (collapsedTo, open) =>
  h(
    AppShell,
    { canvas: 'inset', collapsedTo, defaultNavOpen: open, navMode: 'inline', primary: 'nav' },
    h(
      AppShellNav,
      null,
      h(AppShellNavHeader, null, h(AppShellNavToggle, null), h('div', { 'data-fill': 'header', style: { flex: '1 1 auto', blockSize: '8px' } })),
      h(
        AppShellNavBody,
        null,
        h(Button, { 'data-fill': 'body', 'data-ring': 'button', style: { inlineSize: '100%' } }, 'New'),
        h(IconButton, { 'aria-label': 'Search', 'data-ring': 'icon' }, h('span', null, 'S')),
        destinations,
      ),
      h(AppShellNavFooter, null, h(Button, { 'data-fill': 'footer', style: { inlineSize: '100%' } }, 'Account')),
    ),
    h(AppShellMain, null, h('h1', null, 'Orders')),
  );

function App() {
  return h(
    'div',
    null,
    frame(
      'seam',
      h(
        AppShell,
        { canvas: 'flush', primary: 'nav' },
        h(AppShellBanner, { style: { '--slotted-app-shell-border-color': 'rgb(255, 0, 0)' } }, 'Banner'),
        h(AppShellMain, null, 'Main'),
        h(AppShellFooter, { style: { '--slotted-app-shell-border-color': 'transparent' } }, 'Footer'),
      ),
    ),
    frame('open', column('rail', true)),
    frame('rail', column('rail', false)),
  );
}

createRoot(document.getElementById('root')).render(h(App));
`.replace('  AppShellMain,\n  AppShellNav,', '  AppShellFooter,\n  AppShellMain,\n  AppShellNav,');

const READ = `(async () => {
  const frames = (count) =>
    new Promise((resolve) => {
      const step = (left) => (left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
      step(count);
    });
  await frames(10);
  const probe = (name) => document.querySelector('[data-probe="' + name + '"]');

  const seamFrame = probe('seam');
  const banner = seamFrame.querySelector('[data-part="banner"]');
  const footer = seamFrame.querySelector('[data-ui="app-shell"] > [data-part="footer"]');
  const seam = {
    banner: getComputedStyle(banner).borderBottomColor,
    footer: getComputedStyle(footer).borderTopColor,
  };

  const edges = {};
  for (const name of ['open']) {
    const shell = probe(name);
    edges[name] = Object.fromEntries(
      ['header', 'body', 'footer'].map((part) => [
        part,
        shell.querySelector('[data-fill="' + part + '"]').getBoundingClientRect().right,
      ]),
    );
  }

  const rings = [];
  for (const name of ['open', 'rail']) {
    const shell = probe(name);
    const body = shell.querySelector('[data-part="nav-body"]');
    const outer = body.getBoundingClientRect();
    const clip = {
      left: outer.left + body.clientLeft,
      top: outer.top + body.clientTop,
      right: outer.left + body.clientLeft + body.clientWidth,
      bottom: outer.top + body.clientTop + body.clientHeight,
    };
    for (const kind of ['button', 'icon']) {
      const control = shell.querySelector('[data-ring="' + kind + '"]');
      if (getComputedStyle(control).display === 'none') continue;
      control.focus();
      await frames(2);
      const style = getComputedStyle(control);
      const reach = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
      const box = control.getBoundingClientRect();
      rings.push({
        probe: name,
        kind,
        visible: control.matches(':focus-visible'),
        outlineStyle: style.outlineStyle,
        reach,
        ring: {
          left: box.left - reach,
          top: box.top - reach,
          right: box.right + reach,
          bottom: box.bottom + reach,
        },
        clip,
      });
      control.blur();
    }
  }
  return { seam, edges, rings, gutter: (() => {
    const body = probe('open').querySelector('[data-part="nav-body"]');
    return body.offsetWidth - body.clientWidth;
  })() };
})()`;

const url = await buildReactPage('app-shell-nav-edges', entry);
const { devtools, close } = await launch({ scrollbars: 'show' });
let reading;

try {
  await devtools.send('Page.enable');
  await devtools.send('Runtime.enable');
  await devtools.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1600,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const loaded = devtools.once('Page.loadEventFired');
  await devtools.send('Page.navigate', { url: url.href });
  await loaded;

  /* One key from the keyboard, so a later focus() matches :focus-visible. */
  for (const type of ['keyDown', 'keyUp']) {
    await devtools.send('Input.dispatchKeyEvent', {
      type,
      key: 'Shift',
      code: 'ShiftLeft',
      windowsVirtualKeyCode: 16,
    });
  }

  const { result, exceptionDetails } = await devtools.send('Runtime.evaluate', {
    expression: READ,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description ?? 'the scene did not run');
  }
  reading = result.value;
} finally {
  devtools.close();
  await close();
}

console.log(JSON.stringify(reading, null, 2));

/* Every check runs, so one reading names every defect at once. */
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(reading.gutter > 0, 'the page draws classic scrollbars, or the edge reading proves nothing');

check(reading.seam.banner === 'rgb(255, 0, 0)', 'the colour written on the banner draws its seam');
check(
  reading.seam.footer === 'rgba(0, 0, 0, 0)',
  'transparent written on the footer removes its seam',
);

for (const [probe, edge] of Object.entries(reading.edges)) {
  check(
    Math.abs(edge.header - edge.body) < 0.5 && Math.abs(edge.footer - edge.body) < 0.5,
    `${probe}: header ${edge.header}, body ${edge.body} and footer ${edge.footer} end on one edge`,
  );
}

check(reading.rings.length >= 3, 'the open column shows both controls and the rail one at least');
for (const ring of reading.rings) {
  const label = `${ring.probe} ${ring.kind}`;
  check(ring.visible, `${label}: focus is visible`);
  check(ring.outlineStyle !== 'none', `${label}: an outline is drawn`);
  for (const side of ['left', 'top']) {
    check(
      ring.ring[side] >= ring.clip[side] - 0.01,
      `${label}: the ring's ${side} is inside the body`,
    );
  }
  for (const side of ['right', 'bottom']) {
    check(
      ring.ring[side] <= ring.clip[side] + 0.01,
      `${label}: the ring's ${side} is inside the body`,
    );
  }
}

assert.deepEqual(failures, [], failures.join('\n'));
console.log('ok — the seam follows the region, one content edge, every ring inside the body');
