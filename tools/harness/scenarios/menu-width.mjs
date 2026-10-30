import assert from 'node:assert/strict';

import { buildReactPage } from '../react-page.mjs';
import { launch } from '../shoot.mjs';

/**
 * `width="anchor"` on a menu, read in Chrome: a menu opened from a 240px
 * trigger is 240px wide, and one opened from a 120px trigger is 120px — under
 * the family's floor, which `anchor` drops. A menu at `content` keeps its own
 * measure.
 *
 * The request came from an application whose account switcher, at the foot of
 * a sidebar, opened a menu narrower or wider than the full-width row that
 * opened it.
 *
 * Run: node tools/harness/scenarios/menu-width.mjs
 * Exits non-zero when an assertion fails.
 */

const entry = `
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';

const menu = (probe, width, triggerWidth) =>
  h(
    'div',
    { 'data-probe': probe, style: { blockSize: '200px' } },
    h(
      Menu,
      { defaultOpen: true, width, portal: false },
      h(MenuTrigger, { style: { inlineSize: triggerWidth + 'px', boxSizing: 'border-box' } }, 'Account'),
      h(MenuContent, { 'aria-label': probe }, h(MenuItem, { value: 'switch' }, 'Switch')),
    ),
  );

createRoot(document.getElementById('root')).render(
  h(
    'div',
    { style: { padding: '24px' } },
    menu('anchor 240', 'anchor', 240),
    menu('anchor 120', 'anchor', 120),
    menu('content 240', 'content', 240),
  ),
);
`;

const READ = `(async () => {
  for (let index = 0; index < 10; index += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
  return [...document.querySelectorAll('[data-probe]')].map((probe) => ({
    probe: probe.getAttribute('data-probe'),
    trigger: probe.querySelector('[aria-haspopup="menu"]').getBoundingClientRect().width,
    content: document.querySelector('[role="menu"][aria-label="' + probe.getAttribute('data-probe') + '"]').getBoundingClientRect().width,
  }));
})()`;

const url = await buildReactPage('menu-width', entry);
const { devtools, close } = await launch();
let reading;

try {
  await devtools.send('Page.enable');
  await devtools.send('Runtime.enable');
  await devtools.send('Emulation.setDeviceMetricsOverride', {
    width: 800,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const loaded = devtools.once('Page.loadEventFired');
  await devtools.send('Page.navigate', { url: url.href });
  await loaded;
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

for (const row of reading) {
  console.log(`${row.probe.padEnd(12)} trigger ${row.trigger}  content ${row.content}`);
}

const [wide, narrow, content] = reading;
assert.equal(wide.content, 240, 'anchor: the content is as wide as a 240px trigger');
assert.equal(narrow.content, 120, 'anchor: the content follows a trigger under the floor');
assert.notEqual(content.content, 240, 'content: the menu keeps its own measure');
console.log('ok — the anchor sets the width');
