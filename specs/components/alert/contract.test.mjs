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

test('names the message and its four regions', () => {
  assert.equal(contract.family, 'alert');
  assert.deepEqual(Object.keys(contract.members), [
    'alert',
    'alertIcon',
    'alertTitle',
    'alertDescription',
    'alertActions',
  ]);
});

test('paints the same five tones the rest of the library names', () => {
  assert.deepEqual(contract.axes.variant, badgeContract.axes.variant);
  assert.deepEqual(contract.axes.fill, ['subtle', 'outline', 'solid']);
  assert.deepEqual(contract.axes.size, ['sm', 'md']);
});

test('is quiet by default, and says so as a capability', () => {
  assert.deepEqual(contract.liveness, ['off', 'polite', 'assertive']);
  assert.deepEqual(contract.members.alert.capabilities, ['appearance', 'live']);
  assert.deepEqual(contract.members.alert.defaults, {
    variant: 'accent',
    fill: 'subtle',
    size: 'md',
    live: 'off',
  });
});

test('names one part per member', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(contract.members).map(([name, m]) => [name, m.parts])),
    {
      alert: ['root'],
      alertIcon: ['icon'],
      alertTitle: ['title'],
      alertDescription: ['description'],
      alertActions: ['actions'],
    },
  );
});

test('carries no attribute state: a message does not respond', () => {
  for (const member of Object.values(contract.members)) {
    assert.deepEqual(member.states, ['default']);
  }
  assert.ok(!('stateAttributes' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['alert']);
  assert.deepEqual(contract.scenarios.alert, ['playground', 'appearance', 'live', 'composition']);
});
