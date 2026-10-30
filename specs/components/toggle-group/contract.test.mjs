import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const toolbar = JSON.parse(
  await readFile(new URL('../toolbar/contract.json', import.meta.url), 'utf8'),
);
const segmented = JSON.parse(
  await readFile(new URL('../segmented-control/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.toggleGroup;
const keyboard = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'toggle-group');
  assert.equal(contract.ui, 'toggle-group');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * There is no APG pattern called "toggle group". The container is a `group`,
 * each item is the Button pattern's toggle button, and the navigation between
 * them is the Toolbar pattern's. Citing one and implying the other is how a
 * family ends up with half a keyboard.
 */
test('cites both patterns it is assembled from', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/button/');
  assert.equal(contract.navigationPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/');
});

test('answers every key both patterns list, and says where focus lands', () => {
  assert.deepEqual(
    contract.keyboard.map((entry) => entry.key),
    ['Tab', 'Space', 'Enter', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'],
  );
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.source.length > 0, `${entry.key} does not say who implements it`);
  }
});

/**
 * The one place a toggle group and a radio group genuinely differ, and the one
 * a reader feels: an item is a button, and the Button pattern activates on
 * `Space` and `Enter` alone. `segmented-control` moves the checked segment with
 * the same keys, which is why the two are two families.
 */
test('moves focus with the arrows and never toggles with them', () => {
  assert.equal(contract.arrowsToggle, false);
  assert.match(keyboard('ArrowRight').effect, /never toggles/);
  assert.match(keyboard('ArrowLeft').effect, /never toggles/);

  const segmentedArrow = segmented.keyboard.find((entry) => entry.key === 'ArrowRight');
  assert.match(segmentedArrow.effect, /checks the next segment/);
});

/** "It does not listen for Down Arrow or Up Arrow so those keys can provide
    their normal browser scrolling functions", as the horizontal case asks. */
test('leaves the cross axis to the page in a horizontal group', () => {
  assert.equal(contract.crossAxisNavigates, false);
  assert.match(keyboard('ArrowDown').effect, /nothing in a horizontal one/);
  assert.match(keyboard('ArrowUp').effect, /nothing in a horizontal one/);
});

/**
 * `toolbar` declined `checkedValues` and named this family as the owner. The
 * promise it made in return is that a group inside a bar gives up its own ring:
 * two tab stops where the APG asks for one is the defect the deferral creates
 * if this family forgets it.
 */
test('stands down inside the bar that deferred this capability to it', () => {
  assert.equal(toolbar.declined.checkedValues.deferTo, 'toggle-group');
  assert.equal(contract.rovingFocus.standsDownInside, 'toolbar');
  assert.equal(contract.rovingFocus.detectedBy, "closest([data-ui='toolbar'])");
  assert.equal(contract.rovingFocus.override, 'rovingFocus');
  assert.ok(contract.rovingFocus.reason.length > 0);
});

/**
 * A joined bar has one edge, and one edge cannot be the sum of several
 * opinions about their own. The first pass framed the root as well as the
 * items and produced a colored border inside a grey one; leaving the frame to
 * the items also makes the bar exactly as tall as every other control, which
 * is what lets it stand beside a text field in a form.
 */
test('leaves the frame to the items, and is one control tall', () => {
  assert.equal(contract.frame.ownedBy, 'the items');
  assert.match(contract.frame.rootStates, /no border/);
  assert.match(contract.frame.joinedBy, /one border painted in each shared column/);
  assert.equal(contract.frame.height, '--slotted-control-height-*');
  assert.ok(contract.frame.reason.length > 0);
});

test('declares a state model for the one value a consumer can own', () => {
  assert.ok(member.capabilities.includes('selection'));
  assert.ok(MUTABLE_CAPABILITIES.includes('selection'));
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard'],
  });
});

/**
 * `pressed` is a state of an item and not a capability of the group. Declaring
 * the capability would oblige a second state model over the same fact the
 * group's value already holds, which is the desync `docs/state-and-events.md`
 * exists to prevent — and it is the reason the items are this family's own
 * rather than `button`'s ToggleButton.
 */
test('holds the pressed state without claiming the capability twice', () => {
  assert.ok(member.states.includes('pressed'));
  assert.ok(!member.capabilities.includes('pressed'));
  assert.deepEqual(Object.keys(contract.stateModel), ['selection']);
  assert.equal(contract.stateAttributes.pressed, 'data-pressed');
});

/** One value type in both bindings, and the cost of it written down. */
test('holds an array in both selection modes and says what that costs', () => {
  assert.equal(contract.value.type, 'string[]');
  assert.equal(contract.value.cappedBy, 'multiple');
  assert.equal(member.defaults.multiple, false);
  assert.match(contract.value.reason, /single-select consumer/);
});

test('keeps every declined capability answered by a family or by a composition', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines with no reason`);
    assert.ok(
      entry.deferTo !== undefined || /Composed instead/.test(entry.reason),
      `${name} names neither the family that owns it nor the composition that replaces it`,
    );
  }
});

test('declares the parts the anatomy names, root first', () => {
  assert.deepEqual(member.parts, ['root', 'item', 'icon', 'label']);
  assert.equal(contract.roles.root, 'group');
  assert.equal(contract.roles.item, 'button');
});

test('names a scenario for every axis, every state and the keyboard', () => {
  const scenarios = contract.scenarios.toggleGroup;
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(
      scenarios.some((id) => id.toLowerCase().includes(axis.slice(0, 4).toLowerCase())),
      `no scenario demonstrates ${axis}`,
    );
  }
  for (const id of ['states', 'keyboard', 'composition', 'content', 'toolbar']) {
    assert.ok(scenarios.includes(id), `no ${id} scenario`);
  }
});
