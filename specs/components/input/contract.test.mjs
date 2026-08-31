import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is one member, on the element the platform already has', () => {
  assert.equal(contract.family, 'input');
  assert.deepEqual(Object.keys(contract.members), ['input']);
  assert.equal(contract.members.input.nativeElement, 'input');
  assert.deepEqual(contract.members.input.parts, ['root']);
});

test('takes the size scale the button family already names', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(contract.members.input.defaults.size, 'md');
});

test('owns its size and nothing else, because the rest comes from the field', () => {
  assert.deepEqual(contract.members.input.defaults, { size: 'md' });
  assert.equal(
    contract.stateSource,
    'field',
    'An unset state defers to the field; a set one wins over it',
  );
});

test('mirrors the field states it paints, and names them the way the field does', () => {
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.equal(attribute, field.stateAttributes[state], `${state} disagrees with the field`);
    assert.ok(contract.members.input.states.includes(state), `Missing state ${state}`);
  }
  assert.deepEqual(Object.keys(contract.stateAttributes), ['disabled', 'invalid', 'readonly']);
  assert.equal(
    contract.mirrorsState,
    true,
    'A descendant selector from the field cannot style a control used outside one',
  );
});

test('does not mirror required: the marker belongs to the label, not the control', () => {
  assert.ok(!('required' in contract.stateAttributes));
  assert.ok(contract.members.input.capabilities.includes('required'));
  assert.equal(
    contract.requiredAttribute,
    'aria-required',
    'The prop still describes the control; it just paints nothing on it',
  );
});

test('answers the pointer and the keyboard as a control must', () => {
  for (const state of ['hover', 'focus-visible']) {
    assert.ok(contract.members.input.states.includes(state), `Missing state ${state}`);
  }
});

test('describes itself with aria-required, never the native attribute', () => {
  assert.equal(contract.requiredAttribute, 'aria-required');
  assert.equal(
    contract.disabledAttribute,
    'disabled',
    'disabled is what removes a control from the tab order, so it is set natively',
  );
});

test('declares the capabilities its reference page must document', () => {
  assert.deepEqual(contract.members.input.capabilities, [
    'size',
    'disabled',
    'invalid',
    'required',
    'readOnly',
  ]);
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['input']);
  assert.deepEqual(contract.scenarios.input, ['playground', 'sizes', 'states', 'field']);
});
