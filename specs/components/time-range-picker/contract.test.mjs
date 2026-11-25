import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const read = async (family) =>
  JSON.parse(await readFile(new URL(`../${family}/contract.json`, import.meta.url), 'utf8'));

const contract = await read('time-range-picker');
const dateRangePicker = await read('date-range-picker');
const timePicker = await read('time-picker');
const member = contract.members.timeRangePicker;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'time-range-picker');
  assert.equal(contract.ui, 'time-range-picker');
  assert.equal(contract.schemaVersion, 5);
});

test('composes the fields, the clocks and the panel, and draws none of them again', () => {
  assert.deepEqual(contract.composes, ['time-field', 'clock', 'picker-panel']);
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
 * One line at the control height, at any width. Two segmented fields in the
 * frame needed about 220 pixels on one line and broke into two lines below it,
 * against the control height every form counts on.
 */
test('keeps the frame on one line, and the fields in the head of the panel', () => {
  assert.equal(contract.control.fieldsInFrame, false);
  assert.match(contract.control.why, /two lines/);
  assert.match(contract.panel.halves, /time field/);
  assert.match(contract.forms.hiddenInputs, /portal/);
  assert.match(contract.control.fullName, /ellipsis/);
});

/**
 * The value is two nullable times, and nothing for nothing: a filter "from
 * 14:00" is `{ start, end: null }`, written where the reader sees it.
 */
test('holds a range with two nullable ends, and one word for nothing', () => {
  assert.equal(contract.valueType, 'TimeRange | null');
  assert.match(contract.valueRules.empty, /both ends are null.*null/);
  assert.match(contract.valueRules.openEnd, /field/);
  assert.match(contract.valueRules.midnight, /datetime-range-picker/);
});

test('refuses in the clock of the end what the start refuses', () => {
  assert.match(contract.closing.clock, /too short or too long/);
  assert.match(contract.closing.clock, /first unavailable/);
  assert.match(contract.closing.start, /nothing else/);
});

test('keeps a draft until Apply', () => {
  assert.match(contract.draft.rule, /Apply writes the value/);
  assert.match(contract.draft.abandonedBy, /Escape/);
  assert.equal(member.defaults.confirm, true);
  assert.match(contract.focusRule.rule, /missing/);
});

test('says the duration between the two halves, as a control', () => {
  assert.equal(contract.length.liveRegion, 'polite');
  assert.match(contract.length.between, /one step/);
  assert.match(contract.length.unit, /seconds/);
  assert.match(contract.length.label, /durationLabel/);
  assert.match(contract.length.sameTime, /0 min/);
});

test('takes lengths in seconds, and shortcuts in the shape of its siblings', () => {
  assert.equal(contract.durations.default.length, 8);
  assert.match(contract.durations.refused, /without a start/);
  assert.equal(contract.presets.type, timePicker.presets.type);
});

/** The slider pattern: a drag is never the only way to a value. */
test('gives each handle of the day the keys of a slider', () => {
  assert.match(contract.ruler.role, /slider/);
  assert.match(contract.ruler.keys, /Home and End/);
  assert.match(contract.ruler.crossing, /no further/);
});

test('declares the three mutable values, each with a reason vocabulary', () => {
  assert.deepEqual(contract.stateModel, dateRangePicker.stateModel);
  assert.deepEqual(contract.axes.position, ['start', 'end']);
  assert.match(contract.position.meaning, /data-current/);
});

/** Explained, not only imposed, in the unit step is written in. */
test('explains a duration limit as well as enforcing it, in seconds', () => {
  assert.deepEqual(contract.limits.length, ['minLength', 'maxLength']);
  assert.equal(contract.limits.unit, 'seconds');
  assert.equal(contract.limits.contiguous.default, true);
  assert.match(contract.limits.contiguous.search, /offered times/);
  assert.match(contract.limits.explained, /by how much/);
});

/** A written value is never rewritten: the family says `invalid` and waits. */
test('never swaps or rewrites a value the reader typed', () => {
  assert.match(contract.validity.reversed, /not swapped/);
  assert.deepEqual(contract.validity.angularErrors, [
    'slottedTimeRangeMin',
    'slottedTimeRangeMax',
    'slottedTimeRangeUnavailable',
    'slottedTimeRangeOrder',
    'slottedTimeRangeLength',
  ]);
});

test('draws one clear for both ends', () => {
  assert.equal(member.defaults.clearable, false);
  assert.match(contract.clear.fields, /not/);
});

test('carries the dialog role and the trigger wiring of date-range-picker', () => {
  assert.equal(contract.contentRole, 'dialog');
  assert.equal(contract.wiring['aria-haspopup'], 'dialog');
  assert.match(contract.wiring['aria-label'], /both ends/);
  assert.match(contract.triggerName.chosen, /duration/);
  assert.equal(contract.triggerIcon, 'clock');
  assert.match(contract.pattern.departure, /Apply/);
});

test('stages Escape, and binds the keys of the panel', () => {
  const escape = contract.keyboard.find((row) => row.key === 'Escape');
  assert.equal(escape.focusTo, 'trigger');
  assert.equal(escape.discards, 'the draft');
  assert.match(escape.staged, /expression/);

  assert.ok(contract.keyboard.some((row) => row.key === 'Ctrl+Enter' && row.effect === 'apply'));
  assert.ok(contract.keyboard.some((row) => row.key === 'Tab' && row.effect === 'contained'));
});

test('shows one clock at a time in one column', () => {
  assert.match(contract.responsive.below760, /one clock at a time/);
  assert.match(contract.responsive.decidedIn, /keyboard/);
});

test('defaults are settable once, in both bindings', () => {
  assert.deepEqual(contract.provides.timeRangePickerDefaults, [
    'confirm',
    'granularity',
    'hourCycle',
    'lengthLabel',
    'placement',
    'size',
    'step',
    'timeZone',
    'variant',
  ]);
  assert.equal(member.defaults.step, 900);
  assert.deepEqual(contract.step, timePicker.step);
});

test('exposes the imperative actions a consumer cannot express declaratively', () => {
  assert.deepEqual(contract.imperative, ['focus', 'open', 'close']);
});

test('declares the axes the sibling pickers declare', () => {
  assert.deepEqual(contract.axes.granularity, timePicker.axes.granularity);
  assert.deepEqual(contract.axes.hourCycle, timePicker.axes.hourCycle);
  assert.deepEqual(contract.axes.size, dateRangePicker.axes.size);
  assert.deepEqual(contract.axes.variant, dateRangePicker.axes.variant);
});

test('submits two named values in a plain form', () => {
  assert.deepEqual(contract.forms.react, ['startName', 'endName']);
  assert.match(contract.forms.angular, /ControlValueAccessor/);
});
