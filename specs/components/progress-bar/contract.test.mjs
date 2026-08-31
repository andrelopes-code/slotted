import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, STATE_ATTRIBUTES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because the family is one primitive', () => {
  assert.equal(contract.family, 'progress-bar');
  assert.deepEqual(Object.keys(contract.members), ['progressBar']);
});

test('is a div carrying the progressbar role, not a native progress element', () => {
  assert.equal(contract.members.progressBar.nativeElement, 'div');
  assert.equal(contract.role, 'progressbar');
});

test('names the filled part, and lets the root be the track', () => {
  assert.deepEqual(contract.members.progressBar.parts, ['root', 'indicator']);
});

test('measures against a maximum, counting from zero', () => {
  assert.deepEqual(contract.members.progressBar.capabilities, ['measurement']);
  assert.equal(contract.members.progressBar.defaults.max, 100);
  assert.equal(contract.min, 0);
});

test('holds one state, for the progress nobody can measure', () => {
  assert.deepEqual(contract.stateAttributes, { indeterminate: 'data-indeterminate' });
  assert.equal(STATE_ATTRIBUTES.indeterminate, 'data-indeterminate');
  assert.deepEqual(contract.members.progressBar.states, ['default', 'indeterminate']);
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['progressBar']);
  assert.deepEqual(contract.scenarios.progressBar, [
    'playground',
    'values',
    'indeterminate',
    'accessibility',
  ]);
});
