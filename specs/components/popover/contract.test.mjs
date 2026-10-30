import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const tooltip = JSON.parse(
  await readFile(new URL('../tooltip/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.popover;
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'popover');
  assert.equal(contract.ui, 'popover');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * There is no popover pattern. The APG's own tooltip page names the non-modal
 * dialog as what to build when the surface holds focusable elements, so the
 * dialog pattern is what this family answers — and the difference from a modal
 * dialog is stated rather than left to the role name.
 */
test('cites the pattern it actually answers, and says what it is not', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/');
  assert.equal(contract.roles.content, 'dialog');
  assert.equal(contract.modal, false);
  assert.match(contract.wiring['aria-modal'], /never/i);
  assert.equal(contract.declined.modal.deferTo, 'dialog');
});

test('answers every key it binds, and says where focus lands', () => {
  assert.deepEqual(keys, ['Enter', 'Space', 'Escape', 'Tab', 'Shift+Tab']);
  for (const entry of contract.keyboard) {
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key} source`);
  }
  assert.equal(contract.keyboard[0].source, 'platform');
  assert.equal(contract.keyboard[2].source, 'pattern');
});

test('declares a state model for the one value a consumer can own', () => {
  assert.ok(member.capabilities.includes('open'));
  assert.ok(MUTABLE_CAPABILITIES.includes('open'));
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'escape', 'outsidePress', 'dismiss', 'programmatic'],
  });
});

/**
 * Where focus goes on open, where it comes back to on close, and what happens
 * when the trigger is gone by then. Three answers rather than one boolean.
 */
test('says where focus goes on open, on close, and when the trigger is gone', () => {
  assert.equal(contract.focus.autoFocus.default, true);
  assert.equal(contract.focus.autoFocus.target, 'content');
  assert.ok(contract.focus.initialFocus.reason.length > 0);
  assert.ok(contract.focus.finalFocus.reason.length > 0);
  assert.equal(contract.focus.restore, 'trigger');
  assert.equal(contract.focus.contained, false);
});

/**
 * The gap every surveyed library leaves open: what Tab does at the end of a
 * layer that is portalled to the end of the document and is not modal.
 */
test('says what Tab does at the edge of a portalled non-modal layer', () => {
  assert.equal(contract.focus.guards.count, 2);
  assert.equal(contract.focus.guards.part, 'focus-guard');
  assert.equal(contract.focus.guards.emits, 'keyboard');
  assert.equal(contract.focus.guards.destination, 'trigger');
  assert.match(contract.focus.guards.reason, /reading order/i);
});

test('composes the four core modules and rewrites none of them', () => {
  assert.deepEqual(contract.composes, ['positioner', 'presence', 'portal', 'dismissable-layer']);
  assert.deepEqual(contract.layer.branches, ['the trigger element', 'the anchor element']);
  assert.equal(contract.layer.modal, false);
  assert.equal(contract.layer.scrollLock, false);
  assert.equal(contract.layer.zIndexToken, '--slotted-z-index-popover');
});

test('names every part, including the plumbing it will not hide', () => {
  assert.deepEqual(member.parts, [
    'root',
    'content',
    'header',
    'title',
    'description',
    'body',
    'footer',
    'close',
    'arrow',
    'focus-guard',
  ]);
  assert.deepEqual(member.states, ['default', 'hover', 'active', 'focus-visible', 'open']);
  assert.deepEqual(contract.stateAttributes, { open: 'data-open' });
  assert.ok(contract.declined.triggerPart.reason.includes("data-part='root'"));
});

/**
 * Radix, Base UI and React Aria all expose the remaining height as a custom
 * property and none of them uses it. The header and the footer exist so the
 * body can be the thing that scrolls.
 */
test('bounds the body rather than the whole panel', () => {
  assert.equal(contract.overflow.part, 'body');
  assert.equal(contract.overflow.property, '--slotted-positioner-available-height');
  assert.deepEqual(contract.overflow.staysPut, ['header', 'footer']);
});

test('holds the disabled capability without declaring a state nothing paints', () => {
  assert.ok(member.capabilities.includes('disabled'));
  assert.ok(!member.states.includes('disabled'));
  assert.match(contract.declined.disabledState.reason, /never opens/);
});

test('names the runtime properties its stylesheet reads', () => {
  assert.deepEqual(contract.runtimeProperties, [
    '--slotted-layer-depth',
    '--slotted-positioner-anchor-width',
    '--slotted-positioner-arrow-x',
    '--slotted-positioner-arrow-y',
    '--slotted-positioner-available-height',
    '--slotted-positioner-available-width',
    '--slotted-positioner-transform-origin',
  ]);
});

test('gives every axis a resolution order ending in a stated default', () => {
  for (const axis of Object.keys(contract.axes)) {
    const order = contract.resolution[axis];
    assert.ok(Array.isArray(order), `${axis} declares no resolution order`);
    assert.equal(order[0], 'prop', `${axis} does not let a consumer win`);
    assert.equal(order[1], 'defaults', `${axis} skips the provider`);
    assert.equal(order.length, 3, `${axis} resolution order is not prop, defaults, fallback`);
    assert.ok(
      contract.axes[axis].includes(order[2]) || typeof order[2] !== 'string',
      `${axis} falls back to a value it does not offer`,
    );
  }
});

test('declares one demonstration per scenario the page has to carry', () => {
  assert.deepEqual(contract.scenarios.popover, [
    'playground',
    'sizes',
    'width',
    'placement',
    'anchor',
    'focus',
    'dismissal',
    'scrolling',
    'composition',
    'nested',
    'keyboard',
  ]);
});

test('agrees with tooltip everywhere the pair share an answer', () => {
  assert.deepEqual(contract.axes.side, tooltip.axes.side);
  assert.deepEqual(contract.axes.align, tooltip.axes.align);
  assert.deepEqual(contract.axes.mount, tooltip.axes.mount);
  assert.equal(contract.motion.property, tooltip.motion.property);
  assert.equal(contract.arrow.placedBy, tooltip.arrow.placedBy);
  assert.deepEqual(contract.composes, tooltip.composes);
});

/**
 * The one asymmetry worth stating: a hint whose anchor scrolled away has
 * nothing left to explain, and a task the reader is halfway through must not
 * vanish because the row behind it scrolled.
 */
test('keeps a task on screen where a hint would leave', () => {
  assert.equal(contract.resolution.hideWhenDetached[2], false);
  assert.equal(tooltip.resolution.hideWhenDetached[2], true);
  assert.ok(contract.declined.hideWhenDetachedByDefault.reason.length > 0);
});

test('makes the gap out of padding rather than out of offset', () => {
  assert.equal(contract.positioning.sideOffset, 0);
  assert.equal(contract.positioning.gap.token, '--slotted-popover-gap');
  assert.equal(contract.members.popover.defaults.sideOffset, 0);
});

/**
 * Three width steps the family owns, and one axis value that replaces them with
 * the anchor's measured width — the filter panel under a search field.
 */
test('caps its own width with tokens, or with the anchor', () => {
  assert.match(contract.measure.value, /16rem/);
  assert.ok(!('measure' in contract.axes));
  assert.deepEqual(contract.axes.width, ['auto', 'anchor']);
});
