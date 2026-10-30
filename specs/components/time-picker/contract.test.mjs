import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const timeField = JSON.parse(
  await readFile(new URL('../time-field/contract.json', import.meta.url), 'utf8'),
);
const datePicker = JSON.parse(
  await readFile(new URL('../date-picker/contract.json', import.meta.url), 'utf8'),
);
const select = JSON.parse(
  await readFile(new URL('../select/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.timePicker;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'time-picker');
  assert.equal(contract.ui, 'time-picker');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The family composes the field and redraws nothing of it. A second segmented
 * control would be two places to fix one defect, which is the reason
 * `date-picker` composes `date-field` rather than reimplementing it.
 */
test('composes the field rather than drawing a second one', () => {
  assert.deepEqual(contract.composes, ['time-field']);
  assert.equal(contract.valueType, timeField.valueType);
  assert.ok(member.parts.includes('control'));
  assert.ok(!member.parts.includes('segment'), 'the segments belong to time-field');
});

/**
 * A list of times at a step has one axis, so it is a listbox and not a grid.
 * The family therefore composes the layer modules `select` composes and none
 * of `calendar`.
 */
test('takes the listbox pattern and none of the calendar machinery', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/');
  assert.ok(!contract.composes.includes('calendar'));
  for (const module of [
    '@slotted/core/positioner',
    '@slotted/core/presence',
    '@slotted/core/portal',
    '@slotted/core/dismissable-layer',
    '@slotted/core/typeahead',
  ]) {
    assert.ok(contract.core.includes(module), `${module} is not composed`);
  }
});

/**
 * One shape, one axis, one role. The panel is a listbox in every configuration
 * the family has, so the trigger says the same thing in every one of them.
 */
test('has one panel shape, and the trigger names it', () => {
  assert.equal(contract.panel.role, 'listbox');
  assert.equal(contract.panel['aria-haspopup'], 'listbox');
  assert.equal(contract.contentRole, 'listbox');
  assert.equal(contract.axes.panel, undefined, 'a panel with one shape has no axis');
  assert.equal(member.defaults.panel, undefined);
  assert.equal(member.parts.includes('column'), false);
  assert.equal(member.parts.includes('column-label'), false);
});

/**
 * The capability two surveyed implementations ship, declined with the family
 * that owns it instead named — which is what `references/capability.md`
 * requires of every decline.
 */
test('declines the column panel and names what owns the capability instead', () => {
  const declined = contract.declined.columns;
  assert.deepEqual(declined.shipsIt.length, 2);
  assert.equal(declined.ownedInsteadBy, 'time-field');
  assert.match(declined.reason, /§6/);
  assert.match(declined.reason, /`options`/, 'the arbitrary set is what a decline has to answer');
  assert.match(declined.reason, /seconds/, 'and so is the precision');
  assert.ok(declined.cost.length > 0, 'a decline states what it costs');
});

/**
 * The guard belongs on the length of the list, not on the size of the step: a
 * thirty-second slot inside a five-minute window is eleven rows. A floor of one
 * minute was written at the visual gate and withdrawn on the reviewer's
 * reading, because it refused the window along with the day.
 */
test('guards the length of the list rather than the size of the step', () => {
  assert.equal(contract.step.floor, 1);
  assert.match(contract.step.floorReason, /withdrawn/);
  assert.equal(contract.maxOptions.default, 1440);
  assert.match(contract.maxOptions.why, /86 ?400|86400/);
  assert.match(contract.maxOptions.beyondIt, /data-truncated/);
  assert.ok(contract.maxOptions.raisable.length > 0, 'a cap a consumer cannot raise is a wall');
  assert.equal(
    contract.dataAttributes['data-truncated'],
    'the list stops short of the times the configuration asked for, at maxOptions',
  );
});

/**
 * The half of the columns question a decline had to answer rather than avoid.
 * A step describes a regular list; a clinic open at 09:00, 09:20 and 13:45 is
 * not one, and a predicate only subtracts from times that fall on a step.
 */
test('takes an explicit list of times, so every arrangement is expressible', () => {
  assert.equal(contract.options.prop, 'options');
  assert.match(contract.options.replaces, /step, min and max/);
  assert.match(contract.options.why, /second-level|seconds/);
  assert.match(contract.options.content, /renderOption/);
  assert.match(contract.options.content, /ng-template/);
  assert.match(contract.options.order, /consumer/);
});

/**
 * `input[type=time]` ties the arrows to the step and this family does not: a
 * minute arrow moving fifteen at a time puts `:07` out of reach of the arrows,
 * and the field's promise is that every value is reachable there.
 */
test('keeps the panel step out of the field arrows, and says why', () => {
  assert.match(contract.step.notTheFieldArrows, /input\[type=time\] ties the two/);
  assert.match(contract.step.notTheFieldArrows, /out of reach/);
});

/**
 * Ninety-six rows is a length, not a shape. An hour heading was drawn and
 * withdrawn: the hour is already on every row, so the heading repeated the
 * reading and cost a row of the list. What answers the length costs no row.
 */
test('answers the length of the list without spending a row on it', () => {
  assert.match(contract.panel.scanning, /withdrawn/);
  assert.equal(member.parts.includes('group'), false);
  assert.equal(member.parts.includes('group-label'), false);
  assert.deepEqual(contract.hourJump.keys, ['PageUp', 'PageDown']);
  assert.match(contract.hourJump.moves, /hour/);
  assert.equal(contract.grouping, undefined);
});

test('binds every key the sourced pattern lists', () => {
  const bound = new Set(contract.keyboard.map((entry) => entry.key));
  for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'Space', 'Escape']) {
    assert.ok(bound.has(key), `${key} is in the pattern and not in the contract`);
  }
  assert.ok(bound.has('a-z0-9'), 'the pattern recommends type-ahead above seven options');
  /* The coarse axis a grouped list gains, and the one the pattern has no key
     for because its example holds no groups. */
  assert.ok(bound.has('PageUp') && bound.has('PageDown'), 'a grouped list pages by group');
});

