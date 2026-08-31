import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const badgeContract = JSON.parse(
  await readFile(new URL('../badge/contract.json', import.meta.url), 'utf8'),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is a value and the control that removes it', () => {
  assert.equal(contract.family, 'tag');
  assert.deepEqual(Object.keys(contract.members), ['tag', 'tagRemove']);
  assert.equal(contract.members.tag.nativeElement, 'span');
  assert.equal(contract.members.tagRemove.nativeElement, 'button');
});

test('borrows the badge appearance rather than naming a second one', () => {
  assert.deepEqual(contract.axes, badgeContract.axes);
  assert.deepEqual(contract.members.tag.defaults, badgeContract.members.badge.defaults);
});

test('names one part per member', () => {
  assert.deepEqual(contract.members.tag.parts, ['root']);
  assert.deepEqual(contract.members.tagRemove.parts, ['remove']);
});

test('gives the remove control the states a button has', () => {
  assert.deepEqual(contract.members.tagRemove.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'disabled',
  ]);
  assert.deepEqual(contract.members.tag.states, ['default']);
  assert.deepEqual(contract.stateAttributes, { disabled: 'data-disabled' });
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['tag']);
  assert.deepEqual(contract.scenarios.tag, [
    'playground',
    'appearance',
    'removable',
    'composition',
  ]);
});
