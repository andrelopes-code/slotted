import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'grid');
  assert.equal(contract.ui, 'grid');
  assert.equal(contract.schemaVersion, 5);
});

test('is one primitive with one part, because a container has no anatomy', () => {
  assert.deepEqual(Object.keys(contract.members), ['grid']);
  assert.deepEqual(contract.members.grid.parts, ['root']);
});

test('renders a div until the consumer says what the element is', () => {
  assert.equal(contract.members.grid.nativeElement, 'div');
});

test('carries no state, and no role: role=grid is a different widget entirely', () => {
  assert.deepEqual(contract.members.grid.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
  assert.ok(!('stateModel' in contract));
  assert.ok(!('role' in contract.members.grid));
});

test('arranges children, which is the capability it declares', () => {
  assert.deepEqual(contract.members.grid.capabilities, ['arrangement']);
});

test('reads the same space scale Stack and Inline read', () => {
  assert.deepEqual(contract.axes.gap, [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
  ]);
  assert.equal(contract.members.grid.defaults.gap, '6');
});

test('aligns inside the cell on both axes, because filled tracks distribute nothing', () => {
  assert.deepEqual(contract.axes.align, ['start', 'center', 'end', 'stretch']);
  assert.deepEqual(contract.axes.justify, ['start', 'center', 'end', 'stretch']);
});

test('counts columns up to twelve, and calls their absence auto', () => {
  assert.deepEqual(
    contract.axes.columns,
    ['auto', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    'auto is the absence of a stated count, not a thirteenth count',
  );
  assert.ok(
    !('columns' in contract.members.grid.defaults),
    'auto is what an unstated count means, so it is not a default value',
  );
});

test('bounds the narrowest a cell may get by a step, never by a length', () => {
  assert.deepEqual(contract.axes.minItemWidth, ['xs', 'sm', 'md', 'lg', 'xl']);
  assert.equal(contract.members.grid.defaults.minItemWidth, 'md');
});

test('decides separation and the narrowest cell, and nothing else', () => {
  assert.deepEqual(Object.keys(contract.members.grid.defaults), ['gap', 'minItemWidth']);
});

test('offers no axis that reorders or places children', () => {
  const axes = Object.keys(contract.axes);
  for (const axis of ['reverse', 'order', 'flow', 'dense', 'span', 'areas', 'rows']) {
    assert.ok(!axes.includes(axis), `${axis} makes the family a CSS dialect`);
  }
});

test('names one reference page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['grid']);
  assert.ok(contract.scenarios.grid.includes('reflow'));
  assert.ok(contract.scenarios.grid.includes('accessibility'));
});
