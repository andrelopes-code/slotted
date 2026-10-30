import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const aspectRatio = JSON.parse(
  await readFile(new URL('../aspect-ratio/contract.json', import.meta.url), 'utf8'),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'image');
  assert.equal(contract.ui, 'image');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One member, five parts. The picture, and the two layers that stand in for
 * it before it arrives and after it fails; `picture` is the platform's own
 * element for art direction and exists only when `sources` are given. The
 * root is a `div` because a `<picture>` cannot be inside a `<span>` and a
 * frame that owns a ratio is block-level everywhere it is used.
 */
test('is one image: the picture, and what stands in for it before and after', () => {
  assert.deepEqual(Object.keys(contract.members), ['image']);
  assert.deepEqual(contract.members.image.parts, [
    'root',
    'picture',
    'image',
    'placeholder',
    'fallback',
  ]);
  assert.equal(contract.members.image.nativeElement, 'div');
});

/**
 * The ratio is another family's, and this one composes it rather than
 * restating `aspect-ratio` in its own sheet: an `image` given a ratio renders
 * the `aspect-ratio` root inside its own, and every rule that family fixes
 * this one inherits.
 */
test('composes aspect-ratio rather than owning a ratio of its own', () => {
  assert.deepEqual(contract.composes, ['aspect-ratio']);
  assert.ok(!('ratio' in contract.axes), 'the ratio axis belongs to aspect-ratio');
  assert.equal(aspectRatio.ui, 'aspect-ratio');
});

/**
 * Three layouts. `intrinsic` is the platform's: the picture is its own size,
 * shrunk to fit, and `width`/`height` on the element reserve its ratio before
 * it loads. `fill` is Next's and NgOptimizedImage's: the box is the parent's
 * in both axes and `fit` decides the crop. `framed` is the one a decided
 * ratio implies: the box is the column's width and the frame's height, and
 * it is a value of its own because `fill` inside a list item took the row's
 * stretched height and pushed the caption out of it.
 */
test('lays the picture out at its own size, its parent’s, or its frame’s, and starts with its own', () => {
  assert.deepEqual(contract.axes.layout, ['intrinsic', 'fill', 'framed']);
  assert.equal(contract.members.image.defaults.layout, 'intrinsic');
});

/**
 * The five values `object-fit` has, and `cover` first because it is what a
 * picture in a frame that is not its own shape needs — Chakra's and Mantine's
 * default. `aspect-ratio` alone says `contain`; the crop is this family's
 * decision, which is the split `docs/process/build-order.md` wrote.
 */
test('fits the picture with the platform’s five values, and crops by default', () => {
  assert.deepEqual(contract.axes.fit, ['cover', 'contain', 'fill', 'none', 'scale-down']);
  assert.equal(contract.members.image.defaults.fit, 'cover');
});

/**
 * Five named focal points and a custom one. `object-position` has no logical
 * keywords, so `start` and `end` are this family's and mirror under
 * `dir="rtl"`; a focal point a CMS supplies (`30% 20%`) is `custom`, written
 * into `--slotted-image-position` on the instance.
 */
test('names the focal point logically, and takes any other as a custom value', () => {
  assert.deepEqual(contract.axes.position, ['center', 'top', 'bottom', 'start', 'end', 'custom']);
  assert.equal(contract.members.image.defaults.position, 'center');
});

/**
 * Four steps of the radius scale and nothing round: a circular picture is an
 * avatar. `bordered` is a subtle inset edge for a photograph of a white wall
 * on a white page, and it is drawn inside the box so turning it on moves
 * nothing.
 */
test('rounds its corners on the radius scale, and draws an edge on request', () => {
  assert.deepEqual(contract.axes.radius, ['none', 'sm', 'md', 'lg']);
  assert.equal(contract.members.image.defaults.radius, 'none');
  assert.equal(contract.members.image.defaults.bordered, false);
});

/**
 * Three placeholders. `surface` is the sunken ground under a box that has
 * been reserved; `blur` is Next's and NgOptimizedImage's low-quality preview,
 * scaled and blurred; `none` paints nothing. A consumer's own node — a
 * skeleton — is content of the placeholder part rather than a fourth value.
 */
test('holds the place with a ground, a blurred preview, or nothing', () => {
  assert.deepEqual(contract.axes.placeholder, ['none', 'surface', 'blur']);
  assert.equal(contract.members.image.defaults.placeholder, 'surface');
});

/**
 * Lazy and asynchronous by default, which is what every image below the
 * fold wants; `priority` is the one above it, and writes `eager` with a high
 * fetch priority the way Next and NgOptimizedImage do.
 */
test('loads lazily unless told the picture is the one the page is waiting for', () => {
  assert.equal(contract.members.image.defaults.loading, 'lazy');
  assert.equal(contract.members.image.defaults.decoding, 'async');
  assert.equal(contract.members.image.defaults.priority, false);
});

/**
 * Four values, not a boolean, for the reason `avatar` records: `data-loaded`
 * cannot say whether the picture failed, is still coming, or was never asked
 * for. `error` is reached only after `fallbackSrc` has had its turn.
 */
test('reports the picture with the four statuses avatar established', () => {
  assert.deepEqual(contract.axes.status, ['idle', 'loading', 'loaded', 'error']);
  assert.ok(contract.members.image.capabilities.includes('status'));
  assert.ok(!('loaded' in (contract.stateAttributes ?? {})), 'data-loaded is the boolean retired');
  assert.ok(
    !('loading' in (contract.stateAttributes ?? {})),
    'data-loading is the boolean retired',
  );
});

/**
 * A picture is not a control, and paints neither press nor a resting hover.
 * It paints hover and focus anyway because `render` can make the root an
 * `<a>` or a `<button>` — a thumbnail that opens a dialog — and a ring that
 * appears only where a family expects focus is a ring that goes missing.
 * `disabled` belongs to the control that holds the picture.
 */
test('paints hover and focus for the link it can become, and never press or disabled', () => {
  assert.deepEqual(contract.members.image.states, ['default', 'hover', 'focus-visible']);
  assert.deepEqual(contract.stateAttributes, {});
});

/**
 * Every value an image holds is one the consumer owns, including `status`: a
 * load event is a fact rather than a request, there is nothing to cancel, and
 * the closed reason vocabulary has no member that fits.
 */
test('holds no state a consumer can own, and therefore declares no state model', () => {
  assert.deepEqual(contract.members.image.capabilities, [
    'appearance',
    'measurement',
    'status',
    'content',
  ]);
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(
      !contract.members.image.capabilities.includes(capability),
      `image claims the mutable capability ${capability}`,
    );
  }
  assert.ok(!('stateModel' in contract));
});

test('names one reference page, covering every axis, both stand-ins and the real context', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['image']);
  assert.deepEqual(contract.scenarios.image, [
    'playground',
    'sizing',
    'ratio',
    'fit',
    'position',
    'appearance',
    'loading',
    'error',
    'sources',
    'status',
    'interactive',
    'in-context',
    'accessibility',
  ]);
});
