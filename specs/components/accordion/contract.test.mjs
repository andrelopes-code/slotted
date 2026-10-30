import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const collapsible = JSON.parse(
  await readFile(new URL('../collapsible/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.accordion;
const keys = contract.keyboard.map((entry) => entry.key);
const keyboard = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'accordion');
  assert.equal(contract.ui, 'accordion');
  assert.equal(contract.schemaVersion, 5);
});

test('cites the pattern it implements rather than claiming to have checked it', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/');
});

/** The group holds the value; the item is the family beside it, not a part of it. */
test('names the family its items are', () => {
  assert.equal(contract.itemFamily, 'collapsible');
  assert.equal(collapsible.groupFamily, 'accordion');
  assert.deepEqual(member.parts, ['root']);
});

test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, [
    'Enter',
    'Space',
    'Tab',
    'Shift+Tab',
    'ArrowDown',
    'ArrowUp',
    'Home',
    'End',
  ]);
  for (const entry of contract.keyboard) {
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.source.length > 0, `${entry.key} does not say who implements it`);
  }
});

/**
 * The pattern's own four keys are the platform's. Everything the family binds
 * is the departure below, and it is written as one.
 */
test('leaves opening and closing to the platform', () => {
  for (const key of ['Enter', 'Space', 'Tab', 'Shift+Tab']) {
    assert.equal(keyboard(key).source, 'platform');
  }
});

/**
 * "All focusable elements in the accordion are included in the page Tab
 * sequence", and `w3c/aria-practices#3434` removed the roving alternative. The
 * arrows are additive: they move focus and write no tabindex.
 */
test('adds the arrows without taking a header out of the tab sequence', () => {
  assert.equal(contract.rovingTabindex, false);
  assert.deepEqual(contract.keyboardDeparture.keys, ['ArrowDown', 'ArrowUp', 'Home', 'End']);
  assert.equal(
    contract.keyboardDeparture.source,
    'https://github.com/w3c/aria-practices/pull/3434',
  );
  assert.ok(contract.keyboardDeparture.cost.length > 0, 'a departure with no cost written');
  assert.match(keyboard('ArrowDown').effect, /opens nothing/);
  assert.match(keyboard('ArrowUp').effect, /opens nothing/);
  assert.match(keyboard('Tab').effect, /page tab sequence/);
});

test('declares a state model for the one value a consumer can own', () => {
  assert.ok(member.capabilities.includes('selection'));
  assert.ok(MUTABLE_CAPABILITIES.includes('selection'));
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard', 'select', 'programmatic'],
  });
});

/**
 * "If the accordion panel associated with an accordion header is visible, and
 * if the accordion does not permit the panel to be collapsed, the header
 * button element has aria-disabled set to true."
 */
test('marks the header that may not close, the way the pattern asks', () => {
  assert.equal(contract.requireOpen.attribute, 'aria-disabled');
  assert.equal(contract.requireOpen.appliesTo, 'the trigger of the one open item');
  assert.equal(contract.requireOpen.source, contract.pattern);
  assert.equal(member.defaults.requireOpen, false);
  assert.match(contract.wiring['aria-disabled'], /requireOpen/);
});

test('puts no role on the set', () => {
  assert.equal(contract.roles.root, 'none');
  assert.equal(contract.rootRole.value, 'none');
  assert.ok(contract.rootRole.reason.length > 0);
});

/** The group hands the item a variant; it never selects into the item's DOM. */
test('maps its own appearance onto the one it hands each item', () => {
  for (const value of contract.axes.variant) {
    assert.ok(
      collapsible.axes.variant.includes(contract.variantMapping[value]),
      `${value} maps onto a variant the item does not have`,
    );
  }
  assert.equal(contract.variantMapping.framed, 'ruled');
  assert.equal(contract.variantMapping.separated, 'framed');
  assert.match(contract.variantMapping.reason, /selects nothing inside it/);
});

test('hands the item every axis the item resolves through the group', () => {
  for (const axis of Object.keys(collapsible.resolution)) {
    const handed = axis === 'level' ? 'level' : axis;
    assert.ok(
      contract.provides.toItems.includes(handed),
      `the item resolves ${axis} through the accordion and the accordion never hands it over`,
    );
  }
});

test('says what it refuses and what owns each refusal', () => {
  assert.equal(contract.declined.orientation.deferTo, 'tabs');
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} is declined with no reason`);
  }
});

/** The two an array cannot express while the family owns the array itself. */
test('ships the pair Angular Material ships, and says why they exist', () => {
  assert.ok(contract.imperative.openAll.includes('programmatic'));
  assert.ok(contract.imperative.closeAll.includes('requireOpen'));
  assert.match(contract.imperative.reason, /uncontrolled one has no array/);
});

test('declares every state it paints, and each one has an attribute', () => {
  assert.deepEqual(member.states, ['default', 'disabled']);
  assert.deepEqual(contract.stateAttributes, { disabled: 'data-disabled' });
});
