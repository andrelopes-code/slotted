import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./tags-input.css', import.meta.url), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/**
 * The chips are `tag`'s, worn as `data-ui` beside the row this family owns,
 * and this sheet lays them out and paints none of them — the rule
 * `chip-preview.test.mjs` holds for `select` and `multi-select`, restated here
 * because that file's other rules assume a popup this family does not have.
 *
 * What the family needs from a chip it asks for through the two tokens
 * `tag.css` reads — `--slotted-tag-inset-block` for a frame shorter than the
 * chip at `dense`, `--slotted-tag-border-color` for the chip that answered a
 * duplicate — and never by naming the tag's identifier or its private hooks.
 */
test('lays the chips out and paints none of them', () => {
  assert.doesNotMatch(css, /\[data-ui-tag\]/, 'reaches into the tag sheet');
  assert.doesNotMatch(css, /--_inset-block|--_border\b|--_surface|--_text\b/, 'writes a tag hook');
  assert.match(css, /--slotted-control-inner-size:\s*var\(--_inner-size\)/);
  assert.match(css, /--slotted-tag-border-color:/);
});

/**
 * A control holding one row of chips is the height of an empty one beside it
 * at every density, and the chip never touches the frame: a row is the
 * foundation's inner size for the control's step, which is the frame less two
 * steps of air, and the chip takes that height through the property the row
 * writes.
 */
test('sizes a row of chips to the inner size of the control at every density', () => {
  assert.match(css, /--_row-air:\s*var\(--slotted-space-1/);
  assert.match(css, /--_inner-size:\s*var\(--slotted-control-inner-size-md/);
  assert.match(css, /--_inner-size:\s*var\(--slotted-control-inner-size-sm/);
  assert.match(css, /--_inner-size:\s*var\(--slotted-control-inner-size-lg/);
  assert.match(css, /--_row-size:\s*var\(--_inner-size\)/);
  assert.doesNotMatch(css, /--_row-size:\s*var\(--slotted-target-min/);
});
