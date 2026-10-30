import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const button = JSON.parse(
  await readFile(new URL('../button/contract.json', import.meta.url), 'utf8'),
);
const toggleGroup = JSON.parse(
  await readFile(new URL('../toggle-group/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.toggle;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'toggle');
  assert.equal(contract.ui, 'toggle');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The Button pattern's toggle button, and nothing assembled around it: a
 * single control has no arrows of its own, and inside `toolbar` the bar owns
 * the tab stop. Citing a navigation pattern here would promise a keyboard the
 * family does not write.
 */
test('is the Button pattern’s toggle button and answers its two keys', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/button/');
  assert.equal(contract.roles.root, 'button');
  assert.deepEqual(
    contract.keyboard.map((entry) => entry.key),
    ['Space', 'Enter'],
  );
  for (const entry of contract.keyboard) {
    assert.equal(entry.source, 'platform');
    assert.equal(entry.focus, 'stays');
  }
  assert.match(contract.keyboardReason, /toolbar/);
});

/**
 * The decision the family exists to hold: a toggle is a mode, and `button`'s
 * ToggleButton is an action that persists. The two share one state model —
 * the same names, the same reasons — so a consumer moving from one to the
 * other changes no handler.
 */
test('shares the pressed model with button’s ToggleButton and says which is which', () => {
  assert.deepEqual(contract.stateModel.pressed, button.stateModel.pressed);
  assert.match(contract.meaning.toggle, /mode/);
  assert.match(contract.meaning.toggleButton, /waits/);
  assert.equal(contract.declined.loading.deferTo, 'button');
  assert.equal(contract.declined.tone.deferTo, 'button');
  assert.equal(contract.declined.focusableWhenDisabled.deferTo, 'button');
});

/**
 * The picture is `toggle-group`'s item: the same parts, the same two variants,
 * the same three sizes, the same "on" pair. The group keeps its item so the
 * value has one owner; the reopen that makes the item this family is recorded
 * in `docs/process/build-order.md`.
 */
test('paints what toggle-group’s item paints', () => {
  assert.equal(contract.sibling.family, 'toggle-group');
  assert.deepEqual(member.parts, ['root', 'icon', 'label']);
  assert.deepEqual(contract.axes.variant, toggleGroup.axes.variant);
  assert.deepEqual(contract.axes.size, toggleGroup.axes.size);
  assert.equal(contract.on.border, '--slotted-tone-accent-border');
  assert.equal(contract.on.background, '--slotted-tone-accent-subtle-active');
  assert.equal(contract.on.color, '--slotted-tone-accent-text');
  assert.equal(contract.declined.value.deferTo, 'toggle-group');
});

test('is announced as a toggle in both states and keeps its label', () => {
  assert.match(contract.wiring['aria-pressed'], /both states/);
  assert.equal(member.nativeElement, 'button');
  assert.equal(member.defaults.type, 'button');
  assert.equal(member.defaults.defaultPressed, false);
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'pressed',
    'disabled',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    pressed: 'data-pressed',
    disabled: 'data-disabled',
  });
});

test('is not a form control', () => {
  assert.equal(contract.declined.formValue.deferTo, 'checkbox');
  assert.match(contract.declined.formValue.reason, /ControlValueAccessor/);
});

test('resolves each axis from the prop, then the defaults, then the contract', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    const [first, second, fallback] = contract.resolution[axis];
    assert.equal(first, 'prop');
    assert.equal(second, 'defaults');
    assert.ok(values.includes(fallback), `${axis} falls back to ${fallback}`);
    assert.equal(member.defaults[axis], fallback);
    assert.ok(contract.provides.toggleDefaults.includes(axis));
  }
});

test('declares one demonstration per capability it holds', () => {
  const scenarios = contract.scenarios.toggle;
  for (const scenario of [
    'pressed',
    'variant',
    'sizes',
    'iconOnly',
    'states',
    'toolbar',
    'content',
    'composition',
    'keyboard',
    'versus',
  ]) {
    assert.ok(scenarios.includes(scenario), `no ${scenario} scenario`);
  }
});
