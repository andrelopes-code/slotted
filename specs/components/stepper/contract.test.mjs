import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is an ordered list of steps, each with a marker and a label', () => {
  assert.equal(contract.family, 'stepper');
  assert.deepEqual(Object.keys(contract.members), [
    'stepper',
    'stepperStep',
    'stepperMarker',
    'stepperLabel',
  ]);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, m]) => [name, m.nativeElement]),
    ),
    { stepper: 'ol', stepperStep: 'li', stepperMarker: 'span', stepperLabel: 'span' },
  );
});

test('names the three places a step can be in the flow', () => {
  assert.deepEqual(contract.axes, { status: ['upcoming', 'current', 'complete'] });
  assert.deepEqual(contract.members.stepperStep.capabilities, ['status']);
  assert.equal(contract.members.stepperStep.defaults.status, 'upcoming');
});

test('arranges the steps along one axis', () => {
  assert.deepEqual(contract.orientations, ['horizontal', 'vertical']);
  assert.deepEqual(contract.members.stepper.capabilities, ['orientation']);
  assert.equal(contract.members.stepper.defaults.orientation, 'horizontal');
});

test('has no connector member, because a line between steps is not content', () => {
  assert.equal(contract.connector, 'stylesheet');
  assert.ok(!('stepperConnector' in contract.members));
});

test('holds status as an axis and no boolean state', () => {
  for (const member of Object.values(contract.members)) {
    assert.deepEqual(member.states, ['default']);
  }
  assert.ok(!('stateAttributes' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['stepper']);
  assert.deepEqual(contract.scenarios.stepper, [
    'playground',
    'status',
    'orientations',
    'composition',
  ]);
});
