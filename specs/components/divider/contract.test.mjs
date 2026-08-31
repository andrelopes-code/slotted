import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because the family is one primitive', () => {
  assert.equal(contract.family, 'divider');
  assert.deepEqual(Object.keys(contract.members), ['divider']);
  assert.ok(!('axes' in contract), 'the family has no appearance axes');
});

test('renders an hr, the element that already means separation', () => {
  assert.equal(contract.members.divider.nativeElement, 'hr');
  assert.deepEqual(contract.members.divider.parts, ['root']);
});

test('names both orientations and defaults to the reading direction', () => {
  assert.deepEqual(contract.orientations, ['horizontal', 'vertical']);
  assert.equal(contract.members.divider.defaults.orientation, 'horizontal');
});

test('lets a separator step out of the accessibility tree', () => {
  assert.deepEqual(contract.members.divider.capabilities, ['orientation', 'decorative']);
  assert.equal(contract.members.divider.defaults.decorative, false);
});

test('carries no state attribute, because the primitive has no state', () => {
  assert.deepEqual(contract.members.divider.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['divider']);
  assert.deepEqual(contract.scenarios.divider, [
    'playground',
    'orientations',
    'decorative',
    'composition',
  ]);
});
