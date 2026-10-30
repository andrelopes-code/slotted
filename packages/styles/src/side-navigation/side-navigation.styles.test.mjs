import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./side-navigation.css', import.meta.url), 'utf8');
const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/side-navigation/contract.json', import.meta.url),
    'utf8',
  ),
);

/** The rules inside the one container query, as `selector { body }` pairs. */
function compactRules() {
  const at = css.indexOf('@container slotted-side-navigation');
  assert.notEqual(at, -1, 'the family answers no width at all');
  const open = css.indexOf('{', at);
  let depth = 1;
  let end = open + 1;
  for (; end < css.length && depth > 0; end += 1) {
    if (css[end] === '{') depth += 1;
    else if (css[end] === '}') depth -= 1;
  }
  const block = css.slice(open + 1, end - 1).replace(/\/\*[\s\S]*?\*\//g, '');
  return [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selector: selector.replace(/\s+/g, ' ').trim(),
    body,
  }));
}

/**
 * The breakpoint is a literal because `@container (inline-size < var(--x))` is
 * invalid CSS, and the same number has to reach script: the stylesheet decides
 * what a row shows and the script decides whether the tooltip and the flyout
 * are in play. Two literals is how the two drift apart.
 */
test('reads the same breakpoint the contract states, and no other', () => {
  const conditions = [...css.matchAll(/@container\s+slotted-side-navigation\s+\(([^)]*)\)/g)].map(
    ([, condition]) => condition.trim(),
  );

  assert.deepEqual(conditions, [`inline-size < ${contract.compactAt}px`]);
  assert.match(css, /container-name: slotted-side-navigation;/);
  assert.match(css, /container-type: inline-size;/);
});

/**
 * A container's own query cannot select it, so the rules are written once
 * under the query for `mode="auto"` and once for `mode="compact"`. This is
 * what keeps the two copies the same: every rule under the query has a twin
 * outside it with the mode swapped, and the same body.
 */
test('states the forced compact mode with the same rules the width states', () => {
  const rules = compactRules();
  assert.ok(rules.length >= 8, 'the compact block is empty');
  const outside = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  for (const { selector, body } of rules) {
    assert.match(selector, /\[data-mode='auto'\]/, `${selector} is not scoped to auto`);
    const twin = selector.replaceAll("[data-mode='auto']", "[data-mode='compact']");
    const at = outside.indexOf(`${twin} {`);
    assert.notEqual(at, -1, `${twin} has no rule outside the query`);
    const twinBody = outside.slice(outside.indexOf('{', at) + 1, outside.indexOf('}', at));
    assert.equal(
      twinBody.replace(/\s+/g, ' ').trim(),
      body.replace(/\s+/g, ' ').trim(),
      `${twin} disagrees with its twin under the query`,
    );
  }
});

/**
 * The label leaves the eye and not the DOM: a link whose label were
 * `display: none` would have no accessible name, and the contract promises the
 * tooltip repeats what the label says.
 */
test('clips the label in compact mode rather than removing it', () => {
  const label = compactRules().find(({ selector }) => selector.includes('[data-part-label]'));
  assert.ok(label, 'no compact rule for the label');
  assert.match(label.body, /clip-path: inset\(50%\)/);
  assert.doesNotMatch(label.body, /display: none/);
  for (const part of contract.compact.hides) {
    assert.ok(
      compactRules().some(({ selector }) => selector.includes(`[data-part-${part.toLowerCase()}]`)),
      `${part} is not hidden in compact mode`,
    );
  }
});

/**
 * The group opens on a track that transitions between `0fr` and `1fr`, so its
 * height is its content's at every frame and nothing is measured; a closed
 * group is `visibility: hidden` so its links leave the tab sequence.
 */
