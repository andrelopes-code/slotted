import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES, TONES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'avatar');
  assert.equal(contract.ui, 'avatar');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One member, three parts. Radix, Base UI, Ark and Chakra all publish the same
 * three and nothing else; Fluent adds `initials`, `icon` and `badge` as
 * separate slots, which is three names for one box and one family — the corner
 * mark — that already exists here.
 */
test('is one avatar: a box, the picture, and what stands in for it', () => {
  assert.deepEqual(Object.keys(contract.members), ['avatar']);
  assert.deepEqual(contract.members.avatar.parts, ['root', 'image', 'fallback']);
});

/** Phrasing content: an avatar has to be legal inside a cell, a heading or a label. */
test('renders the element that claims nothing and fits anywhere text fits', () => {
  assert.equal(contract.members.avatar.nativeElement, 'span');
});

/**
 * The order every surveyed implementation agrees on, written down because it is
 * the family's whole behaviour. The last step is a glyph the family owns, so a
 * failed request never paints the browser's torn-page mark.
 */
test('declares the order it falls back in, ending in artwork rather than in a broken image', () => {
  assert.deepEqual(contract.fallbackOrder, ['image', 'initials', 'glyph']);
});

/**
 * Four values, not a boolean. The family this replaces held `data-loaded`, and
 * a boolean cannot say whether the picture failed, is still coming, or was
 * never asked for — which is the same lesson `state-and-events.md` records
 * about a change carrying its reason.
 */
test('reports the picture with the four statuses the headless libraries agree on', () => {
  assert.deepEqual(contract.axes.status, ['idle', 'loading', 'loaded', 'error']);
  assert.ok(contract.members.avatar.capabilities.includes('status'));
  assert.ok(!('loaded' in (contract.stateAttributes ?? {})), 'data-loaded is the boolean retired');
});

/**
 * Five steps, and every one of them answers density, which is why the scale is
 * in the theme rather than in this stylesheet. `--slotted-control-height-lg` is
 * 38 pixels and a profile page needs two thirds more than that.
 */
test('scales in five steps and starts in the middle', () => {
  assert.deepEqual(contract.axes.size, ['xs', 'sm', 'md', 'lg', 'xl']);
  assert.equal(contract.members.avatar.defaults.size, 'md');
});

/**
 * Primer's rule, adopted with its meaning: a circle is a person and a square is
 * a team, an organisation or a bot. Atlassian ships a hexagon too, which is its
 * own product mark rather than a family capability.
 */
test('draws itself round for a person and square for everything else', () => {
  assert.deepEqual(contract.axes.shape, ['circle', 'square']);
  assert.equal(contract.members.avatar.defaults.shape, 'circle');
});

/**
 * `auto` is the default because a list of twenty grey circles is a list nobody
 * scans. The palette is the library's five tones rather than a colour list:
 * `docs/product/prd.md` 2.4 refuses an arbitrary colour in the contract, and the
 * five are the only colours whose text-on-surface ratio the theme already
 * holds.
 */
test('colours itself from the name, out of the palette the library already speaks', () => {
  assert.deepEqual(contract.axes.tone, ['auto', ...TONES]);
  assert.equal(contract.members.avatar.defaults.tone, 'auto');
  /* `info` is a tone a reader picks, not one a name is hashed to: its default
     seed is a blue beside the accent's, and two blues in a palette of six
     collide twice as often as any other pair. */
  assert.deepEqual(
    contract.autoTonePalette,
    TONES.filter((tone) => tone !== 'info'),
  );
});

/**
 * Two paintings, not three. An outlined avatar is a ring around nothing: every
 * surveyed implementation fills the fallback, and the tinted one is the default
 * for the same reason it is in `badge` — a page of solid discs reads as a page
 * of controls.
 */
test('paints the fallback tinted by default, and filled on request', () => {
  assert.deepEqual(contract.axes.variant, ['soft', 'solid']);
  assert.equal(contract.members.avatar.defaults.variant, 'soft');
  assert.ok(!contract.axes.variant.includes('outline'));
});

/**
 * An avatar is not a command, and paints neither press nor a resting hover. It
 * paints hover and focus anyway because `render` can make the root an `<a>` or
 * a `<button>`, and a ring that appears only where a family expects focus is a
 * ring that goes missing.
 */
test('paints hover, focus and disabled, and never paints press', () => {
  assert.deepEqual(contract.members.avatar.states, [
    'default',
    'hover',
    'focus-visible',
    'disabled',
  ]);
  assert.ok(!contract.members.avatar.states.includes('active'));
  assert.deepEqual(contract.stateAttributes, { disabled: 'data-disabled' });
});

/**
 * The W3C `alt` decision tree, in the library's own vocabulary: an avatar
 * beside the name it belongs to is decoration, and announcing it repeats the
 * person. The name is still read, because it is what the initials and the tone
 * are derived from.
 */
test('can be taken out of the accessibility tree without losing its name', () => {
  assert.ok(contract.members.avatar.capabilities.includes('decorative'));
  assert.equal(contract.members.avatar.defaults.decorative, false);
});

/**
 * Every value an avatar holds is one the consumer owns, including `status`: a
 * load event is a fact rather than a request, there is nothing to cancel, and
 * the closed reason vocabulary has no member that fits. The consumer's explicit
 * status simply wins over the derived one.
 */
test('holds no state a consumer can own, and therefore declares no state model', () => {
  assert.deepEqual(contract.members.avatar.capabilities, [
    'appearance',
    'size',
    'shape',
    'status',
    'disabled',
    'decorative',
  ]);
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(
      !contract.members.avatar.capabilities.includes(capability),
      `avatar claims the mutable capability ${capability}`,
    );
  }
  assert.ok(!('stateModel' in contract));
});

test('names one reference page, covering the fallback order and the identity colour', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['avatar']);
  assert.deepEqual(contract.scenarios.avatar, [
    'playground',
    'sizes',
    'fallback',
    'identity',
    'shapes',
    'status',
    'interactive',
    'accessibility',
  ]);
});
