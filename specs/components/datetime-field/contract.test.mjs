import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const dateField = JSON.parse(
  await readFile(new URL('../date-field/contract.json', import.meta.url), 'utf8'),
);
const timeField = JSON.parse(
  await readFile(new URL('../time-field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.dateTimeField;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'datetime-field');
  assert.equal(contract.ui, 'datetime-field');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One frame, one group, one value. Two nested family roots would be two
 * groups, two values and two `SegmentState`s, and "the reader is typing" would
 * become two questions with two answers — which is the arrangement the
 * previous session widened the segment engine to avoid.
 */
test('draws one group holding both halves, and says why it nests neither sibling', () => {
  assert.equal(contract.controlPart, 'segments');
  assert.equal(contract.controlRole, 'group');
  assert.equal(contract.segmentRole, 'spinbutton');
  assert.equal(contract.rootRole, null);
  assert.equal(contract.composes, undefined, 'a nested field root would be a second group');
  assert.ok(member.parts.includes('segments'));
  assert.ok(member.parts.includes('segment'));
  assert.match(contract.oneRow.why, /role="group"/);
  assert.match(contract.oneRow.why, /one pattern/i);
  assert.ok(contract.oneRow.cost.length > 0, 'a decision states what it costs');
});

/**
 * `PlainDateTime` is a `PlainDate` beside a `PlainTime`, which
 * `2026-09-09-date-design.md` §11 already named. Nested, so every function the
 * two halves already have applies to each half unchanged.
 */
test('holds one value, nested, and no instant', () => {
  assert.equal(contract.valueType, 'PlainDateTime | null');
  assert.equal(contract.valueShape, '{ date: PlainDate; time: PlainTime }');
  assert.equal(contract.zoned, false);
  assert.match(contract.zonedReason, /wall-clock/);
  assert.equal(contract.hiddenValueInput, true);
  assert.equal(contract.hiddenValueFormat, 'ISO 8601 YYYY-MM-DDTHH:mm:ss');
});

/**
 * Seven fields in one `SegmentState`, which is what the time session widened
 * the engine for and what this family is the first to spend.
 */
test('names all seven fields, from the two halves', () => {
  assert.deepEqual(contract.fields, [
    'year',
    'month',
    'day',
    'hour',
    'minute',
    'second',
    'dayPeriod',
  ]);
  for (const field of dateField.fields) assert.ok(contract.fields.includes(field));
  for (const field of timeField.fields) assert.ok(contract.fields.includes(field));
  assert.equal(contract.engine.module, 'packages/core/src/date/segments.ts');
  assert.equal(contract.engine.shared, true);
  assert.match(contract.engine.widened, /additively|unchanged/);
});

/**
 * The order of the two halves and the literal between them come from one
 * combined formatter. Two independent fields cannot learn either, which is one
 * of the three reasons the row is drawn once.
 */
test('takes the order of the halves from one combined formatter', () => {
  assert.equal(contract.fieldOrder, "the locale's, from one Intl.DateTimeFormat.formatToParts");
  assert.match(contract.formatModule, /datetime-format\.ts/);
  assert.match(contract.oneRow.pattern, /literal/);
});

/**
 * The row is one line at every width and is clipped at the frame, never
 * wrapped: a control two lines tall broke every row it stood in. Nothing is
 * removed, and the half with focus is scrolled into view.
 */
test('keeps the row on one line and clips it at the frame', () => {
  assert.equal(
    contract.dataAttributes['data-half'],
    'date or time, and where the row is clipped between the two',
  );
  assert.match(contract.overflow.at, /one line at every width/);
  assert.match(contract.overflow.never, /never onto a second line/);
  assert.equal(contract.overflow.removesContent, false);
  assert.match(contract.overflow.scrolls, /scrolled into view/);
  assert.equal(contract.overflow.part, 'half');
  assert.ok(
    member.parts.includes('half'),
    'the halves are boxes: a date and a time each read left to right',
  );
  assert.match(contract.overflow.partWhy, /left to right/);
  assert.match(contract.overflow.boundaryLiteral, /data-boundary/);
  assert.match(contract.overflow.decidedBy, /flex-wrap is off at every width/);
  assert.equal(
    contract.dataAttributes['data-boundary'],
    'the literal between the two halves, drawn at the end of the date half',
  );
});

/**
 * `value` is null until both halves are whole, which every surveyed
 * implementation reports. Which half is missing is what none of them can say.
 */
test('says which half is missing, in the DOM, in the request and in the form', () => {
  assert.equal(
    contract.dataAttributes['data-incomplete'],
    'date or time — the half that is missing',
  );
  assert.ok(contract.stateModel.value.carries.includes('segments'));
  assert.ok(contract.validators.includes('dateTimeIncomplete'));
  assert.match(contract.incomplete.emptyField, /not/, 'an empty field is not an incomplete one');
  assert.match(contract.incomplete.paints, /warning/, 'a state nobody drew is a state nobody saw');
  assert.match(contract.incomplete.paints, /focus/, 'and it is quiet while the reader is typing');
  assert.match(contract.incomplete.paints, /under invalid/);
});

/**
 * The expression `time-field` opens, widened by two unit letters. `d` and `w`
 * are additive: every expression `time-field` parsed parses the same way.
 */
test('widens the relative grammar by two units and nothing else', () => {
  assert.deepEqual(contract.relative.grammar.units, ['w', 'd', 'h', 'm', 's']);
  for (const unit of timeField.relative.grammar.units) {
    assert.ok(contract.relative.grammar.units.includes(unit), `${unit} was dropped`);
  }
  assert.equal(contract.relative.anchor, timeField.relative.anchor);
  assert.equal(contract.relative.grammar.bareNumber, timeField.relative.grammar.bareNumber);
  assert.match(contract.relative.preview.shows, /date only when it differs/);
});

/**
 * The flag exists in `time-field` because a `PlainTime` has no day beside it.
 * Here the day exists, so the crossing is not a flag: it is the value.
 */
test('spends the midnight flag rather than carrying it', () => {
  assert.ok(
    timeField.stateModel.value.carries.includes('crossesMidnight'),
    'the sibling raises the flag this family answers',
  );
  assert.ok(!contract.stateModel.value.carries.includes('crossesMidnight'));
  assert.match(contract.relative.rollsDay, /the value/);
  assert.ok(member.parts.includes('preview-date'), 'the attribute paints the half that moved');
  assert.match(contract.relative.preview.datePart, /crying wolf|warned/);
  assert.equal(
    contract.dataAttributes['data-rolls-day'],
    'the expression resolved onto a different day',
  );
});

test('binds every key the sourced pattern lists, and states each departure', () => {
  assert.equal(contract.pattern, timeField.pattern);
  const bound = new Set(contract.keyboard.map((entry) => entry.key));
  for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']) {
    assert.ok(bound.has(key), `${key} is in the pattern and not in the contract`);
  }
  assert.ok(bound.has('ArrowRight') && bound.has('ArrowLeft'));
  for (const departure of ['pageStep', 'noArrowButtons', 'arrowsAcross', 'relativeKeys']) {
    assert.ok(contract.departures[departure], `${departure} has no written cost`);
  }
});

/**
 * Each half pages the way its own family pages. Two fields drawing the same
 * segment and stepping it differently would be one behaviour with two answers,
 * so nothing here is reinvented — and the disagreement that remains is with
 * `calendar`, which pages by the month it draws rather than by a unit.
 */
test('pages each of the seven fields the way its own half already does', () => {
  assert.deepEqual(Object.keys(contract.pageStep).sort(), contract.fields.slice().sort());
  for (const [field, step] of Object.entries(dateField.pageStep)) {
    assert.equal(contract.pageStep[field], step, `${field} pages unlike date-field`);
  }
  for (const [field, step] of Object.entries(timeField.pageStep)) {
    assert.equal(contract.pageStep[field], step, `${field} pages unlike time-field`);
  }
  assert.match(contract.departures.pageStep, /calendar/);
});

/**
 * The rule `date-field` recorded and every family in the chain inherits: a
 * single-key shortcut guard tests for input, textarea and contenteditable, and
 * a div with role=spinbutton is none of the three.
 */
test('consumes a key it acts on rather than only defaulting it', () => {
  assert.equal(contract.entryModel.keysAreConsumed, timeField.entryModel.keysAreConsumed);
  assert.match(contract.entryModel.whyKeysAreConsumed, /contenteditable/);
  assert.equal(contract.entryModel.requestEmittedOn, timeField.entryModel.requestEmittedOn);
  assert.deepEqual(contract.entryModel.pasteOrder, [
    'the locale pattern',
    'ISO 8601 YYYY-MM-DDTHH:mm[:ss]',
    'a relative expression',
  ]);
});

/**
 * A digit that fills the last date segment advances into the first time
 * segment. Across two nested roots both would stop at the boundary, which is
 * the third reason the row is drawn once.
 */
test('runs typing and the arrows across the boundary between the halves', () => {
  assert.match(contract.entryModel.runsAcrossHalves, /advances/);
  assert.match(contract.oneRow.typing, /boundary/);
});

test('declares one mutable value, with a reason vocabulary the schema holds', () => {
  assert.deepEqual(Object.keys(contract.stateModel), ['value']);
  for (const reason of contract.stateModel.value.reasons) {
    assert.ok(CHANGE_REASONS.includes(reason), `unknown reason ${reason}`);
  }
});

test('shares its appearance axes and its resolution order with both siblings', () => {
  assert.deepEqual(contract.axes.size, timeField.axes.size);
  assert.deepEqual(contract.axes.variant, timeField.axes.variant);
  assert.deepEqual(contract.axes.hourCycle, timeField.axes.hourCycle);
  assert.deepEqual(contract.axes.granularity, timeField.axes.granularity);
  assert.deepEqual(contract.resolution.size, timeField.resolution.size);
  assert.deepEqual(contract.resolution.granularity, timeField.resolution.granularity);
});

/**
 * The date half is always whole. A datetime without a day is a date, and
 * `date-field` is that family.
 */
test('governs the time half with granularity and leaves the date half whole', () => {
  assert.match(contract.granularity.governs, /time half/);
  assert.match(contract.granularity.dateHalf, /date-field/);
  assert.equal(contract.axes.granularity.includes('day'), false);
});
