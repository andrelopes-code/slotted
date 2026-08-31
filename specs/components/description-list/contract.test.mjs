import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares the three elements the platform already pairs', () => {
  assert.equal(contract.family, 'description-list');
  assert.deepEqual(Object.keys(contract.members), [
    'descriptionList',
    'descriptionTerm',
    'descriptionDetails',
  ]);
});

test('uses the native list elements, which carry the pairing themselves', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, member]) => [name, member.nativeElement]),
    ),
    { descriptionList: 'dl', descriptionTerm: 'dt', descriptionDetails: 'dd' },
  );
});

test('names one part per member', () => {
  assert.deepEqual(contract.members.descriptionList.parts, ['root']);
  assert.deepEqual(contract.members.descriptionTerm.parts, ['term']);
  assert.deepEqual(contract.members.descriptionDetails.parts, ['details']);
});

test('arranges the pair along one axis, stacked by default', () => {
  assert.deepEqual(contract.orientations, ['horizontal', 'vertical']);
  assert.deepEqual(contract.members.descriptionList.capabilities, ['orientation']);
  assert.equal(contract.members.descriptionList.defaults.orientation, 'vertical');
});

test('carries no state: a pair of facts does not respond to anything', () => {
  for (const member of Object.values(contract.members)) {
    assert.deepEqual(member.states, ['default']);
  }
  assert.ok(!('stateAttributes' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['descriptionList']);
  assert.deepEqual(contract.scenarios.descriptionList, [
    'playground',
    'orientations',
    'composition',
    'accessibility',
  ]);
});
