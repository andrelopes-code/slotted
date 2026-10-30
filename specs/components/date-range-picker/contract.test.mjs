import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const dateField = JSON.parse(
  await readFile(new URL('../date-field/contract.json', import.meta.url), 'utf8'),
);
const calendar = JSON.parse(
  await readFile(new URL('../calendar/contract.json', import.meta.url), 'utf8'),
);
const datePicker = JSON.parse(
  await readFile(new URL('../date-picker/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.dateRangePicker;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'date-range-picker');
  assert.equal(contract.ui, 'date-range-picker');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * Two fields and the range mode `calendar` already has, behind a trigger — the
 * scope line in `docs/process/build-order.md`. Nothing of either is drawn again here.
 */
test('composes two date fields and one calendar instead of drawing them again', () => {
  assert.deepEqual(contract.composes, ['date-field', 'calendar']);
  assert.equal(contract.fields, 2);
  assert.equal(dateField.family, 'date-field');
  assert.equal(calendar.family, 'calendar');
  for (const part of ['segment', 'cell', 'week-header', 'hidden-input']) {
    assert.ok(
      !member.parts.includes(part),
      `${part} belongs to a composed family and must not be redeclared`,
    );
  }
});

test('takes every overlay behaviour from core, as date-picker does', () => {
  assert.deepEqual(contract.core, datePicker.core);
});

/**
 * The value is the run `calendar` already exports, with each end nullable: a
 * filter "from the 12th" is `{ start, end: null }`, and it is written in the
 * field where the reader sees it.
 */
test('holds a range with two nullable ends, and one word for nothing', () => {
  assert.equal(contract.valueType, 'DateRange | null');
  assert.match(contract.valueRules.empty, /both ends are null.*null/);
  assert.match(contract.valueRules.openEnd, /field/);
});

/**
 * The band that answers the reader's actual question — how long — while the
 * run is still being drawn. §12 of the date design records the reviewer's ask.
 */
test('says the length of the run while it is being drawn', () => {
  assert.ok(member.parts.includes('head'));
  assert.ok(member.parts.includes('length'));
  assert.equal(contract.length.liveRegion, 'polite');
  assert.match(contract.length.pending, /pending end/);
  assert.deepEqual(contract.axes.count, ['days', 'nights']);
  assert.equal(member.defaults.count, 'days');
  assert.match(contract.length.sameDay, /1 day.*0 nights/);
});

/**
 * The pending end is the calendar's: it draws the band to the day under the
 * pointer or the focused day, and reports it. The picker never reaches into a
 * cell.
 */
test('takes the pending end from the calendar rather than reading its cells', () => {
  assert.equal(contract.preview.drawnBy, 'calendar');
  assert.equal(contract.preview.reportedBy, 'onPreviewChange');
  assert.ok('data-preview' in calendar.dataAttributes, 'calendar declares the preview band');
});

/**
 * The gap no surveyed implementation closes well: a panel closed with one end
 * chosen. The draft is abandoned; a half-drawn value never reaches a form
 * without the reader having seen it in the field.
 */
test('abandons a half-drawn run instead of committing it', () => {
  assert.match(contract.draft.rule, /not the value/);
  assert.match(contract.draft.abandonedBy, /Escape/);
  assert.match(contract.draft.abandonedBy, /outside/);
});

test('declares the three mutable values, each with a reason vocabulary', () => {
  assert.deepEqual(Object.keys(contract.stateModel).sort(), ['current', 'open', 'value']);
  assert.equal(contract.stateModel.current.controlled, 'position');
  assert.equal(contract.stateModel.current.uncontrolled, 'defaultPosition');
  assert.equal(contract.stateModel.current.request, 'onPositionChange');
  assert.ok(contract.stateModel.current.reasons.includes('select'));
  assert.ok(contract.stateModel.open.reasons.includes('escape'));
  assert.ok(contract.stateModel.open.reasons.includes('outsidePress'));
  assert.ok(contract.stateModel.value.reasons.includes('select'));
  assert.ok(contract.stateModel.value.reasons.includes('clear'));
  assert.deepEqual(contract.axes.position, ['start', 'end']);
});

/** The end being edited is the one the next press writes, and it is visible. */
test('marks the current end in the DOM and lets the consumer own it', () => {
  assert.ok(member.states.includes('current'));
  assert.equal(contract.stateAttributes.current, 'data-current');
  assert.match(contract.position.calendarReceives.end, /end: null/);
  assert.match(contract.position.calendarReceives.start, /whole/);
});

/**
 * Explained, not only imposed: a limit the grid enforces is a limit the band
 * names. Ant blocks without saying; MUI says without blocking.
 */
test('explains a duration limit as well as enforcing it', () => {
  assert.ok(member.parts.includes('limit'));
  assert.deepEqual(contract.limits.length, ['minLength', 'maxLength']);
  assert.match(contract.limits.unit, /count/);
  assert.equal(contract.limits.contiguous.default, true);
  assert.match(contract.limits.contiguous.search, /366/);
});

/** A written value is never rewritten: the family says `invalid` and waits. */
test('never swaps or rewrites a value the reader typed', () => {
  assert.match(contract.validity.reversed, /not swapped/);
  assert.deepEqual(contract.validity.angularErrors, [
    'slottedDateRangeMin',
    'slottedDateRangeMax',
    'slottedDateRangeUnavailable',
    'slottedDateRangeOrder',
    'slottedDateRangeLength',
  ]);
});

/** One clear on the frame; the two fields inside do not draw their own. */
test('draws one clear for two fields', () => {
  assert.ok(member.parts.includes('clear'));
  assert.equal(member.defaults.clearable, false);
  assert.match(contract.clear.fields, /not/);
});

/** A shortcut is a part the family wires, not a button the consumer wires. */
test('wires a preset as a part that writes the value', () => {
  assert.ok(member.parts.includes('presets'));
  assert.ok(member.parts.includes('preset'));
  assert.equal(contract.preset.reason, 'select');
  assert.equal(contract.preset.selectedAttribute, 'data-selected');
  assert.match(contract.preset.invalid, /not hidden/);
});

test('carries the same dialog role and trigger wiring as date-picker', () => {
  assert.equal(contract.contentRole, 'dialog');
  assert.equal(contract.wiring['aria-haspopup'], 'dialog');
  assert.match(contract.triggerName.empty, /choose message/);
  assert.match(contract.triggerName.chosen, /length/);
});

/**
 * Two presses, so closing on the first would be a trap. `auto` closes when the
 * run becomes whole; a preset makes it whole.
 */
test('closes when the run is whole, and names the departure from the APG', () => {
  assert.deepEqual(contract.axes.closeOnSelect, ['auto', 'always', 'never']);
  assert.equal(member.defaults.closeOnSelect, 'auto');
  assert.match(contract.dismissal.closeOnSelect, /whole/);
  assert.match(contract.pattern.departure, /second press/);
});

test('inherits the staged Escape, the chord and the sheet from date-picker', () => {
  assert.ok(contract.keyboard.some((row) => row.key === 'Alt+ArrowDown' && row.effect === 'open'));
  const escape = contract.keyboard.find((row) => row.key === 'Escape');
  assert.equal(escape.focusTo, 'trigger');
  assert.match(escape.staged, /view/);
  assert.match(escape.staged, /draft/);
  assert.ok(contract.keyboard.some((row) => row.key === 'Tab' && row.effect === 'contained'));
  assert.equal(contract.platformNotes.altArrowDown, datePicker.platformNotes.altArrowDown);
  assert.equal(contract.responsive.decidedIn, 'the stylesheet; the DOM does not change');
  assert.ok('data-presentation' in contract.dataAttributes);
});

test('opens on the current end, or on today', () => {
  assert.match(contract.keyboard.find((row) => row.key === 'Enter, Space').focusTo, /current end/);
});

test('defaults are settable once, in both bindings', () => {
  for (const name of [
    'calendar',
    'closeOnSelect',
    'count',
    'months',
    'placement',
    'size',
    'timeZone',
    'variant',
  ]) {
    assert.ok(contract.provides.dateRangePickerDefaults.includes(name), `${name} is not provided`);
  }
  assert.equal(member.defaults.months, 2);
});

test('exposes the imperative actions a consumer cannot express declaratively', () => {
  assert.deepEqual(contract.imperative, ['focus', 'open', 'close']);
});

test('declares the same single-value calendar axis the composed families do', () => {
  assert.deepEqual(contract.axes.calendar, calendar.axes.calendar);
  assert.deepEqual(contract.axes.calendar, dateField.axes.calendar);
});

test('submits two named values in a plain form', () => {
  assert.deepEqual(contract.forms.react, ['startName', 'endName']);
  assert.match(contract.forms.angular, /ControlValueAccessor/);
});
