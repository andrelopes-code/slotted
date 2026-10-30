import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const calendar = JSON.parse(
  await readFile(new URL('../calendar/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.dateField;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'date-field');
  assert.equal(contract.ui, 'date-field');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * `input[type=date]` renders a control the application cannot style, cannot
 * place a calendar of its own beside, and whose segment order Chrome takes
 * from the browser's locale rather than the application's. The family draws
 * the segments itself, and the value still reaches a form: a hidden input
 * carries the ISO string, which is the decision `currency-field` already took
 * for a number.
 */
test('draws its own segments and still posts a value a form can read', () => {
  assert.equal(member.nativeElement, 'div');
  assert.equal(contract.rootRole, null, 'the frame carries no role of its own');
  assert.equal(contract.hiddenValueInput, true);
  assert.equal(contract.hiddenValueFormat, 'ISO 8601 YYYY-MM-DD');
  assert.ok(member.parts.includes('hidden-input'));
});

/**
 * The APG's spin-button example wraps the three fields in a `group` whose
 * accessible name is the whole date, so a screen-reader user perceives the
 * date without visiting all three and remembering each.
 */
test('takes the group and spinbutton roles the sourced pattern names', () => {
  assert.equal(contract.controlPart, 'segments');
  assert.equal(contract.controlRole, 'group');
  assert.equal(contract.segmentRole, 'spinbutton');
  assert.deepEqual(contract.ariaValue, [
    'aria-valuenow',
    'aria-valuemin',
    'aria-valuemax',
    'aria-valuetext',
  ]);
});

test('binds every key the sourced pattern lists', () => {
  const bound = new Set(contract.keyboard.map((entry) => entry.key));
  for (const key of [
    'ArrowUp',
    'ArrowDown',
    'PageUp',
    'PageDown',
    'Home',
    'End',
    'ArrowLeft',
    'ArrowRight',
    'Backspace',
    'Delete',
    '0-9',
  ]) {
    assert.ok(bound.has(key), `${key} is in the pattern and not in the contract`);
  }
});

/**
 * The one place the family leaves the APG example, and it is written rather
 * than taken quietly. A `decline` with no named cost is what the skill refuses.
 */
test('writes the cost of every departure from the pattern', () => {
  assert.equal(contract.pageStep.day, 5);
  assert.equal(contract.pageStep.month, 5);
  assert.equal(contract.pageStep.year, 10, 'the year is the departure');
  assert.ok(contract.departures.yearPage.includes('cost'));
  assert.ok(contract.departures.noArrowButtons.length > 0);
});

/**
 * A step wraps inside the segment. December stepping up to January without
 * moving the year is the APG example's own rule, and a family that carried
 * would make one arrow press change two fields.
 */
test('wraps a step inside the segment rather than carrying', () => {
  const up = contract.keyboard.find((entry) => entry.key === 'ArrowUp');
  assert.equal(up.wraps, 'within the segment');
  assert.equal(contract.entryModel.wraps, 'inside the segment, never carrying into the next');
});

/**
 * The gap the inventory names: every surveyed segmented field holds a whole
 * date or nothing, so a day and a month with no year is a state none of them
 * can express. The request carries the segments, so a consumer can save one.
 */
test('carries the segments alongside the value, so a half-typed date exists', () => {
  assert.equal(contract.valueType, 'PlainDate | null');
  assert.ok(contract.stateModel.value.carries.includes('segments'));
  assert.equal(contract.entryModel.clearedSegment, 'the placeholder, and the value becomes null');
});

/**
 * `en-US` short format writes `9/9/26`. Four digits and a stated pivot are
 * what keep 26 from being the year 26.
 */
test('gives the year four digits and states the pivot rather than guessing', () => {
  assert.equal(contract.entryModel.yearDigits, 4);
  assert.equal(contract.entryModel.yearPivot, 20);
  assert.ok(contract.resolution.yearPivot.includes('defaults'));
});

test('holds the day a short month could not, which no surveyed family does', () => {
  assert.equal(contract.entryModel.intendedDayHeld, true);
});

/**
 * The segments move on every keystroke and the value moves when the run ends.
 * Without the distinction a consumer writing each request to a server would be
 * asked about the year 2 on the way to 2026, which is what the first run of
 * this family's React spec showed as four requests where one was meant.
 */
test('moves the display on every digit and the value only when a run ends', () => {
  assert.equal(contract.entryModel.requestEmittedOn, 'the end of a run, never inside one');
  assert.match(contract.entryModel.whyRequestWaits, /year 2/);
  assert.ok(contract.stateModel.value.reasons.includes('blur'), 'a run also ends by leaving');
});

/**
 * A control that takes typed digits and is not an `input` is invisible to
 * every "is the target editable" guard an application writes, so the keys it
 * acts on have to stop rather than only lose their default.
 */
test('stops the keys it acts on rather than only defaulting them', () => {
  assert.equal(
    contract.entryModel.keysAreConsumed,
    'a key the field acts on is stopped, not only defaulted',
  );
  assert.match(contract.entryModel.whyKeysAreConsumed, /role=spinbutton/);
});

/**
 * The placeholder is the reader's own language, not `mm/dd/yyyy` shown to
 * everybody: `Intl.DisplayNames` names the day, month and year fields per locale.
 */
test('writes the placeholder and the field order from the locale', () => {
  assert.equal(contract.placeholder.from, 'Intl.DisplayNames dateTimeField');
  assert.equal(contract.placeholder.example['pt-BR'], 'dd/mm/aaaa');
  assert.match(contract.fieldOrder, /locale/);
});

test('declares one mutable value, with a reason vocabulary the schema holds', () => {
  assert.deepEqual(Object.keys(contract.stateModel), ['value']);
  for (const reason of contract.stateModel.value.reasons) {
    assert.ok(CHANGE_REASONS.includes(reason), `unknown reason ${reason}`);
  }
});

test('defers to the field for everything the field owns', () => {
  assert.equal(contract.stateSource, 'field');
  assert.equal(contract.mirrorsState, true);
  assert.equal(contract.wiring['aria-describedby'], 'merged');
});

/**
 * The one capability the inventory declines, with the axis that keeps its
 * arrival from breaking a contract. The sibling family declares the same axis
 * with the same single value, because the two would otherwise disagree about
 * what a calendar system is.
 */
test('names the deferred calendar system as an axis rather than as a silence', () => {
  assert.deepEqual(contract.axes.calendar, ['gregory']);
  assert.deepEqual(contract.axes.calendar, calendar.axes.calendar);
  assert.equal(member.defaults.calendar, 'gregory');
});

test('reads the arithmetic from the one place that owns it', () => {
  assert.ok(contract.core.includes('@slotted/core/date'));
});
