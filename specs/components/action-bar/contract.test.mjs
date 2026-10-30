import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const buttonGroup = JSON.parse(
  await readFile(new URL('../button-group/contract.json', import.meta.url), 'utf8'),
);
const table = JSON.parse(
  await readFile(new URL('../table/contract.json', import.meta.url), 'utf8'),
);
const toolbar = JSON.parse(
  await readFile(new URL('../toolbar/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.actionBar;
const keyboard = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'action-bar');
  assert.equal(contract.ui, 'action-bar');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * There is no APG pattern for a bar of actions. The closest official guidance
 * is the Toolbar pattern, and this family departs from it deliberately — so the
 * contract cites the pattern *and* the departure, rather than citing a pattern
 * it does not follow.
 */
test('cites the closest pattern and the departure from it', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/');
  assert.equal(contract.patternDeparture.from, 'roving focus, and the toolbar role with it');
  assert.equal(contract.roles.root, 'group');
  assert.equal(contract.rovingFocus, false);
  assert.ok(contract.patternDeparture.reason.length > 0);
  assert.ok(contract.patternDeparture.cost.length > 0);
  assert.equal(contract.patternDeparture.insteadUse, 'toolbar');
});

/**
 * `toolbar` is a subclass of `group` in ARIA 1.2, and the subclass is what is
 * asserted when there is focus management to declare. Without it, `group` is
 * what is true.
 */
test('takes the superclass role, because the subclass would promise a keyboard', () => {
  assert.equal(toolbar.roles.root, 'toolbar');
  assert.equal(contract.roles.root, 'group');
  assert.equal(contract.roles.separator, 'separator');
  assert.match(contract.wiring['aria-label'], /consumer/);
});

/**
 * Tab reaches every action. The only keys the family is responsible for belong
 * to the overflow trigger, and they are `menu`'s.
 */
test('answers every key it is responsible for, and says who implements it', () => {
  assert.deepEqual(
    contract.keyboard.map((entry) => entry.key),
    ['Tab', 'Enter', 'Space', 'ArrowDown', 'Escape'],
  );
  for (const entry of contract.keyboard) {
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.source.length > 0, `${entry.key} does not say who implements it`);
  }
  assert.match(keyboard('Tab').effect, /one tab stop per control/);
  assert.equal(keyboard('Escape').source, 'menu');
  assert.equal(contract.escapeBound, false);
});

/**
 * The whole reason the family exists beside `toolbar`. A bar of tools reads in
 * the same direction as its importance and gives way from the end; a bar of
 * actions puts the action that confirms at the end, so it needs a rank.
 */
test('ranks what gives way, where the family it stands beside refuses to', () => {
  assert.equal(toolbar.declined.overflowPriority.deferTo, 'the bar order');
  assert.deepEqual(contract.priority.values, ['pinned', 'high', 'low', 'hide', 'always']);
  assert.equal(contract.priority.attribute, 'data-priority');
  assert.deepEqual(contract.priority.rank, { hide: 0, low: 1, high: 2 });
  assert.match(contract.priority.order, /within one rank/);
  assert.equal(contract.priority.engine, '@slotted/core/overflow');
  assert.ok(contract.priority.reason.includes('end of the line'));
});

/** A unit with nowhere to go stays where it is, which is what `pinned` says. */
test('pins what declares no counterpart, and says so once', () => {
  assert.equal(contract.priority.defaults.withCounterpart, 'low');
  assert.equal(contract.priority.defaults.withoutCounterpart, 'pinned');
  assert.match(contract.priority.malformed, /pinned/);
  assert.match(contract.collapse.pinned, /counterpart/);
});

/**
 * `hide` is SAP's `Disappear`, and it is the one rank no other surveyed
 * implementation ships: a control that is not worth a row in a menu.
 */
test('holds the rank that gives way without becoming a menu row', () => {
  assert.equal(contract.priority.rank.hide, 0);
  assert.match(contract.priority.meaning.hide, /not offered in the surface/);
  assert.match(contract.priority.meaning.always, /never drawn in the bar/);
});

/**
 * The third line of the scope paragraph, and it is structural rather than
 * advisory: the run is anchored to the bar's end edge, so what grows or leaves
 * before it cannot move it.
 */
test('anchors the action that confirms so nothing before it moves it', () => {
  assert.equal(contract.stability.anchor, 'margin-inline-start: auto on the actions part');
  assert.deepEqual(contract.stability.unmovedBy, ['status', 'loading', 'permissions']);
  assert.ok(contract.stability.reason.length > 0);
  assert.ok(contract.scenarios.actionBar.includes('stability'));
});

/** Sticky and not fixed, and offset by what the page publishes. */
test('stops above the page own chrome rather than covering it', () => {
  assert.equal(contract.sticky.position, 'sticky');
  assert.equal(contract.sticky.reads, '--slotted-page-sticky-bottom');
  assert.equal(contract.sticky.fallback, '0px');
  assert.match(contract.sticky.reason, /covers the last line/);
});

/**
 * A container query cannot take a token, so the number is literal — and it is
 * written once, in the stylesheet, where the binding reads it back rather than
 * comparing widths of its own.
 */
