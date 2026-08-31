import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const progressContract = JSON.parse(
  await readFile(new URL('../progress-bar/contract.json', import.meta.url), 'utf8'),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member with the same two parts as the progress bar', () => {
  assert.equal(contract.family, 'loading-bar');
  assert.deepEqual(Object.keys(contract.members), ['loadingBar']);
  assert.deepEqual(contract.members.loadingBar.parts, progressContract.members.progressBar.parts);
});

test('reports progress the same way, because it is the same measurement', () => {
  assert.equal(contract.role, progressContract.role);
  assert.equal(contract.min, progressContract.min);
  assert.equal(contract.members.loadingBar.defaults.max, 100);
  assert.deepEqual(contract.stateAttributes, progressContract.stateAttributes);
});

test('differs from the progress bar in where it sits, and only there', () => {
  assert.deepEqual(contract.axes, { placement: ['inline', 'fixed'] });
  assert.deepEqual(contract.members.loadingBar.capabilities, ['measurement', 'placement']);
  assert.equal(contract.members.loadingBar.defaults.placement, 'inline');
});

test('holds the same one state, for progress nobody can measure', () => {
  assert.deepEqual(contract.members.loadingBar.states, ['default', 'indeterminate']);
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['loadingBar']);
  assert.deepEqual(contract.scenarios.loadingBar, [
    'playground',
    'placement',
    'indeterminate',
    'accessibility',
  ]);
});
