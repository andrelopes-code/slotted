import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'inline');
  assert.equal(contract.ui, 'inline');
  assert.equal(contract.schemaVersion, 5);
});

test('is one primitive with one part, because a container has no anatomy', () => {
  assert.deepEqual(Object.keys(contract.members), ['inline']);
  assert.deepEqual(contract.members.inline.parts, ['root']);
});

test('renders a div until the consumer says what the element is', () => {
  assert.equal(contract.members.inline.nativeElement, 'div');
});

test('carries no state: a layout does not change, its content does', () => {
  assert.deepEqual(contract.members.inline.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
  assert.ok(!('stateModel' in contract));
});

test('arranges children, which is the capability it declares', () => {
  assert.deepEqual(contract.members.inline.capabilities, ['arrangement']);
});

test('reads the same space scale Stack and Grid read', () => {
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
});

test('separates items at a step below the line height, so the run reads as one line', () => {
  assert.equal(contract.members.inline.defaults.gap, '4');
});

test('adds the baseline, because items on a line can share one', () => {
  assert.deepEqual(contract.axes.align, ['start', 'center', 'end', 'stretch', 'baseline']);
  assert.equal(contract.members.inline.defaults.align, 'center');
});

test('justifies along the flow with the three distributions', () => {
  assert.deepEqual(contract.axes.justify, [
    'start',
    'center',
    'end',
    'between',
    'around',
    'evenly',
  ]);
});

test('wraps by default, because a row that cannot wrap overflows a narrow container', () => {
  assert.deepEqual(contract.axes.wrap, ['wrap', 'nowrap']);
  assert.equal(contract.members.inline.defaults.wrap, 'wrap');
});

test('decides separation, cross alignment and wrapping, and nothing else', () => {
  assert.deepEqual(Object.keys(contract.members.inline.defaults), ['gap', 'align', 'wrap']);
});

test('offers no axis that reorders children', () => {
  const axes = Object.keys(contract.axes);
  for (const axis of ['reverse', 'direction', 'order', 'flow']) {
    assert.ok(!axes.includes(axis), `${axis} would let CSS disagree with the reading order`);
  }
});

test('names one reference page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['inline']);
  assert.ok(contract.scenarios.inline.includes('wrapping'));
  assert.ok(contract.scenarios.inline.includes('accessibility'));
});
