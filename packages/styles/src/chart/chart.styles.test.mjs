import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/chart/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./chart.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
/**
 * Whitespace is collapsed rather than removed: a descendant selector and a
 * multi-word value both lose their meaning when every space goes. Parentheses
 * are collapsed too, because the formatter breaks a long value across lines
 * and leaves `var( --token`, which no assertion here spells.
 */
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;

/** The declarations of the first rule whose selector starts with `selector`. */
function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

/** Every rule whose selector names `plot` and one of the two messages. */
function messagePlots() {
  return [...normalized.matchAll(/(?<=^|[{};])([^{};@]+)\{([^{}]*)\}/g)]
    .map(([, selector, body]) => ({ selector, body }))
    .filter(
      ({ selector }) =>
        selector.includes('[data-part-plot]') && /\[data-part-(empty|error)\]/.test(selector),
    );
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}{`), 'the family has no base rule keyed on data-ui');
});

/**
 * The empty and the failed plot keep the drawing's box (`heightStable`) and
 * paint one line in it: the baseline, at the foot of the box, below the
 * message. The message is centred over the plot on no surface of its own, so
 * a band every quarter of the height crossed the empty title and ran between
 * the failed title and its retry.
 */
test('paints no grid behind an empty or failed plot, only its baseline, and keeps the plot’s box', () => {
  const plots = messagePlots();
  assert.equal(plots.length, 1, 'one rule paints the plot that holds a message');
  const [{ selector, body }] = plots;
  assert.doesNotMatch(body, /repeating-linear-gradient/, `${selector} paints gridlines`);
  assert.match(
    body,
    /background:linear-gradient\(var\(--_chart-grid\),var\(--_chart-grid\)\) 0 100% \/ 100% 1px no-repeat content-box;/,
    'the baseline is not the one layer painted',
  );
  assert.match(rule(`${ui} [data-part-plot]`), /min-block-size:var\(--_plot-size\)/);
  const message = rule(`${ui}:is([data-part-empty],[data-part-error])`);
  assert.match(message, /inset:0/);
  assert.match(message, /position:absolute/);
});

/**
 * A click on a non-interactive descendant focuses the region, and the next
 * Shift makes it match `:focus-visible`; the ring follows the origin the
 * binding writes (`createFocusOrigin`), not the browser heuristic.
 */
test('draws the table region ring for a focus from the keyboard only', () => {
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)].map((m) =>
    m[1].replace(/\s+/g, ' ').trim(),
  );
  const ring = rules.filter(
    (selector) =>
      selector.includes('[data-part-table-region]') && selector.includes(':focus-visible'),
  );
  assert.ok(ring.length > 0, 'the region has a ring');
  for (const selector of ring) {
    assert.match(selector, /:focus-visible\[data-focus-origin='keyboard'\]/, selector);
  }
  const flat = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  assert.ok(
    flat.includes('[data-part-table-region]:focus { outline: none; }'),
    'the browser’s own ring is suppressed for a focus from the pointer',
  );
});

/** The tooltip, the menu and the help float over the plot; a material theme blurs it through one token. */
test('filters the overlays’ backdrop from one token, except under reduced transparency', () => {
  const overlays = `${ui}:is([data-part-menu],[data-part-help-content],[data-part-tooltip])`;
  assert.match(
    rule(overlays),
    /backdrop-filter:var\(--slotted-chart-overlay-backdrop-filter,none\)/,
  );
  assert.ok(
    normalized.includes(
      `@media (prefers-reduced-transparency:reduce),(forced-colors:active){${overlays}{-webkit-backdrop-filter:none;backdrop-filter:none;}}`,
    ),
  );
});
