import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.scrollArea;
const keyboard = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'scroll-area');
  assert.equal(contract.ui, 'scroll-area');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * `references/patterns.md` forbids writing "checked against APG" from memory,
 * and the honest answer for this family is that there is nothing to check
 * against: the Authoring Practices index holds no Scroll Area, and no ARIA role
 * describes a scroll container.
 *
 * So the contract records the absence and cites what governs instead. A later
 * pass that invents a pattern URL fails here.
 */
test('records that no APG pattern exists, and cites what governs instead', () => {
  assert.equal(contract.pattern, null);

  const cited = contract.patternAbsent.governedBy.map((entry) => entry.url);
  assert.ok(cited.length >= 3, 'an absent pattern is replaced by more than one requirement');
  for (const url of cited) assert.match(url, /^https:\/\//);

  assert.ok(
    cited.some((url) => url.includes('WCAG22/Understanding/keyboard')),
    'SC 2.1.1 is the criterion that puts a tab stop on a scrollport',
  );
  assert.ok(
    cited.some((url) => url.includes('name-role-value')),
    'SC 4.1.2 is what the tab stop then owes, and is the half the field skips',
  );
});

/**
 * Three parts, and the three that are missing are the three a drawn scrollbar
 * needs. This test is what keeps a later pass from growing them, and with them
 * the decision recorded
 * section 5: the scrollbar is the platform's.
 */
test('is the scrollport and its frame, and declares no scrollbar of its own', () => {
  assert.deepEqual(member.parts, ['root', 'viewport', 'content']);
  assert.equal(member.nativeElement, 'div');

  for (const drawn of ['scrollbar', 'thumb', 'corner']) {
    assert.ok(!member.parts.includes(drawn), `${drawn} is a part a drawn scrollbar needs`);
  }
});

/**
 * The frame and the scrollport are two elements because a mask covers
 * everything the element paints, its border included — which the first capture
 * of this family showed and no offline test could.
 *
 * The reason belongs in the contract because the merge is the obvious
 * simplification: a later pass that collapses the two has to delete this test,
 * and deleting it is where the capture gets read.
 */
test('keeps the frame off the element the veil is on', () => {
  assert.match(contract.identity.whyTwoElements, /mask covers everything the element paints/);
  assert.match(contract.affordance.element, /^the viewport, never the root/);
});

/**
 * The scrollbar is themed through CSS properties the platform owns, and the
 * cost of that is written rather than implied.
 */
test('names the platform as the scrollbar, and states what it costs', () => {
  assert.equal(contract.scrollbar.source, 'the platform');
  assert.deepEqual(contract.scrollbar.properties, [
    'scrollbar-color',
    'scrollbar-width',
    'scrollbar-gutter',
  ]);
  assert.match(contract.scrollbar.cost, /scrollbar-width has auto, thin and none/);
});

/**
 * No mutable capability, and therefore no state model — which the shared schema
 * would otherwise demand.
 *
 * The reason belongs in the contract rather than in a commit message: a later
 * pass that adds a controlled `scrollTop` has to delete this test, and deleting
 * it is where the argument gets read.
 */
test('holds no mutable value, and says why the scroll position is not one', () => {
  assert.deepEqual(contract.state.mutable, []);
  assert.equal(contract.stateModel, undefined);

  for (const capability of member.capabilities) {
    assert.ok(
      !MUTABLE_CAPABILITIES.includes(capability),
      `${capability} holds state and would need a model`,
    );
  }

  assert.match(contract.state.reason, /reported and never requested/);
});

/**
 * Ten keys, and the family writes one of them. Everything a focused scrollport
 * already does is the platform's, and the contract says so key by key so that a
 * later pass cannot reimplement `PageDown` and call it a capability.
 */
test('claims one key and leaves the platform the other nine', () => {
  assert.equal(keyboard('Tab').source, 'family');

  const platform = contract.keyboard.filter((entry) => entry.source === 'platform');
  assert.equal(platform.length, contract.keyboard.length - 1);

  for (const key of [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'PageUp',
    'PageDown',
    'Home',
    'End',
    'Space',
  ]) {
    const entry = keyboard(key);
    assert.ok(entry, `${key} is missing from the keyboard table`);
    assert.equal(entry.source, 'platform', `${key} is not the family's to write`);
    assert.equal(entry.focus, 'stays on the scrollport');
  }
});

/**
 * The tab stop is conditional on the measurement, and it owes a name. Base UI
 * and Zag both write `role="presentation"` beside theirs, which answers the
 * rule that is tested and breaks SC 4.1.2, which is not.
 */
test('writes the region only while it overflows, and never without a name', () => {
  assert.match(contract.wiring.role, /only while the content overflows/);
  assert.match(contract.wiring.tabindex, /a tab stop on content that fits is a tab stop/);
  assert.match(contract.wiring.name, /aria-labelledby, then aria-label/);
  assert.match(contract.wiring.movement, /^none\./);
});

/**
 * Logical edge names, because the attributes are what a stylesheet selects on.
 */
test('publishes the measurement in logical names', () => {
  assert.equal(contract.edges.source, '@slotted/core/overflow');
  assert.deepEqual(contract.edges.attributes, [
    'data-overflowing',
    'data-at-block-start',
    'data-at-block-end',
    'data-at-inline-start',
    'data-at-inline-end',
  ]);

  for (const physical of ['top', 'bottom', 'left', 'right']) {
    assert.ok(
      !contract.edges.attributes.some((attribute) => attribute.includes(physical)),
      `${physical} is a physical edge, and mirrors wrongly`,
    );
  }
});

/**
 * The affordance is a mask and not a gradient, and the reason is `table`'s own:
 * a gradient needs the color of the ground under it, and a mask needs none.
 */
test('draws the affordance without an ink', () => {
  assert.match(contract.affordance.mechanism, /mask-image/);
  assert.match(contract.affordance.forcedColors, /^removed\./);
  assert.match(
    contract.affordance.enhancement,
    /animation-timeline: scroll\(\) — was considered and not built/,
  );
});

/**
 * `docs/component-features.md` §4 names printing in this family's own sentence,
 * and no surveyed implementation answers it.
 */
test('prints the whole content rather than the visible slice', () => {
  assert.match(contract.print.rule, /@media print/);
});

/**
 * Every axis the family declares has a scenario, so the reference pages cannot
 * ship a sample of the family instead of the family.
 */
test('declares a scenario for every axis it holds', () => {
  const scenarios = new Set(contract.scenarios.scrollArea);

  for (const axis of ['axis', 'scrollbars', 'gutter', 'fade', 'overscroll']) {
    assert.ok(axis in member.defaults, `${axis} is not declared as an axis`);
    assert.ok(scenarios.has(axis), `${axis} has no demonstration`);
  }

  for (const required of ['keyboard', 'content', 'composition', 'accessibility']) {
    assert.ok(scenarios.has(required), `${required} has no demonstration`);
  }
});
