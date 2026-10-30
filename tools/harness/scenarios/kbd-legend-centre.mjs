import assert from 'node:assert/strict';

import { buildReactPage } from '../react-page.mjs';
import { launch } from '../shoot.mjs';

/**
 * Where a key's legend stands, read in Chrome: in a `Button`'s `end` slot, the
 * centre of every `[data-part=legend]` of a `Kbd` and of a `Shortcut` is the
 * centre of the button's `[data-part=label]`, and the centre of the key box
 * that holds it, at sizes `xs`, `sm` and `inherit` and variants `plain` and
 * `outline`.
 *
 * The request came from an application: with `size="inherit"
 * variant="plain"`, a `Kbd` stood its legend 1.5px above the label's centre
 * and a `Shortcut` 1.5px below it — the shortcut's root kept the user agent's
 * monospace face and a 16px line box, and its keys sat on that line's
 * baseline.
 *
 * Run: node tools/harness/scenarios/kbd-legend-centre.mjs
 * Exits non-zero when an assertion fails.
 */

const SIZES = ['xs', 'sm', 'inherit'];
const VARIANTS = ['plain', 'outline'];

const entry = `
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@slotted/react/button';
import { Kbd, Shortcut } from '@slotted/react/kbd';

const sizes = ${JSON.stringify(SIZES)};
const variants = ${JSON.stringify(VARIANTS)};
const rows = [];
for (const size of sizes) {
  for (const variant of variants) {
    rows.push(
      h(
        'div',
        { key: size + variant + 'kbd', 'data-probe': 'kbd ' + size + ' ' + variant, style: { inlineSize: '240px' } },
        h(Button, { justify: 'between', end: h(Kbd, { size, variant }, 'N') }, 'New'),
      ),
      h(
        'div',
        { key: size + variant + 'shortcut', 'data-probe': 'shortcut ' + size + ' ' + variant, style: { inlineSize: '240px' } },
        h(Button, { justify: 'between', end: h(Shortcut, { keys: 'mod+k', platform: 'windows', size, variant }) }, 'Search'),
      ),
    );
  }
}

createRoot(document.getElementById('root')).render(
  h('div', { style: { display: 'grid', gap: '12px', padding: '24px' } }, rows),
);
`;

const READ = `(async () => {
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const centre = (node) => {
    const box = node.getBoundingClientRect();
    return box.top + box.height / 2;
  };
  return [...document.querySelectorAll('[data-probe]')].map((probe) => {
    const label = probe.querySelector('[data-part="label"]');
    const legends = [...probe.querySelectorAll('[data-part="legend"]')];
    return {
      probe: probe.getAttribute('data-probe'),
      label: centre(label),
      legends: legends.map((legend) => ({
        text: legend.textContent,
        legend: centre(legend),
        key: centre(legend.closest('[data-part="root"]')),
        keyTop: legend.closest('[data-part="root"]').getBoundingClientRect().top,
        legendTop: legend.getBoundingClientRect().top,
      })),
    };
  });
})()`;

const url = await buildReactPage('kbd-legend-centre', entry);
const { devtools, close } = await launch();
let reading;

try {
  await devtools.send('Page.enable');
  await devtools.send('Runtime.enable');
  await devtools.send('Emulation.setDeviceMetricsOverride', {
    width: 800,
    height: 1200,
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

const failures = [];
for (const row of reading) {
  for (const legend of row.legends) {
    const offLabel = legend.legend - row.label;
    const offKey = legend.legend - legend.key;
    const keyOffLabel = legend.key - row.label;
    console.log(
      `${row.probe.padEnd(24)} ${legend.text.padEnd(5)} legend−label ${offLabel.toFixed(2)}  legend−key ${offKey.toFixed(2)}  key−label ${keyOffLabel.toFixed(2)}  legend top ${(legend.legendTop - legend.keyTop).toFixed(2)}`,
    );
    if (Math.abs(offLabel) > 0.5)
      failures.push(`${row.probe} ${legend.text}: legend ${offLabel.toFixed(2)}px off the label`);
    if (Math.abs(offKey) > 0.5)
      failures.push(`${row.probe} ${legend.text}: legend ${offKey.toFixed(2)}px off its key`);
    if (legend.legendTop < legend.keyTop - 0.01)
      failures.push(`${row.probe} ${legend.text}: legend box overflows the key's top`);
  }
}

assert.deepEqual(failures, [], failures.join('\n'));
console.log('ok — every legend on its key and on the label');
