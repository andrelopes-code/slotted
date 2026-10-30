import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const toolbar = JSON.parse(
  await readFile(new URL('../toolbar/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.tabs;
const keys = contract.keyboard.map((entry) => entry.key);
const keyboard = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'tabs');
  assert.equal(contract.ui, 'tabs');
  assert.equal(contract.schemaVersion, 5);
});

test('cites the pattern it implements rather than claiming to have checked it', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/');
});

/**
 * The APG's whole table, key by key, with the focus destination for each. The
 * family that shipped before this one declared no keyboard at all and left the
 * two bindings to agree by coincidence.
 */
test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, [
    'Tab',
    'ArrowRight',
    'ArrowLeft',
    'ArrowDown',
    'ArrowUp',
    'Home',
    'End',
    'Enter',
    'Space',
    'Delete',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.source.length > 0, `${entry.key} does not say who implements it`);
  }
});

/**
 * "If the tab list is horizontal, it does not listen for Down Arrow or Up
 * Arrow so those keys can provide their normal browser scrolling functions
 * even when focus is inside the tab list."
 */
test('leaves the cross axis to the page in a horizontal list', () => {
  assert.equal(contract.crossAxisNavigates, false);
  assert.match(keyboard('ArrowDown').effect, /nothing in a horizontal one/);
  assert.match(keyboard('ArrowUp').effect, /nothing in a horizontal one/);
});

/** The APG's own focus rule for a deleted tab, applied to focus and to the value. */
test('sends focus and the selection to the neighbour a dismissal leaves behind', () => {
  assert.match(keyboard('Delete').focus, /following tab/);
  assert.match(keyboard('Delete').focus, /preceding one when the dismissed tab was last/);
  assert.equal(contract.dismissal.movesSelectionWithReason, 'remove');
  assert.ok(contract.stateModel.selection.reasons.includes('remove'));
});

test('declares a state model for the one value a consumer can own', () => {
  assert.ok(member.capabilities.includes('selection'));
  assert.ok(MUTABLE_CAPABILITIES.includes('selection'));
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard', 'remove', 'programmatic'],
  });
});

/**
 * `activation` is an axis and not a capability. The shared vocabulary files it
 * under the mutable list, where declaring it would oblige the family to name a
 * request for a value nothing can move: whether focus activates a tab is a
 * policy the consumer states once, not state either side owns.
 */
test('keeps the activation mode an axis rather than a capability', () => {
  assert.deepEqual(contract.axes.activation, ['automatic', 'manual']);
  assert.equal(member.defaults.activation, 'automatic');
  assert.ok(!member.capabilities.includes('activation'));
  assert.deepEqual(Object.keys(contract.stateModel), ['selection']);
});

/**
 * A `button` may not contain a `button`, so a dismissible tab needs a box that
 * is neither. It is presentational, so the list still owns its tabs.
 */
test('gives the dismiss control a box of its own without breaking the ownership', () => {
  assert.deepEqual(member.parts, [
    'root',
    'list',
    'item',
    'tab',
    'start',
    'label',
    'end',
    'dismiss',
    'marker',
    'panel',
    'scroll',
    'actions',
  ]);
  assert.equal(contract.roles.list, 'tablist');
  assert.equal(contract.roles.item, 'presentation');
  assert.equal(contract.roles.tab, 'tab');
  assert.equal(contract.roles.panel, 'tabpanel');
});

/**
 * The dismiss control stays out of the arrow ring, so the pattern's own model
 * is unchanged, and stays in the accessibility tree, so it is not a control
 * only a mouse can reach. `aria-keyshortcuts` is what announces the other path.
 */
test('keeps the dismiss control out of the tab sequence and inside the tree', () => {
  assert.equal(contract.dismissal.tabIndex, -1);
  assert.equal(contract.wiring['aria-keyshortcuts'], 'Delete, on a dismissible tab');
  assert.deepEqual(contract.dismissal.reasons, ['pointer', 'keyboard']);
  assert.equal(contract.dismissal.request, 'onTabDismiss');
});

