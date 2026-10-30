import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const popover = JSON.parse(
  await readFile(new URL('../popover/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.tooltip;
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'tooltip');
  assert.equal(contract.ui, 'tooltip');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The pattern is cited with the state it is actually in. The APG page carries a
 * notice that the tooltip pattern "is work in progress; it does not yet have
 * task force consensus", and a family that quoted it as settled law would be
 * overstating its own source.
 */
test('cites the pattern, its status, and the criterion that is settled', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/');
  assert.match(contract.patternStatus, /work in progress/);
  assert.equal(
    contract.criterion.source,
    'https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html',
  );
  assert.deepEqual(Object.keys(contract.criterion.requirements), [
    'dismissible',
    'hoverable',
    'persistent',
  ]);
});

/**
 * Each of the three parts of SC 1.4.13 is answered by something the family
 * does, not by a sentence saying it was considered.
 */
test('answers each part of the criterion with a mechanism', () => {
  assert.equal(contract.criterion.requirements.dismissible.answeredBy, 'escape');
  assert.equal(contract.criterion.requirements.hoverable.answeredBy, 'hoverable');
  assert.equal(contract.criterion.requirements.persistent.answeredBy, 'closeDelay');
  for (const requirement of Object.values(contract.criterion.requirements)) {
    assert.ok(requirement.reason.length > 0);
  }
});

test('answers every key the pattern lists, and says where focus lands', () => {
  assert.deepEqual(keys, ['Escape', 'Tab', 'Shift+Tab', 'Enter', 'Space']);
  for (const entry of contract.keyboard) {
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key} source`);
  }
  assert.equal(contract.keyboard[0].source, 'pattern');
});

/**
 * "Tooltip widgets do not receive focus." Nothing inside the layer is
 * focusable, and the layer itself is never in the tab sequence.
 */
test('keeps the layer out of the tab sequence entirely', () => {
  assert.equal(contract.focusable, false);
  assert.match(contract.declined.interactiveContent.reason, /does not receive focus/i);
  assert.equal(contract.declined.interactiveContent.deferTo, 'popover');
});

test('declares a state model for the one value a consumer can own', () => {
  assert.ok(member.capabilities.includes('open'));
  assert.ok(MUTABLE_CAPABILITIES.includes('open'));
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'escape', 'blur', 'programmatic'],
  });
});

/**
 * A press that takes the tooltip away is one gesture from the reader's side,
 * whether it landed on the trigger or on the page. Reporting it under two
 * reasons would make a consumer write two handlers for one thing.
 */
test('reports a press that dismisses as pointer rather than as outsidePress', () => {
  assert.ok(!contract.stateModel.open.reasons.includes('outsidePress'));
  assert.match(contract.dismissal.outsidePress.reason, /pointer/);
  assert.equal(contract.dismissal.outsidePress.emits, 'pointer');
});

test('composes the four core modules and rewrites none of them', () => {
  assert.deepEqual(contract.composes, ['positioner', 'presence', 'portal', 'dismissable-layer']);
  assert.deepEqual(contract.layer.branches, ['the trigger element']);
  assert.equal(contract.layer.modal, false);
  assert.equal(contract.layer.scrollLock, false);
  assert.equal(contract.layer.depthProperty, '--slotted-layer-depth');
});

/**
 * The stacking scale gains no step. A tooltip draws above the popover it was
 * opened inside because it is a later layer, which is the single-stack decision
 * the overlay infrastructure already took.
 */
test('stacks by depth rather than by a new token', () => {
  assert.equal(contract.layer.zIndexToken, '--slotted-z-index-popover');
  assert.equal(contract.layer.zIndexToken, popover.layer.zIndexToken);
});

/**
 * Focus opens without delay because a delay a reader cannot shorten by moving
 * faster is a delay for nothing; the group window is what stops a row of icon
 * buttons charging the warmup once per button.
 */
test('states every delay it holds, with the number and the reason', () => {
  assert.deepEqual(contract.delays.openDelay.default, 600);
  assert.deepEqual(contract.delays.closeDelay.default, 150);
  assert.deepEqual(contract.delays.groupDelay.default, 400);
  assert.deepEqual(contract.delays.touchDelay.default, 500);
  assert.equal(contract.delays.focus.default, 0);
  for (const delay of Object.values(contract.delays)) {
    assert.ok(delay.reason.length > 0);
  }
});

/**
 * An icon-only button whose only words are in its tooltip is described by
 * nothing and named "button" if the family can only write aria-describedby.
 */
test('can be the trigger name instead of its description', () => {
  assert.deepEqual(contract.describes.values, ['description', 'label', 'none']);
  assert.equal(contract.describes.default, 'description');
  assert.equal(contract.describes.attribute.description, 'aria-describedby');
  assert.equal(contract.describes.attribute.label, 'aria-labelledby');
  assert.equal(contract.describes.forcesMount, 'eager');
});

/**
 * A hint that repeats words the trigger already carries — the full name of a
 * column whose header is clipped — is read twice under either reference.
 */
test('can be shown without being read, for a hint the trigger already names', () => {
  assert.equal(contract.describes.attribute.none, null);
  assert.match(contract.wiring['aria-hidden'], /describes is none/);
});

/**
 * The hint over a truncated name must not open over a name that fits, and the
 * answer is only true at the moment it would open.
 */
test('opens over a cut name alone, measured when it would open', () => {
  assert.deepEqual(contract.whenClipped.values ?? contract.axes.whenClipped, [true, false]);
  assert.equal(contract.whenClipped.default, false);
  assert.equal(contract.whenClipped.measuredAt, 'the moment the hint would open');
  assert.deepEqual(contract.resolution.whenClipped, ['prop', 'defaults', false]);
  assert.ok(contract.provides.tooltipDefaults.includes('whenClipped'));
  assert.equal(contract.members.tooltip.defaults.whenClipped, false);
});

test('holds the disabled capability without declaring a state nothing paints', () => {
  assert.ok(member.capabilities.includes('disabled'));
  assert.ok(!member.states.includes('disabled'));
  assert.match(contract.declined.disabledState.reason, /never opens/);
});

/**
 * The trigger is not a part. `data-part` names a part of the family that owns
 * the element, and sixteen stylesheets here key on `[data-part='root']`, so
 * writing `trigger` over a `badge` or a `checkbox` used as a trigger would
 * unstyle it and nothing would report it.
 */
test('names its own parts and claims none of the consumer\u2019s', () => {
  assert.deepEqual(member.parts, ['root', 'content', 'arrow']);
  assert.ok(contract.declined.triggerPart.reason.includes("data-part='root'"));
  assert.deepEqual(member.states, ['default', 'open']);
  assert.deepEqual(contract.stateAttributes, { open: 'data-open' });
});

/**
 * The arrow is placed from two numbers the engine measures. They are runtime
 * values rather than tokens, which is why `packages/styles/src/tokens.test.mjs`
 * had to learn about them before this family could read one.
 */
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
  assert.deepEqual(contract.scenarios.tooltip, [
    'playground',
    'variant',
    'sizes',
    'placement',
    'delay',
    'describes',
    'hoverable',
    'content',
    'disabled',
    'composition',
    'keyboard',
  ]);
});

/**
 * The two families were designed in one session so that one answer covers both.
 * Where they agree, the contracts have to agree in writing, or the next change
 * to one of them quietly becomes a difference.
 */
test('agrees with popover everywhere the pair share an answer', () => {
  assert.deepEqual(contract.axes.side, popover.axes.side);
  assert.deepEqual(contract.axes.align, popover.axes.align);
  assert.deepEqual(contract.axes.mount, popover.axes.mount);
  assert.equal(contract.motion.property, popover.motion.property);
  assert.equal(contract.arrow.placedBy, popover.arrow.placedBy);
  assert.notEqual(contract.roles.content, popover.roles.content);
});

/**
 * The distance between the trigger and the painted surface is the layer's own
 * padding, not the positioner's offset. A gap made of offset is empty space the
 * pointer falls through on the way in, which is SC 1.4.13 Hoverable failing.
 */
test('makes the gap out of padding rather than out of offset', () => {
  assert.equal(contract.positioning.sideOffset, 0);
  assert.equal(contract.positioning.gap.token, '--slotted-tooltip-gap');
  assert.equal(contract.positioning.gap.default, 'var(--slotted-space-4)');
  assert.equal(popover.positioning.sideOffset, 0);
  assert.equal(popover.positioning.gap.token, '--slotted-popover-gap');
});

/**
 * `docs/build-briefing.md` gives measure to `container` and to it alone, so the
 * cap is a token the family owns rather than an axis it offers.
 */
test('caps its own width with a token and offers no measure axis', () => {
  assert.equal(contract.measure.value, '18rem');
  assert.ok(!('measure' in contract.axes));
  assert.match(contract.measure.reason, /container/);
});
