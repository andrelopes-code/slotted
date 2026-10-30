import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  MUTABLE_CAPABILITIES,
  STATE_ATTRIBUTES,
  TONES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.progressIndicator;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is one family with one member, three components and five parts', () => {
  assert.equal(contract.family, 'progress-indicator');
  assert.equal(contract.ui, 'progress-indicator');
  assert.deepEqual(Object.keys(contract.members), ['progressIndicator']);
  assert.deepEqual(Object.keys(contract.components), ['progressBar', 'progressCircle', 'loader']);
  assert.deepEqual(member.parts, ['root', 'label', 'value', 'track', 'indicator']);
});

/**
 * The consolidation the rebuild order asked for. Three entries left
 * `specs/components/` for this one, and the contract says which three so a
 * reader of the old API can find where each went — the reference page carries
 * the moves themselves.
 */
test('names the three families it absorbed', () => {
  assert.deepEqual(contract.absorbs, ['spinner', 'progress-bar', 'loading-bar']);
});

/**
 * `div` rather than the native `progress`. A native progress bar can only be
 * painted through engine-specific pseudo-elements — `::-webkit-progress-value`,
 * `::-moz-progress-bar` — that sit outside the CSS specification and cannot be
 * written once for both engines, and one authored stylesheet is this library's
 * rule. The decision is inherited from the family this one replaces, and the
 * cost is that the role and every range attribute are written by hand; the
 * accessibility section of the reference page is where they are accounted for.
 */
test('renders a div and writes the progressbar role itself', () => {
  assert.equal(member.nativeElement, 'div');
});

/**
 * The shape is written by the component rather than chosen by a consumer: one
 * stylesheet has to tell three geometries apart, and a `shape` prop would be a
 * fourth way to pick the component a consumer has already picked. `shape` is
 * therefore absent from the capabilities, and the values live here so the
 * stylesheet, both bindings and the harness fragment read one table.
 */
test('discriminates the three geometries without offering a shape prop', () => {
  assert.deepEqual(Object.values(contract.components), ['linear', 'circular', 'morph']);
  assert.ok(!member.capabilities.includes('shape'));
});

/**
 * The whole point of the family: a quantity a consumer states and this family
 * draws. `measurement` is the word `progress-bar` put in the vocabulary, and
 * it is deliberately not mutable — a progress indicator cannot decide it has
 * progressed, so there is no request to emit and no reason a request could
 * carry.
 */
test('measures a quantity it never moves, and therefore declares no state model', () => {
  assert.ok(member.capabilities.includes('measurement'));
  assert.ok(!MUTABLE_CAPABILITIES.includes('measurement'));
  for (const capability of member.capabilities) {
    assert.ok(
      !MUTABLE_CAPABILITIES.includes(capability),
      `${capability} would make this family the owner of a value it only reports`,
    );
  }
  assert.ok(!('stateModel' in contract));
});

/**
 * Nought to a hundred, which is what ARIA defaults `aria-valuemin` and
 * `aria-valuemax` to and what Base UI, Radix and Spectrum all ship. Material
 * and Fluent use nought to one instead; a percentage is the range a reader is
 * told about, so it is the range the family states.
 */
test('measures against the range ARIA already defaults to', () => {
  assert.equal(member.defaults.min, 0);
  assert.equal(member.defaults.max, 100);
});

/**
 * A value nobody stated is a wait, not nought per cent. The default is
 * therefore an absence rather than a number, which is why it is stated here
 * as a fact about the family instead of as an entry in `defaults` — `null` is
 * not a scalar the defaults table can carry, and writing `0` there would be
 * the claim this family refuses to make.
 */
test('is indeterminate until a value arrives', () => {
  assert.ok(!('value' in member.defaults));
  assert.ok(member.states.includes('indeterminate'));
  assert.equal(STATE_ATTRIBUTES.indeterminate, contract.stateAttributes.indeterminate);
});

/**
 * Two derived states and no chosen ones. `complete` exists because CSS cannot
 * compare a value to a maximum: without it a consumer who wants the finished
 * bar to read differently from one at ninety-nine per cent has no selector to
 * write. Radix spells it `data-state="complete"` and Base UI `data-complete`.
 */
test('paints the two facts a consumer cannot compute in CSS', () => {
  assert.deepEqual(member.states, ['default', 'indeterminate', 'complete']);
  assert.deepEqual(contract.stateAttributes, {
    indeterminate: 'data-indeterminate',
    complete: 'data-complete',
  });
  assert.equal(STATE_ATTRIBUTES.complete, contract.stateAttributes.complete);
});

/**
 * No `disabled`, no `hover`, no `active` and no `focus-visible`. The family is
 * not a control: it answers no pointer, takes no focus and has nothing to
 * disable. `status-indicator` paints a focus ring because its root is
 * routinely a link in a table row; a progress indicator is never the thing a
 * reader clicks.
 */
test('declares none of the interactive states, because it is not a control', () => {
  for (const state of ['hover', 'active', 'focus-visible', 'disabled', 'readonly']) {
    assert.ok(!member.states.includes(state), `${state} belongs to a control`);
  }
});

