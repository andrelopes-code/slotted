import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const button = JSON.parse(
  await readFile(new URL('../button/contract.json', import.meta.url), 'utf8'),
);
const menu = JSON.parse(await readFile(new URL('../menu/contract.json', import.meta.url), 'utf8'));
const buttonGroup = JSON.parse(
  await readFile(new URL('../button-group/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.splitButton;
const keyboard = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'split-button');
  assert.equal(contract.ui, 'split-button');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The decision the family exists to hold: two `button`s over `menu`, and not
 * a third button or a second menu. Nothing of either is restated — a part of
 * `menu` appearing here would be Radix's shape, where two copies of one
 * machine drift.
 */
test('holds button and menu unchanged rather than restating either', () => {
  assert.deepEqual(contract.holds, ['button', 'menu']);
  assert.deepEqual(contract.composes, []);
  for (const part of menu.members.menu.parts) {
    assert.ok(!member.parts.includes(part) || part === 'root', `split-button restates ${part}`);
  }
  assert.equal(contract.declined.menuApi.deferTo, 'menu');
  assert.equal(contract.declined.buttonApi.deferTo, 'button');
});

/**
 * The two halves are `button`'s own elements, carrying this family's part
 * name in the slot `button` leaves free. The axes are `button`'s, so a value
 * that is not a button's is not a split button's either.
 */
test('names its halves as parts on button’s own elements', () => {
  assert.deepEqual(member.parts, ['root', 'primary', 'menu-trigger']);
  assert.equal(contract.roles.root, 'group');
  assert.match(contract.partIdentity.rule, /data-ui=button/);
  assert.deepEqual(contract.partIdentity.parts, { primary: 'button', 'menu-trigger': 'button' });
  assert.deepEqual(contract.axes.tone, button.axes.tone);
  assert.deepEqual(contract.axes.variant, button.axes.variant);
  assert.deepEqual(contract.axes.size, button.axes.size);
  assert.equal(member.defaults.tone, button.members.button.defaults.tone);
  assert.equal(member.defaults.variant, button.members.button.defaults.variant);
});

/**
 * The menu's model, surfaced: the same reasons in the same order, so a
 * handler moved from a menu changes nothing. `selection` is the radio group's,
 * and it exists under `remember` alone.
 */
test('surfaces the menu’s open and selection models and adds no second owner', () => {
  assert.deepEqual(contract.stateModel.open, menu.stateModel.open);
  assert.deepEqual(contract.stateModel.selection, menu.stateModel.selection);
  assert.match(contract.stateModelReason, /second owner/);
  assert.equal(contract.remember.default, false);
  assert.equal(member.defaults.remember, false);
  assert.match(contract.remember.reason, /silent/);
});

/** Two tab stops, and the trigger's keys are the Menu Button pattern's. */
test('gives each half its own tab stop and the trigger the menu-button keys', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/button/');
  assert.equal(contract.triggerPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/');
  assert.deepEqual(
    contract.keyboard.map((entry) => entry.key),
    ['Tab', 'Space', 'Enter', 'ArrowDown', 'ArrowUp', 'Escape'],
  );
  assert.match(keyboard('Tab').effect, /two tab stops/);
  assert.match(keyboard('ArrowDown').effect, /nothing on the primary/);
  assert.equal(keyboard('ArrowUp').focus, 'the last item');
  assert.equal(keyboard('Escape').focus, 'the menu trigger');
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.source.length > 0, `${entry.key} does not say who implements it`);
  }
  assert.ok('primaryArrowDown' in contract.declined);
});

/**
 * The join is `button-group`'s, restated for two children on one axis, and
 * every rule says which measurement it rests on.
 */
test('joins its halves the way button-group joins a bar', () => {
  assert.equal(contract.join.ownedBy, 'split-button');
  assert.equal(contract.join.cites, 'button-group');
  assert.equal(buttonGroup.frameOwner, 'button-group');
  assert.ok(contract.join.rules.length >= 5);
  assert.ok(contract.join.rules.some((rule) => /one border painted/.test(rule)));
  assert.ok(contract.join.rules.some((rule) => /seam/.test(rule)));
  assert.ok('orientation' in contract.declined);
});

test('names the trigger, draws the chevron and holds it still', () => {
  assert.match(contract.naming['menu-trigger'], /required/);
  assert.equal(contract.chevron.glyph, 'chevron-down');
  assert.equal(contract.chevron.turns, false);
});

test('blocks the second half while the first is in flight', () => {
  assert.match(contract.loading['menu-trigger'], /aria-disabled/);
  assert.match(contract.loading['menu-trigger'], /focusable/);
  assert.ok(contract.provides.toHalves.includes('loading'));
  assert.ok(contract.provides.toHalves.includes('disabled'));
});

test('declares the states the root and its halves carry', () => {
  assert.deepEqual(member.states, ['default', 'open', 'disabled', 'loading']);
  assert.deepEqual(contract.stateAttributes, {
    open: 'data-open',
    disabled: 'data-disabled',
    loading: 'data-loading',
  });
});

test('resolves each axis from the prop, the defaults, button’s defaults, then the contract', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    const [first, second, third, fallback] = contract.resolution[axis];
    assert.equal(first, 'prop');
    assert.equal(second, 'defaults');
    assert.equal(third, 'buttonDefaults');
    assert.ok(values.includes(fallback), `${axis} falls back to ${fallback}`);
    assert.equal(member.defaults[axis], fallback);
    assert.ok(contract.provides.splitButtonDefaults.includes(axis));
  }
});

test('declares one demonstration per capability it holds', () => {
  const scenarios = contract.scenarios.splitButton;
  for (const scenario of [
    'variants',
    'sizes',
    'remember',
    'loading',
    'states',
    'width',
    'content',
    'composition',
    'keyboard',
  ]) {
    assert.ok(scenarios.includes(scenario), `no ${scenario} scenario`);
  }
});
