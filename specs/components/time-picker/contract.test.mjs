import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const timeField = JSON.parse(
  await readFile(new URL('../time-field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.timePicker;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'time-picker');
  assert.equal(contract.ui, 'time-picker');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The family composes the field, the clock and the panel, and redraws nothing
 * of any of them. A second segmented control would be two places to fix one
 * defect, and so would a second grid of hours.
 */
test('composes the field, the clock and the panel rather than drawing its own', () => {
  assert.deepEqual(contract.composes, ['time-field', 'clock', 'picker-panel']);
  assert.equal(contract.valueType, timeField.valueType);
  assert.deepEqual(member.parts, ['root', 'control', 'trigger']);
});

test('opens a dialog, and the trigger says so', () => {
  assert.equal(contract.contentRole, 'dialog');
  assert.equal(contract.panel['aria-haspopup'], 'dialog');
});

/**
 * A time is two presses, and the first of them is already a whole time. Writing
 * it at once sent a value the reader was still choosing.
 */
test('keeps a draft until Apply, and lets a product ask for none', () => {
  assert.match(contract.draft.rule, /Apply writes the value/);
  assert.equal(member.defaults.confirm, true);
  assert.equal(contract.dismissal.discards, 'the draft');
});

test('takes an explicit list of times, so every arrangement is expressible', () => {
  assert.equal(contract.options.prop, 'options');
  assert.match(contract.options.content, /renderSlot/);
  assert.match(contract.options.content, /ng-template/);
  assert.match(contract.offsets.withOptions, /no Now/);
});

/**
 * `input[type=time]` ties the arrows to the step and this family does not: a
 * minute arrow moving fifteen at a time puts `:07` out of reach of the arrows,
 * and the field's promise is that every value is reachable there.
 */
test('keeps the panel step out of the field arrows, and says why', () => {
  assert.match(contract.step.notTheFieldArrows, /input\[type=time\] ties the two/);
  assert.equal(contract.step.base, 'min when it is stated, midnight when it is not');
  assert.equal(contract.step.offStepIsInvalid, false);
});

test('keeps the field typable while the panel is showing', () => {
  assert.equal(contract.panelBlocksTyping, false);
  const chord = contract.keyboard.find((entry) => entry.key === 'Alt+ArrowDown');
  assert.match(chord.focus, /stays in the field/);
});

test('declares two mutable values, with a reason vocabulary the schema holds', () => {
  assert.deepEqual(Object.keys(contract.stateModel), ['value', 'open']);
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason), reason);
  }
});

test('dismisses through the one layer stack, as every overlay family does', () => {
  assert.equal(contract.layer.modal, false);
  assert.ok(contract.core.includes('@slotted/core/dismissable-layer'));
});