/** Three steps, in the geometry each shape has: thickness, diameter, box. */
test('offers one size axis for three geometries', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(member.defaults.size, 'md');
  assert.ok(member.capabilities.includes('size'));
});

/**
 * The five the theme owns, read from the shared list rather than restated. A
 * tone asserted by copying another family's contract is what broke `alert` and
 * `tag` when `badge` was rebuilt.
 */
test('speaks the five tones the theme owns, and no color of its own', () => {
  assert.deepEqual(contract.axes.tone, TONES);
  assert.equal(member.defaults.tone, 'accent');
});

/**
 * `placement` joined the vocabulary for `loading-bar`, and it is the only real
 * difference that family had. A page-level bar is this one with two
 * declarations changed, not a family of its own.
 */
test('absorbs the page-level bar as a placement rather than a family', () => {
  assert.deepEqual(contract.axes.placement, ['inline', 'page', 'edge-start', 'edge-end']);
  assert.equal(member.defaults.placement, 'inline');
  assert.ok(member.capabilities.includes('placement'));
});

/**
 * The edge of a box is the same bar again: the viewport is one box, and a card,
 * the content region of a shell or the foot of a header is another. The edge
 * is part of the placement rather than a second axis, because an edge without
 * the placement names nothing.
 */
test('stands on an edge of the box that holds it, over the line that edge draws', () => {
  assert.match(contract.edge.box, /nearest positioned box/);
  assert.match(contract.edge.line, /covers the line/);
  assert.match(contract.edge.motion, /grows out of the edge/);
  assert.match(contract.edge.motion, /--slotted-easing-enter/);
  assert.match(contract.edge.motion, /--slotted-easing-exit/);
  assert.match(contract.edge.forcedColors, /no outline of its own/);
});

/**
 * Both timing values default to zero. The family cannot know an application's
 * latency, and a non-zero default would leave a blank space wherever a wait is
 * already over — which is every first render of an already-loaded page. The
 * recommended pair is on the reference page and set once through the provider,
 * which is the decision `skeleton` recorded for the same machine.
 */
test('ships the timing that prevents a flash, and turns neither on by itself', () => {
  assert.equal(member.defaults.delay, 0);
  assert.equal(member.defaults.minDuration, 0);
  assert.equal(member.defaults.loading, true);
  assert.ok(member.capabilities.includes('loading'));
});

/**
 * No live region, and the reason is a fact about the role rather than a
 * preference. `progressbar` carries **Children Presentational: True** in ARIA
 * 1.3 <https://w3c.github.io/aria/#progressbar>, so every element inside the
 * one holding the role is pruned from the accessibility tree — a
 * `role="status"` child of a progress indicator is a live region no reader
 * ever hears. The words a reader hears while a task runs are
 * `inline-message`'s, which section 9 of the feature guide names for exactly
 * this — “ajuda, erro, warning, success ou progresso”, with an announcement
 * policy of its own — and there the sighted reader sees the same sentence the
 * screen reader speaks.
 */
test('announces through the role alone, and defers a spoken message to inline-message', () => {
  assert.ok(!member.capabilities.includes('live'));
  assert.ok(!('live' in contract.axes));
  assert.ok(!('announceStep' in member.defaults));
  assert.ok(!member.parts.includes('announcement'));
});

/**
 * The sentence `docs/component-features.md` section 9 writes about this
 * family: “A standalone spinner requires an accessible name or is hidden when the
 * neighboring text already names it.” `decorative` is the second half, and it is `divider`'s
 * word rather than a second one invented for the same removal from the
 * accessibility tree.
 */
test('can leave the accessibility tree when neighbouring text already names the wait', () => {
  assert.ok(member.capabilities.includes('decorative'));
  assert.equal(member.defaults.decorative, false);
});

/**
 * The two M3 Expressive appearances, each a boolean named for what it is
 * rather than a shared `variant` axis: `wave` belongs to the two measured
 * shapes and `contained` to the loader, and one axis holding both would offer
 * every value to every component.
 */
test('names the wavy indicator and the loader container as their own facts', () => {
  assert.equal(member.defaults.wave, false);
  assert.equal(member.defaults.contained, false);
  assert.deepEqual(contract.measured, ['progressBar', 'progressCircle']);
});

/** A wait does not need a number to be understood; M3 renders none at all. */
test('renders no number and no visible name unless asked', () => {
  assert.equal(member.defaults.showValue, false);
  assert.equal(member.defaults.hideLabel, false);
});

test('names one scenario page, because the three components are chosen together', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['progressIndicator']);
  assert.deepEqual(contract.scenarios.progressIndicator, [
    'playground',
    'recipes',
    'determinate',
    'indeterminate',
    'loader',
    'wave',
    'waveRamp',
    'wavePace',
    'waveIndeterminate',
    'waveSizes',
    'buffer',
    'sizes',
    'tones',
    'timing',
    'page',
    'content',
    'composition',
    'accessibility',
  ]);
});
