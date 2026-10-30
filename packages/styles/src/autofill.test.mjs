import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (family) =>
  readFileSync(new URL(`./${family}/${family}.css`, import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ');

const body = (css, selector) => {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `no rule ${selector}`);
  return css.slice(start, css.indexOf('}', start));
};

/**
 * An autofilled value changes the whole control or none of it. Painted as an
 * inset shadow on the input alone, the tint covered the frame's border where
 * the input overlaps it and left the frame's padding, its slots and its
 * buttons bare. The frame takes the tint; the input repaints the browser's
 * ground in the same color and stops at the border.
 */
const FRAMES = {
  'text-field': ['[data-ui-text-field][data-part-root]:has(> [data-part-input]:autofill)', true],
  combobox: ['[data-ui-combobox][data-part-root]:has(> [data-part-input]:autofill)', true],
  'entity-picker': [
    '[data-ui-entity-picker] > [data-part-control]:has([data-part-input]:autofill)',
    true,
  ],
  'multi-select': ['[data-ui-multi-select][data-part-root]:has([data-part-input]:autofill)', false],
  'tags-input': ['[data-ui-tags-input][data-part-root]:has([data-part-input]:autofill)', false],
};

for (const [family, [frame, overlaps]] of Object.entries(FRAMES)) {
  test(`${family} tints the frame of an autofilled value, not the input alone`, () => {
    const css = read(family);
    const token = `--slotted-${family}-autofill-background`;
    assert.match(body(css, frame), new RegExp(`background-color: var\\( ?${token}`));
    const input = css.match(/([^{}]*\[data-part-input\]:autofill) \{([^}]*)\}/);
    assert.ok(input, `${family} has no rule for the autofilled input`);
    assert.match(input[2], new RegExp(`box-shadow: inset 0 0 0 100px var\\(${token}`));
    if (overlaps) {
      assert.match(input[2], /clip-path: inset\(var\(--slotted-control-border-width, 1px\) 0\)/);
    }
  });
}

/** The OTP input lies over the boxes: its ground is held back and the boxes take the tint. */
test('otp-input tints the boxes of an autofilled code and keeps them visible', () => {
  const css = read('otp-input');
  const input = body(css, '[data-ui-otp-input] > [data-part-input]:autofill');
  assert.doesNotMatch(input, /box-shadow/);
  assert.match(input, /transition: background-color 0s 600000s/);
  assert.match(
    body(
      css,
      '[data-ui-otp-input][data-part-root]:has(> [data-part-input]:autofill) [data-part-slot]',
    ),
    /background-color: var\( ?--slotted-otp-input-autofill-background/,
  );
});
