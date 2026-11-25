import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.clock;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

/**
 * A step of one minute is sixty units and a step of a quarter of an hour four,
 * and both are drawn whole. What is refused is a list that scrolls: the shape
 * answers the step, and every unit stays in view.
 */
test('draws the units of every step in view, by a column count the step decides', () => {
  assert.deepEqual(contract.shape.minuteColumns, { upTo4: 4, upTo12: 6, above12: 10 });
  assert.ok(!member.parts.includes('list'));
});

/**
 * An arrow that chose would write a time at every step of a walk, and a picker
 * that closes on a choice would close under the reader's first arrow.
 */
test('moves focus with the arrows and chooses with a press', () => {
  assert.equal(contract.selectionFollowsFocus, false);
  assert.equal(contract.controlRole, 'listbox');
  assert.deepEqual(
    contract.keyboard.filter((entry) => entry.effect === 'select').map((entry) => entry.key),
    ['Enter', 'Space'],
  );
});

test('keeps a refused option focusable', () => {
  assert.equal(contract.unavailable.attribute, 'aria-disabled');
  assert.equal(contract.unavailable.focusable, true);
  assert.equal(contract.unavailable.selectable, false);
});

test('tells which unit a press wrote', () => {
  assert.ok(contract.stateModel.value.carries.includes('unit'));
  assert.deepEqual(contract.stateModel.value.reasons, ['pointer', 'keyboard']);
});
