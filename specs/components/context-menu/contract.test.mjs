import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const menu = JSON.parse(await readFile(new URL('../menu/contract.json', import.meta.url), 'utf8'));
const member = contract.members.contextMenu;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'context-menu');
  assert.equal(contract.ui, 'context-menu');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The decision this family exists to hold: a context menu is a target over the
 * menu family, not a second copy of it. Radix re-exports sixteen parts and its
 * two pages repeat each other; Ark adds one trigger. The second shape is taken,
 * as `menubar` took it, and nothing of the surface is restated here.
 */
test('holds the menu family unchanged rather than restating it', () => {
  assert.equal(contract.holds, 'menu');
  assert.match(contract.holdsReason, /Radix/);
  for (const part of menu.members.menu.parts) {
    assert.ok(!member.parts.includes(part) || part === 'root', `context-menu restates ${part}`);
  }
  assert.equal(contract.declined.menuApi.deferTo, 'menu');
  assert.deepEqual(contract.composes, []);
});

/**
 * The surface's model is the menu's, surfaced through the family: the same
 * reasons, in the same order, so a consumer moving a handler from a menu to a
 * context menu changes nothing in it.
 */
test('surfaces the menu’s open model and adds no second owner', () => {
  assert.deepEqual(contract.stateModel.open, menu.stateModel.open);
  assert.match(contract.stateModelReason, /second owner/);
});

/** The root is the target the reader presses, and it is the only part. */
test('owns the target as its root, and nothing else', () => {
  assert.deepEqual(member.parts, ['root']);
  assert.equal(member.nativeElement, 'div');
  assert.match(contract.rootReason, /region/);
  assert.deepEqual(member.states, ['default', 'open', 'pressed', 'disabled']);
  assert.deepEqual(contract.stateAttributes, {
    open: 'data-open',
    pressed: 'data-pressed',
    disabled: 'data-disabled',
  });
});

/** The four ways in, each with its anchor and its reason. */
test('opens from the pointer at a point, from the keyboard at the target', () => {
  assert.equal(contract.opening.contextmenu.anchor, 'a 0×0 rectangle at the pointer');
  assert.equal(contract.opening.contextmenu.emits, 'pointer');
  assert.match(contract.opening.contextmenu.effect, /no request is emitted/);
  assert.equal(contract.opening.longPress.emits, 'pointer');
  assert.equal(contract.opening.keyboard.anchor, 'the target element');
  assert.equal(contract.opening.keyboard.emits, 'keyboard');
  assert.equal(contract.opening.programmatic.anchor, 'the target element');
});

test('opens on a long press with the delay tooltip already holds', () => {
  assert.equal(contract.longPress.default, true);
  assert.equal(contract.longPress.delay, 500);
  assert.equal(contract.longPress.movementThreshold, 10);
  assert.equal(member.defaults.longPressDelay, 500);
  assert.match(contract.longPress.reason, /touchDelay/);
});

/**
 * A primary press on the target closes: the target is a branch of the layer,
 * so the family has to say so itself, and it says so with the reason the
 * consumer would expect of a press anywhere else on the page.
 */
test('closes on a primary press on the target, as an outside press', () => {
  assert.equal(contract.closing.primaryPress.emits, 'outsidePress');
  assert.match(contract.closing.primaryPress.reason, /branch/);
  assert.match(contract.closing.contextmenuInsideLayer, /prevented/);
});

test('binds the two platform keys on the target and none of the menu button’s', () => {
  const keys = contract.keyboard.map((entry) => entry.key);
  assert.deepEqual(keys, ['Shift+F10', 'ContextMenu', 'Escape', 'Tab']);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key} source`);
  }
  assert.match(contract.declined.triggerKeys.reason, /region is not a button/);
});

/**
 * Focus goes back to what had it. A target is a region and the focused thing
 * inside it is what the reader was doing; Radix returns focus to a span that
 * cannot take it. The mechanism is the menu's own `finalFocus`.
 */
test('returns focus to the element that held it when the menu opened', () => {
  assert.equal(contract.focus.onOpen, 'first item');
  assert.match(contract.focus.restore, /held focus when the menu opened/);
  assert.match(contract.focus.restoreMechanism, /finalFocus/);
  assert.deepEqual(contract.focus.exempt, ['outsidePress', 'programmatic']);
  assert.ok('finalFocus' in menu.focus, 'menu promises finalFocus');
});

test('writes no tabindex and no aria-haspopup on the target, and says what each costs', () => {
  assert.equal(contract.focus.tabindex, 'never written by the family');
  assert.match(contract.focus.tabindexReason, /roving/);
  assert.match(contract.wiring['aria-haspopup'], /never written/);
  assert.match(contract.declined.triggerAria.reason, /generic element/);
});

test('resolves every axis in the same order, and holds a default for each', () => {
  for (const axis of Object.keys(contract.axes)) {
    const resolution = contract.resolution[axis];
    assert.ok(Array.isArray(resolution), `${axis} declares no resolution order`);
    assert.equal(resolution[0], 'prop', `${axis} does not let the consumer's value win`);
    assert.equal(resolution[1], 'defaults', `${axis} cannot be set once for an application`);
    assert.ok(axis in member.defaults, `${axis} has no default`);
    assert.deepEqual(member.defaults[axis], resolution[2], `${axis} default disagrees`);
    assert.ok(
      contract.provides.contextMenuDefaults.includes(axis),
      `${axis} is not in the provider`,
    );
  }
});

test('declines nothing without naming what owns it instead, or what it costs', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines with no reason`);
  }
  assert.equal(contract.declined.modal.deferTo, 'dialog');
  assert.match(contract.declined.alignOffset.reason, /corner on the point/);
});

test('declares the scenes its reference page has to show', () => {
  assert.deepEqual(contract.scenarios.contextMenu, [
    'playground',
    'target',
    'rows',
    'keyboard',
    'touch',
    'other-path',
    'disabled',
    'states',
  ]);
});
