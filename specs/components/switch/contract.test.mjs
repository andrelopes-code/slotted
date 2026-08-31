import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, STATE_ATTRIBUTES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const input = JSON.parse(
  await readFile(new URL('../input/contract.json', import.meta.url), 'utf8'),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is a switch drawn on a button, with a thumb it moves', () => {
  assert.equal(contract.family, 'switch');
  assert.equal(contract.role, 'switch');
  assert.deepEqual(Object.keys(contract.members), ['switch']);
  assert.equal(contract.members.switch.nativeElement, 'button');
  assert.deepEqual(contract.members.switch.parts, ['root', 'thumb']);
});

test('reads its field the way every T3 control does, without repeating the rules', () => {
  assert.equal(contract.stateSource, input.stateSource);
  assert.equal(contract.mirrorsState, input.mirrorsState);
  assert.equal(contract.requiredAttribute, input.requiredAttribute);
  assert.equal(contract.disabledAttribute, input.disabledAttribute);
});

test('names the checked state in the shared vocabulary', () => {
  assert.equal(contract.stateAttributes.checked, STATE_ATTRIBUTES.checked);
  assert.ok(contract.members.switch.states.includes('checked'));
  assert.ok(contract.members.switch.capabilities.includes('checked'));
});

test('has no read-only state, and says why rather than pretending', () => {
  assert.ok(!('readonly' in contract.stateAttributes));
  assert.ok(!contract.members.switch.capabilities.includes('readOnly'));
  assert.equal(
    contract.readOnly,
    'unsupported',
    'A control that swallows clicks looks operable and is not; disable it instead',
  );
});

test('takes its keyboard from the button it is, and binds nothing', () => {
  assert.deepEqual(contract.keys, ['Space', 'Enter']);
  assert.equal(contract.keySource, 'button');
});

test('never submits the form it sits in', () => {
  assert.equal(contract.members.switch.defaults.type, 'button');
});

test('starts off, at the middle size', () => {
  assert.deepEqual(contract.members.switch.defaults, {
    checked: false,
    size: 'md',
    type: 'button',
  });
  assert.deepEqual(contract.axes.size, input.axes.size);
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['switch']);
  assert.deepEqual(contract.scenarios.switch, ['playground', 'sizes', 'states', 'field']);
});
