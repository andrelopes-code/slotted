import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

/**
 * A family draws its own icons — a close button's cross, a pager's chevrons, a
 * field's clear button, a checkbox's tick — with the `Glyph` element: a real
 * `<svg>` from `@slotted/core/glyph` inside the `icon` box, rendered by the
 * binding. It never paints one from a stylesheet: no `mask-image` of a glyph
 * token, no pseudo-element standing in for an icon, no family hook whose
 * fallback is a glyph token. One mechanism, the same in every family.
 *
 * `PENDING` lists the families that still paint a glyph token from CSS. It only
 * shrinks: a family leaves it in the change that migrates it, and a family not
 * on it — a new one included — fails here the moment it paints one.
 */
const PENDING = [];

const source = new URL('.', import.meta.url).pathname;
const root = new URL('../../../', import.meta.url).pathname;
const glyphTokens = Object.keys(
  JSON.parse(readFileSync(join(root, 'packages/themes/src/default/glyphs.json'), 'utf8')),
);
const GLYPH = new RegExp(
  `var\\(\\s*(${glyphTokens.map((token) => token.replace(/-/g, '\\-')).join('|')})\\s*[,)]`,
);
const INLINE_ARTWORK = /mask(?:-image)?\s*:[^;]*url\(/;
/**
 * A mask whose image is a public custom property is an icon slot a consumer
 * fills from CSS — `--slotted-select-item-icon: var(--slotted-icon-star)` —
 * the same painted icon with the token moved out of the stylesheet. A fade or
 * a hole is a gradient the family writes, and may read a public length or
 * color inside it; only the image itself being a property is refused.
 */
const MASK_HOOK = /mask(?:-image)?\s*:\s*var\(\s*--slotted-/;

function stylesheets() {
  return readdirSync(source)
    .filter((entry) => statSync(join(source, entry)).isDirectory())
    .map((family) => ({
      family,
      css: readdirSync(join(source, family))
        .filter((file) => file.endsWith('.css'))
        .map((file) => readFileSync(join(source, family, file), 'utf8'))
        .join('\n'),
    }));
}

test('paints no glyph from a stylesheet outside the families still migrating', () => {
  const offenders = stylesheets()
    .filter(({ family, css }) => !PENDING.includes(family) && GLYPH.test(css))
    .map(({ family }) => family);
  assert.deepEqual(
    offenders,
    [],
    'these paint a glyph token from CSS; draw the icon with the Glyph element (Icon + Glyph / span[slIcon] + svg[slGlyph]) instead',
  );
});

test('opens no icon slot a stylesheet fills', () => {
  const offenders = stylesheets()
    .filter(({ family, css }) => !PENDING.includes(family) && MASK_HOOK.test(css))
    .map(({ family }) => family);
  assert.deepEqual(
    offenders,
    [],
    'these paint a mask from a public custom property; take the icon as content (a Glyph, or the consumer’s element) instead',
  );
});

test('inlines no artwork into a mask', () => {
  const offenders = stylesheets()
    .filter(({ css }) => INLINE_ARTWORK.test(css))
    .map(({ family }) => family);
  assert.deepEqual(offenders, [], 'artwork is a Glyph element, not a url() in a mask');
});

test('lists only families that still paint one, so the list shrinks', () => {
  const painting = new Set(
    stylesheets()
      .filter(({ css }) => GLYPH.test(css) || MASK_HOOK.test(css))
      .map(({ family }) => family),
  );
  const migrated = PENDING.filter((family) => !painting.has(family));
  assert.deepEqual(migrated, [], 'these no longer paint a glyph: take them off PENDING');
});