/**
 * One marker that slides between tabs is measured, as every surveyed indicator
 * is: the list draws it from the selected tab's box. The direction of travel
 * stays an attribute on the root for a consumer's own motion.
 */
test('draws one measured marker in the list, and keeps the direction attribute', () => {
  assert.equal(contract.marker.measured, true);
  assert.equal(contract.marker.part, 'marker');
  assert.ok(contract.members.tabs.parts.includes('marker'));
  assert.equal(contract.marker.directionAttribute, 'data-activation-direction');
  assert.deepEqual(contract.marker.directions, ['forward', 'backward', 'none']);
});

test('scrolls a list that does not fit, and keeps its paging controls out of the way', () => {
  assert.equal(contract.overflow.behaviour, 'scroll');
  assert.equal(contract.overflow.pagingControls, 2);
  assert.equal(contract.overflow.pagingControlsInTabSequence, false);
  assert.equal(contract.overflow.engine, '@slotted/core/overflow');
});

test('resolves its seven axes in one stated order', () => {
  assert.deepEqual(Object.keys(contract.axes), [
    'activation',
    'orientation',
    'size',
    'variant',
    'track',
    'fit',
    'mount',
  ]);
  for (const [axis, values] of Object.entries(contract.axes)) {
    const order = contract.resolution[axis];
    assert.ok(order, `${axis} states no resolution order`);
    assert.equal(order[0], 'prop', `${axis} does not let the consumer win`);
    assert.ok(values.includes(order.at(-1)), `${axis} falls back outside its own values`);
    assert.equal(member.defaults[axis], order.at(-1), `${axis} default disagrees with its order`);
  }
});

/**
 * The line under a tab list is one the page may have drawn already, and the
 * family cannot see it. Cloudscape ships a whole `container` variant for the
 * same case; this is one axis with two values.
 */
test('can stand on a line the page already drew', () => {
  assert.deepEqual(contract.axes.track, ['line', 'none']);
  assert.equal(member.defaults.track, 'line');
  assert.equal(contract.trackless.value, 'none');
  assert.match(contract.trackless.reason, /smudge/);
});

test('hands every tab what the family decides once', () => {
  assert.deepEqual(contract.provides.tabsDefaults, [
    'activation',
    'orientation',
    'size',
    'variant',
    'track',
    'fit',
    'mount',
    'loop',
  ]);
  assert.deepEqual(contract.provides.toTabs, [
    'activation',
    'disabled',
    'orientation',
    'size',
    'value',
  ]);
});

test('mirrors exactly the states its stylesheet paints', () => {
  assert.deepEqual(Object.keys(contract.stateAttributes), ['selected', 'disabled']);
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'selected',
    'disabled',
  ]);
});

/** Each declined capability names the family that owns it, or the reason. */
test('says what it does not do, and who does it instead', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} is declined with no reason`);
  }
  assert.equal(contract.declined['Shift+F10'].deferTo, 'menu');
  assert.equal(contract.declined.deselectable.deferTo, 'collapsible');
  assert.equal(contract.declined.toolbarWrapper.deferTo, toolbar.family);
});

/**
 * The words get a box of their own, as they do in `tag`. Without it there is
 * nothing for `text-overflow` to clip when `fit="equal"` makes a share too
 * narrow, and nothing for `unicode-bidi: plaintext` to hold.
 */
test('gives the words a box of their own', () => {
  assert.equal(contract.labelPart.part, 'label');
  assert.ok(member.parts.includes('label'));
  assert.match(contract.labelPart.reason, /plaintext/);
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.tabs, [
    'playground',
    'activation',
    'orientation',
    'variant',
    'sizes',
    'fit',
    'states',
    'mount',
    'dismissible',
    'overflow',
    'links',
    'content',
    'composition',
    'keyboard',
  ]);
});
