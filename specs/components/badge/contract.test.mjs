import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'badge');
  assert.equal(contract.ui, 'badge');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The field ships two things under one name: an inline metadata chip — Spectrum,
 * Primer, Atlassian, Radix, shadcn — and a count anchored to the corner of
 * another element — Ant, MUI, Angular Material, HeroUI. Fluent ships both, as
 * two components. They are one family here because they are one box with one
 * tone, one edge and one type scale; the anchoring is a frame around it, not a
 * second badge.
 */
test('is one badge, whose frame and glyphs are parts rather than families', () => {
  assert.deepEqual(Object.keys(contract.members), ['badge']);
  assert.deepEqual(contract.members.badge.parts, ['root', 'start', 'label', 'end', 'anchor']);
});

/**
 * The words have a box of their own, as they do in `button`, and the glyphs sit
 * beside it rather than inside it. That is what lets `text-box` trim the line to
 * the cap and the baseline: the trim needs a block container, and a flex
 * container's own text lives in an anonymous item no stylesheet can reach.
 */
test('gives the text a box of its own, with a glyph slot on either side', () => {
  assert.ok(contract.members.badge.parts.includes('label'));
  assert.ok(contract.members.badge.parts.includes('start'));
  assert.ok(contract.members.badge.parts.includes('end'));
  assert.ok(contract.members.badge.capabilities.includes('content'));
});

/**
 * The one part in the library that contains its family's root instead of
 * sitting inside it. It therefore carries `data-ui` itself: a `data-part` with
 * no reachable family identifier would be selectable only by a name no family
 * owns.
 */
test('reserves the frame that places a badge on another element', () => {
  assert.ok(contract.members.badge.parts.includes('anchor'));
  assert.deepEqual(contract.axes.placement, ['top-end', 'top-start', 'bottom-end', 'bottom-start']);
  assert.deepEqual(contract.axes.overlap, ['rectangle', 'circle']);
  assert.equal(contract.members.badge.defaults.placement, 'top-end');
  assert.equal(contract.members.badge.defaults.overlap, 'rectangle');
});

/**
 * The corner is a decision the family takes and the last pixel or two is one it
 * cannot: how far a badge sits into a host depends on the host's own curve,
 * shadow and optical weight, and `overlap` has two values where hosts have
 * many. The offset is the correction, in pixels, of the overhang the frame
 * computes — nought on both axes, so a badge that states nothing is placed
 * exactly where it was before (BD1).
 */
test('lets the page correct the corner it is placed on, by a stated number of pixels', () => {
  assert.equal(contract.members.badge.defaults.offset, '{ x: 0, y: 0 }');
});

/** Phrasing content: a badge has to be legal inside a heading, a cell or a label. */
test('renders the element that claims nothing and fits anywhere text fits', () => {
  assert.equal(contract.members.badge.nativeElement, 'span');
});

/**
 * `tone` names the colour and `variant` names the painting, as they do in
 * `button`. The previous contract had them the other way round, which is why
 * the rename is written in the design's break table.
 */
test('separates the colour it speaks in from the way that colour is painted', () => {
  assert.deepEqual(contract.axes.tone, [
    'accent',
    'secondary',
    'info',
    'success',
    'warning',
    'danger',
  ]);
  assert.deepEqual(contract.axes.variant, ['solid', 'soft', 'outline']);
  assert.ok(!('fill' in contract.axes), 'fill is the word button retired');
});

/**
 * `soft` is the value Button removed from its own painting axis, naming this
 * family the owner of every tone's `surface` role. A badge is metadata, and a
 * page of solid grey pills reads as a page of controls.
 */
test('defaults to the tinted metadata chip, not to a filled one', () => {
  assert.equal(contract.members.badge.defaults.variant, 'soft');
  assert.equal(contract.members.badge.defaults.tone, 'secondary');
});

test('scales in three steps and starts in the middle', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(contract.members.badge.defaults.size, 'md');
});

/**
 * The dot is a shape and not a boolean: it is the same badge, the same tone and
 * the same hidden text, drawn without a value. Fluent, Ant, MUI and HeroUI all
 * spend a separate prop on it.
 */
test('draws itself as a pill, a rectangle, or the mark that carries no value', () => {
  assert.deepEqual(contract.axes.shape, ['pill', 'square', 'dot']);
  assert.equal(contract.members.badge.defaults.shape, 'pill');
});

/**
 * A count that changes decides for itself whether it is announced, and decides
 * `off`. A page of twenty badges that all announce is a page no screen reader
 * user can read, and WCAG 2.2 4.1.3 is about messages rather than about every
 * piece of metadata on a screen.
 */
test('lets a changing count declare its announcement policy, and stays quiet by default', () => {
  assert.deepEqual(contract.axes.live, ['off', 'polite', 'assertive']);
  assert.equal(contract.members.badge.defaults.live, 'off');
});

/** The ceiling four surveyed implementations agree on, and the zero rule three do. */
test('carries the counting decisions rather than leaving them to each consumer', () => {
  assert.equal(contract.members.badge.defaults.max, 99);
  assert.equal(contract.members.badge.defaults.showZero, false);
});

/**
 * A badge is not a command: it answers no hover and gives no press feedback.
 * `focus-visible` is painted anyway, because `render` can make the root an `<a>`
 * and a ring that appears only where a family expects focus is a ring that goes
 * missing.
 */
test('paints focus and refuses hover and press', () => {
  assert.deepEqual(contract.members.badge.states, ['default', 'focus-visible']);
  assert.ok(!contract.members.badge.states.includes('hover'));
  assert.ok(!contract.members.badge.states.includes('active'));
  assert.ok(!('stateAttributes' in contract), 'every declared state is a pseudo-state');
});

/**
 * Every value a badge holds is one the consumer owns. The badge never asks for
 * a new one, so there is nothing to hold controlled or uncontrolled and no
 * request to carry a reason.
 */
test('holds no state of its own, and therefore declares no state model', () => {
  assert.deepEqual(contract.members.badge.capabilities, [
    'appearance',
    'size',
    'shape',
    'content',
    'live',
    'placement',
  ]);
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(
      !contract.members.badge.capabilities.includes(capability),
      `badge claims the mutable capability ${capability}`,
    );
  }
  assert.ok(!('stateModel' in contract));
});

test('names one reference page, covering the count and the frame', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['badge']);
  assert.deepEqual(contract.scenarios.badge, [
    'playground',
    'appearance',
    'sizes',
    'shapes',
    'count',
    'anchored',
    'composition',
    'accessibility',
  ]);
});
