import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const dateTimeField = JSON.parse(
  await readFile(new URL('../datetime-field/contract.json', import.meta.url), 'utf8'),
);
const calendar = JSON.parse(
  await readFile(new URL('../calendar/contract.json', import.meta.url), 'utf8'),
);
const dateTimePicker = JSON.parse(
  await readFile(new URL('../datetime-picker/contract.json', import.meta.url), 'utf8'),
);
const dateRangePicker = JSON.parse(
  await readFile(new URL('../date-range-picker/contract.json', import.meta.url), 'utf8'),
);
const timeRangePicker = JSON.parse(
  await readFile(new URL('../time-range-picker/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.dateTimeRangePicker;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'datetime-range-picker');
  assert.equal(contract.ui, 'datetime-range-picker');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * Two datetime fields, the range calendar, and a list per end — the scope
 * line in `docs/process/build-order.md`, wave 9. Nothing of the three is drawn again.
 */
test('composes one datetime field and one calendar instead of drawing them again', () => {
  assert.deepEqual(contract.composes, ['datetime-field', 'calendar']);
  assert.equal(contract.fields, 1);
  assert.equal(dateTimeField.family, 'datetime-field');
  assert.equal(calendar.family, 'calendar');
  assert.match(contract.field.one, /current end/);
  assert.match(contract.field.finePointerOnly, /coarse/);
  for (const part of ['segment', 'cell', 'week-header', 'half']) {
    assert.ok(
      !member.parts.includes(part),
      `${part} belongs to a composed family and must not be redeclared`,
    );
  }
});

/** The frame of `time-range-picker`: one line, the tabs and the field in the band. */
test('keeps the frame on one line and puts the tabs and the field in the band', () => {
  assert.equal(contract.control.fieldsInFrame, false);
  assert.match(contract.control.why, /360/);
  assert.ok(member.parts.includes('summary'));
  assert.ok(member.parts.includes('hidden-input'));
  assert.match(contract.head.holds, /tabs/);
  assert.match(contract.panel.order, /tabs.*presets.*calendar.*list/);
  for (const part of ['tabs', 'tab', 'tab-label', 'tab-value', 'field', 'hint', 'done']) {
    assert.ok(member.parts.includes(part), `${part} is missing`);
  }
});

test('takes every overlay behaviour from core, as datetime-picker does', () => {
  assert.deepEqual(contract.core, dateTimePicker.core);
});

test('holds a range with two nullable ends, and one word for nothing', () => {
  assert.equal(contract.valueType, 'DateTimeRange | null');
  assert.match(contract.valueRules.empty, /both ends are null.*null/);
  assert.match(contract.valueRules.openEnd, /field/);
});

/** The panel of `time-range-picker`, with the calendar beside the list. */
/**
 * One end at a time, the decision `time-range-picker` records at its second
 * gate: the calendar with both dates drawn, and the list of the current end
 * beside it. The first contract declined tabs because a tablist that exists
 * at one width and not at another tells two stories; these exist at every
 * width.
 */
test('draws the range calendar and the list of the current end, behind two tabs', () => {
  assert.equal(contract.panel.perEnd, false);
  assert.match(contract.panel.current, /both dates/);
  assert.match(contract.panel.reversed, /every width/);
  assert.equal(contract.tabs.role, 'tablist');
  for (const part of ['date-panel', 'panel', 'now', 'list', 'option', 'option-duration', 'empty']) {
    assert.ok(member.parts.includes(part), `${part} is missing`);
  }
  assert.ok(!member.parts.includes('panel-day') && !member.parts.includes('panel-label'));
  assert.match(contract.panel.day, /focused day/);
  assert.match(contract.hint.says, /chooseDay/);
  assert.match(contract.hint.messages, /\{day\}/);
  assert.equal(contract.done.always, true);
  assert.match(contract.responsive.sheetList, /under the grid/);
  assert.match(contract.list.duration, /beside its time/);
  assert.match(contract.list.duration, /same day/);
});

test('inherits the range grid of date-range-picker, preview included', () => {
  assert.deepEqual(contract.preview, dateRangePicker.preview);
  assert.equal(
    contract.position.calendarReceives.end,
    dateRangePicker.position.calendarReceives.end,
  );
  assert.match(contract.position.calendarOrders, /hours stay/);
});

/**
 * One month by default, where date-range-picker draws two: the list sits
 * beside the grid, and two months and a list do not fit in 720 pixels.
 */
test('shows one month by default and says why', () => {
  assert.equal(member.defaults.months, 1);
  assert.match(contract.responsive.months, /one by default/);
  assert.match(contract.responsive.months, /beside the grid/);
});

/** The two bounds datetime-picker combines, once per end, crossed. */
test('applies the whole-value bounds and the day window together, per end', () => {
  assert.deepEqual(contract.limits.bounds, ['min', 'max', 'minTime', 'maxTime']);
  assert.match(contract.limits.dayWindow, /dayWindow/);
  assert.match(contract.list.otherEnd, /same day/);
  assert.match(contract.list.against, /focused day/);
});

test('says the duration while the run is being drawn, dates included', () => {
  assert.ok(member.parts.includes('head'));
  assert.ok(member.parts.includes('length'));
  assert.equal(contract.length.liveRegion, 'polite');
  assert.match(contract.length.unit, /seconds/);
  assert.match(contract.length.pendingDate, /midnight/);
});

test('declares the same four mutable values as time-range-picker', () => {
  assert.deepEqual(contract.stateModel, timeRangePicker.stateModel);
  assert.match(contract.highlight.shape, /start.*end/);
  assert.match(contract.highlight.focusedDate, /calendar/);
});

test('moves focus to the missing half, once per end', () => {
  assert.match(contract.focusRule.rule, /incomplete.*missing.*tab/);
  assert.match(contract.focusRule.otherEnd, /tab swaps/);
  assert.match(contract.focusRule.gridWritesDate, /list/);
  assert.match(contract.focusRule.listWritesTime, /grid/);
  assert.match(contract.draft.rule, /work/);
  assert.match(contract.draft.halves, /date and time/);
});

test('explains a duration limit as well as enforcing it, in seconds', () => {
  assert.ok(member.parts.includes('limit'));
  assert.deepEqual(contract.limits.length, ['minLength', 'maxLength']);
  assert.equal(contract.limits.unit, 'seconds');
  assert.equal(contract.limits.contiguous.default, true);
  assert.match(contract.limits.contiguous.grid, /blockedAround/);
  assert.match(contract.limits.contiguous.list, /same day/);
});

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

test('takes two predicates, as datetime-picker does', () => {
  assert.deepEqual(contract.predicates, ['isDateUnavailable', 'isTimeUnavailable']);
});

test('draws one clear for two fields', () => {
  assert.ok(member.parts.includes('clear'));
  assert.equal(member.defaults.clearable, false);
  assert.match(contract.clear.fields, /not/);
});

test('wires a preset as a part that writes the value', () => {
  assert.ok(member.parts.includes('presets'));
  assert.ok(member.parts.includes('preset'));
  assert.equal(contract.preset.reason, 'select');
  assert.equal(contract.preset.selectedAttribute, 'data-selected');
  assert.match(contract.preset.invalid, /not hidden/);
});

test('carries the dialog role and the calendar trigger of datetime-picker', () => {
  assert.equal(contract.contentRole, 'dialog');
  assert.equal(contract.wiring['aria-haspopup'], 'dialog');
  assert.equal(contract.triggerIcon, 'calendar');
  assert.match(contract.triggerName.chosen, /duration/);
});

test('closes when the work is whole, and names the departure from the APG', () => {
  assert.deepEqual(contract.axes.closeOnSelect, ['auto', 'always', 'never']);
  assert.equal(member.defaults.closeOnSelect, 'auto');
  assert.match(contract.dismissal.closeOnSelect, /whole/);
  assert.match(contract.pattern.departure, /whole/);
});

test('inherits the staged Escape, the chord and the sheet from the siblings', () => {
  assert.ok(
    contract.keyboard.some(
      (row) => row.key === 'ArrowDown, Alt+ArrowDown' && row.effect === 'open',
    ),
  );
  const escape = contract.keyboard.find((row) => row.key === 'Escape');
  assert.equal(escape.focusTo, 'trigger');
  assert.match(escape.staged, /view/);
  assert.match(escape.staged, /work/);
  assert.ok(contract.keyboard.some((row) => row.key === 'Tab' && row.effect === 'contained'));
  assert.equal(contract.platformNotes.altArrowDown, dateTimePicker.platformNotes.altArrowDown);
  assert.equal(contract.responsive.decidedIn, 'the stylesheet; the DOM does not change');
  assert.ok('data-presentation' in contract.dataAttributes);
});

test('opens on the field of the current end, or on its cell from the arrow', () => {
  assert.match(contract.keyboard.find((row) => row.key === 'Enter, Space').focusTo, /segment/);
  assert.match(
    contract.keyboard.find((row) => row.key === 'ArrowDown, Alt+ArrowDown').focusTo,
    /current end/,
  );
});

test('defaults are settable once, in both bindings', () => {
  for (const name of [
    'calendar',
    'closeOnSelect',
    'firstDayOfWeek',
    'granularity',
    'hourCycle',
    'lengthLabel',
    'maxOptions',
    'months',
    'placement',
    'size',
    'step',
    'timeZone',
    'unavailableOptions',
    'variant',
  ]) {
    assert.ok(
      contract.provides.dateTimeRangePickerDefaults.includes(name),
      `${name} is not provided`,
    );
  }
  assert.equal(member.defaults.step, 900);
});

test('exposes the imperative actions a consumer cannot express declaratively', () => {
  assert.deepEqual(contract.imperative, ['focus', 'open', 'close']);
});

test('declares the axes the composed families declare', () => {
  assert.deepEqual(contract.axes.calendar, calendar.axes.calendar);
  assert.deepEqual(contract.axes.granularity, dateTimePicker.axes.granularity);
  assert.deepEqual(contract.axes.hourCycle, dateTimePicker.axes.hourCycle);
  assert.deepEqual(contract.axes.unavailableOptions, dateTimePicker.axes.unavailableOptions);
});

test('submits two named values in a plain form', () => {
  assert.deepEqual(contract.forms.react, ['startName', 'endName']);
  assert.match(contract.forms.angular, /ControlValueAccessor/);
});
