import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const read = async (family) =>
  JSON.parse(await readFile(new URL(`../${family}/contract.json`, import.meta.url), 'utf8'));

const contract = await read('datetime-picker');
const dateTimeField = await read('datetime-field');
const datePicker = await read('date-picker');
const timePicker = await read('time-picker');
const member = contract.members.dateTimePicker;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'datetime-picker');
  assert.equal(contract.ui, 'datetime-picker');
  assert.equal(contract.schemaVersion, 5);
});

test('composes the field, the month, the clock and the panel, and draws none of them again', () => {
  assert.deepEqual(contract.composes, [
    'datetime-field',
    'calendar',
    'clock',
    'time-field',
    'picker-panel',
  ]);
  assert.equal(contract.valueType, dateTimeField.valueType);
  assert.deepEqual(member.parts, ['root', 'control', 'trigger']);
});

test('takes the dialog role the sourced example gives the popup', () => {
  assert.equal(contract.contentRole, 'dialog');
  assert.equal(contract.panel['aria-haspopup'], 'dialog');
  assert.equal(contract.contentRole, datePicker.contentRole);
  assert.match(contract.pattern, /^https:\/\/www\.w3\.org\/WAI\/ARIA\/apg\//);
  assert.match(contract.patternStatus, /2026/);
});

/**
 * A day pressed in a month is not a whole moment, and a reader who changes both
 * halves of one presses twice: Apply is what says they are done.
 */
test('keeps a draft until Apply', () => {
  assert.match(contract.draft.rule, /Apply writes the value/);
  assert.equal(member.defaults.confirm, true);
  assert.equal(contract.dismissal.discards, 'the draft');
  assert.deepEqual(contract.axes.confirm, ['on', 'off']);
});

test('states where focus goes after each press', () => {
  assert.match(contract.focusRule.sentence, /missing/);
  assert.deepEqual(Object.keys(contract.focusRule.cases), [
    'open',
    'dayPressedTimeEmpty',
    'dayPressedTimeSet',
    'narrow',
    'apply',
  ]);
});

/**
 * Where the range starts and what a day is open for are two questions, and both
 * are answered: MUI's own validation page records that it cannot combine them.
 */
test('combines a whole-value bound with a per-day window', () => {
  assert.equal(contract.range.min, dateTimeField.range.min);
  assert.equal(contract.range.minTime, dateTimeField.range.minTime);
  assert.match(contract.range.combine, /maxDateTime/, 'the limitation is quoted, not paraphrased');
  assert.match(contract.range.partialDay, /first and last/);
  assert.equal(contract.range.unavailableDate, 'isDateUnavailable(date)');
  assert.equal(contract.range.unavailableTime, 'isTimeUnavailable(time, date)');
  assert.match(contract.range.twoPredicates, /probing/);
});

test('offers the times of the day being chosen for', () => {
  assert.equal(contract.times.of, 'the day in the draft');
  assert.equal(contract.times.refusedDay, 'every hour unavailable');
});

test('takes the arithmetic of the clock from the sibling picker unchanged', () => {
  assert.equal(contract.step.unit, timePicker.step.unit);
  assert.equal(contract.step.base, timePicker.step.base);
  assert.equal(contract.step.offStepIsInvalid, timePicker.step.offStepIsInvalid);
  assert.equal(member.defaults.step, timePicker.members.timePicker.defaults.step);
  assert.equal(contract.options.prop, timePicker.options.prop);
  assert.equal(contract.options.content, timePicker.options.content);
});

test('takes shortcuts and steps in the shape of its siblings', () => {
  assert.equal(contract.presets.type, timePicker.presets.type);
  assert.equal(contract.offsets.unit, timePicker.offsets.unit);
  assert.deepEqual(contract.offsets.default, [3600, 14400, 86400]);
});

test('declares two mutable values, with reasons the library has', () => {
  assert.deepEqual(Object.keys(contract.stateModel).sort(), ['open', 'value']);
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) {
      assert.ok(CHANGE_REASONS.includes(reason), `unknown reason ${reason}`);
    }
  }
});

test('binds the keys of the panel, and leaves the grids to their families', () => {
  const bound = new Set(contract.keyboard.map((entry) => entry.key));

  for (const key of ['Alt+ArrowDown', 'ArrowDown', 'Ctrl+Enter', 'Escape', 'Tab']) {
    assert.ok(bound.has(key), `${key} is missing`);
  }
});

test('stages Escape through the layer, in the order its parts need', () => {
  assert.equal(contract.dismissal.escape, timePicker.dismissal.escape);
  assert.deepEqual(contract.dismissal.escapeOrder, [
    'the field abandons an open expression',
    "the calendar's view walks down from year or month",
    'the panel closes and focus returns to the trigger',
  ]);
  assert.equal(contract.layer.modal, false);
  assert.equal(contract.layer.depthProperty, '--slotted-layer-depth');
});

/** One part at a time below the widest panel, and both in the DOM at every width. */
test('shows one part at a time in one column', () => {
  assert.match(contract.responsive.below760, /data-showing/);
  assert.match(contract.responsive.decidedIn, /stay in the DOM/);
});

test('shares its axes with both sibling pickers', () => {
  assert.deepEqual(contract.axes.size, datePicker.axes.size);
  assert.deepEqual(contract.axes.variant, datePicker.axes.variant);
  assert.deepEqual(contract.axes.placement, datePicker.axes.placement);
  assert.deepEqual(contract.axes.hourCycle, timePicker.axes.hourCycle);
  assert.deepEqual(contract.axes.granularity, timePicker.axes.granularity);
});

test('keeps the field typable while the panel is showing', () => {
  const chord = contract.keyboard.find((entry) => entry.key === 'Alt+ArrowDown');

  assert.equal(chord.focus, 'stays in the field, so typing keeps working');
  assert.equal(contract.platformNotes.altArrowDown, datePicker.platformNotes.altArrowDown);
  assert.equal(contract.panelBlocksTyping, false);
});

test('writes its identity on the control, and the panel writes its own', () => {
  assert.deepEqual(contract.portalledIdentity.elements, ['root']);
});
