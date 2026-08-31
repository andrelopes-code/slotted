import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is one element with one part, and the controls are the consumer’s', () => {
  assert.equal(contract.family, 'toolbar');
  assert.deepEqual(Object.keys(contract.members), ['toolbar']);
  assert.equal(contract.members.toolbar.nativeElement, 'div');
  assert.deepEqual(contract.members.toolbar.parts, ['root']);
});

test('carries the toolbar role, which is what makes it one tab stop', () => {
  assert.equal(contract.role, 'toolbar');
});

test('finds its controls rather than requiring a member to mark them', () => {
  assert.equal(contract.items, 'focusable-children');
  assert.ok(!('toolbarItem' in contract.members));
});

test('arranges its controls along one axis and wraps at the ends', () => {
  assert.deepEqual(contract.orientations, ['horizontal', 'vertical']);
  assert.deepEqual(contract.members.toolbar.capabilities, ['orientation']);
  assert.equal(contract.members.toolbar.defaults.orientation, 'horizontal');
  assert.equal(contract.loop, true);
});

test('carries no state: a toolbar is a container', () => {
  assert.deepEqual(contract.members.toolbar.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['toolbar']);
  assert.deepEqual(contract.scenarios.toolbar, [
    'playground',
    'orientations',
    'keyboard',
    'composition',
  ]);
});
