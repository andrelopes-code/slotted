import assert from 'node:assert/strict';

import { buildReactPage } from '../react-page.mjs';
import { launch } from '../shoot.mjs';

/**
 * A family placed inside a stat card renders as it does outside it: the
 * card's part rules reach the card's own parts and stop at a nested family's.
 *
 * The request came from an application whose success badge in
 * `StatCardStatus` printed grey 13-pixel text inside a green border: the rule
 * for the card's `label` part matched the badge's `label` part as well.
 *
 * The page renders the same badge twice, inside `StatCardStatus` and beside the
 * card, and reads the computed colour, size and weight of each badge's label.
 *
 * The other half is the card inside a family: a stat card whose parent carries
 * `data-ui` — a `Grid` — took its own root for the scope's limit, and no part
 * rule applied (the value at the inherited 16 pixels, the body without its
 * grid). The page renders the same card under a `Grid` and under a plain
 * element and compares the value's size and the body's display.
 *
 * Run: node tools/harness/scenarios/stat-card-nested.mjs
 * Exits non-zero when the two differ.
 */

const entry = `
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { Badge } from '@slotted/react/badge';
import { Grid } from '@slotted/react/grid';
import {
  StatCard,
  StatCardFigure,
  StatCardHeader,
  StatCardLabel,
  StatCardStatus,
  StatCardValue,
} from '@slotted/react/stat-card';

const badge = () => h(Badge, { tone: 'success', variant: 'soft', size: 'sm' }, 'Paid');
const card = (probe) =>
  h(StatCard, { 'data-probe': probe },
    h(StatCardHeader, null, h(StatCardLabel, null, 'L')),
    h(StatCardFigure, null, h(StatCardValue, { value: 'R$ 1' })),
  );

createRoot(document.getElementById('root')).render(
  h('div', { style: { padding: '24px', display: 'grid', gap: '24px', inlineSize: '360px' } },
    h('div', { 'data-probe': 'outside' }, badge()),
    h(StatCard, null,
      h(StatCardHeader, null, h(StatCardLabel, null, 'Card'), h(StatCardStatus, null, badge())),
      h(StatCardFigure, null, h(StatCardValue, { value: '1' })),
    ),
    h('div', null, card('plain')),
    h(Grid, null, card('in-grid')),
  ),
);
`;

const url = await buildReactPage('stat-card-nested', entry);

const READ = `(() => {
  const read = (badge) => {
    const style = getComputedStyle(badge.querySelector('[data-part="label"]'));
    return { color: style.color, fontSize: style.fontSize, fontWeight: style.fontWeight };
  };
  const card = (probe) => {
    const root = document.querySelector('[data-probe="' + probe + '"]');
    return {
      valueSize: getComputedStyle(root.querySelector('[data-part="value"]')).fontSize,
      bodyDisplay: getComputedStyle(root.querySelector('[data-part="body"]')).display,
    };
  };
  return {
    outside: read(document.querySelector('[data-probe="outside"] [data-ui="badge"]')),
    inside: read(document.querySelector('[data-ui="stat-card"] [data-ui="badge"]')),
    plain: card('plain'),
    grid: card('in-grid'),
  };
})()`;

const { devtools, close } = await launch();
let reading;
try {
  await devtools.send('Page.enable');
  await devtools.send('Runtime.enable');
  const loaded = devtools.once('Page.loadEventFired');
  await devtools.send('Page.navigate', { url: url.href });
  await loaded;
  await new Promise((resolve) => setTimeout(resolve, 300));
  reading = (await devtools.send('Runtime.evaluate', { expression: READ, returnByValue: true }))
    .result.value;
} finally {
  devtools.close();
  await close();
}

console.log(JSON.stringify(reading));
assert.deepEqual(reading.inside, reading.outside, 'the badge inside the card renders as outside');
assert.deepEqual(
  reading.grid,
  reading.plain,
  'the card inside a Grid renders as under a plain element',
);
assert.notEqual(
  reading.plain.valueSize,
  '16px',
  'the value takes the family size, not the inherited one',
);
console.log(
  'ok — the card styles its own parts, stops at a nested family, and keeps its rules under a family parent',
);
