import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  CHANGE_REASONS,
  MUTABLE_CAPABILITIES,
  TONES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const alert = JSON.parse(
  await readFile(new URL('../alert/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.toast;
const keys = contract.keyboard.map((entry) => entry.key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'toast');
  assert.equal(contract.ui, 'toast');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * There is no toast pattern in the APG. The Alert pattern is the closest
 * official guidance and this family departs from it twice, so both departures
 * are named in the contract rather than left to be inferred from the roles.
 */
test('cites the pattern it answers, and states both departures from it', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/');
  assert.match(contract.patternStatus, /no toast/i);
  assert.deepEqual(Object.keys(contract.departures).sort(), ['keyboard', 'role']);
  for (const departure of Object.values(contract.departures)) {
    assert.ok(departure.says.length > 0, 'a departure that does not quote the pattern');
    assert.ok(departure.cost.length > 0, 'a departure with no written cost');
  }
});

/**
 * The one rule the pattern states that this family keeps without exception. A
 * message arriving never moves focus; the reader moves it, with the hotkey.
 */
test('never moves focus when a message arrives', () => {
  assert.equal(contract.focus.autoFocus, false);
  assert.ok(contract.focus.reason.length > 0);
  assert.equal(contract.focus.contained, false);
});

/**
 * The visible message is a landmark's content and not a live region: a live
 * role on a box holding a Close and an Undo is read with both buttons in it,
 * and a region created in the same task as its text is silent — ARIA 1.2 §6.4,
 * which is what `packages/core/src/live-announcer` exists for.
 */
test('announces through the shared announcer and writes no live role', () => {
  assert.equal(contract.announcement.liveRegion, false);
  assert.equal(contract.announcement.channel, 'packages/core/src/live-announcer');
  assert.ok(contract.composes.includes('live-announcer'));
  assert.deepEqual(Object.keys(contract.announcement.politeness).sort(), ['assertive', 'polite']);
  assert.ok(contract.announcement.cost.length > 0);
  assert.equal(contract.roles.root, 'region');
});

test('answers every key it binds, and says where focus lands', () => {
  assert.deepEqual(keys, ['F6', 'Tab', 'Shift+Tab', 'Escape', 'Enter', 'Space']);
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key} source`);
  }
  assert.equal(contract.keyboard[0].source, 'family');
  assert.equal(contract.keyboard[1].source, 'platform');
});

test('declares a state model for the one value a consumer can own', () => {
  assert.ok(member.capabilities.includes('queue'));
  assert.ok(MUTABLE_CAPABILITIES.includes('queue'));
  assert.deepEqual(contract.stateModel.queue, {
    controlled: 'toasts',
    uncontrolled: 'defaultToasts',
    request: 'onToastsChange',
    reasons: ['programmatic', 'dismiss', 'escape', 'keyboard', 'pointer', 'timeout', 'clear'],
  });
  for (const reason of contract.stateModel.queue.reasons) {
    assert.ok(CHANGE_REASONS.includes(reason), `${reason} is outside the vocabulary`);
  }
});

/**
 * A timer is the one thing the reason vocabulary could not say before this
 * family, and telling an expiry from a dismissal by elimination is what it
 * exists to prevent.
 */
test('emits a distinct reason when the time it was given runs out', () => {
  assert.ok(contract.stateModel.queue.reasons.includes('timeout'));
  assert.ok(contract.stateModel.queue.reasons.includes('dismiss'));
  assert.notEqual(contract.timing.expiredReason, contract.timing.dismissedReason);
  assert.equal(contract.timing.expiredReason, 'timeout');
  assert.equal(contract.timing.dismissedReason, 'dismiss');
});

/**
 * WCAG 2.2 SC 2.2.1 offers six ways out of a time limit; the family takes the
 * first and says which, rather than implying it has discharged the criterion.
 */
test('says which way out of the timing criterion it takes', () => {
  assert.equal(
    contract.timing.criterion,
    'https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html',
  );
  assert.equal(contract.timing.wayOut, 'turn off');
  assert.ok(contract.timing.applicationOwes.length > 0);
});

/**
 * Angular Material is the only surveyed implementation that states the rule;
 * five ship the action and the timer and leave the combination to the
 * consumer. Here it is a default rather than advice.
 */
test('suspends the timer for a message that carries an action', () => {
  assert.equal(contract.timing.actionSuspends, true);
  assert.ok(contract.timing.actionSuspendsReason.includes('Material'));
  assert.equal(contract.timing.never, 0);
  assert.equal(member.defaults.duration, 5000);
});

test('starts a message timer when it becomes visible, never when it is created', () => {
  assert.equal(contract.timing.startsWhenVisible, true);
  assert.equal(contract.timing.resume, 'remaining');
  assert.deepEqual(contract.timing.pause, ['hover', 'focus', 'hidden']);
});

/**
 * Focus is not one of the pause conditions a consumer may switch off: turning
 * it off expires the message under the keyboard that is using it.
 */
test('leaves the focus pause out of the axes on purpose', () => {
  assert.ok('pauseOnHover' in contract.axes);
  assert.ok('pauseWhenHidden' in contract.axes);
  assert.ok(!('pauseOnFocus' in contract.axes));
  assert.ok(contract.timing.focusPauseReason.length > 0);
});

/** Six placements, named so a right-to-left document mirrors them. */
test('names its placements logically', () => {
  assert.deepEqual(contract.axes.placement, [
    'top-start',
    'top',
    'top-end',
    'bottom-start',
    'bottom',
    'bottom-end',
  ]);
  for (const placement of contract.axes.placement) {
    assert.ok(!/left|right/.test(placement), `${placement} names a physical edge`);
  }
  assert.equal(member.defaults.placement, 'bottom-end');
});

/**
 * One axis with three values rather than two booleans that admit a meaningless
 * combination — the shape `collapsible` settled for `mount`.
 */
test('decides where the region attaches with one axis', () => {
  assert.deepEqual(contract.axes.attach, ['portal', 'viewport', 'inline']);
  assert.equal(member.defaults.attach, 'portal');
  assert.ok(!('portal' in contract.axes));
  for (const value of contract.axes.attach) {
    assert.ok(contract.attach[value].length > 0, `${value} says nothing about what it does`);
  }
});

test('speaks the five tones the theme holds, and no list of its own', () => {
  assert.deepEqual(contract.axes.tone, TONES);
  assert.deepEqual(Object.keys(contract.toneGlyphs).sort(), [...TONES].sort());
  for (const tone of TONES) {
    assert.equal(
      contract.toneGlyphs[tone],
      alert.toneGlyphs[tone],
      `${tone} draws a different mark`,
    );
  }
});

/**
 * `loading` is a state and not a tone: a promise starts in it, and the message
 * it is about still has a colour.
 */
test('keeps loading out of the tone axis', () => {
  assert.ok(!contract.axes.tone.includes('loading'));
  assert.ok(member.states.includes('loading'));
  assert.equal(contract.stateAttributes.loading, 'data-loading');
});

test('paints a tone in three ways, and names the neutral one as its default', () => {
  assert.deepEqual(contract.axes.variant, ['raised', 'soft', 'solid']);
  assert.equal(member.defaults.variant, 'raised');
  assert.ok(contract.variants.raised.includes('surface'));
});

/**
 * The pile is Sonner's and Base UI's picture, and it is measured the way they
 * measure it. What is written here is what that costs, because the first draft
 * claimed the picture could be had without measuring and the expand read as a
 * snap.
 */
test('says what the pile measures, and what measuring it costs', () => {
  assert.deepEqual(contract.axes.stacking, ['list', 'stack']);
  assert.equal(member.defaults.stacking, 'list');
  assert.equal(contract.stacking.measures, true);
  for (const measured of contract.stacking.measured) {
    assert.ok(
      contract.runtimeProperties.includes(measured),
      `${measured} is measured and is not declared a runtime property`,
    );
  }
  assert.ok(contract.stacking.cost.length > 0);
  assert.deepEqual(contract.stacking.expandsOn, ['hover', 'focus']);
});

test('names every runtime property it writes, and files none as a token', () => {
  assert.deepEqual(contract.runtimeProperties, [
    '--slotted-toast-count',
    '--slotted-toast-duration',
    '--slotted-toast-front-height',
    '--slotted-toast-height',
    '--slotted-toast-index',
    '--slotted-toast-play-state',
    '--slotted-toast-stack-height',
    '--slotted-toast-stack-offset',
    '--slotted-toast-swipe-x',
    '--slotted-toast-swipe-y',
  ]);
});

/**
 * The region cannot eat a press meant for the page it floats over, and no
 * surveyed implementation states it in its contract.
 */
test('lets a press through the region and not through a message', () => {
  assert.equal(contract.layer.pointerEvents.region, 'none');
  assert.equal(contract.layer.pointerEvents.item, 'auto');
  assert.equal(contract.layer.zIndexToken, '--slotted-z-index-toast');
});

test('declares the ten parts the anatomy is made of', () => {
  assert.deepEqual(member.parts, [
    'root',
    'list',
    'item',
    'icon',
    'content',
    'title',
    'description',
    'actions',
    'close',
    'progress',
  ]);
});

test('composes the overlay infrastructure rather than rewriting it', () => {
  assert.deepEqual(contract.composes, [
    'presence',
    'portal',
    'live-announcer',
    'removal-focus',
    'state',
  ]);
});

/** Every declining names the family that owns the capability, or the composition. */
test('says where each declined capability went', () => {
  for (const [name, declined] of Object.entries(contract.declined)) {
    assert.ok(declined.reason.length > 0, `${name} declines with no reason`);
    assert.ok(
      declined.deferTo !== undefined || declined.composition !== undefined,
      `${name} declines and names neither a family nor a composition`,
    );
  }
  assert.equal(contract.declined.anchored.deferTo, 'popover');
  assert.equal(contract.declined.modal.deferTo, 'alert-dialog');
  assert.equal(contract.declined.persistent.deferTo, 'alert');
});

test('resolves every axis in the same order, ending in a stated default', () => {
  for (const axis of Object.keys(contract.axes)) {
    const resolution = contract.resolution[axis];
    assert.ok(Array.isArray(resolution), `${axis} declares no resolution`);
    assert.deepEqual(resolution.slice(0, 2), ['prop', 'defaults'], `${axis} resolution order`);
    assert.equal(resolution[2], member.defaults[axis], `${axis} default disagrees with the member`);
  }
});

test('lets an application set every axis once, and its two words come from the catalog', () => {
  const provided = contract.provides.toastDefaults;
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(provided.includes(axis), `${axis} cannot be set once`);
  }
  assert.ok(provided.includes('hotkey'));
  assert.deepEqual(contract.messages, ['close', 'label']);
  assert.equal(member.defaults.hotkey, 'F6');
});

test('declares one scenario per demonstration the reference pages owe', () => {
  assert.deepEqual(contract.scenarios.toast, [
    'playground',
    'tones',
    'variants',
    'placement',
    'timing',
    'actions',
    'promise',
    'queue',
    'stacking',
    'dismissal',
    'keyboard',
    'content',
    'composition',
  ]);
});
