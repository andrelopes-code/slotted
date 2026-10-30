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
const popover = JSON.parse(
  await readFile(new URL('../popover/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.datePicker;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'date-picker');
  assert.equal(contract.ui, 'date-picker');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * It composes the other two rather than redrawing them. A third segmented
 * field and a second month grid would be two places to fix one defect, and the
 * two families would drift the way `alert` and `tag` drifted from `badge`.
 */
test('composes the two families instead of drawing a field and a grid again', () => {
  assert.deepEqual(contract.composes, ['date-field', 'calendar']);
  assert.equal(dateField.family, 'date-field');
  assert.equal(calendar.family, 'calendar');
  for (const part of ['segment', 'cell', 'week-header']) {
    assert.ok(
      !member.parts.includes(part),
      `${part} belongs to a composed family and must not be redeclared`,
    );
  }
});

/**
 * The briefing's rule for every overlay: the behavior comes from
 * `packages/core` and is never rewritten in a family.
 */
test('takes every overlay behavior from core', () => {
  for (const module of [
    '@slotted/core/presence',
    '@slotted/core/portal',
    '@slotted/core/positioner',
    '@slotted/core/dismissable-layer',
    '@slotted/core/focus',
  ]) {
    assert.ok(contract.core.includes(module), `${module} is not composed`);
  }
  assert.ok(contract.core.includes('@slotted/core/date'));
});

test('carries the same dialog role the surveyed field and the APG carry', () => {
  assert.equal(contract.contentRole, 'dialog');
  assert.equal(contract.wiring['aria-haspopup'], 'dialog');
  assert.equal(popover.family, 'popover', 'the overlay vocabulary is shared, not reinvented');
});

/**
 * Focus returns to the trigger when the popup closes, so the trigger's name is
 * where the reader is told what was chosen. The APG names this as an
 * accessibility feature of its own example.
 */
test('puts the chosen date in the name focus returns to', () => {
  assert.match(contract.triggerName.empty, /choose message/);
  assert.match(contract.triggerName.chosen, /whole date in words/);
  assert.match(contract.triggerName.why, /Focus returns/);
});

/**
 * Adopted from Angular Material together with the platform note it records:
 * ChromeOS eats the chord, so a button is always there.
 */
test('offers the chord and never depends on it', () => {
  const chord = contract.keyboard.find((entry) => entry.key === 'Alt+ArrowDown');
  assert.equal(chord.effect, 'open');
  assert.match(contract.platformNotes.altArrowDown, /ChromeOS/);
  assert.ok(member.parts.includes('trigger'));
});

/**
 * The staging the briefing records: `dismissable-layer` asks in the capture
 * phase, so a family that wants a key to do something else first decides it
 * and does not call `setOpen`. Here the calendar's month and year views take
 * `Escape` before the surface does.
 */
test('closes on Escape, and lets the calendar take the key first', () => {
  const escape = contract.keyboard.find((entry) => entry.key === 'Escape');
  assert.equal(escape.focusTo, 'trigger');
  assert.match(escape.staged, /month or year/);
  assert.equal(contract.dismissal.escape, 'through dismissable-layer, in the capture phase');
});

/**
 * Closing on selection is right for one date and a trap for a range, where the
 * second press has to reach the same surface.
 */
test('closes on selection only where closing is not a trap', () => {
  assert.deepEqual(contract.axes.closeOnSelect, ['auto', 'always', 'never']);
  assert.equal(member.defaults.closeOnSelect, 'auto');
  assert.match(contract.dismissal.closeOnSelect, /single only/);
});

/**
 * §2.7 of `docs/component-features.md` asks for it by name: a popover on the
 * desktop and a sheet in a narrow viewport. The DOM is the same either way, so
 * the decision is testable without a device.
 */
test('answers a narrow coarse-pointer viewport without changing the DOM', () => {
  assert.match(contract.responsive.sheet, /coarse pointer/);
  assert.equal(contract.responsive.decidedIn, 'the stylesheet; the DOM does not change');
  assert.ok('data-presentation' in contract.dataAttributes);
});

test('declares both mutable values, each with a reason vocabulary', () => {
  assert.deepEqual(Object.keys(contract.stateModel).sort(), ['open', 'value']);
  assert.ok(contract.stateModel.open.reasons.includes('escape'));
  assert.ok(contract.stateModel.open.reasons.includes('outsidePress'));
  assert.ok(contract.stateModel.value.reasons.includes('select'));
});

test('exposes the imperative actions a consumer cannot express declaratively', () => {
  assert.deepEqual(contract.imperative, ['focus', 'open', 'close']);
});

test('declares the same single-value calendar axis the composed families do', () => {
  assert.deepEqual(contract.axes.calendar, ['gregory']);
  assert.deepEqual(contract.axes.calendar, dateField.axes.calendar);
  assert.deepEqual(contract.axes.calendar, calendar.axes.calendar);
});
