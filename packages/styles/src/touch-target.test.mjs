import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * On a coarse pointer the theme raises every control to the comfortable
 * target, 44 pixels, and a field's frame is that tall — border included. What
 * the reader presses inside it was not: the input filled the frame's content
 * box and stood 42 pixels, a select's trigger the same, and the clear and
 * toggle buttons inside a combobox their glyph's box, 24. Measured on a
 * phone with `tools/look.mjs` on the Nexora finance forms.
 *
 * 1. A field's input and a select's trigger span the frame's border box: a
 *    negative margin of one border width on each side, geometry-neutral at
 *    every pointer, so the control is the frame's height. The input is
 *    stretched rather than sized as a percentage, which the filter bar's
 *    search, in a frame that is not stretched, resolved to its line: 17px.
 * 2. Under a coarse pointer, an inner button keeps the box it has on a fine
 *    pointer and reaches the comfortable target by its `::after`: a
 *    transparent box centerd on the button, 44 pixels in both axes. The rule
 *    it replaces padded the button in the block axis and clipped the ground
 *    to the content box, so the ground stayed square while the border box —
 *    and the focus ring drawn on it — stood 24 wide and 44 tall. Two buttons
 *    side by side do not reach across the edge they share.
 */
function normalized(family) {
  return readFileSync(join(source, family, `${family}.css`), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,:>~+])\s*/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');
}

function body(css, selector) {
  return css.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

function coarse(css) {
  const at = css.indexOf('@media (pointer:coarse){');
  return at === -1 ? '' : css.slice(at);
}

const BORDER = 'var(--slotted-control-border-width,1px)';

for (const family of ['text-field', 'number-field', 'currency-field', 'combobox']) {
  test(`${family}: the input spans the frame's border box`, () => {
    const input = body(normalized(family), `[data-ui-${family.toLowerCase()}]>[data-part-input]`);
    assert.ok(input.includes('align-self:stretch;'), `${family} input: ${input}`);
    assert.ok(!/block-size:100%/.test(input), `${family} input keeps no percentage height`);
    assert.ok(input.includes(`margin-block:calc(${BORDER} * -1);`), `${family} input margin`);
  });
}

test("select: the trigger spans the frame's border box", () => {
  const trigger = body(normalized('select'), '[data-ui-select]>[data-part-trigger]');
  assert.ok(trigger.includes(`margin-block:calc(${BORDER} * -1);`), trigger);
  assert.ok(trigger.includes('min-block-size:var(--_height);'), trigger);
});

const INNER = [
  {
    family: 'combobox',
    selector: '[data-ui-combobox]>:is([data-part-clear],[data-part-trigger])',
  },
  { family: 'select', selector: '[data-ui-select]>[data-part-clear]' },
  {
    family: 'text-field',
    selector: '[data-ui-text-field]>:is([data-part-clear],[data-part-copy],[data-part-reveal])',
  },
];

for (const { family, selector } of INNER) {
  test(`${family}: an inner button reaches the comfortable target on a coarse pointer`, () => {
    const css = coarse(normalized(family));
    const halo = body(css, `${selector}::after`);
    assert.ok(
      halo.includes('inset:min(0px,calc((100% - var(--slotted-target-comfortable,44px)) / 2));'),
      `${family} halo: ${halo}`,
    );
    const box = body(css, selector);
    for (const growth of ['background-clip', 'padding-block', 'margin-block', 'box-sizing']) {
      assert.ok(!box.includes(`${growth}:`), `${family} box keeps its size: ${box}`);
    }
  });
}