test('opens a group without measuring it, and hides a closed one from Tab', () => {
  assert.match(css, /grid-template-rows: auto 0fr;/);
  assert.match(css, /\[data-expanded\] \{\s*grid-template-rows: auto 1fr;/);
  assert.match(css, /> \[data-part-group\] \{[^}]*visibility: hidden;/);
  assert.match(css, /\[data-expanded\] > \[data-part-group\] \{[^}]*visibility: visible;/);
});

/** R1, in this family's own words: the ground says current, no band does. */
test('says current with the ground and paints no bar', () => {
  assert.match(css, /\[data-part-link\]\[data-current\][^{]*\{[^}]*--_current-background/);
  assert.doesNotMatch(css, /data-marker/);
});

/**
 * The edge round the current row is the foundation's, not a border step of the
 * family's own: `--slotted-current-edge` is transparent where the tone ground
 * says the state and black in `high-contrast`, where the ground is white. A
 * grey line round a tinted row is what the first demo capture showed.
 */
test('draws the current edge from the foundation token, and no border step', () => {
  assert.match(
    css,
    /--_current-edge:\s*var\(\s*--slotted-side-navigation-current-edge,\s*var\(--slotted-current-edge,\s*transparent\)\s*\)/,
  );
  assert.doesNotMatch(css, /--_current-edge:[^;]*--slotted-border-subtle/);
});

/**
 * The flyout stands outside the root, in the portal container, and the row
 * geometry has to reach it: it is stated on `[data-ui]` and not on the root
 * part, so a group moved into the layer keeps the row it had in the column.
 */
test('gives the flyout the row geometry the column has', () => {
  const at = css.indexOf('[data-ui-side-navigation] {');
  assert.notEqual(at, -1, 'the geometry is stated on the root part alone');
  assert.match(css, /\[data-ui-side-navigation\]\[data-part-flyout\] \{/);
  assert.match(css, /\[data-part-flyout\] > \[data-part-group\] \{/);
});

/**
 * The six numbers app-shell publishes, each read with the family's own
 * fallback so a column outside the shell measures the same.
 */
test('reads every row property app-shell publishes', () => {
  for (const property of contract.reads) {
    assert.match(css, new RegExp(`var\\(${property},`), `${property} is not read`);
  }
});

test('hands its glyph size to whatever the icon slot holds', () => {
  // A bare svg is held to the icon size by the child rule. A glyph host such
  // as `ng-icon` sizes itself at `1em`, and an icon box reads
  // `--slotted-icon-size`: the slot declares both, so nothing placed in it is
  // drawn at the row's font-size.
  const rule = css.match(/\[data-ui-side-navigation\] \[data-part-icon\] \{([^}]*)\}/)?.[1] ?? '';
  assert.match(rule, /--slotted-icon-size: var\(--_icon-size\)/);
  assert.match(rule, /font-size: var\(--_icon-size\)/);
});

/**
 * A chip with a radius drawn against the edge of its region loses a corner to
 * it. The shell's flush plane puts the region on the window's edge, so the row
 * stood on it too — zero pixels, measured, against twelve on the inset plane.
 * The standoff is taken out of the row's inset and never added to it: the mark
 * has to stay on the left edge the shell's own controls stand on.
 */
test('stands a row off the column edge without moving its mark', () => {
  const row = css
    .slice(css.indexOf('[data-ui-side-navigation] :is([data-part-link], [data-part-trigger]) {'))
    .slice(0, 900);
  assert.match(row, /margin-inline:\s*calc\(var\(--_standoff\) - var\(--_ring-inset\)\)/);
  assert.match(
    row,
    /padding-inline:\s*calc\(var\(--_inset\) - var\(--_standoff\) \+ var\(--_ring-inset\)\)/,
  );
  assert.match(css, /--_ring-inset:\s*var\(--slotted-app-shell-row-ring-inset, 0px\)/);
  assert.match(css, /--_standoff:\s*min\(var\(--slotted-space-2[^)]*\)[^;]*var\(--_inset\)\)/);
});
