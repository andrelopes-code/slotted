import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'stack');
  assert.equal(contract.ui, 'stack');
  assert.equal(contract.schemaVersion, 5);
});

test('is one primitive with one part, because a container has no anatomy', () => {
  assert.deepEqual(Object.keys(contract.members), ['stack']);
  assert.deepEqual(contract.members.stack.parts, ['root']);
});

test('renders a div until the consumer says what the element is', () => {
  assert.equal(contract.members.stack.nativeElement, 'div');
});

test('carries no state: a layout does not change, its content does', () => {
  assert.deepEqual(contract.members.stack.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
  assert.ok(!('stateModel' in contract));
});

test('arranges children, which is the capability it declares', () => {
  assert.deepEqual(contract.members.stack.capabilities, ['arrangement']);
});

test('bounds separation by the space scale, plus the absence of it', () => {
  assert.deepEqual(
    contract.axes.gap,
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    'gap is a step on --slotted-space-*, never a length',
  );
});

test('separates blocks at the step that clears the default line height', () => {
  assert.equal(contract.members.stack.defaults.gap, '6');
});

test('aligns across the flow and justifies along it', () => {
  assert.deepEqual(contract.axes.align, ['start', 'center', 'end', 'stretch']);
  assert.deepEqual(contract.axes.justify, [
    'start',
    'center',
    'end',
    'between',
    'around',
    'evenly',
  ]);
});

test('defaults only the axis it decides, so the rest are the platform initial value', () => {
  assert.deepEqual(Object.keys(contract.members.stack.defaults), ['gap']);
});

test('offers no axis that reorders children', () => {
  const axes = Object.keys(contract.axes);
  for (const axis of ['reverse', 'direction', 'order', 'flow']) {
    assert.ok(!axes.includes(axis), `${axis} would let CSS disagree with the reading order`);
  }
});

test('names one reference page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['stack']);
  assert.ok(contract.scenarios.stack.includes('composition'));
  assert.ok(contract.scenarios.stack.includes('accessibility'));
});
