import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * The three binary controls a form lines up — checkbox, radio, switch — keep
 * one distance between the control and its label: the label gap the theme
 * restates per density, read by the same name at every size step (SW1). A
 * family that stated its own gap would sit a pixel off the other two in the
 * same form, which is the one thing a reader notices before anything else.
 *
 * It is the label gap and not the control gap: at `md` the control gap is 8px,
 * and 8px beside a 40px pill read as no gap at all.
 */
const FAMILIES = ['checkbox', 'radio-group', 'switch'];
const LABEL_GAP = [
  ['sm', '8px'],
  ['md', '12px'],
  ['lg', '12px'],
];

function normalized(family) {
  return readFileSync(join(source, family, `${family}.css`), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,:>])\s*/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');
}

function rules(css) {
  return css
    .split('}')
    .map((block) => block.split('{'))
    .filter(([selector, body]) => selector && body)
    .map(([selector, body]) => ({ selector: selector.trim(), body }));
}

/** The family's own name for the label gap, read from its root rule. */
function labelGapProperty(family, css) {
  const root = `[data-ui-${family.toLowerCase()}][data-part-root]`;
  const body = css.split(`${root}{`)[1]?.split('}')[0] ?? '';
  return body.match(/(--_[a-z-]+):var\(--slotted-control-label-gap-md,12px\)/)?.[1];
}

test('every selection control reads the label gap the theme restates per density', () => {
  for (const family of FAMILIES) {
    const css = normalized(family);
    const root = `[data-ui-${family.toLowerCase()}][data-part-root]`;
    const property = labelGapProperty(family, css);
    assert.ok(property, `${family} does not read the label gap at rest`);
    for (const [size, px] of LABEL_GAP) {
      assert.ok(
        css.includes(`${root}[data-size='${size}']{`) &&
          css
            .split(`${root}[data-size='${size}']{`)[1]
            .split('}')[0]
            .includes(`${property}:var(--slotted-control-label-gap-${size},${px})`),
        `${family} states its own gap at ${size}`,
      );
    }
  }
});

/**
 * Where the gap lives: on the grid, as the column gap of the element that
 * holds a label, and never as the label's own padding. A padding is laid out
 * in the label's direction, so a label in Arabic inside a row in Portuguese
 * put the gap on the far side and its text against the control. The column
 * gap opens only beside a label, so a control named by `aria-label` alone is
 * as wide as itself.
 */
test('every selection control puts that gap, and nothing else, between the control and its label', () => {
  for (const family of FAMILIES) {
    const all = rules(normalized(family));
    const label = all.find(
      ({ selector }) =>
        selector.endsWith('[data-part-label]') &&
        selector.startsWith(`[data-ui-${family.toLowerCase()}]`),
    );
    assert.ok(label, `${family} has no label rule`);
    assert.doesNotMatch(label.body, /margin-inline|column-gap|gap:/, `${family} adds to the gap`);
    assert.doesNotMatch(label.body, /padding-inline/, `${family} label pads the gap again`);
    const property = labelGapProperty(family, normalized(family));
    const grid = all.filter(({ body }) => body.includes(`column-gap:var(${property})`));
    assert.equal(grid.length, 1, `${family} states the gap on the grid ${grid.length} times`);
    assert.match(
      grid[0].selector,
      /:has\(>\[data-part-label\]\)$/,
      `${family} opens the gap when there is no label beside the control`,
    );
  }
});
