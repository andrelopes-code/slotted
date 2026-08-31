import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(new URL('../../../../specs/components/card/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./card.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const member of Object.values(contract.members)) {
    for (const part of member.parts) {
      if (part === 'root') continue;
      assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
    }
  }
});

test('paints nothing by default, so a card sits on the page it is placed on', () => {
  const root = collapsed.split('.slotted-card {')[1]?.split('}')[0];
  assert.ok(
    root?.includes('background-color: var(--slotted-card-background, transparent)'),
    'The theme owns no neutral surface colour, so the default is no colour at all',
  );
});

test('gives a region at either end the padding its missing neighbour would carry', () => {
  assert.ok(
    normalized.includes("[data-part='body']:first-child"),
    'A card of only a body would otherwise sit tighter than a full one',
  );
  assert.ok(normalized.includes("[data-part='body']:last-child"), 'The same at the end');
});
