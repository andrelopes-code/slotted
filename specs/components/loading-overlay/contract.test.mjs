import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const overlay = contract.members.loadingOverlay;

/**
 * Read rather than recalled. The claims this file makes about the boundary
 * with the two families that also paint a wait are claims about their public
 * vocabulary, and if either renames something this test is what says so.
 */
const skeleton = JSON.parse(
  await readFile(new URL('../skeleton/contract.json', import.meta.url), 'utf8'),
);
const progress = JSON.parse(
  await readFile(new URL('../progress-indicator/contract.json', import.meta.url), 'utf8'),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is one family with one member and nine parts', () => {
  assert.equal(contract.family, 'loading-overlay');
  assert.equal(contract.ui, 'loading-overlay');
  assert.deepEqual(Object.keys(contract.members), ['loadingOverlay']);
  assert.deepEqual(overlay.parts, [
    'root',
    'announcement',
    'content',
    'scrim',
    'panel',
    'indicator',
    'label',
    'description',
    'cancel',
  ]);
});

/**
 * The part that exists so that `inert` has somewhere to go. It cannot be the
 * root — an inert subtree leaves the accessibility tree, which would silence
 * the announcement and make the cancel control unpressable — and it cannot be
 * absent, because the covered content has to be excluded from the layer
 * without being excluded from the layout.
 */
test('declares the wrapper that carries inert, and says it draws no box', () => {
  assert.ok(overlay.parts.includes('content'));
  assert.equal(contract.anatomy.content.display, 'contents');
  assert.ok(
    contract.anatomy.content.inert.includes('inert'),
    'the content part has to say what inert is for',
  );
});

/**
 * The live region is a child of the root and never of the layer. `presence`
 * takes the layer out of the document when the wait ends, and a live region
 * deleted at the moment it has something to say announces nothing.
 */
test('mounts the announcement outside the layer, for the life of the family', () => {
  const parts = overlay.parts;
  assert.ok(parts.indexOf('announcement') < parts.indexOf('scrim'));
  assert.equal(contract.anatomy.announcement.parent, 'root');
  assert.equal(contract.anatomy.announcement.role, 'status');
});

/**
 * `loading` is the consumer's own fact. A family that could move it would
 * render a reachable region while the request was still in flight, which is
 * the desync `removable` and `measurement` are declared immutable to prevent.
 * The two families that also paint a wait hold it the same way.
 */
test('holds no mutable capability, and therefore declares no state model', () => {
  for (const capability of overlay.capabilities) {
    assert.ok(
      !MUTABLE_CAPABILITIES.includes(capability),
      `${capability} is mutable and this family owns no state a consumer can take`,
    );
  }
  assert.ok(!('stateModel' in contract));

  for (const sibling of [skeleton, progress]) {
    const member = Object.values(sibling.members)[0];
    assert.ok(
      member.capabilities.includes('loading'),
      `${sibling.family} is expected to hold loading the same way`,
    );
  }
});

/**
 * Cancellation is a request in the full sense — a reason and an originating
 * event — and the family commits nothing. It is the shape `removable` has, and
 * the reason there is no state model is the reason there is no `open`.
 */
test('emits a cancel request carrying a reason, and moves nothing itself', () => {
  assert.deepEqual(contract.reasons.cancel, ['dismiss', 'escape']);
  assert.equal(contract.reasons.commits, false);
  assert.equal(overlay.defaults.cancellable, false);
});

/**
 * `Escape` is bound only when there is something for it to ask for. A key that
 * appears to do something and does nothing is worse than a key nobody bound.
 */
test('binds Escape to the cancel request and to nothing else', () => {
  const escape = contract.keyboard.find((entry) => entry.key === 'Escape');
  assert.ok(escape, 'the family declares no Escape behavior');
  assert.equal(escape.precondition, 'a cancel part exists and focus is inside the layer');
  assert.equal(escape.reason, 'escape');
  assert.equal(contract.escapeBound, 'cancellable');
});

/**
 * Making an element inert while it holds focus drops focus to the body. None
 * of the surveyed implementations has the defect because none of them makes
 * anything inert; this family does, so it owns both halves of the move.
 */
test('names where focus goes when the content goes inert, and where it returns', () => {
  assert.equal(contract.focus.initial, 'cancel');
  assert.equal(contract.focus.fallback, 'panel');
  assert.equal(contract.focus.untouched, 'focus outside the covered content is never moved');
  assert.ok(contract.focus.restore.includes('nearest connected ancestor'));
  assert.equal(contract.focus.contain.region, false);
  assert.equal(contract.focus.contain.page, true);
});

