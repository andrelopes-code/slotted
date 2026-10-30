import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * A right-to-left document must work without a second stylesheet, which holds
 * only while every rule is written in logical properties. The physical form of
 * each one below has a logical counterpart that means the same thing in a
 * left-to-right document and the right thing in every other.
 */
const PHYSICAL = [
  { pattern: /(?:^|[;{}\s])(?:min-|max-)?width\s*:/, logical: 'inline-size' },
  { pattern: /(?:^|[;{}\s])(?:min-|max-)?height\s*:/, logical: 'block-size' },
  { pattern: /(?:^|[;{}\s])(?:top|right|bottom|left)\s*:/, logical: 'inset-block or inset-inline' },
  {
    pattern: /(?:^|[;{}\s])(?:margin|padding|border)-(?:top|right|bottom|left)\b/,
    logical: 'the -block- or -inline- form',
  },
  {
    pattern: /(?:^|[;{}\s])(?:float|clear)\s*:\s*(?:left|right)\b/,
    logical: 'inline-start or inline-end',
  },
];

function stylesheets() {
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(join(source, entry.name))
        .filter((name) => name.endsWith('.css'))
        .map((name) => ({
          path: join(entry.name, name),
          css: readFileSync(join(source, entry.name, name), 'utf8').replace(
            /\/\*[\s\S]*?\*\//g,
            '',
          ),
        })),
    );
}

test('finds every stylesheet in the package', () => {
  assert.ok(stylesheets().length >= 4);
});

/**
 * The one rule whose inputs are already physical.
 *
 * `packages/core/src/positioner` measures the arrow with the engine and writes
 * `--slotted-positioner-arrow-x` and `-arrow-y` as offsets from the layer's own
 * left and top, in the same physical coordinates `transform-origin` is written
 * in. `data-side` is physical for the same reason: it names the edge of the
 * anchor the layer landed on, not an edge of the reader's writing direction.
 *
 * Placing a physical number against a physical side takes a physical inset, and
 * mirroring it would move an already-correct arrow to the wrong edge in a
 * right-to-left document. Every other physical inset in the repository is still
 * refused, including one in the same stylesheet.
 *
 * `tour`'s spotlight is the second input of the same kind: the family reads the
 * target's rectangle from `getBoundingClientRect()` and writes it as
 * `--slotted-tour-target-x`, `-y`, `-width` and `-height`, which are viewport
 * pixels measured from the left and the top. A cutout that mirrored them would
 * frame the element's reflection in a right-to-left document.
 *
 * `tabs`' marker is the third: `createIndicator` writes the selected tab's
 * start as pixels from the list's left edge, so the marker is placed from
 * `left`, and the inset that differs at the closing control is swapped by hand
 * under `:dir(rtl)`.
 */
const PHYSICAL_BY_MEASUREMENT =
  /\[data-part-(?:arrow|spotlight)\]|\[data-ui-tabs\][^,]*\[data-part-marker\]/;

/**
 * Every declaration in a sheet, with the selectors it is nested inside. The
 * path rather than the innermost selector, so a rule inside `@media` or
 * `@layer` still carries the part it is about.
 */
export function declarations(css) {
  const found = [];
  const stack = [];
  let buffer = '';

  for (const character of css) {
    if (character === '{') {
      stack.push(buffer.trim());
      buffer = '';
    } else if (character === '}') {
      stack.pop();
      buffer = '';
    } else if (character === ';') {
      found.push({ declaration: buffer.trim(), path: stack.join(' ') });
      buffer = '';
    } else {
      buffer += character;
    }
  }

  return found.filter((entry) => entry.declaration.length > 0);
}

test('writes every rule in logical properties', () => {
  const violations = [];

  for (const { css, path } of stylesheets()) {
    for (const { declaration, path: selector } of declarations(css)) {
      if (PHYSICAL_BY_MEASUREMENT.test(selector)) continue;
      for (const { logical, pattern } of PHYSICAL) {
        if (pattern.test(`;${declaration}`)) {
          violations.push(`${path}: ${declaration} — use ${logical}`);
        }
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Physical properties break a right-to-left document:
  ${violations.join('\n  ')}`,
  );
});

test('keeps the arrow exemption narrow enough to still catch a mirrored rule', () => {
  const sheet = `
    [data-ui-popover] [data-part-arrow] { left: var(--slotted-positioner-arrow-x); }
    [data-ui-popover] [data-part-content] { left: 0; padding-left: 4px; }
  `;
  const offending = declarations(sheet).filter(
    ({ declaration, path }) =>
      !PHYSICAL_BY_MEASUREMENT.test(path) &&
      PHYSICAL.some(({ pattern }) => pattern.test(`;${declaration}`)),
  );

  assert.deepEqual(
    offending.map(({ declaration }) => declaration),
    ['left: 0', 'padding-left: 4px'],
  );
});
