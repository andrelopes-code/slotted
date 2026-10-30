import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const link = contract.members.link;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because the family is one primitive', () => {
  assert.equal(contract.family, 'link');
  assert.equal(contract.ui, 'link');
  assert.deepEqual(Object.keys(contract.members), ['link']);
});

test('renders an anchor, the only element that navigates', () => {
  assert.equal(link.nativeElement, 'a');
});

test('names the underline axis and defaults to the web convention', () => {
  assert.deepEqual(contract.axes.underline, ['always', 'hover', 'none']);
  assert.equal(link.defaults.underline, 'always');
});

/**
 * `accent` is the link, `neutral` is the link that takes the colour of the
 * text around it, and `inverse` is the link on a solid surface. The five tones
 * are not here: tone marks an action's consequence, navigation has none, and a
 * destructive command is a Button.
 */
test('names three variants and no tone scale', () => {
  assert.deepEqual(contract.axes.variant, ['accent', 'neutral', 'inverse']);
  assert.equal(link.defaults.variant, 'accent');
  assert.ok(!('tone' in contract.axes));
});

/**
 * A size on the type scale, unset by default: an unset link takes the size an
 * action slot states for the controls it holds, or its parent's. The same
 * link in a stat card's, a section's and a chart's actions drew at three sizes.
 */
test('names a size axis that is unset unless stated', () => {
  assert.deepEqual(contract.axes.size, ['xs', 'sm', 'md']);
  assert.ok(!('size' in link.defaults));
});

test('carries the two parts an external link owes the reader', () => {
  assert.deepEqual(link.parts, ['root', 'external-icon', 'external-hint']);
  assert.equal(link.defaults.external, false);
});

test('paints a disabled link and holds the weaker states back for it', () => {
  assert.ok(link.capabilities.includes('disabled'));
  assert.equal(link.defaults.disabled, false);
  assert.deepEqual(link.states, ['default', 'hover', 'active', 'focus-visible', 'disabled']);
  assert.deepEqual(contract.stateAttributes, { disabled: 'data-disabled' });
});

/**
 * `visited` is opt-in because `:visited` is restricted to colour and cannot be
 * read back by script: a family that turned it on by default would ship a rule
 * no test in this repository can assert.
 */
test('makes the visited colour a decision the application takes', () => {
  assert.equal(link.defaults.visited, false);
});

/**
 * The family holds no state it can move. `aria-current` is the router's or the
 * consumer's, so the stylesheet paints the platform attribute and the contract
 * declares neither the mutable capability nor a `data-current` mirror of it.
 */
test('holds no mutable capability, and therefore no state model', () => {
  for (const capability of link.capabilities) {
    assert.ok(
      !MUTABLE_CAPABILITIES.includes(capability),
      `${capability} holds state a link cannot move`,
    );
  }
  assert.ok(!('stateModel' in contract));
  assert.ok(!link.states.includes('current'));
});

test('exposes appearance, underline, external and disabled as its capabilities', () => {
  assert.deepEqual(link.capabilities, ['appearance', 'underline', 'external', 'disabled']);
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['link']);
  assert.deepEqual(contract.scenarios.link, [
    'playground',
    'underline',
    'variants',
    'external',
    'states',
    'current',
    'content',
    'composition',
    'accessibility',
  ]);
});
