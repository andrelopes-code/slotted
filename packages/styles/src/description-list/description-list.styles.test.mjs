import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/description-list/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./description-list.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const part of ['term', 'details']) {
    assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
  }
});

test('answers the orientation that needs columns, and lets the other be the default', () => {
  assert.ok(
    normalized.includes(".slotted-description-list[data-orientation='horizontal']"),
    'Missing the horizontal arrangement',
  );
  assert.ok(
    contract.orientations.includes('vertical'),
    'The stacked arrangement is the bare grid, so it needs no rule of its own',
  );
});

test('pins each part to a column, so several details stay under one term', () => {
  assert.ok(collapsed.includes("[data-part='term'] { grid-column: 1"), 'The term is unpinned');
  assert.ok(
    collapsed.includes("[data-part='details'] { grid-column: 2"),
    'A second detail would take the next term’s cell',
  );
});

test('clears the indent the user agent puts on a dd', () => {
  const details = collapsed
    .split(".slotted-description-list [data-part='details'] {")[1]
    ?.split('}')[0];
  assert.ok(details?.includes('margin: 0'), 'The default dd indent would fight the grid gap');
});
