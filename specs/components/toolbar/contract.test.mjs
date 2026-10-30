import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const buttonGroup = JSON.parse(
  await readFile(new URL('../button-group/contract.json', import.meta.url), 'utf8'),
);
const tabs = JSON.parse(await readFile(new URL('../tabs/contract.json', import.meta.url), 'utf8'));
const member = contract.members.toolbar;
const keys = contract.keyboard.map((entry) => entry.key);
const keyboard = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'toolbar');
  assert.equal(contract.ui, 'toolbar');
  assert.equal(contract.schemaVersion, 5);
});

test('cites the pattern it implements rather than claiming to have checked it', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/');
});

/**
 * The family that shipped before this one declared `loop: true` and had no
 * keyboard in either binding. The whole point of the role is the keyboard: one
 * tab stop for a set of controls, and arrows between them.
 */
test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, ['Tab', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']);
  for (const entry of contract.keyboard) {
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.source.length > 0, `${entry.key} does not say who implements it`);
  }
  assert.equal(contract.escapeBound, false);
});

/** "If the toolbar has previously contained focus, focus is optionally set on
    the control that last had focus." */
test('returns to the control that last had focus', () => {
  assert.match(keyboard('Tab').focus, /last had focus/);
  assert.match(keyboard('Tab').focus, /first that is not disabled/);
});

/** "Up Arrow and Down Arrow can duplicate Left Arrow and Right Arrow." */
test('duplicates the cross-axis pair, which is what the pattern permits', () => {
  assert.equal(contract.crossAxisNavigates, true);
  assert.equal(tabs.crossAxisNavigates, false);
  assert.match(keyboard('ArrowDown').effect, /duplicating ArrowRight/);
});

/** "In toolbars with multiple rows of controls, Left Arrow and Right Arrow can
    provide navigation that wraps from row to row." */
test('wraps from row to row when the bar wrapped', () => {
  assert.match(keyboard('ArrowRight').effect, /row to row/);
  assert.deepEqual(contract.axes.overflow, ['wrap', 'scroll', 'menu']);
  assert.equal(member.defaults.overflow, 'wrap');
});

/**
 * The items are the consumer's own controls, found by being focusable. A
 * wrapper component per item type is what Radix and Base UI ship, and it is
 * what would keep this library's own families out of its own toolbar.
 */
test('finds its items in the DOM rather than wrapping each one', () => {
  assert.equal(contract.items.found, 'focusable-descendants');
  assert.equal(contract.items.wrapperPerItem, false);
  assert.ok(contract.items.selector.includes('button'));
  assert.ok(contract.items.selector.includes("[role='menuitem']"));
  assert.equal(contract.declined.itemWrappers.reason.length > 0, true);
});

/**
 * The APG's "avoid including controls whose operation requires the pair of
 * arrow keys used for toolbar navigation" is advice; here the container
 * enforces it, so a text field keeps its caret and focus still leaves it.
 */
test('lets an item keep the keys it needs to operate', () => {
  assert.equal(contract.items.keyOwners.attribute, 'data-toolbar-keys');
  assert.deepEqual(contract.items.keyOwners.values, ['inline', 'block', 'all', 'none']);
  assert.match(contract.items.keyOwners.inferred, /text entry/);
});

/**
 * A control the platform disables cannot be focused, whatever the container
 * says; one that announces `aria-disabled` can, and the APG allows it where
 * discoverability matters.
 */
test('keeps an aria-disabled control in the ring and skips a natively disabled one', () => {
  assert.match(contract.wiring['aria-disabled'], /stays in the ring/);
  assert.match(contract.wiring['aria-disabled'], /native disabled attribute is skipped/);
  assert.match(keyboard('Home').focus, /not natively disabled/);
});

/** A composite with one tab stop holds no value a consumer can own. */
test('declares no state model, because it holds no value', () => {
  assert.equal('stateModel' in contract, false);
  for (const capability of member.capabilities) {
    assert.ok(
      !MUTABLE_CAPABILITIES.includes(capability),
      `${capability} holds state and this family declares none`,
    );
  }
});

test('resolves its four axes in one stated order', () => {
  assert.deepEqual(Object.keys(contract.axes), ['orientation', 'size', 'variant', 'overflow']);
  for (const [axis, values] of Object.entries(contract.axes)) {
    const order = contract.resolution[axis];
    assert.ok(order, `${axis} states no resolution order`);
    assert.equal(order[0], 'prop', `${axis} does not let the consumer win`);
    assert.ok(values.includes(order.at(-1)), `${axis} falls back outside its own values`);
    assert.equal(member.defaults[axis], order.at(-1), `${axis} default disagrees with its order`);
  }
});

/**
 * Three families now arrange controls in a row, and each owns one question.
 * `button-group` says so in its own stylesheet; this is the other half of it.
 */