test('states the stacking breakpoint in one place and reads it from there', () => {
  assert.equal(contract.stack.breakpoint, '24rem');
  assert.equal(contract.stack.container, 'root');
  assert.equal(contract.stack.queried, 'actions');
  assert.equal(contract.stack.property, '--_stacked');
  assert.match(contract.stack.collapse, /does not run/);
  assert.match(contract.stack.degradation, /wrap/);
  assert.ok(!contract.stack.degradation.includes('scroll'));
});

/** A bar that exists only while there is something to act on. */
test('enters and leaves without leaving focus inside a region that is gone', () => {
  assert.equal(contract.presence.input, 'present');
  assert.equal(contract.presence.module, '@slotted/core/presence');
  assert.equal(contract.presence.movesFocus, false);
  assert.match(contract.presence.reason, /aria-hidden/);
  assert.match(contract.presence.leaves, /React unmounts/);
  assert.match(contract.presence.leaves, /display:none/);
  assert.ok(contract.composes.includes('presence'));
});

/**
 * `table` refuses `batchActions` and names this family. A bulk bar is therefore
 * a context of this one, and the count it shows belongs to the family that owns
 * the selection.
 */
test('serves the bulk bar the table deferred to it, without owning the count', () => {
  assert.equal(table.declined.batchActions.deferTo, 'action-bar');
  assert.equal(contract.declined.selectionCount.deferTo, 'table');
  assert.ok(contract.scenarios.actionBar.includes('bulk'));
});

/** The bar holds no value a consumer can own. */
test('declares no state model, because it holds no value', () => {
  assert.equal('stateModel' in contract, false);
  for (const capability of member.capabilities) {
    assert.ok(
      !MUTABLE_CAPABILITIES.includes(capability),
      `${capability} holds state and this family declares none`,
    );
  }
  assert.equal(contract.declined.collapsedState.deferTo, 'the layout');
});

test('resolves its four axes in one stated order', () => {
  assert.deepEqual(Object.keys(contract.axes), ['variant', 'size', 'align', 'sticky']);
  for (const [axis, values] of Object.entries(contract.axes)) {
    const order = contract.resolution[axis];
    assert.ok(order, `${axis} states no resolution order`);
    assert.equal(order[0], 'prop', `${axis} does not let the consumer win`);
    assert.ok(values.includes(order.at(-1)), `${axis} falls back outside its own values`);
    assert.equal(member.defaults[axis], order.at(-1), `${axis} default disagrees with its order`);
  }
});

/**
 * The bar arranges its own two regions and nothing inside them. The shape of a
 * run of buttons — gap, join, orientation — stays with the family that owns it.
 */
test('leaves the shape of a run of buttons to the family that owns it', () => {
  assert.ok(member.capabilities.includes('arrangement'));
  assert.equal(contract.declined.runShape.deferTo, buttonGroup.family);
  assert.ok(!Object.keys(contract.axes).includes('gap'));
  assert.ok(!Object.keys(contract.axes).includes('orientation'));
});

/** A bar that sizes itself sizes the controls it holds, once. */
test('hands its own step down to the buttons inside it', () => {
  assert.deepEqual(contract.provides.buttonDefaults, ['size']);
  assert.deepEqual(contract.provides.actionBarDefaults, ['variant', 'size', 'align', 'sticky']);
});

test('names the parts it draws', () => {
  assert.deepEqual(member.parts, ['root', 'status', 'actions', 'action', 'separator', 'overflow']);
  for (const part of member.parts) {
    assert.ok(contract.anatomy[part], `${part} is a part and the anatomy does not describe it`);
  }
  assert.ok(!member.parts.includes('primary'));
  assert.match(contract.anatomy.action, /pinned/);
});

/**
 * The bar paints itself and the one control it owns. Hover, press and
 * unavailability belong to the consumer's own controls.
 */
test('paints only the states of the one control it draws itself', () => {
  assert.deepEqual(member.states, ['default', 'hover', 'active', 'focus-visible', 'open']);
  assert.deepEqual(contract.stateAttributes, { open: 'data-open' });
  assert.ok(!member.capabilities.includes('disabled'));
  assert.ok(!member.capabilities.includes('loading'));
});

test('says what it does not do, and who does it instead', () => {
  assert.equal(contract.declined.rovingFocus.deferTo, 'toolbar');
  assert.equal(contract.declined.loading.deferTo, 'button');
  assert.equal(contract.declined.disabled.deferTo, 'the platform');
  assert.equal(contract.declined.destructiveConfirmation.deferTo, 'dialog');
  assert.equal(contract.declined.ground.deferTo, 'page');
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} is declined with no reason`);
  }
});

/**
 * A destructive action and a frequent one are not allowed to touch, and
 * `docs/component-features.md` §5 asks for the separation without naming a
 * mechanism. The rule is the part.
 */
test('gives a destructive action something to stand apart from', () => {
  assert.match(contract.anatomy.separator, /destructive/);
  assert.ok(contract.scenarios.actionBar.includes('danger'));
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.actionBar, [
    'playground',
    'priority',
    'overflowMenu',
    'stability',
    'danger',
    'status',
    'bulk',
    'sticky',
    'align',
    'sizes',
    'variant',
    'stacked',
    'content',
    'composition',
    'accessibility',
  ]);
});
