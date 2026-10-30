import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const timeField = JSON.parse(
  await readFile(new URL('../time-field/contract.json', import.meta.url), 'utf8'),
);
const timePicker = JSON.parse(
  await readFile(new URL('../time-picker/contract.json', import.meta.url), 'utf8'),
);
const dateRangePicker = JSON.parse(
  await readFile(new URL('../date-range-picker/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.timeRangePicker;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'time-range-picker');
  assert.equal(contract.ui, 'time-range-picker');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One time field, the current end's, behind a trigger — nothing of the field
 * is drawn again. The scope line in `docs/process/build-order.md`, wave 9, said two;
 * one end at a time needs one.
 */
test("composes one time field, the current end's, instead of drawing it again", () => {
  assert.deepEqual(contract.composes, ['time-field']);
  assert.equal(contract.fields, 1);
  assert.equal(timeField.family, 'time-field');
  assert.match(contract.field.one, /current end/);
  assert.match(contract.field.finePointerOnly, /coarse/);
  for (const part of ['segment', 'literal', 'duration']) {
    assert.ok(
      !member.parts.includes(part),
      `${part} belongs to a composed family and must not be redeclared`,
    );
  }
});

/**
 * One line at the control height, at any width. Two segmented fields in the
 * frame needed about 220 pixels on one line and broke into two lines below
 * it, against the control height every form counts on; withdrawn at the
 * visual gate. The frame keeps what fits on one line: the value in words.
 */
test('keeps the frame on one line and puts the tabs and the field in the band', () => {
  assert.equal(contract.control.fieldsInFrame, false);
  assert.match(contract.control.why, /two lines/);
  assert.ok(member.parts.includes('summary'));
  assert.ok(member.parts.includes('hidden-input'));
  assert.match(contract.head.holds, /tabs/);
  assert.match(contract.head.fieldsSubmit, /hidden-input/);
  assert.match(contract.forms.hiddenInputs, /portal/);
  assert.match(contract.control.fullName, /ellipsis/);
  for (const part of ['tabs', 'tab', 'tab-label', 'tab-value', 'field', 'hint']) {
    assert.ok(member.parts.includes(part), `${part} is missing`);
  }
  const head = member.parts.indexOf('head');
  assert.ok(member.parts.indexOf('tabs') > head && member.parts.indexOf('field') > head);
});

/**
 * One end at a time. Two lists side by side were refused at the release gate
 * as too much interface at once for a lay reader and for a phone; the tab
 * says which end, the panel shows only that end, and choosing one end moves
 * to the other. The first contract declined exactly this shape; the record
 * of why the argument fell is in `panel.reversed`.
 */
test("draws one panel, the current end's, behind two tabs", () => {
  assert.equal(contract.panel.perEnd, false);
  assert.equal(contract.panel.role, 'listbox');
  assert.match(contract.panel.why, /one end at a time/i);
  assert.match(contract.panel.reversed, /swaps/);
  assert.equal(contract.tabs.role, 'tablist');
  assert.match(contract.tabs.activation, /automatic/);
  for (const part of ['panel', 'now', 'list', 'option', 'option-duration', 'empty', 'done']) {
    assert.ok(member.parts.includes(part), `${part} is missing`);
  }
  assert.ok(!member.parts.includes('panel-label'));
  assert.ok(!member.parts.includes('start') && !member.parts.includes('end'));
  assert.match(contract.dataAttributes['data-position'], /start or end/);
  assert.match(contract.panel.labelledBy, /tab/);
  assert.match(contract.list.duration, /beside its time/);
  assert.equal(contract.now.perEnd, false);
  assert.match(contract.now.writes, /current end/);
});

/**
 * Explained, not only refused: the hint says what the next press should be
 * while an end is missing, and what is wrong while the work is whole and
 * invalid; done is the way out a full-screen sheet otherwise lacks.
 */
test('says what is missing, and gives the sheet a way out', () => {
  assert.match(contract.hint.says, /missing/);
  assert.match(contract.hint.says, /invalid/);
  assert.match(contract.hint.messages, /\{end\}/);
  assert.match(contract.hint.wiring, /aria-describedby/);
  assert.equal(contract.done.always, true);
  assert.match(contract.done.effect, /whole work/);
  assert.match(contract.responsive.coarsePointer, /target-comfortable/);
  assert.match(contract.responsive.sheetList, /100dvh/);
  assert.ok(contract.keyboard.some((row) => row.from === 'a tab' && /automatic/.test(row.effect)));
  assert.ok(contract.messages.includes('done'));
  assert.ok(contract.messages.includes('chooseTime'));
});

test('takes every overlay behaviour from core, as time-picker does', () => {
  assert.deepEqual(contract.core, timePicker.core);
});

/**
 * The value is two nullable times, and nothing for nothing: a filter "from
 * 14:00" is `{ start, end: null }`, written in the field where the reader
 * sees it.
 */
test('holds a range with two nullable ends, and one word for nothing', () => {
  assert.equal(contract.valueType, 'TimeRange | null');
  assert.match(contract.valueRules.empty, /both ends are null.*null/);
  assert.match(contract.valueRules.openEnd, /field/);
  assert.match(contract.valueRules.midnight, /datetime-range-picker/);
});

/**
 * One list per end, both in the DOM: the list of the end says what the start
 * refuses the moment the start is chosen, which a list that swaps with the
 * position (MUI, Ant) cannot.
 */
test('inherits the one panel shape of time-picker', () => {
  assert.deepEqual(contract.step, timePicker.step);
  assert.equal(contract.selectionFollowsFocus, false);
  assert.match(contract.list.otherEnd, /before the start/);
  assert.match(contract.list.otherEnd, /after the end/);
});

/**
 * The band that says how long, while the run is drawn: the pending end is
 * the option under the pointer or the highlighted one, and the length is
 * said in seconds turned into words.
 */
test('says the duration while the run is being drawn', () => {
  assert.ok(member.parts.includes('head'));
  assert.ok(member.parts.includes('length'));
  assert.equal(contract.length.liveRegion, 'polite');
  assert.match(contract.length.pending, /pointer|highlighted/);
  assert.match(contract.length.unit, /seconds/);
  assert.match(contract.length.label, /durationLabel/);
  assert.match(contract.length.sameTime, /0 min/);
});

test('declares the four mutable values, each with a reason vocabulary', () => {
  assert.deepEqual(Object.keys(contract.stateModel).sort(), ['current', 'open', 'value']);
  assert.deepEqual(Object.keys(contract.stateModel.current).sort(), ['highlighted', 'position']);
  assert.equal(contract.stateModel.current.position.controlled, 'position');
  assert.equal(contract.stateModel.current.position.uncontrolled, 'defaultPosition');
  assert.equal(contract.stateModel.current.position.request, 'onPositionChange');
  assert.equal(contract.stateModel.current.highlighted.controlled, 'highlighted');
  assert.equal(contract.stateModel.current.highlighted.request, 'onHighlightedChange');
  assert.ok(contract.stateModel.open.reasons.includes('escape'));
  assert.ok(contract.stateModel.value.reasons.includes('select'));
  assert.ok(contract.stateModel.value.reasons.includes('clear'));
  assert.deepEqual(contract.axes.position, ['start', 'end']);
  assert.match(contract.highlight.shape, /start.*end/);
});

/** The end being edited is visible on the field and on its panel. */
test('marks the current end in the DOM and lets the consumer own it', () => {
  assert.ok(member.states.includes('current'));
  assert.equal(contract.stateAttributes.current, 'data-current');
  assert.match(contract.position.meaning, /tab/);
  assert.match(contract.position.onOpen, /missing/);
  assert.equal(contract.position.afterTab, 'the pressed end, reason pointer or keyboard');
  assert.equal(contract.position.afterListWritesOtherEmpty, 'the other end');
  assert.equal(contract.position.afterPreset, 'start');
  assert.equal(contract.position.afterClear, 'start');
});

/**
 * The rule `datetime-picker` wrote, once per end: a press that leaves the
 * work incomplete carries focus to what is missing; the press that completes
 * it closes the panel.
 */
test('moves focus to the missing end and closes on completion', () => {
  assert.match(contract.focusRule.rule, /incomplete.*missing.*tab/);
  assert.match(contract.focusRule.rule, /completes.*closes/);
  assert.match(contract.focusRule.whole, /stays open/);
  assert.match(contract.draft.rule, /work/);
  assert.match(contract.draft.abandonedBy, /Escape/);
});

/**
 * Explained, not only imposed: a limit the list enforces is a limit the band
 * names, in the unit step is written in.
 */
test('explains a duration limit as well as enforcing it, in seconds', () => {
  assert.ok(member.parts.includes('limit'));
  assert.deepEqual(contract.limits.length, ['minLength', 'maxLength']);
  assert.equal(contract.limits.unit, 'seconds');
  assert.equal(contract.limits.contiguous.default, true);
  assert.match(contract.limits.contiguous.list, /first unavailable/);
  assert.match(contract.limits.contiguous.search, /list/);
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

test('carries the dialog role and the trigger wiring of date-range-picker', () => {
  assert.equal(contract.contentRole, 'dialog');
  assert.equal(contract.wiring['aria-haspopup'], 'dialog');
  assert.match(contract.wiring['aria-label'], /both ends/);
  assert.match(contract.triggerName.chosen, /duration/);
  assert.equal(contract.triggerIcon, 'clock');
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
  assert.match(escape.staged, /expression/);
  assert.match(escape.staged, /work/);
  assert.ok(contract.keyboard.some((row) => row.key === 'Tab' && row.effect === 'contained'));
  assert.equal(contract.platformNotes.altArrowDown, timePicker.platformNotes.altArrowDown);
  assert.equal(contract.responsive.decidedIn, 'the stylesheet; the DOM does not change');
  assert.ok('data-presentation' in contract.dataAttributes);
});

test('opens on the field of the current end, or on its list from the arrow', () => {
  assert.match(contract.keyboard.find((row) => row.key === 'Enter, Space').focusTo, /segment/);
  assert.match(
    contract.keyboard.find((row) => row.key === 'ArrowDown, Alt+ArrowDown').focusTo,
    /current end/,
  );
  assert.deepEqual(contract.opensOn, timePicker.opensOn);
});

test('defaults are settable once, in both bindings', () => {
  for (const name of [
    'closeOnSelect',
    'granularity',
    'hourCycle',
    'lengthLabel',
    'maxOptions',
    'placement',
    'size',
    'step',
    'timeZone',
    'unavailableOptions',
    'variant',
  ]) {
    assert.ok(contract.provides.timeRangePickerDefaults.includes(name), `${name} is not provided`);
  }
  assert.equal(member.defaults.step, 900);
  assert.equal(member.defaults.maxOptions, 1440);
});

test('exposes the imperative actions a consumer cannot express declaratively', () => {
  assert.deepEqual(contract.imperative, ['focus', 'open', 'close']);
});

test('declares the axes the composed field and the sibling picker declare', () => {
  assert.deepEqual(contract.axes.granularity, timePicker.axes.granularity);
  assert.deepEqual(contract.axes.hourCycle, timePicker.axes.hourCycle);
  assert.deepEqual(contract.axes.unavailableOptions, timePicker.axes.unavailableOptions);
  assert.deepEqual(contract.axes.size, dateRangePicker.axes.size);
  assert.deepEqual(contract.axes.variant, dateRangePicker.axes.variant);
});

test('submits two named values in a plain form', () => {
  assert.deepEqual(contract.forms.react, ['startName', 'endName']);
  assert.match(contract.forms.angular, /ControlValueAccessor/);
});

test('holds the states precedence the list needs', () => {
  assert.deepEqual(contract.statePrecedence.order, ['disabled', 'selected', 'current', 'hover']);
});
