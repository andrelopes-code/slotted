import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/collapsible/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./collapsible.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const member of Object.values(contract.members)) {
    for (const part of member.parts) {
      if (part === 'root') continue;
      assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
    }
  }
});

test('reads the state from the attribute the platform sets', () => {
  assert.ok(
    normalized.includes(`.slotted-collapsible[${contract.openAttribute}]`),
    'The open state should be read from [open], not from a data attribute',
  );
});

test('removes both disclosure markers the engines draw', () => {
  assert.ok(normalized.includes('list-style:none'), 'Missing the standard removal');
  assert.ok(
    normalized.includes('::-webkit-details-marker{display:none;}'),
    'Safari draws its own marker through a pseudo-element no standard property reaches',
  );
});

test('draws its own marker with logical borders, so it points the way text reads', () => {
  assert.ok(
    normalized.includes('border-inline-start:var(--slotted-collapsible-marker-size'),
    'A physical border would point the wrong way in a right-to-left document',
  );
  assert.ok(normalized.includes('rotate:90deg'), 'The marker should turn with the state');
});

test('reacts to every state the trigger declares', () => {
  for (const state of contract.members.collapsibleTrigger.states) {
    if (state === 'default') continue;
    assert.ok(
      normalized.includes(`[data-part='trigger']:${state}`),
      `Missing trigger state ${state}`,
    );
  }
});
