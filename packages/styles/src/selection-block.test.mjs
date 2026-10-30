import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * LB2 (MAOC): adjacent selected options are one block, not a stack of pills.
 *
 * Every option carries its own radius, so two chosen neighbours painted with
 * the same ground met at a waist — four rounded corners inside the block —
 * and a multiple listbox read as a column of separate chips rather than as a
 * selection. The block keeps its radius only at its two ends: the second of
 * two selected siblings gives up its top corners, and the first gives up its
 * bottom corners through `:has(+ …)`. The same ground is drawn by `select`
 * and `combobox` in their own sheets, so all three are held to it here.
 */
const FAMILIES = [
  { family: 'listbox', part: 'option' },
  { family: 'select', part: 'item' },
  { family: 'combobox', part: 'item' },
  { family: 'multi-select', part: 'item' },
  { family: 'entity-picker', part: 'item' },
];

function stylesheet(family) {
  return readFileSync(join(source, family, `${family}.css`), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
}

function rule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  return match ? match[1] : undefined;
}

for (const { family, part } of FAMILIES) {
  test(`${family}: two selected ${part}s in a row share one ground`, () => {
    const css = stylesheet(family);
    const second = rule(
      css,
      `[data-part-${part.toLowerCase()}][data-selected] + [data-part-${part.toLowerCase()}][data-selected]`,
    );
    assert.ok(second, `${family} draws no rule for the second of two selected ${part}s`);
    assert.match(
      second,
      /border-start-start-radius:\s*0/,
      'the second gives up its top start corner',
    );
    assert.match(second, /border-start-end-radius:\s*0/, 'the second gives up its top end corner');

    const first = rule(
      css,
      `[data-part-${part.toLowerCase()}][data-selected]:has(+ [data-part-${part.toLowerCase()}][data-selected])`,
    );
    assert.ok(first, `${family} draws no rule for the first of two selected ${part}s`);
    assert.match(
      first,
      /border-end-start-radius:\s*0/,
      'the first gives up its bottom start corner',
    );
    assert.match(first, /border-end-end-radius:\s*0/, 'the first gives up its bottom end corner');
  });
}
