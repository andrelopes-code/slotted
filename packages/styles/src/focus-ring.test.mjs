import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * R3: the focus ring is drawn in `--slotted-focus-ring-color` in every scheme,
 * or in `--slotted-focus-ring-color-invalid` on a control that is invalid.
 *
 * A ring in another color was measured once, on a `Button` in the `dark`
 * scheme: `#d4d4d8` where the theme says `#60a5fa`. That one came from a
 * stylesheet outside this package, and this test is what would have caught the
 * same color written inside it — a `solid` alert and toast did draw the ring
 * in their own ink, for contrast against the fill, and now keep the theme's
 * ring with a halo inside it instead.
 *
 * A `forced-colors` block is exempt: there the user agent owns every color,
 * the theme resolves the token to `Highlight`, and an outline standing in for
 * a border (`ButtonBorder` on a track) is not a focus ring.
 */
const RING = /var\(\s*--slotted-focus-ring-color(?:-invalid)?\s*[,)]/;

function stylesheets() {
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(join(source, entry.name))
        .filter((name) => name.endsWith('.css'))
        .map((name) => ({
          path: join(entry.name, name),
          css: readFileSync(join(source, entry.name, name), 'utf8'),
        })),
    );
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Removes every `@media (forced-colors: active) { … }` block, matching braces
 * so nested rules go with it.
 */
function withoutForcedColors(css) {
  let out = '';
  let index = 0;
  const marker = /@media\s*\(forced-colors:\s*active\)\s*\{/g;
  for (let match = marker.exec(css); match; match = marker.exec(css)) {
    out += css.slice(index, match.index);
    let depth = 1;
    let end = match.index + match[0].length;
    for (; end < css.length && depth > 0; end += 1) {
      if (css[end] === '{') depth += 1;
      else if (css[end] === '}') depth -= 1;
    }
    index = end;
    marker.lastIndex = end;
  }
  return out + css.slice(index);
}

function outlineColors(css) {
  const declarations = [];
  const pattern = /(?:^|[;{\s])(outline(?:-color)?)\s*:\s*([^;}]+)/g;
  for (let match = pattern.exec(css); match; match = pattern.exec(css)) {
    const [, property, raw] = match;
    const value = raw.replace(/\s+/g, ' ').trim();
    if (property === 'outline' && /^(none|0)$/.test(value)) continue;
    declarations.push(`${property}: ${value}`);
  }
  return declarations;
}

test('every focus ring is drawn in the theme’s ring color', () => {
  const offenders = [];
  for (const { path, css } of stylesheets()) {
    const body = withoutForcedColors(stripComments(css));
    for (const declaration of outlineColors(body)) {
      if (!RING.test(declaration)) offenders.push(`${path}: ${declaration}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `An outline that is not the theme's ring (R3):\n  ${offenders.join('\n  ')}`,
  );
});

test('finds the rings it guards', () => {
  const rings = stylesheets().flatMap(({ css }) =>
    outlineColors(withoutForcedColors(stripComments(css))),
  );
  assert.ok(rings.length >= 40, `Expected the families' rings, found ${rings.length}`);
});

/**
 * A family that draws its ring somewhere other than the element holding focus
 * has to suppress the ring on the element holding focus.
 *
 * The user agent draws one there whether or not the family wants it — Chrome's
 * is a white line inside a dark one — so a family that moves the ring and
 * forgets this paints two at once, in two different colors, one of them not
 * the theme's. `checkbox`, `switch` and `radio-group` each move the ring off
 * the native control and each suppress it; `tree` moved it off the `treeitem`
 * and did not, and a focused branch drew the browser's ring around its whole
 * subtree with the family's inside it around the row.
 *
 * `forced-colors` is exempt for the reason it is above: there the user agent
 * owns every color and an outline is what survives.
 */
test('a family that moves its ring suppresses the one the browser would draw', () => {
  const offenders = [];
  for (const { path, css } of stylesheets()) {
    const flat = withoutForcedColors(stripComments(css)).replace(/\s+/g, ' ');
    /* A selector whose `:focus-visible` is not on its last compound: the ring
       lands on a descendant of the focused element rather than on it. */
    const moved = /([^{}]*?:focus-visible[^{},]*?)\s+([^{},]+?)\s*\{([^{}]*?)\}/g;
    for (const [, focused, , body] of flat.matchAll(moved)) {
      if (!/outline\s*:\s*(?!none|0)/.test(body)) continue;
      /* `:has(> [data-part-control]:focus-visible)` leaves a closing paren on
         the compound, and `[data-focus-origin]` narrows the focus without
         naming another element; the element is the same one either way. */
      const holder = (focused.trim().split(' ').pop() ?? '')
        .replace(':focus-visible', '')
        .replace("[data-focus-origin='keyboard']", '')
        .replace(/\)+$/, '');
      if (!holder.startsWith('[')) continue;
      const escaped = holder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const suppressed = new RegExp(`${escaped}[^{,]*\\{[^}]*outline: ?none`).test(flat);
      if (!suppressed)
        offenders.push(`${path}: ${holder} holds focus and draws no ring of its own`);
    }
  }
  assert.deepEqual(
    [...new Set(offenders)],
    [],
    `A focused element the browser will ring as well:\n  ${offenders.join('\n  ')}`,
  );
});

/**
 * A chip inside a control's chip row draws its ring inside its own box.
 *
 * The row scrolls (`overflow-y: auto`) or clips (`overflow: hidden` under
 * `overflow='collapse'`), and either way it cuts at its padding edge, two
 * pixels past the chip. A ring at the theme's offset reaches four pixels past
 * the chip, and its outer two were cut on every side in every density. The
 * ring is drawn one width inside the chip instead — the same answer `listbox`
 * gives an option inside a scrolling list — so the whole of it is visible
 * whatever the density, and the frame keeps its lift as the second signal.
 */
test('a chip in a scrolling chip row draws its ring inside its own box', () => {
  const inset = /outline-offset:\s*calc\(\s*-1\s*\*\s*var\(--slotted-focus-ring-width, 2px\)\s*\)/;
  const offenders = [];
  for (const family of ['tags-input', 'multi-select']) {
    const css = withoutForcedColors(
      stripComments(readFileSync(join(source, family, `${family}.css`), 'utf8')),
    ).replace(/\s+/g, ' ');
    const rule = new RegExp(
      `\\[data-ui-${family}\\] \\[data-part-chips\\] > :not\\(\\[data-part-field\\]\\):focus-visible \\{([^}]*)\\}`,
    ).exec(css);
    if (!rule) {
      offenders.push(`${family}: no ring rule for a focused chip`);
      continue;
    }
    if (!inset.test(rule[1])) offenders.push(`${family}: ${rule[1].trim()}`);
  }
  assert.deepEqual(offenders, [], `A chip ring the row would cut:\n  ${offenders.join('\n  ')}`);
});
