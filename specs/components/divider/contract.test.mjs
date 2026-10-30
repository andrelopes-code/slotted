import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'divider');
  assert.equal(contract.ui, 'divider');
  assert.equal(contract.schemaVersion, 5);
});

test('is one rule, and the label is a part of it rather than a second family', () => {
  assert.deepEqual(Object.keys(contract.members), ['divider']);
  assert.deepEqual(contract.members.divider.parts, ['root', 'label']);
});

test('renders the element that already means separation', () => {
  assert.equal(contract.members.divider.nativeElement, 'hr');
});

/**
 * `hr` takes no content, so the element has to change to carry a label. The
 * swap is the one fact a consumer cannot discover from the props, so the
 * contract states it rather than leaving it to the implementation.
 */
test('states the element a labelled rule renders instead', () => {
  assert.equal(contract.labelledElement, 'div');
});

test('carries no state: a rule does not move', () => {
  assert.deepEqual(contract.members.divider.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
  assert.ok(!('stateModel' in contract));
});

test('declares the two capabilities the shared vocabulary has words for', () => {
  assert.deepEqual(contract.members.divider.capabilities, ['orientation', 'decorative']);
});

test('runs in two directions and defaults to the one a separator implies', () => {
  assert.deepEqual(contract.axes.orientation, ['horizontal', 'vertical']);
  assert.equal(contract.members.divider.defaults.orientation, 'horizontal');
});

test('is announced until it is asked to be decoration', () => {
  assert.equal(contract.members.divider.defaults.decorative, false);
});

test('runs edge to edge until it is asked to stop short', () => {
  assert.equal(contract.members.divider.defaults.inset, false);
});

test('puts a label in the middle of the rule, and offers both ends', () => {
  assert.deepEqual(contract.axes.align, ['start', 'center', 'end']);
  assert.equal(contract.members.divider.defaults.align, 'center');
});

test('names one reference page, covering the label and the decoration', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['divider']);
  for (const id of ['playground', 'orientations', 'label', 'decorative', 'composition']) {
    assert.ok(contract.scenarios.divider.includes(id), `no scenario covers ${id}`);
  }
});