/**
 * Two scopes, and the safer one is the default. `docs/component-features.md`
 * §9 warns against making a whole page unreachable for a local operation.
 */
test('offers two scopes and defaults to the one that blocks least', () => {
  assert.deepEqual(contract.axes.scope, ['region', 'page']);
  assert.equal(overlay.defaults.scope, 'region');
});

/**
 * Page scope owns none of the document, so it writes `aria-busy` on nothing
 * and composes the modal layer that already knows how to make a page inert.
 */
test('blocks a page through the layer that already owns inertness and the scroll', () => {
  assert.deepEqual(contract.composes, [
    'portal',
    'dismissable-layer',
    'presence',
    'focus',
    'loading',
  ]);
  assert.equal(contract.wiring['aria-busy'].scope, 'region');
  assert.ok(!('aria-modal' in contract.wiring));
});

/**
 * Three ways to obscure what is underneath, and one of them obscures nothing.
 * A color is not among them: §2.4 of the guide refuses arbitrary color in
 * the agnostic contract, and a theme retunes the token instead.
 */
test('offers three veils and no free color', () => {
  assert.deepEqual(contract.axes.veil, ['wash', 'blur', 'none']);
  assert.equal(overlay.defaults.veil, 'wash');
  assert.ok(!('color' in overlay.defaults));
  assert.ok(!('background' in overlay.defaults));
});

/**
 * The same three steps `progress-indicator` uses, so a mark replaced through
 * the indicator slot is the size the default one would have been.
 */
test('sizes on the scale the family that draws the mark already owns', () => {
  assert.deepEqual(contract.axes.size, progress.axes.size);
  assert.equal(overlay.defaults.size, 'md');
});

/**
 * `skeleton`'s own axis, with `skeleton`'s own values and default. Two
 * families announcing one wait in two vocabularies would be one library
 * disagreeing with itself.
 */
test('announces with the vocabulary the sibling family already established', () => {
  assert.deepEqual(contract.axes.live, skeleton.axes.live);
  assert.equal(overlay.defaults.live, skeleton.members.skeleton.defaults.live);
  assert.deepEqual(contract.messages.slice(0, 1), skeleton.messages);
});

/**
 * Both durations default to zero, so a family that turns neither on schedules
 * no timer. The rule itself is `@slotted/core/loading`'s, shared so that the
 * layer reveals at the same moment in both bindings.
 */
test('costs no timer until an application asks for one', () => {
  assert.equal(overlay.defaults.delay, 0);
  assert.equal(overlay.defaults.minDuration, 0);
});

/**
 * The safe default is the blocking one. A consumer who forgets the prop sees
 * a covered region immediately, in development, on the first render; the other
 * default fails silently, by leaving a region reachable during a real wait.
 */
test('blocks by default, which is the direction that fails loudly', () => {
  assert.equal(overlay.defaults.loading, true);
  assert.equal(skeleton.members.skeleton.defaults.loading, true);
});

/**
 * A determinate wait is composition, not a prop. The family that owns a
 * measured quantity already exists and this one renders it.
 */
test('declines to measure, and names the part that carries the measurement', () => {
  assert.ok(!overlay.capabilities.includes('measurement'));
  assert.ok(progress.members.progressIndicator.capabilities.includes('measurement'));
  assert.equal(contract.anatomy.indicator.defers, 'progress-indicator');
});

test('declares every state it paints, and no state it does not', () => {
  assert.deepEqual(overlay.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'loading',
    'disabled',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    loading: 'data-loading',
    disabled: 'data-disabled',
  });
});

test('declares one scenario page, covering every axis it ships', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['loadingOverlay']);
  for (const scenario of [
    'region',
    'page',
    'veil',
    'sizes',
    'shapes',
    'timing',
    'cancel',
    'focus',
  ]) {
    assert.ok(
      contract.scenarios.loadingOverlay.includes(scenario),
      `no scenario demonstrates ${scenario}`,
    );
  }
});

/**
 * The container is the root and the panel is the descendant it sizes, which is
 * the split `docs/build-briefing.md` records. The breakpoint is a literal
 * because a container condition cannot hold a custom property.
 */
test('owns its query container and states the breakpoint as a number', () => {
  assert.equal(contract.container.name, 'slotted-loading-overlay');
  assert.equal(contract.container.element, 'scrim');
  assert.ok(
    contract.container.reason.includes("consumer's own covered content"),
    'the container says why it is not the root',
  );
  assert.equal(typeof contract.container.compact, 'number');
});
