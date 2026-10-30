import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, STATE_ATTRIBUTES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.calendar;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'calendar');
  assert.equal(contract.ui, 'calendar');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The APG's own note: with the grid role on a `table`, the row, column-header
 * and cell roles are implied by `tr`, `th` and `td` and must not be written.
 * A family that wrote them would be duplicating semantics the platform already
 * gives, which is the failure `patterns.md` names.
 */
test('puts the grid role on a real table and writes none of the implied ones', () => {
  assert.equal(contract.controlPart, 'grid');
  assert.equal(contract.controlRole, 'grid');
  assert.equal(contract.gridElement, 'table');
  assert.deepEqual(contract.impliedRoles, ['row', 'columnheader', 'rowheader', 'gridcell']);
  for (const role of contract.impliedRoles) {
    assert.ok(
      !Object.values(contract.wiring).includes(role),
      `${role} is implied by the element and must not be written`,
    );
  }
});

test('keeps exactly one cell in the tab sequence', () => {
  assert.match(contract.focusModel, /roving tabindex/);
  assert.match(contract.focusModel, /exactly one cell/);
});

test('binds every key the grid pattern lists, with its focus destination', () => {
  const bound = new Map(contract.keyboard.map((entry) => [entry.key, entry]));
  for (const key of [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
    'Shift+PageUp',
    'Shift+PageDown',
    'Enter',
    'Space',
  ]) {
    assert.ok(bound.has(key), `${key} is in the pattern and not in the contract`);
  }
  assert.equal(bound.get('PageUp').clampsDay, true, 'the APG clamps to the last day of the month');
  assert.equal(
    bound.get('ArrowLeft').mirroredInRtl,
    true,
    'the keys are physical, the order is not',
  );
});

/**
 * Paging with a key changes nothing that focus lands on, so nothing else
 * announces the new month. The APG marks the heading as a live region for
 * exactly this.
 */
test('announces what a key changes and nothing else does', () => {
  assert.equal(contract.wiring['aria-live'], 'heading is polite');
  assert.match(contract.announce.headingChange, /polite/);
  assert.match(contract.announce.clampedStep, /short month/);
});

/**
 * Two characters is what a column can hold and is not a weekday. `abbr` is the
 * APG's answer, and it is the difference between hearing "Mo" and "Monday".
 */
test('gives the column header the full weekday name a reader hears', () => {
  assert.equal(contract.wiring.abbr, 'the full weekday name on every column header');
  assert.ok(member.parts.includes('week-header'));
});

/**
 * An unavailable date the reader cannot reach is a date the reader cannot be
 * told about. `aria-disabled` keeps it focusable; `disabled` would not.
 */
test('keeps an unavailable date reachable and refuses to select it', () => {
  assert.equal(contract.unavailable.attribute, 'aria-disabled');
  assert.equal(contract.unavailable.focusable, true);
  assert.equal(contract.unavailable.selectable, false);
  assert.equal(contract.unavailable.evaluatedOncePerVisibleCell, true);
});

/**
 * §6 of `docs/component-features.md` asks for it in those words: today is
 * marked separately from the selection, because a reader who has chosen today
 * must still see both facts.
 */
test('marks today apart from the selection', () => {
  assert.ok('data-today' in contract.dataAttributes);
  assert.equal(contract.stateAttributes.selected, STATE_ATTRIBUTES.selected);
  assert.ok(
    !Object.keys(contract.stateAttributes).includes('current'),
    'the cell the reader is on is the one holding focus, and focus already says so',
  );
});

/**
 * The two values are different questions — what has been chosen, and where the
 * reader is — and three of the seven surveyed implementations let a consumer
 * own the second one.
 */
test('separates the date chosen from the date the reader is on', () => {
  assert.deepEqual(Object.keys(contract.stateModel).sort(), ['current', 'value']);
  assert.equal(contract.stateModel.current.controlled, 'focusedDate');
  assert.ok(member.capabilities.includes('current'));
});

test('ships the three selection modes the field ships', () => {
  assert.deepEqual(contract.axes.selectionMode, ['single', 'range', 'multiple']);
  for (const attribute of ['data-range-start', 'data-range-end', 'data-in-range']) {
    assert.ok(attribute in contract.dataAttributes, `${attribute} has no meaning written`);
  }
});

/**
 * While a run has one end, the grid draws where it would close — the day
 * under the pointer, or the focused day — and says so. Four of the nine
 * implementations `date-range-picker` surveyed draw it; the picker needs the
 * day itself to say how long the run would be.
 */
test('previews the open run to the pending end, and reports that end', () => {
  assert.ok('data-preview' in contract.dataAttributes);
  assert.match(contract.preview.pendingEnd, /pointer.*focused/);
  assert.equal(contract.preview.reportedBy, 'onPreviewChange');
  assert.match(contract.preview.notAModel, /not own/);
});

test('ships the three views, and the columns each one is drawn in', () => {
  assert.deepEqual(contract.views.order, ['day', 'month', 'year']);
  assert.deepEqual(contract.views.columns, { day: 7, month: 4, year: 4 });
  assert.equal(contract.views.reachedBy, 'the heading');
});

/**
 * `Escape` inside a month or year view goes down a view rather than out of the
 * component, which is the staging the briefing records for `dismissable-layer`:
 * the family decides, and simply does not ask the layer to close.
 */
test('stages Escape so a view closes before the surface does', () => {
  const escape = contract.keyboard.find((entry) => entry.key === 'Escape');
  assert.equal(escape.effect, 'view');
  assert.match(escape.onlyWhen, /month or year/);
});

/**
 * The root is the query container, so a family that reflows answers its own
 * inline size. `references/stories.md` then requires its stage to be `block`.
 */
test('answers its own width rather than the viewport', () => {
  assert.equal(contract.container.on, 'root');
  assert.equal(contract.container.name, 'slotted-calendar');
  assert.ok(contract.container.breakpoints.every(Number.isInteger));
});

/**
 * The reflow is arithmetic and not a step, and it takes nothing away. A
 * literal threshold is the only kind CSS allows in a container condition, and
 * one literal cannot be right at three densities — the reason is written in
 * the contract rather than left for the next reader to rediscover.
 */
test('reflows by proportion, and withdraws no part of the month', () => {
  assert.equal(contract.container.hidesNothing, true);
  assert.match(contract.container.reflow, /100cqi/);
  assert.match(contract.container.reflow, /wraps under the first/);
  assert.match(contract.container.why, /three densities/);
});

test('holds a six-row grid available, so a popup does not resize under the pointer', () => {
  assert.deepEqual(contract.axes.fixedWeeks, ['off', 'on']);
});
