import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because the family is one primitive', () => {
  assert.equal(contract.family, 'kbd');
  assert.deepEqual(Object.keys(contract.members), ['kbd']);
  assert.deepEqual(contract.members.kbd.parts, ['root']);
});

test('renders the element the platform already has for a key', () => {
  assert.equal(contract.members.kbd.nativeElement, 'kbd');
});

test('sizes a key for a menu row and for a shortcut list', () => {
  assert.deepEqual(contract.axes, { size: ['sm', 'md'] });
  assert.deepEqual(contract.members.kbd.capabilities, ['size']);
  assert.equal(contract.members.kbd.defaults.size, 'md');
});

test('carries no state: a key legend never changes', () => {
  assert.deepEqual(contract.members.kbd.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['kbd']);
  assert.deepEqual(contract.scenarios.kbd, ['playground', 'sizes', 'composition', 'accessibility']);
});
