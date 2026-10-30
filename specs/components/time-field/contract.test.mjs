import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const dateField = JSON.parse(
  await readFile(new URL('../date-field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.timeField;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'time-field');
  assert.equal(contract.ui, 'time-field');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * `input[type=time]` renders a control the application cannot style past its
 * closed state, whose panel is drawn by the operating system and answers no
 * scheme, no density and no direction, and whose field order is the browser's
 * locale rather than the application's. The family draws the segments itself
 * and the value still reaches a form through a hidden input.
 */
test('draws its own segments and still posts a value a form can read', () => {
  assert.equal(member.nativeElement, 'div');
  assert.equal(contract.rootRole, null, 'the frame carries no role of its own');
  assert.equal(contract.hiddenValueInput, true);
  assert.equal(contract.hiddenValueFormat, 'ISO 8601 HH:mm:ss');
  assert.ok(member.parts.includes('hidden-input'));
});

/**
 * The same arrangement `date-field` takes from the APG's spin-button example:
 * the frame carries no role, the row of segments is the `group` whose
 * accessible name is the whole time, and each field is a spin button.
 */
test('takes the group and spinbutton roles the sourced pattern names', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/');
  assert.equal(contract.controlPart, dateField.controlPart);
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
 * The engine is the one `date-field` published. `fieldRange` is the only place
 * a field is named, so the four time fields are a wider union and four rows —
 * not a second engine that would have to be corrected twice.
 */
test('names four fields and reads them from the engine that already exists', () => {
  assert.deepEqual(contract.fields, ['hour', 'minute', 'second', 'dayPeriod']);
  assert.ok(contract.core.includes('@slotted/core/date'));
  assert.equal(contract.engine.module, 'packages/core/src/date/segments.ts');
  assert.equal(contract.engine.shared, true);
  assert.match(contract.engine.widened, /fieldRange/);
});

/**
 * `Intl` resolves four hour cycles and a boolean cannot say which. `ja-JP`
 * writes midnight as hour zero under `h11`, so a family that stores `12` there
 * is wrong in a way nobody notices until a Japanese reader reports it.
 */
test('states four hour cycles rather than a twelve-or-twenty-four boolean', () => {
  assert.deepEqual(Object.keys(contract.hourCycles), ['h11', 'h12', 'h23', 'h24']);
  assert.deepEqual(contract.hourCycles.h11, { min: 0, max: 11, dayPeriod: true });
  assert.deepEqual(contract.hourCycles.h12, { min: 1, max: 12, dayPeriod: true });
  assert.deepEqual(contract.hourCycles.h23, { min: 0, max: 23, dayPeriod: false });
  assert.deepEqual(contract.hourCycles.h24, { min: 1, max: 24, dayPeriod: false });
  assert.deepEqual(contract.axes.hourCycle, [12, 24], 'the axis is the question a consumer asks');
});

/**
 * The day period holds two values and announces the locale's own name, which
 * is what `aria-valuetext` exists for. Digits do not reach it: a letter does.
 */
test('makes the day period a spin button of two and types it by letter', () => {
  assert.equal(contract.dayPeriod.range.min, 0);
  assert.equal(contract.dayPeriod.range.max, 1);
  assert.equal(contract.dayPeriod.announcedBy, 'aria-valuetext');
  assert.equal(contract.dayPeriod.typedBy, 'the first letter of the locale name');
  assert.equal(contract.dayPeriod.drawnWhen, 'the resolved hour cycle is h11 or h12');
});

/**
 * The one place the family leaves the APG example, written rather than taken
 * quietly. Fifteen minutes is the page a reader of a time field means, and it
 * is the step a quarter-hour panel offers, so the two agree.
 */
test('writes the cost of every departure from the pattern', () => {
  assert.deepEqual(contract.pageStep, { hour: 3, minute: 15, second: 15, dayPeriod: 1 });
  assert.ok(contract.departures.pageStep.includes('cost'));
  assert.ok(contract.departures.noArrowButtons.length > 0);
  assert.match(contract.departures.arrowsAcross, /logical/);
});

test('wraps a step inside the segment rather than carrying', () => {
  const up = contract.keyboard.find((entry) => entry.key === 'ArrowUp');
  assert.equal(up.wraps, 'within the segment');
  assert.equal(contract.entryModel.wraps, 'inside the segment, never carrying into the next');
});

/**
 * The gap the inventory names: every surveyed field holds a whole time or
 * nothing, so an hour with no minute is a state none of them can express.
 */
test('carries the segments alongside the value, so a half-typed time exists', () => {
  assert.equal(contract.valueType, 'PlainTime | null');
  assert.ok(contract.stateModel.value.carries.includes('segments'));
  assert.equal(contract.entryModel.clearedSegment, 'the placeholder, and the value becomes null');
});

/**
 * The value this library holds is the wall-clock time the reader typed. An
 * instant is the type every surveyed implementation gets wrong at a daylight
 * boundary, and holding one would owe an answer for the hour that happens
 * twice and the hour that never happens.
 */
test('holds a wall-clock time and never an instant', () => {
  assert.equal(contract.zoned, false);
  assert.match(contract.zonedReason, /daylight/i);
  assert.equal(contract.resolution.timeZone[2], 'runtime', 'the zone answers only "what is now"');
});

test('moves the display on every digit and the value only when a run ends', () => {
  assert.equal(contract.entryModel.requestEmittedOn, 'the end of a run, never inside one');
  assert.ok(contract.stateModel.value.reasons.includes('blur'), 'a run also ends by leaving');
});

test('stops the keys it acts on rather than only defaulting them', () => {
  assert.equal(
    contract.entryModel.keysAreConsumed,
    'a key the field acts on is stopped, not only defaulted',
  );
  assert.match(contract.entryModel.whyKeysAreConsumed, /role=spinbutton/);
});

/**
 * A time written as a duration from now, resolved in view before it is accepted.
 */
test('accepts a time written as a duration and resolves it before committing', () => {
  assert.equal(contract.relative.opensOn.join(''), '+-=');
  assert.equal(contract.relative.anchor, 'now, or referenceTime when the consumer states one');
  assert.equal(contract.relative.commitsOn, 'Enter, or blur when the expression resolves');
  assert.equal(contract.relative.abandonsOn, 'Escape, or blur when it does not');
  assert.ok(member.parts.includes('duration'));
  assert.ok(member.parts.includes('preview'));
  assert.equal(contract.relative.preview.live, 'polite');
  assert.match(contract.relative.grammar.bareNumber, /minute/);
  assert.deepEqual(contract.relative.grammar.units, ['h', 'm', 's']);
  assert.ok(
    contract.relative.reachableWithout.length > 0,
    'a shortcut is never the only way to a value',
  );
});

/**
 * A duration that runs past midnight resolves into a different day, and this
 * library holds no day beside a time. The crossing is stated in the DOM, in
 * the announcement and in the request rather than hidden.
 */
test('says so when a duration crosses midnight', () => {
  assert.equal(
    contract.dataAttributes['data-crosses-midnight'],
    'the expression resolved into the next day',
  );
  assert.ok(contract.stateModel.value.carries.includes('crossesMidnight'));
  assert.match(contract.relative.midnight, /00:30/);
});

test('writes the placeholder and the field order from the locale', () => {
  assert.equal(contract.placeholder.from, 'Intl.DisplayNames dateTimeField');
  assert.equal(contract.placeholder.example['pt-BR'], 'hh:mm');
  assert.equal(contract.placeholder.example['en-US'], 'hh:mm AM');
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
 * Granularity is an axis rather than a silence, so a family that later grows a
 * sub-second field does not break a contract to say it.
 */
test('names granularity as an axis and defaults it to the platform default', () => {
  assert.deepEqual(contract.axes.granularity, ['hour', 'minute', 'second']);
  assert.equal(member.defaults.granularity, 'minute');
});

test('shares its appearance axes with the field it sits beside', () => {
  assert.deepEqual(contract.axes.size, dateField.axes.size);
  assert.deepEqual(contract.axes.variant, dateField.axes.variant);
});
