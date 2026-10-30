import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const popover = JSON.parse(
  await readFile(new URL('../popover/contract.json', import.meta.url), 'utf8'),
);
const tooltip = JSON.parse(
  await readFile(new URL('../tooltip/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.hoverCard;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'hover-card');
  assert.equal(contract.ui, 'hover-card');
  assert.equal(contract.schemaVersion, 5);
});

test('cites the guidance it answers: the tooltip page and SC 1.4.13', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/');
  assert.match(contract.criterion, /content-on-hover-or-focus/);
  assert.match(contract.dismissal.hoverable, /Hoverable/);
  assert.match(contract.dismissal.persistent, /Persistent/);
  assert.match(contract.dismissal.escape.effect, /Dismissible/);
});

/**
 * The decision this family exists to hold: a hover card is popover behind a
 * hover trigger, not a second copy of it. Radix's HoverCard.Content restates
 * Popover.Content; here nothing of the panel is restated.
 */
test('holds the popover family unchanged rather than restating it', () => {
  assert.equal(contract.holds, 'popover');
  assert.match(contract.holdsReason, /overrides below/);
  for (const part of popover.members.popover.parts) {
    assert.ok(!member.parts.includes(part) || part === 'root', `hover-card restates ${part}`);
  }
  assert.equal(contract.declined.popoverApi.deferTo, 'popover');
  assert.deepEqual(contract.composes, ['pointer-intent']);
});

/**
 * Two of the popover's defaults are the family's to override, and both are
 * written with their reason: the card never takes focus, and it stands off the
 * link by the halo the open mark draws plus the same again of air.
 */
test('overrides autoFocus and sideOffset on the popover it holds, and says why', () => {
  assert.equal(contract.overrides.autoFocus.value, false);
  assert.equal(contract.overrides.sideOffset.value, 4);
  assert.equal(member.defaults.sideOffset, 4);
  assert.match(contract.overrides.sideOffset.reason, /halo/);
  assert.equal(popover.members.popover.defaults.sideOffset, 0);
});

/** The root is the trigger, an anchor element, and it is the only part. */
test('owns the trigger as its root, and nothing else', () => {
  assert.deepEqual(member.parts, ['root']);
  assert.equal(member.nativeElement, 'a');
  assert.match(contract.rootReason, /Radix and Base UI/);
  assert.deepEqual(member.states, ['default', 'hover', 'focus-visible', 'open']);
  assert.deepEqual(contract.stateAttributes, { open: 'data-open' });
  assert.match(contract.statesReason, /no disabled state/);
});

/**
 * The delays are the tooltip's where the two families meet, and the field's
 * where they part: 600 to open, as tooltip; 300 to close, as Radix and Base UI.
 */
test('opens after the tooltip’s delay and closes after the field’s', () => {
  assert.equal(contract.delays.openDelay.default, tooltip.delays.openDelay.default);
  assert.equal(contract.delays.closeDelay.default, 300);
  assert.equal(contract.delays.focus.default, 0);
  assert.match(contract.delays.focus.reason, /focus-visible/);
  assert.equal(member.defaults.openDelay, 600);
  assert.equal(member.defaults.closeDelay, 300);
});

test('keeps the card open while the pointer is on its way there', () => {
  assert.equal(contract.grace.module, 'pointer-intent');
  assert.match(contract.grace.reason, /closeDelay alone/);
});

/** The reasons: the popover's, plus blur, which is the trigger's own. */
test('owns the open model and adds blur to the popover’s reasons', () => {
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'escape', 'outsidePress', 'blur', 'dismiss', 'programmatic'],
  });
  for (const reason of popover.stateModel.open.reasons) {
    assert.ok(contract.stateModel.open.reasons.includes(reason), `${reason} lost`);
  }
  assert.ok(!popover.stateModel.open.reasons.includes('blur'));
  assert.equal(contract.dismissal.blur.emits, 'blur');
  assert.equal(contract.dismissal.guard.emits, 'keyboard');
  assert.equal(contract.dismissal.close.emits, 'dismiss');
});

/**
 * Focus the family puts back must not reopen the card. Without the rule a
 * guard closes the card, focuses the trigger, and the trigger opens it again.
 */
test('never takes focus on open, and does not reopen on the focus it returns', () => {
  assert.match(contract.focus.onOpen, /autoFocus is forced off/);
  assert.equal(contract.focus.guards, true);
  assert.match(contract.dismissal.reopen.rule, /holds the reopening back/);
});

/** The one axis the field lacks, with both readings written out. */
test('makes the content navigable on request, and says what changes', () => {
  assert.equal(contract.navigable.default, false);
  assert.equal(member.defaults.navigable, false);
  assert.match(contract.navigable.off, /presentation/);
  assert.match(contract.navigable.on, /aria-haspopup="dialog"/);
  assert.equal(contract.roles.content, 'dialog when navigable, presentation when not');
  assert.match(contract.wiring['aria-haspopup'], /only when navigable/);
});

test('opens on a tap on touch, and follows the link on the second', () => {
  assert.equal(contract.touch.opensOn, 'tap');
  assert.match(contract.touch.openTrigger, /follows the link/);
  assert.match(contract.touch.reason, /one extra tap/);
});

test('answers every key it binds, and says where focus lands', () => {
  assert.deepEqual(
    contract.keyboard.map((entry) => entry.key),
    ['Tab', 'Shift+Tab', 'Escape', 'Enter'],
  );
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(
      ['platform', 'pattern', 'family', 'criterion'].includes(entry.source),
      `${entry.key} source`,
    );
  }
});

test('shares one card between many triggers without a second API', () => {
  assert.match(contract.sharedCard.rule, /registers itself as the anchor/);
  assert.match(contract.sharedCard.payload, /currentTarget/);
});

test('resolves every axis in the same order, and holds a default for each', () => {
  for (const axis of Object.keys(contract.axes)) {
    const resolution = contract.resolution[axis];
    assert.ok(Array.isArray(resolution), `${axis} declares no resolution order`);
    assert.equal(resolution[0], 'prop', `${axis} does not let the consumer's value win`);
    assert.equal(resolution[1], 'defaults', `${axis} cannot be set once for an application`);
    assert.ok(axis in member.defaults, `${axis} has no default`);
    assert.deepEqual(member.defaults[axis], resolution[2], `${axis} default disagrees`);
    assert.ok(contract.provides.hoverCardDefaults.includes(axis), `${axis} is not in the provider`);
  }
});

test('declines nothing without naming what owns it instead, or what it costs', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines with no reason`);
  }
  assert.match(contract.declined.inlineAnchor.reason, /positioner/);
});

test('declares the scenes its reference page has to show', () => {
  assert.deepEqual(contract.scenarios.hoverCard, [
    'playground',
    'mention',
    'link-preview',
    'navigable',
    'delay',
    'shared',
    'touch',
    'composition',
    'keyboard',
  ]);
});
