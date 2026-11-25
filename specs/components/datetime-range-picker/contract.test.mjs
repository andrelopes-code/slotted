import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const read = async (family) =>
  JSON.parse(await readFile(new URL(`../${family}/contract.json`, import.meta.url), 'utf8'));

const contract = await read('datetime-range-picker');
const calendar = await read('calendar');
const dateRangePicker = await read('date-range-picker');
const dateTimePicker = await read('datetime-picker');
const timeRangePicker = await read('time-range-picker');
const member = contract.members.dateTimeRangePicker;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'datetime-range-picker');
  assert.equal(contract.ui, 'datetime-range-picker');
  assert.equal(contract.schemaVersion, 5);
});

test('composes the fields, the months, the clocks and the panel, and draws none again', () => {
  assert.deepEqual(contract.composes, ['datetime-field', 'calendar', 'clock', 'picker-panel']);
  assert.equal(contract.fields, 2);
  assert.deepEqual(member.parts, [
    'root',
    'control',
    'trigger',
    'summary',
    'clear',
    'hidden-input',
  ]);
});

/**
 * One line at the control height, at any width. Two datetime fields in the
 * frame needed about 360 pixels on one line and broke into two lines below it,
 * against the control height every form counts on.
 */
test('keeps the frame on one line, and the fields in the head of the panel', () => {
  assert.equal(contract.control.fieldsInFrame, false);
  assert.match(contract.control.why, /two lines/);
  assert.match(contract.panel.halves, /datetime field/);
  assert.match(contract.forms.hiddenInputs, /portal/);
  assert.match(contract.control.fullName, /ellipsis/);
});

/** A value is whole moments, and a half lives in the draft. */
test('holds a range with two nullable ends, and one word for nothing', () => {
  assert.equal(contract.valueType, 'DateTimeRange | null');
  assert.match(contract.valueRules.empty, /both ends are null.*null/);
  assert.match(contract.valueRules.openEnd, /field/);
  assert.match(contract.valueRules.halves, /whole or it is nothing/);
});

test('brings the grid of the half that is missing', () => {
  assert.match(contract.focusRule.rule, /missing/);
  assert.match(contract.draft.halves, /two nullable halves/);
  assert.match(contract.position.calendarOrders, /hours stay/);
});

test('keeps a draft until Apply', () => {
  assert.match(contract.draft.rule, /Apply writes the value/);
  assert.match(contract.draft.abandonedBy, /Escape/);
  assert.equal(member.defaults.confirm, true);
});

test('refuses in the grid and in the clock of the end what the start refuses', () => {
  assert.match(contract.closing.clock, /too short or too long/);
  assert.match(contract.closing.grid, /inside the limits/);
});

test('inherits the range grid of date-range-picker, preview included', () => {
  assert.deepEqual(contract.preview, dateRangePicker.preview);
  assert.equal(
    contract.position.calendarReceives.end,
    dateRangePicker.position.calendarReceives.end,
  );
});

test('shows two months by default, and one in one column', () => {
  assert.equal(member.defaults.months, 2);
  assert.match(contract.panel.months, /two by default/);
  assert.match(contract.responsive.below760, /one month/);
});

test('applies the whole-value bounds and the day window together, per end', () => {
  assert.deepEqual(contract.limits.bounds, ['min', 'max', 'minTime', 'maxTime']);
  assert.match(contract.limits.dayWindow, /dayWindow/);
});

test('says the duration between the two halves, as a control', () => {
  assert.equal(contract.length.liveRegion, 'polite');
  assert.match(contract.length.between, /one day/);
  assert.match(contract.length.incomplete, /days between/);
  assert.match(contract.length.label, /durationLabel/);
});

test('takes lengths in seconds, and shortcuts in the shape of its siblings', () => {
  assert.deepEqual(
    contract.durations.default.map((seconds) => seconds / 86_400),
    [1, 2, 3, 5, 7, 14],
  );
  assert.equal(contract.presets.type, timeRangePicker.presets.type);
});

test('declares the same three mutable values as date-range-picker', () => {
  assert.deepEqual(contract.stateModel, dateRangePicker.stateModel);
  assert.deepEqual(contract.axes.position, ['start', 'end']);
});

test('explains a duration limit as well as enforcing it, in seconds', () => {
  assert.deepEqual(contract.limits.length, ['minLength', 'maxLength']);
  assert.equal(contract.limits.unit, 'seconds');
  assert.equal(contract.limits.contiguous.default, true);
  assert.match(contract.limits.explained, /by how much/);
});

/** A written value is never rewritten: the family says `invalid` and waits. */
test('never swaps or rewrites a value the reader typed', () => {
  assert.match(contract.validity.reversed, /not swapped/);
  assert.deepEqual(contract.validity.angularErrors, [
    'slottedDateTimeRangeMin',
    'slottedDateTimeRangeMax',
    'slottedDateTimeRangeUnavailable',
    'slottedDateTimeRangeOrder',
    'slottedDateTimeRangeLength',
  ]);
});

test('carries the dialog role and the calendar trigger of datetime-picker', () => {
  assert.equal(contract.contentRole, 'dialog');
  assert.equal(contract.wiring['aria-haspopup'], 'dialog');
  assert.match(contract.wiring['aria-label'], /both ends/);
  assert.equal(contract.triggerIcon, 'calendar');
  assert.match(contract.pattern.departure, /Apply/);
});

test('stages Escape, and binds the keys of the panel', () => {
  const escape = contract.keyboard.find((row) => row.key === 'Escape');
  assert.equal(escape.focusTo, 'trigger');
  assert.equal(escape.discards, 'the draft');
  assert.match(escape.staged, /expression.*view/);

  assert.ok(contract.keyboard.some((row) => row.key === 'Ctrl+Enter' && row.effect === 'apply'));
  assert.ok(contract.keyboard.some((row) => row.key === 'Tab' && row.effect === 'contained'));
  assert.equal(contract.platformNotes.altArrowDown, dateTimePicker.platformNotes.altArrowDown);
});

test('defaults are settable once, in both bindings', () => {
  assert.deepEqual(contract.provides.dateTimeRangePickerDefaults, [
    'calendar',
    'confirm',
    'firstDayOfWeek',
    'granularity',
    'hourCycle',
    'lengthLabel',
    'months',
    'placement',
    'size',
    'step',
    'timeZone',
    'variant',
  ]);
  assert.equal(member.defaults.step, 900);
});

test('exposes the imperative actions a consumer cannot express declaratively', () => {
  assert.deepEqual(contract.imperative, ['focus', 'open', 'close']);
});

test('declares the axes the composed families declare', () => {
  assert.deepEqual(contract.axes.calendar, calendar.axes.calendar);
  assert.deepEqual(contract.axes.granularity, dateTimePicker.axes.granularity);
  assert.deepEqual(contract.axes.hourCycle, dateTimePicker.axes.hourCycle);
});

test('submits two named values in a plain form', () => {
  assert.deepEqual(contract.forms.react, ['startName', 'endName']);
  assert.match(contract.forms.angular, /ControlValueAccessor/);
});