test('leaves the shape of a run of actions to the family that owns it', () => {
  assert.equal(contract.declined.arrangement.deferTo, buttonGroup.family);
  assert.ok(!Object.keys(contract.axes).includes('gap'));
  assert.ok(!member.capabilities.includes('arrangement'));
  assert.ok(buttonGroup.members.buttonGroup.capabilities.includes('arrangement'));
});

test('names the parts it draws', () => {
  assert.deepEqual(member.parts, ['root', 'group', 'separator', 'spacer', 'item', 'overflow']);
  assert.equal(contract.roles.root, 'toolbar');
  assert.equal(contract.roles.group, 'group');
  assert.equal(contract.roles.separator, 'separator');
});

/**
 * The keyboard finds items by being focusable, at any depth, and never wrapped.
 * The collapse acts on the boxes the bar lays out, and a control that can
 * disappear has to be a box the family owns — so the two definitions are
 * deliberately different, and the contract says so rather than letting a reader
 * assume one answers the other.
 */
test('separates the unit it can hide from the item it moves focus to', () => {
  assert.equal(contract.items.found, 'focusable-descendants');
  assert.equal(contract.collapse.unit, 'direct-children');
  assert.match(contract.collapse.order, /reversed/);
  assert.match(contract.collapse.pinned, /declares no counterpart/);
});

/**
 * The rule the refinement exists for. The primary action stays visible because
 * it has nowhere to go, not because a prop ranked it above the others.
 */
test('takes what is left over rather than what is convenient to hide', () => {
  assert.equal(contract.declined.overflowPriority.deferTo, 'the bar order');
  assert.match(contract.collapse.degradation, /scrolls/);
  assert.ok(!Object.keys(contract.axes).includes('priority'));
});

/**
 * The bar observes its own width, so a bar whose width comes from its content
 * never sees the room it regained: `page-header` kept its actions folded after
 * the window widened again.
 */
test('asks its container for a width that does not derive from its content', () => {
  assert.match(contract.collapse.container, /does not derive from its own content/);
  assert.match(contract.collapse.container, /never returns/);
});

/** A hidden control cannot hold focus, and the browser's answer is `body`. */
test('moves focus before it hides the control under it', () => {
  assert.match(contract.collapse.focus, /before/);
  assert.match(contract.collapse.focus, /trigger/);
});

/**
 * The bar is the participant that hid the units, so it is the only one that
 * knows which boundaries still divide something. Fluent asks the consumer to
 * wire the same outcome with `useIsOverflowGroupVisible`.
 */
test('carries the bar own structure into the surface', () => {
  assert.match(contract.collapse.separator, /menu separator/);
  assert.match(contract.collapse.trigger, /hidden until/);
});

/**
 * The set that does not fit is read from the layout. A controlled pair over it
 * would let a consumer assert that a bar fits when the browser says otherwise.
 */
test('declares overflow as a capability and not as a value', () => {
  assert.ok(member.capabilities.includes('overflow'));
  assert.equal('stateModel' in contract, false);
  assert.equal(contract.declined.collapsedState.deferTo, 'the layout');
});

/**
 * "Use toolbar as a grouping element only if the group contains 3 or more
 * controls." A role that disappeared when a permission filter removed a button
 * would be a semantic changing behind the author.
 */
test('documents the pattern guidance it does not enforce', () => {
  assert.equal(contract.roleGuidance.minimumControls, 3);
  assert.equal(contract.roleGuidance.enforced, false);
  assert.ok(contract.roleGuidance.reason.length > 0);
});

/**
 * The bar paints itself and nothing inside it, so it has no state of its own to
 * mirror: hover, press, selection and unavailability all belong to the control
 * the consumer placed. A container that painted them would be painting over a
 * family it does not own.
 */
test('paints only the states of the one control it draws itself', () => {
  assert.deepEqual(member.states, ['default', 'hover', 'active', 'focus-visible', 'open']);
  assert.deepEqual(contract.stateAttributes, { open: 'data-open' });
  assert.match(contract.wiring['disabled on the overflow trigger'], /writes no `data-disabled`/);
});

/**
 * `<fieldset disabled>` disables every control inside it natively, which also
 * removes them from the ring: a natively disabled control cannot be focused,
 * and the roving handle skips exactly those.
 */
test('leaves a bar out of action to the element that can actually do it', () => {
  assert.equal(contract.declined.disabled.deferTo, 'the platform');
  assert.match(contract.declined.disabled.reason, /fieldset disabled/);
  assert.ok(!member.capabilities.includes('disabled'));
  assert.ok(!('disabled' in member.defaults));
});

test('says what it does not do, and who does it instead', () => {
  assert.equal(contract.declined.overflowSection.deferTo, 'popover');
  assert.equal(contract.declined.checkedValues.deferTo, 'toggle-group');
  assert.equal(contract.declined.pagingControls.deferTo, 'menu');
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} is declined with no reason`);
  }
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.toolbar, [
    'playground',
    'orientation',
    'variant',
    'sizes',
    'groups',
    'keyboard',
    'keyOwners',
    'disabled',
    'overflow',
    'overflowMenu',
    'composition',
  ]);
});
