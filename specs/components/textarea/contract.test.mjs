import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const input = JSON.parse(
  await readFile(new URL('../input/contract.json', import.meta.url), 'utf8'),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is one member, on the element the platform already has', () => {
  assert.equal(contract.family, 'textarea');
  assert.deepEqual(Object.keys(contract.members), ['textarea']);
  assert.equal(contract.members.textarea.nativeElement, 'textarea');
  assert.deepEqual(contract.members.textarea.parts, ['root']);
});

test('reads its field the way every T3 control does, without repeating the rules', () => {
  assert.equal(contract.stateSource, input.stateSource);
  assert.equal(contract.mirrorsState, input.mirrorsState);
  assert.equal(contract.requiredAttribute, input.requiredAttribute);
  assert.equal(contract.disabledAttribute, input.disabledAttribute);
  assert.deepEqual(contract.stateAttributes, input.stateAttributes);
});

test('takes the same size scale and the same states as the single-line control', () => {
  assert.deepEqual(contract.axes.size, input.axes.size);
  assert.deepEqual(contract.members.textarea.states, input.members.input.states);
  assert.deepEqual(contract.members.textarea.capabilities, input.members.input.capabilities);
});

test('owns its size and how many rows it starts at', () => {
  assert.deepEqual(contract.members.textarea.defaults, { autoSize: false, rows: 3, size: 'md' });
});

test('grows with its content through the platform, not through measurement', () => {
  assert.equal(
    contract.autoSizeMechanism,
    'field-sizing',
    'Measuring scrollHeight on every keystroke is a layout thrash the platform now answers itself',
  );
  assert.equal(
    contract.autoSizeFloor,
    'rows',
    'rows stays the smallest the control gets, so an unsupporting browser degrades to it',
  );
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['textarea']);
  assert.deepEqual(contract.scenarios.textarea, ['playground', 'sizes', 'states', 'auto-size']);
});
