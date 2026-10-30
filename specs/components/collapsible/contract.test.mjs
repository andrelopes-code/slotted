import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const accordion = JSON.parse(
  await readFile(new URL('../accordion/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.collapsible;
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'collapsible');
  assert.equal(contract.ui, 'collapsible');
  assert.equal(contract.schemaVersion, 5);
});

test('cites both patterns it answers rather than claiming to have checked them', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/');
  assert.equal(contract.groupPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/');
});

/**
 * The disclosure pattern's whole table. It is four keys and every one of them
 * is the platform's, which is the point: the family binds nothing for opening
 * and closing, so `Enter` and `Space` cannot drift from what a `button` does.
 */
test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, ['Enter', 'Space', 'Tab', 'Shift+Tab']);
  for (const entry of contract.keyboard) {
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.equal(entry.source, 'platform', `${entry.key} is not the platform's`);
  }
});

/**
 * "All focusable elements in the accordion are included in the page Tab
 * sequence." A roving tab stop would take every trigger but one out of it,
 * which is what `w3c/aria-practices#3434` removed the option for.
 */
test('keeps every trigger in the page tab sequence', () => {
  assert.equal(contract.rovingTabindex, false);
  assert.match(contract.keyboard[2].effect, /page tab sequence/);
});

test('declares a state model for the one value a consumer can own', () => {
  assert.ok(member.capabilities.includes('open'));
  assert.ok(MUTABLE_CAPABILITIES.includes('open'));
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'select', 'programmatic'],
  });
});

/**
 * A panel that closes because another one opened did not close because the
 * reader asked it to, and a boolean cannot say which happened.
 */
test('carries the reason a panel closed because a sibling opened', () => {
  assert.ok(contract.stateModel.open.reasons.includes('select'));
  assert.ok(accordion.stateModel.selection.reasons.includes('select'));
});

/**
 * The APG requires the header button to be wrapped in a heading with an
 * appropriate `aria-level`, and requires the button to be the only element
 * inside it. That second half is why `actions` is a sibling of `header`.
 */
test('puts the trigger inside a heading and nothing else with it', () => {
  assert.equal(contract.heading.part, 'header');
  assert.equal(contract.heading.onlyChild, 'trigger');
  assert.equal(contract.heading.default, 'none');
  assert.deepEqual(contract.heading.levels, ['none', '1', '2', '3', '4', '5', '6']);
  const parts = member.parts;
  assert.ok(parts.includes('actions'));
  assert.ok(parts.indexOf('actions') > parts.indexOf('trigger'));
});

test('names the roles the pattern asks for and no others', () => {
  assert.deepEqual(contract.roles, {
    header: 'heading',
    trigger: 'button',
    panel: 'region',
  });
  assert.equal(member.defaults.region, false);
  assert.match(contract.wiring.panelRole, /landmark/);
});

test('writes aria-expanded and the pair of identifiers that wire the two parts', () => {
  assert.match(contract.wiring['aria-expanded'], /true on the trigger while the panel is open/);
  assert.match(contract.wiring['aria-controls'], /names its panel/);
  assert.match(contract.wiring['aria-labelledby'], /names its trigger/);
});

/** One axis with four values rather than the three booleans the field ships. */
test('says when the panel exists, once', () => {
  assert.deepEqual(contract.axes.mount, ['active', 'lazy', 'eager', 'until-found']);
  assert.equal(contract.mount.default, 'eager');
  assert.equal(member.defaults.mount, 'eager');
  for (const value of contract.axes.mount) {
    assert.ok(
      contract.mount[value].length > 0,
      `${value} says nothing about when the panel exists`,
    );
  }
});

/** The differentiator, stated where a later reader will look for it. */
test('opens the panel without measuring it', () => {
  assert.equal(contract.motion.measured, false);
  assert.equal(contract.motion.property, 'grid-template-rows');
  assert.equal(contract.motion.from, '0fr');
  assert.equal(contract.motion.to, '1fr');
});

test('answers the browser page search with an attribute and an event', () => {
  assert.equal(contract.findInPage.attribute, 'hidden');
  assert.equal(contract.findInPage.value, 'until-found');
  assert.equal(contract.findInPage.event, 'beforematch');
  assert.ok(contract.stateModel.open.reasons.includes(contract.findInPage.requestReason));
});

/** A decline is only complete when it names what owns the capability instead. */
test('says what it refuses and what owns each refusal', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} is declined with no reason`);
  }
  assert.equal(contract.declined.horizontalCollapse.deferTo, 'sidebar');
  assert.match(contract.declined.detailsElement.reason, /only element inside a heading/);
});

test('resolves every shared axis through the accordion before the provider', () => {
  for (const [axis, order] of Object.entries(contract.resolution)) {
    assert.equal(order[0], 'prop', `${axis} does not let the consumer's own value win`);
    assert.equal(order[1], 'accordion', `${axis} does not defer to the group`);
    assert.equal(order[2], 'defaults', `${axis} does not reach the provider`);
  }
});

test('states every part the two bindings and the harness have to render', () => {
  assert.deepEqual(member.parts, [
    'root',
    'header',
    'trigger',
    'indicator',
    'label',
    'description',
    'actions',
    'panel',
    'content',
  ]);
});

test('declares every state it paints, and each one has an attribute', () => {
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'open',
    'disabled',
    'loading',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    open: 'data-open',
    disabled: 'data-disabled',
    loading: 'data-loading',
  });
});
