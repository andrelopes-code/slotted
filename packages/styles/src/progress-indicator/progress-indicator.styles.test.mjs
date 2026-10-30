import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./progress-indicator.css', import.meta.url), 'utf8');
const declarations = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1');

const root = '[data-ui-progress-indicator][data-part-root]';

/** The declaration block of the rule whose selector is exactly `selector`. */
function block(selector) {
  const start = declarations.indexOf(`}${selector}{`);
  assert.notEqual(start, -1, `no rule for ${selector}`);
  const open = start + selector.length + 2;
  return declarations.slice(open, declarations.indexOf('}', open));
}

const thickness = (body) =>
  body.match(
    /--_thickness:var\(--slotted-progress-indicator-thickness,var\((--slotted-space-\d)/,
  )?.[1];

test('the bar thickness steps 4, 6 and 8 pixels: no size draws a 2-pixel hairline', () => {
  assert.equal(thickness(block(`${root}[data-size='sm']`)), '--slotted-space-2');
  assert.equal(thickness(block(`${root}[data-size='lg']`)), '--slotted-space-4');
  const base = declarations.match(
    /\[data-ui-progress-indicator\]\[data-part-root\]\{([^}]*--_thickness[^}]*)\}/,
  );
  assert.ok(base, 'no base rule declares --_thickness');
  assert.equal(thickness(base[1]), '--slotted-space-3');
  assert.doesNotMatch(declarations, /--_thickness:[^;]*--slotted-space-1\b/);
});
