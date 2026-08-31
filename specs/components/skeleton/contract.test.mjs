import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because the family is one primitive', () => {
  assert.equal(contract.family, 'skeleton');
  assert.deepEqual(Object.keys(contract.members), ['skeleton']);
  assert.deepEqual(contract.members.skeleton.parts, ['root']);
});

test('names the three shapes a placeholder ever has to take', () => {
  assert.deepEqual(contract.axes, { shape: ['text', 'rectangle', 'circle'] });
  assert.equal(contract.members.skeleton.defaults.shape, 'text');
  assert.deepEqual(contract.members.skeleton.capabilities, ['shape']);
});

test('renders a span, so it can stand in for anything', () => {
  assert.equal(contract.members.skeleton.nativeElement, 'span');
});

test('carries no state: a placeholder is only ever waiting', () => {
  assert.deepEqual(contract.members.skeleton.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['skeleton']);
  assert.deepEqual(contract.scenarios.skeleton, [
    'playground',
    'shapes',
    'composition',
    'accessibility',
  ]);
});
