import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const menu = JSON.parse(await readFile(new URL('../menu/contract.json', import.meta.url), 'utf8'));
const member = contract.members.menubar;
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'menubar');
  assert.equal(contract.ui, 'menubar');
  assert.equal(contract.schemaVersion, 5);
});

test('cites the pattern it answers, and the roles it writes', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/');
  assert.deepEqual(contract.roles, { root: 'menubar', trigger: 'menuitem' });
});

/**
 * The decision this family exists to hold: a menubar is a container over the
 * menu family, not a second copy of it. Radix's menubar re-exports sixteen
 * parts its dropdown menu already has, and two copies of one machine drift.
 */
test('holds the menu family unchanged rather than restating it', () => {
  assert.equal(contract.holds, 'menu');
  assert.match(contract.holdsReason, /Radix/);
  for (const part of menu.members.menu.parts) {
    assert.ok(!member.parts.includes(part) || part === 'root', `menubar restates ${part}`);
  }
  assert.equal(contract.declined.menuApi.deferTo, 'menu');
});

test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, [
    'Enter',
    'Space',
    'ArrowDown',
    'ArrowUp',
    'ArrowRight',
    'ArrowLeft',
    'Home',
    'End',
    'Printable character',
    'Escape',
    'Tab',
    'Shift+Tab',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key} source`);
  }
});

/**
 * The bar is one tab stop, which is the whole difference between a menubar and
 * a row of buttons, and the pattern's own optional half: it remembers which
 * trigger last held focus.
 */
test('is one tab stop, and remembers where it was', () => {
  assert.equal(contract.focus.tabStops, 1);
  assert.equal(contract.focus.roving, true);
  assert.equal(contract.focus.remembersLastItem, true);
  assert.match(contract.focus.onTab, /out/i);
});

/**
 * The capability is `selection` and not `value`: a bar chooses one of its own
 * menus, where the vocabulary's `value` is the text a control holds. The
 * distinction is not academic — `value` obliges every page to document a
 * `defaultValue` input, and the Angular binding has none: a `model()` takes its
 * uncontrolled start from the value it is given.
 */
test('holds the identity of the open menu rather than a boolean for each', () => {
  assert.ok(member.capabilities.includes('selection'));
  assert.ok(MUTABLE_CAPABILITIES.includes('selection'));
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard', 'escape', 'outsidePress', 'select', 'dismiss', 'programmatic'],
  });
  assert.match(contract.stateModel.selection.reason ?? contract.valueReason, /two open menus|one/i);
});

/** What makes a bar a bar: the pointer switches menus once one is open. */
test('switches menus on pointer entry once the bar has one open', () => {
  assert.equal(contract.switching.on, 'pointerenter');
  assert.equal(contract.switching.requires, 'an already open menu');
  assert.equal(contract.switching.focus, 'the trigger entered');
  assert.match(contract.switching.reason, /row of buttons/i);
});

test('mirrors and rotates with its own orientation', () => {
  assert.deepEqual(contract.axes.orientation, ['horizontal', 'vertical']);
  assert.equal(contract.members.menubar.defaults.orientation, 'horizontal');
  assert.match(contract.orientationReason, /aria-orientation/);
  assert.equal(contract.menuSide.horizontal, 'bottom');
  assert.equal(contract.menuSide.vertical, 'inline-end');
});

test('names every part, and no part it does not own', () => {
  assert.deepEqual(member.parts, ['root', 'trigger']);
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'open',
    'disabled',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    open: 'data-open',
    disabled: 'data-disabled',
  });
});

test('resolves every axis in the same order, and holds a default for each', () => {
  for (const axis of Object.keys(contract.axes)) {
    const resolution = contract.resolution[axis];
    assert.ok(Array.isArray(resolution), `${axis} declares no resolution order`);
    assert.equal(resolution[0], 'prop', `${axis} does not let the consumer's value win`);
    assert.equal(resolution[1], 'defaults', `${axis} cannot be set once for an application`);
    assert.ok(axis in member.defaults, `${axis} has no default`);
    assert.deepEqual(member.defaults[axis], resolution[2], `${axis} default disagrees`);
    assert.ok(contract.provides.menubarDefaults.includes(axis), `${axis} is not in the provider`);
  }
});

test('declines nothing without naming what owns it instead', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines with no reason`);
  }
  assert.equal(contract.declined.overflow.deferTo, 'toolbar');
});

test('declares a scenario for every capability a reference page has to prove', () => {
  assert.deepEqual(contract.scenarios.menubar, [
    'playground',
    'bar',
    'submenus',
    'checkbox-and-radio',
    'orientation',
    'states',
    'keyboard',
    'composition',
  ]);
});
