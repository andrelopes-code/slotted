import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const dateTimeField = JSON.parse(
  await readFile(new URL('../datetime-field/contract.json', import.meta.url), 'utf8'),
);
const datePicker = JSON.parse(
  await readFile(new URL('../date-picker/contract.json', import.meta.url), 'utf8'),
);
const timePicker = JSON.parse(
  await readFile(new URL('../time-picker/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.dateTimePicker;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'datetime-picker');
  assert.equal(contract.ui, 'datetime-picker');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The family composes the field and the grid and redraws neither. A second
 * segmented control or a second month grid would be two places to fix one
 * defect, which is the rule `date-picker` and `time-picker` both follow.
 */
test('composes the field and the calendar rather than drawing either again', () => {
  assert.deepEqual(contract.composes, ['datetime-field', 'calendar']);
  assert.equal(contract.valueType, dateTimeField.valueType);
  assert.ok(member.parts.includes('control'));
  assert.ok(!member.parts.includes('segment'), 'the segments belong to datetime-field');
  assert.ok(!member.parts.includes('grid'), 'the month grid belongs to calendar');
});

/**
 * One layer carrying `role="dialog"`, which is the role the APG's own Date
 * Picker Combobox example gives its popup, holding a grid and a listbox.
 */
test('takes the dialog role the sourced example gives the popup', () => {
  assert.equal(contract.contentRole, 'dialog');
  assert.equal(contract.wiring['aria-haspopup'], 'dialog');
  assert.equal(contract.contentRole, datePicker.contentRole);
  assert.match(contract.pattern, /^https:\/\/www\.w3\.org\/WAI\/ARIA\/apg\//);
  assert.match(contract.patternStatus, /2026/);
  assert.equal(contract.panel.surfaces.length, 2);
  assert.deepEqual(
    contract.panel.surfaces.map((surface) => surface.role),
    ['grid', 'listbox'],
  );
});

/**
 * The one family holding two surfaces, and the arrangement it refused. A
 * tablist that exists on a narrow container and not on a wide one tells
 * assistive technology two different stories about the same component.
 */
test('keeps both surfaces in the DOM at every width, and says what it refused', () => {
  assert.equal(contract.panel.bothPresent, true);
  assert.equal(member.parts.includes('tab'), false);
  assert.equal(member.parts.includes('tablist'), false);
  assert.ok(member.parts.includes('date-panel'));
  assert.ok(member.parts.includes('time-panel'));
  const declined = contract.declined.tabs;
  assert.ok(declined.shipsIt.length >= 2, 'a decline names who ships the capability');
  assert.match(declined.reason, /assistive technology|screen reader/);
  assert.ok(declined.cost.length > 0, 'a decline states what it costs');
});

/**
 * The briefing's two-element split answers a family whose container query
 * changes its own grid. This panel has no width to query: it is shrink-wrapped
 * from a calendar and a list and capped by the room the positioner measured,
 * and `container-type: inline-size` would take that sizing away. The answer is
 * to need no query — two flex items that wrap when the room runs out.
 */
test('reflows the two panels without a query it cannot ask', () => {
  assert.match(contract.responsive.reflow, /wrapping flex row/);
  assert.equal(contract.responsive.tracks, 'panels');
  assert.ok(member.parts.includes('panels'));
  assert.match(contract.responsive.why, /container-type/);
  assert.match(contract.responsive.why, /shrink-wrapped/);
  assert.equal(contract.responsive.sheet, datePicker.responsive.sheet);
  assert.equal(contract.responsive.decidedIn, datePicker.responsive.decidedIn);
});

/**
 * The decision the family owes, in one sentence: the press that leaves the
 * value incomplete carries focus to the half that is missing, and the press
 * that completes the value closes the panel.
 */
test('states where focus goes after each press, in all five cases', () => {
  assert.equal(contract.focusRule.sentence.length > 0, true);
  assert.match(contract.focusRule.sentence, /incomplete/);
  assert.match(contract.focusRule.sentence, /completes/);
  assert.deepEqual(Object.keys(contract.focusRule.cases), [
    'open',
    'dayPressedTimeEmpty',
    'timePressedDateEmpty',
    'pressCompletedTheValue',
    'valueWasAlreadyWhole',
  ]);
  assert.match(contract.focusRule.cases.dayPressedTimeEmpty, /list/);
  assert.match(contract.focusRule.cases.timePressedDateEmpty, /calendar/);
  assert.match(contract.focusRule.cases.pressCompletedTheValue, /trigger/);
  assert.match(contract.focusRule.cases.valueWasAlreadyWhole, /stays open/);
});

/**
 * Ant adds a confirm button under `showTime` and Kendo adds Set, both because
 * a day pressed in a calendar is not a whole datetime. Neither is needed once
 * the value's own completeness is the rule.
 */
test('closes on the press that completes the value, and needs no confirm button', () => {
  assert.match(contract.dismissal.closeOnSelect, /completes/);
  assert.deepEqual(contract.axes.closeOnSelect, datePicker.axes.closeOnSelect);
  assert.equal(member.defaults.closeOnSelect, 'auto');
  const declined = contract.declined.confirmButton;
  assert.ok(declined.shipsIt.length >= 2);
  assert.match(declined.ownedInsteadBy, /completeness|footer/);
  assert.ok(member.parts.includes('footer'), 'a consumer who wants a button still has the slot');
});

/**
 * Which surface opens first is an axis, and it decides where focus lands
 * rather than what is drawn.
 */
test('names which surface focus opens on, without hiding the other', () => {
  assert.deepEqual(contract.axes.openTo, ['date', 'time']);
  assert.equal(member.defaults.openTo, 'date');
  assert.match(contract.focusRule.cases.open, /openTo/);
  assert.equal(contract.dataAttributes['data-open-to'], 'which surface the panel opened focus on');
  assert.match(contract.openToPaints, /^nothing/, 'an axis about focus does not move a calendar');
  assert.match(contract.openToPaints, /scrollIntoView/);
});

/**
 * MUI's own validation page records that it cannot combine the two pairs. They
 * are two questions — where the range starts, and what a day is open for — and
 * both are answered here.
 */
test('combines a whole-value bound with a per-day window', () => {
  assert.equal(contract.range.min, dateTimeField.range.min);
  assert.equal(contract.range.minTime, dateTimeField.range.minTime);
  assert.match(contract.range.combine, /maxDateTime/, 'the limitation is quoted, not paraphrased');
  assert.match(contract.range.partialDay, /first and last/);
  assert.equal(contract.range.unavailableDate, 'isDateUnavailable(date)');
  assert.equal(contract.range.unavailableTime, 'isTimeUnavailable(time, date)');
  assert.match(contract.range.twoPredicates, /probing/);
});

/**
 * The list is computed against the day the reader is on rather than a day
 * already committed, so a closed day empties the list while they are still
 * deciding.
 */
test('computes the list against the day the reader is on', () => {
  assert.deepEqual(contract.list.against, [
    'the date half of the value',
    "the calendar's focused day, when the value has no date half",
  ]);
  assert.match(contract.list.why, /Ant/);
  assert.ok(member.parts.includes('empty'), 'a day with no time is a state, not a blank box');
});

/**
 * The list is `time-picker`'s list on a known day, so its four props are
 * `time-picker`'s unchanged. One term, one word, across the two families.
 */
test('takes the list arithmetic from the sibling picker unchanged', () => {
  assert.equal(contract.step.unit, timePicker.step.unit);
  assert.equal(contract.step.base, timePicker.step.base);
  assert.equal(contract.step.offStepIsInvalid, timePicker.step.offStepIsInvalid);
  assert.equal(member.defaults.step, timePicker.members.timePicker.defaults.step);
  assert.equal(member.defaults.maxOptions, timePicker.members.timePicker.defaults.maxOptions);
  assert.equal(contract.options.prop, timePicker.options.prop);
  assert.deepEqual(contract.axes.unavailableOptions, timePicker.axes.unavailableOptions);
  assert.equal(
    contract.dataAttributes['data-truncated'],
    timePicker.dataAttributes['data-truncated'],
  );
});

/**
 * A two-surface panel has one answer to "where is the reader", and it is a
 * datetime. Two models would be two names for one place, and the schema holds
 * one `current` capability for exactly this reason.
 */
test('declares three mutable values, and one highlight for both surfaces', () => {
  assert.deepEqual(Object.keys(contract.stateModel).sort(), ['current', 'open', 'value']);
  assert.equal(contract.stateModel.current.controlled, 'highlighted');
  assert.equal(contract.stateModel.current.request, 'onHighlightedChange');
  assert.match(contract.highlight.shape, /date/);
  assert.match(contract.highlight.shape, /time/);
  assert.match(contract.highlight.why, /one place|one answer/);
  assert.match(contract.highlight.feeds, /focusedDate/);
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) {
      assert.ok(CHANGE_REASONS.includes(reason), `unknown reason ${reason}`);
    }
  }
});

test('binds every key the two sourced patterns list', () => {
  const bound = new Set(contract.keyboard.map((entry) => entry.key));
  for (const key of [
    'Alt+ArrowDown',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'Enter',
    'Space',
    'Escape',
    'Tab',
  ]) {
    assert.ok(bound.has(key), `${key} is in a pattern and not in the contract`);
  }
  assert.ok(bound.has('PageUp') && bound.has('PageDown'), 'the list pages by hour');
  assert.ok(bound.has('a-z0-9'), 'the pattern recommends type-ahead above seven options');
});

/**
 * Only one element of a grid is in the Tab sequence, which the Grid Pattern
 * requires and `calendar` already implements, so the two surfaces are two Tab
 * stops rather than forty-three.
 */
test('makes each surface one tab stop, as the grid pattern requires', () => {
  const tab = contract.keyboard.find((entry) => entry.key === 'Tab');
  assert.match(tab.effect, /contained/);
  assert.match(contract.tabSequence.rule, /one element/);
  assert.match(contract.tabSequence.stops, /two/);
});

/**
 * `Escape` is staged: `dismissable-layer` asks in the capture phase, so a
 * handler inside the surface would be too late and the family decides there.
 */
test('stages Escape through the layer, in the order the two surfaces need', () => {
  assert.equal(contract.dismissal.escape, timePicker.dismissal.escape);
  assert.deepEqual(contract.dismissal.escapeOrder, [
    'the field abandons an open expression',
    "the calendar's view walks down from year or month",
    'the panel closes and focus returns to the trigger',
  ]);
  assert.equal(contract.layer.modal, false);
  assert.equal(contract.layer.depthProperty, '--slotted-layer-depth');
});

test('refuses selection following focus, for the reason the sibling records', () => {
  assert.equal(contract.selectionFollowsFocus, false);
  assert.equal(contract.selectionFollowsFocus, timePicker.selectionFollowsFocus);
  assert.match(contract.selectionFollowsFocusReason, /request/);
});

/**
 * Two marks, one per surface, and no third glyph asked of the scale.
 * `docs/process/build-order.md` states it as scope.
 */
/**
 * Two marks, one per half of the value, and each on a control that does
 * something with it. A mark small enough to sit in a line of eleven-pixel text
 * is a mark nobody can read, which is what a label over each surface was.
 */
test('draws one mark per half of the value, on a control rather than on a label', () => {
  assert.equal(member.parts.includes('panel-label'), false, 'a surface names itself');
  assert.deepEqual(contract.marks, {
    trigger: 'calendar',
    now: 'clock',
  });
  assert.match(contract.marksReason, /no third/i);
  assert.match(contract.marksReason, /legible|eleven-pixel/);
  assert.match(contract.wiring.listName, /aria-label/);
});

/**
 * A datetime is two choices and the panel is where both are made. The head is
 * what says how far the reader has got — the one thing neither surface can
 * show, and the one no surveyed panel says at all.
 */
test('says at the head what the reader has chosen so far', () => {
  assert.ok(member.parts.includes('head-value'));
  assert.deepEqual(contract.head.parts, ['head-value', 'now', 'presets']);
  assert.match(contract.head.headValue, /placeholder/);
  assert.match(contract.head.why, /decoration/);
  assert.match(contract.head.rule, /band/);
});

test('shares its appearance and placement axes with both sibling pickers', () => {
  assert.deepEqual(contract.axes.size, datePicker.axes.size);
  assert.deepEqual(contract.axes.variant, datePicker.axes.variant);
  assert.deepEqual(contract.axes.placement, datePicker.axes.placement);
  assert.deepEqual(contract.axes.hourCycle, timePicker.axes.hourCycle);
  assert.deepEqual(contract.axes.granularity, timePicker.axes.granularity);
});

test('opens from the keyboard the way both siblings do', () => {
  const chord = contract.keyboard.find((entry) => entry.key === 'Alt+ArrowDown');
  assert.equal(chord.focus, 'stays in the field, so typing keeps working');
  assert.equal(
    contract.platformNotes.altArrowDown,
    datePicker.platformNotes.altArrowDown,
    'one platform fact, stated the same way in every family that binds the chord',
  );
});

test('keeps the field typable while the panel is showing', () => {
  assert.equal(contract.panelBlocksTyping, false);
  assert.match(contract.panelBlocksTypingReason, /§6/);
  assert.equal(contract.highlightFollowsTyping, true);
});

/**
 * The family is two subtrees: the control where the consumer wrote it, and the
 * popup portalled to the end of the document. A stylesheet cannot reach a
 * subtree that is no longer inside the root.
 */
test('writes its identity on both subtrees, as every portalled family does', () => {
  assert.deepEqual(contract.portalledIdentity.elements, ['root', 'positioner']);
  assert.equal(contract.portalledIdentity.reason, timePicker.portalledIdentity.reason);
});