/**
 * The pattern lists selection-following-focus as optional and warns it can
 * degrade accessibility. Here it would fire one request per option as a reader
 * arrows through ninety-six of them, and would write partial times in columns.
 */
test('refuses selection following focus, and writes why', () => {
  assert.equal(contract.selectionFollowsFocus, false);
  assert.match(contract.selectionFollowsFocusReason, /request/);
});

/**
 * The defect the reviewer found at the visual gate: `:hover` with one `:not()`
 * outweighs a plain `[data-selected]`, so the chosen row turned grey under the
 * pointer whatever the source order said. Precedence between painted states is
 * a specificity question, and the contract states it so the stylesheet can be
 * read against it.
 */
test('orders the painted states, and guards each weaker one by specificity', () => {
  assert.deepEqual(contract.statePrecedence.order, ['disabled', 'selected', 'current', 'hover']);
  assert.match(contract.statePrecedence.guard, /specificity/);
  assert.match(contract.statePrecedence.selectedHover, /own tone/);
  for (const state of contract.statePrecedence.order.slice(0, 3)) {
    assert.ok(member.states.includes(state), `${state} is ordered and no member declares it`);
  }
});

/**
 * The platform's own rule for `input[type=time]`: the step base is `min` when
 * it is stated and midnight when it is not. No surveyed panel states its base.
 */
test('states the base a step counts from', () => {
  assert.equal(contract.step.unit, 'seconds');
  assert.equal(contract.step.base, 'min when it is stated, midnight when it is not');
  assert.match(contract.step.source, /input\[type=time\]/);
  assert.equal(contract.step.offStepIsInvalid, false);
});

test('says where the panel opens, in all three cases', () => {
  assert.deepEqual(contract.opensOn, [
    'the chosen time',
    'the nearest step to now',
    'the first available option',
  ]);
  assert.equal(contract.scroll, "scrollIntoView({ block: 'nearest' })");
});

/**
 * A list that silently drops rows is a list whose step the reader cannot
 * infer, so disabling is the default and hiding is the consumer's choice.
 */
test('offers both answers to an unavailable option and defaults to the loud one', () => {
  assert.deepEqual(contract.axes.unavailableOptions, ['disable', 'hide']);
  assert.equal(member.defaults.unavailableOptions, 'disable');
  assert.ok(member.parts.includes('empty'), 'no time available at all is a state, not a blank box');
});

test('draws a control that writes the current time', () => {
  assert.ok(member.parts.includes('now'));
  assert.equal(contract.now.equals, "the zero case of time-field's relative expression");
  assert.match(contract.now.why, /discover/);
});

/**
 * The highlight is the third: a consumer can own where the reader is in the
 * list, and `select` already names it `current` with the same three reasons.
 * One term, one word, across both families.
 */
test('declares three mutable values, with a reason vocabulary the schema holds', () => {
  assert.deepEqual(Object.keys(contract.stateModel).sort(), ['current', 'open', 'value']);
  assert.equal(contract.stateModel.current.controlled, select.stateModel.current.controlled);
  assert.equal(contract.stateModel.current.request, select.stateModel.current.request);
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) {
      assert.ok(CHANGE_REASONS.includes(reason), `unknown reason ${reason}`);
    }
  }
});

/**
 * The chord `date-picker` took, with the same recorded cost: ChromeOS turns it
 * into PageDown before the browser sees it, so the trigger is always drawn.
 */
test('opens from the keyboard the way the sibling picker does', () => {
  const chord = contract.keyboard.find((entry) => entry.key === 'Alt+ArrowDown');
  assert.ok(chord, 'the chord is not bound');
  assert.equal(chord.focus, 'stays in the field, so typing keeps working');
  assert.match(contract.platformNotes.altArrowDown, /ChromeOS/);
  assert.equal(
    contract.platformNotes.altArrowDown,
    datePicker.platformNotes.altArrowDown,
    'one platform fact, stated the same way in both families',
  );
});

test('keeps the field typable while the panel is showing', () => {
  assert.equal(contract.panelBlocksTyping, false);
  assert.match(contract.panelBlocksTypingReason, /§6/);
  assert.equal(contract.highlightFollowsTyping, true);
});

test('dismisses through the one layer stack, as every overlay family does', () => {
  assert.equal(contract.dismissal.escape, 'through dismissable-layer, in the capture phase');
  assert.equal(contract.dismissal.outsidePress, true);
  assert.equal(contract.layer.modal, false);
  assert.equal(contract.layer.depthProperty, '--slotted-layer-depth');
});

test('shares its appearance and placement axes with the sibling picker', () => {
  assert.deepEqual(contract.axes.size, datePicker.axes.size);
  assert.deepEqual(contract.axes.variant, datePicker.axes.variant);
  assert.deepEqual(contract.axes.placement, datePicker.axes.placement);
});

/**
 * `auto` closes when one press has chosen a whole time and stays open when a
 * press has chosen one part of one — the same shape `date-picker` gives it for
 * a single date against a range.
 */
test('closes on select, because one press finishes the value', () => {
  assert.match(contract.dismissal.closeOnSelect, /^auto closes/);
  assert.deepEqual(contract.axes.closeOnSelect, datePicker.axes.closeOnSelect);
});
