import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'kbd');
  assert.equal(contract.ui, 'kbd');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The HTML Standard already answers what a combination is made of: "nesting a
 * `kbd` element within another `kbd` element represents an actual key or other
 * unit of input as a portion of a larger input". So a shortcut is not a second
 * family and not a wrapper `div` — shadcn's `KbdGroup` is one — it is the part
 * that contains this family's own roots, which is the shape `badge` proved
 * with `anchor`.
 */
test('is one key, whose combination is the part that contains it', () => {
  assert.deepEqual(Object.keys(contract.members), ['kbd']);
  assert.deepEqual(contract.members.kbd.parts, ['root', 'legend', 'name', 'shortcut', 'separator']);
  assert.equal(contract.members.kbd.nativeElement, 'kbd');
});

/**
 * ARIA in HTML (W3C REC, 11 August 2026) maps `kbd` to no corresponding role
 * and declares it Naming Prohibited, so `aria-label` is not available and every
 * word a reader hears has to be content. `legend` is what the eye sees and
 * `name` is what the ear gets: `⌘` is announced "Command" rather than "place of
 * interest sign", and `Ctrl` is announced "Control" rather than whatever the
 * reader's pronunciation dictionary holds. HeroUI is the only surveyed
 * implementation that supplies the word at all, and it uses `title`.
 */
test('separates what is seen from what is spoken', () => {
  assert.ok(contract.members.kbd.parts.includes('legend'));
  assert.ok(contract.members.kbd.parts.includes('name'));
});

/**
 * The one part between two keys, and it is one part rather than two because
 * both answers are the same slot: `+` between simultaneous keys, the word
 * `then` between two steps of a sequence. macOS joins with neither, so on that
 * platform the part is not rendered at all rather than rendered empty. `then`
 * is a word of the shared keys catalog, not a default an instance sets.
 */
test('reserves the slot between two keys, and the two words that fill it', () => {
  assert.ok(contract.members.kbd.parts.includes('separator'));
  assert.equal(contract.members.kbd.defaults.separator, '+');
  assert.equal('thenLabel' in contract.members.kbd.defaults, false);
});

/**
 * `platform` is an input rather than a detection the component performs alone,
 * because a server that knows its audience has to be able to say so. Nuxt's
 * `useKbd` resolves in `onMounted`, so a server-rendered `Ctrl` becomes `⌘`
 * under the reader after hydration; naming the axis is what removes the flash.
 */
test('lets the platform be stated, and detects it only when it is not', () => {
  assert.deepEqual(contract.axes.platform, ['auto', 'mac', 'windows', 'linux', 'other']);
  assert.equal(contract.members.kbd.defaults.platform, 'auto');
});

/**
 * Chakra's default and Radix's default, and the only value that looks like a
 * key. `soft` is the library's own word for a tinted ground, owned by `badge`;
 * `plain` is the form a menu row wants, where a column of boxes is noise.
 */
test('paints a key that looks like a key by default', () => {
  assert.deepEqual(contract.axes.variant, ['raised', 'outline', 'soft', 'plain']);
  assert.equal(contract.members.kbd.defaults.variant, 'raised');
});

/**
 * Four absolute steps — `xs` for a caption or a tooltip — whose legend reads
 * the control type scale, so a key's type shrinks with density beside the
 * controls it sits with, and a fifth that reads the text around it instead. Every surveyed size axis is absolute, which makes a key
 * inside an `h2` a stamp and one in fine print a slab. `inherit` is the value
 * prose should use, and it is the gap none of the twelve fills.
 */
test('scales with the controls beside it, or with the text around it', () => {
  assert.deepEqual(contract.axes.size, ['xs', 'sm', 'md', 'lg', 'inherit']);
  assert.equal(contract.members.kbd.defaults.size, 'md');
});

/**
 * A key cap depicts a physical object, so its colour belongs to the keyboard
 * rather than to the message. Chakra and Nuxt both spend an axis on it; where
 * a shortcut carries a tone here it is the row that carries it, and `alert`,
 * `inline-message` and `tag` own that.
 */
test('takes no tone, because a key has no opinion', () => {
  assert.ok(!('tone' in contract.axes));
  assert.deepEqual(Object.keys(contract.axes), ['size', 'variant', 'platform']);
});

/**
 * Presentational only. A menu item that is unavailable dims its label by
 * inheritance, and a painted cap inside it would keep its ground and stay
 * bright. The item owns the semantics: `kbd` may not carry `aria-disabled`,
 * because ARIA in HTML allows it only the global attributes and that is not one.
 */
test('dims with the row it sits in, and claims none of that row’s semantics', () => {
  assert.deepEqual(contract.members.kbd.states, ['default', 'disabled']);
  assert.equal(contract.stateAttributes.disabled, 'data-disabled');
  assert.equal(contract.members.kbd.defaults.disabled, false);
});

/**
 * Every value a key shows is one the consumer owns, and the family registers
 * no shortcut — the guide states it and all twelve surveyed implementations
 * agree. There is nothing to hold controlled or uncontrolled, and no request to
 * carry a reason.
 */
test('holds no state of its own, and therefore declares no state model', () => {
  assert.deepEqual(contract.members.kbd.capabilities, ['appearance', 'size', 'disabled']);
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(
      !contract.members.kbd.capabilities.includes(capability),
      `kbd claims the mutable capability ${capability}`,
    );
  }
  assert.ok(!('stateModel' in contract));
});

test('names one reference page, covering the platform and the sequence', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['kbd']);
  assert.deepEqual(contract.scenarios.kbd, [
    'playground',
    'variants',
    'sizes',
    'shortcut',
    'platform',
    'sequence',
    'context',
    'states',
    'content',
    'composition',
    'accessibility',
  ]);
});
