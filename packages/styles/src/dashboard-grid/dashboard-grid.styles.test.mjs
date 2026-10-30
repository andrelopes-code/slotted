import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./dashboard-grid.css', import.meta.url), 'utf8');
const normalized = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

/** The declarations of the first rule whose selector starts with `selector`. */
function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

const body = '[data-ui-dashboard-grid] [data-part-widget]>[data-ui-card]>[data-part-body]';

/**
 * A body taller than its cell scrolls inside it, down to its own end padding.
 * Its content grows into a taller cell but never shrinks under its own height:
 * shrunk, a table of eight rows sat in a box of five, the body scrolled only
 * what overflowed the box, and the last row and the padding under it stayed
 * out of reach.
 */
test('lets the body scroll its content whole: the content grows and never shrinks', () => {
  assert.match(rule(body), /overflow:auto/);
  const content = rule(`${body}>:not([data-part-busy-indicator])`);
  assert.match(content, /flex:1 0 auto/, 'the body content may still shrink under its own height');
  assert.doesNotMatch(content, /min-block-size:0/);
});

/**
 * A widget's cell is written on the widget and read only there. Inherited, a
 * new cell restyled everything inside the widget: a preview that moved six
 * widgets cost 4.3 ms a widget where a registered, non-inherited property cost
 * 0.9. The universal syntax keeps the fallback of a widget no script placed.
 */
test('registers the cell of a widget as a property its content does not inherit', () => {
  /* `@property` is a registration, not a rule a cascade layer holds. */
  const depth = (at) =>
    [...normalized.slice(0, at)].reduce((open, c) => open + (c === '{') - (c === '}'), 0);
  for (const name of ['--_dg-x', '--_dg-y', '--_dg-w', '--_dg-h', '--_dg-span-medium']) {
    const at = normalized.indexOf(`@property ${name}{`);
    assert.notEqual(at, -1, `${name} is not registered`);
    assert.equal(depth(at), 0, `${name} sits in a layer`);
    const declarations = normalized.slice(at).split('}')[0];
    assert.match(declarations, /syntax:'\*'/);
    assert.match(declarations, /inherits:false/);
    assert.doesNotMatch(declarations, /initial-value/);
  }
});

/**
 * A browser invalidates by attribute name: `[data-gesture]` on the root ahead
 * of `> [data-part-grid]` restyled every element under the root that has a
 * `data-part` — 722 of them, 114 ms, as a widget was picked up and again as it
 * was dropped. On the grid, in the compound that the rule styles, it
 * restyles the grid alone.
 */
test('brings the lattice forward from the grid itself, never from an ancestor', () => {
  assert.match(
    normalized,
    /\[data-ui-dashboard-grid\]>\[data-part-grid\]\[data-gesture\]::before\{/,
  );
  for (const selector of normalized.match(/[^{}]*\[data-gesture\][^{}]*\{/g) ?? []) {
    assert.match(
      selector,
      /\[data-gesture\](::before)?\{$/,
      `data-gesture is read above its subject in ${selector}`,
    );
  }
});

/**
 * A row's step is drawn in sub-rows with no gap between them, and each widget
 * draws the gap below itself; the number of sub-rows is the one the core
 * lays the picture out in. A widget sized by its content does not grow what
 * its body holds, so the measure reads the content and not the cell.
 */
test('draws rows in the sub-rows the core lays out, with the gap inside each cell', () => {
  const core = readFileSync(
    new URL('../../../core/src/dashboard-grid/dashboard-grid.ts', import.meta.url),
    'utf8',
  );
  const subrows = core.match(/DASHBOARD_SUBROWS = (\d+);/)?.[1];
  const grid = rule('[data-ui-dashboard-grid]>[data-part-grid]');
  assert.ok(grid.includes(`grid-auto-rows:calc((var(--_row) + var(--_gap)) / ${subrows})`));
  assert.ok(grid.includes('row-gap:0'));
  assert.ok(grid.includes('margin-block-end:calc(-1 * var(--_gap))'));
  assert.ok(
    rule('[data-ui-dashboard-grid]:is([data-part-widget],[data-part-placeholder])').includes(
      'margin-block-end:var(--_gap)',
    ),
  );
  assert.ok(
    rule(
      "[data-ui-dashboard-grid] [data-part-widget][data-rows='auto']>[data-ui-card]>[data-part-body]>:not([data-part-busy-indicator])",
    ).includes('flex-grow:0'),
  );
});
