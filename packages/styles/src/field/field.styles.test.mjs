import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/field/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./field.css', import.meta.url), 'utf8');
const normalized = css.replace(/\s+/g, '');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const part of ['label', 'description', 'error', 'control']) {
    assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
  }
});

test('styles every state the contract declares on the root', () => {
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.ok(normalized.includes(`[${attribute}]`), `Missing state ${state}`);
  }
});

test('documents exactly the public custom properties the stylesheet reads', () => {
  const declared = JSON.parse(
    readFileSync(new URL('./field.tokens.json', import.meta.url), 'utf8'),
  );
  const referenced = [
    ...new Set([...css.matchAll(/var\((--slotted-[a-z0-9-]+)/g)].map(([, token]) => token)),
  ].sort();
  assert.deepEqual(declared, referenced);
});
