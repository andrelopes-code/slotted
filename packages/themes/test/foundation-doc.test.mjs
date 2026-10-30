import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { contract, flattenTheme } from '@slotted/theme';

import {
  DEFAULT_STROKE_WIDTH,
  generateModule,
  GLYPH_PREFIX,
  lucideIcon,
  pathOf,
  renderGlyph,
} from '../../../scripts/generate-icon-glyphs.mjs';
import { centeringOffset, inkBox, opticalOffset, VIEW_BOX } from '../../../scripts/glyph-ink.mjs';
import defaultTheme from '../src/default/theme.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const theme = flattenTheme(defaultTheme);
const glyphs = JSON.parse(
  readFileSync(join(ROOT, 'packages/themes/src/default/glyphs.json'), 'utf8'),
);
const foundation = readFileSync(join(ROOT, 'docs/token-foundation.md'), 'utf8');

const SCHEMES = ['light', 'dark', 'high-contrast'];
const DENSITIES = ['comfortable', 'compact', 'dense'];

/**
 * `\Z` is not a JavaScript regular expression: it matches the letter Z. The
 * section therefore used to end at the first capital Z in the document, which
 * nothing noticed until a glyph's path data ended in one — the `Z` that closes
 * an SVG subpath — and the row holding it was read half a cell short. The end
 * of the input is written the way JavaScript spells it.
 */
function section(name) {
  const match = foundation.match(
    new RegExp(`^## ${name}\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm'),
  );
  assert.ok(match, `Missing ${name} section`);
  return match[1];
}

function tokens(predicate) {
  return contract.tokens.filter(predicate);
}

function names(predicate) {
  return tokens(predicate).map((token) => token.name);
}

function rows(content) {
  return content
    .split('\n')
    .filter((line) => line.startsWith('| '))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim()),
    )
    .filter((cells) => !cells.every((cell) => /^-+$/.test(cell)));
}

function assertExactTable(title, header, expectedRows) {
  const content = section(title);
  const [actualHeader, ...actualRows] = rows(content);
  assert.deepEqual(actualHeader, header, `${title} has the wrong table headers`);

  const actualKeys = actualRows.map((row) => JSON.stringify(row));
  const expectedKeys = expectedRows.map((row) => JSON.stringify(row));
  assert.equal(
    new Set(actualKeys).size,
    actualKeys.length,
    `${title} contains duplicate token rows`,
  );
  assert.deepEqual(
    new Set(actualKeys),
    new Set(expectedKeys),
    `${title} has stale or missing token rows`,
  );
}

function assertBaseTable(title, prefix) {
  const entries = names((token) => token.axis === 'base' && token.name.startsWith(prefix));
  assert.ok(entries.length > 0, `${title} documents no token`);
  assertExactTable(
    title,
    ['Token', 'Default value'],
    entries.map((name) => [`\`${name}\``, `\`${theme.base[name]}\``]),
  );
}

/**
 * A glyph is documented by the Lucide icon it is drawn from and how it is
 * painted, not by its data URI: the URI is generated, and the table says what
 * `glyphs.json` says.
 */
function paint(entry) {
  return entry.paint === 'fill'
    ? 'fill'
    : `stroke ${entry['stroke-width'] ?? DEFAULT_STROKE_WIDTH}`;
}

function assertGlyphTable() {
  const entries = names((token) => token.axis === 'base' && token.name.startsWith(GLYPH_PREFIX));
  assert.ok(entries.length > 0, 'Glyph documents no token');
  assertExactTable(
    'Glyph',
    ['Token', 'Lucide icon', 'Paint'],
    entries.map((name) => [`\`${name}\``, `\`${glyphs[name]?.icon}\``, paint(glyphs[name] ?? {})]),
  );
}

/**
 * The predicate reads the token, not its name. Splitting the scheme tables by
 * name prefix held only while every shadow was called `--slotted-shadow-*`,
 * and it broke the moment a control named its own: `--slotted-control-shadow`
 * is a shadow that does not carry the prefix, and the split sent it to the
 * color table. The contract already declares what each token is, so the
 * declared type is what the tables are partitioned by.
 */
function assertSchemeTable(title, predicate) {
  const entries = names((token) => token.axis === 'scheme' && predicate(token));
  assert.ok(entries.length > 0, `${title} documents no token`);
  assertExactTable(
    title,
    ['Token', 'Light', 'Dark', 'High contrast'],
    entries.map((name) => [
      `\`${name}\``,
      ...SCHEMES.map((scheme) => `\`${theme.schemes[scheme][name]}\``),
    ]),
  );
}

test('documents every foundation value in its source-specific table', () => {
  assertBaseTable('Space', '--slotted-space-');
  assertBaseTable('Radius', '--slotted-radius-');
  assertBaseTable('Type size', '--slotted-font-size-');
  assertBaseTable('Line height', '--slotted-line-height-');
  assertBaseTable('Font weight', '--slotted-font-weight-');
  assertBaseTable('Font family', '--slotted-font-family-');
  assertBaseTable('Border width', '--slotted-border-width-');
  assertBaseTable('Stacking', '--slotted-z-index-');
  assertGlyphTable();
  assertBaseTable('Target size', '--slotted-target-');
  assertBaseTable('Selection geometry', '--slotted-selection-');
  assertBaseTable('Highlight', '--slotted-highlight-');
});

test('draws every glyph from the Lucide icon its manifest names', () => {
  const declared = names((token) => token.name.startsWith(GLYPH_PREFIX));
  assert.deepEqual(
    Object.keys(glyphs).sort(),
    [...declared].sort(),
    'glyphs.json must name an icon for exactly the glyph tokens the contract declares',
  );
  for (const name of declared) {
    assert.equal(
      theme.base[name],
      renderGlyph(glyphs[name]),
      `${name} is not the Lucide "${glyphs[name].icon}" drawing; run node scripts/generate-icon-glyphs.mjs`,
    );
  }
});

/**
 * The drawing is Lucide's; where it sits in the box is this repository's. A
 * mask is centerd on whatever consumes it, so a glyph framed for a set rather
 * than for its own middle carries that framing into every family that draws
 * it: `check` paints from y 4.5 to y 18.5 of its twenty-four units, half a
 * unit above the middle, and the checkbox mark inherited 0.208 | 0.250 |
 * 0.292px of it at the three size steps — the only thing CK6 could not take
 * out of the sheet (CK9).
 *
 * The box is measured here rather than trusted from the generator, on two
 * drawings whose ink is arithmetic anybody can repeat: a stroke of three
 * around `M20 6 9 17l-5-5` with round caps, and a circle of radius ten under a
 * stroke of two.
 */
test('measures the ink of a drawing, not the frame it was given', () => {
  const check = inkBox(lucideIcon('check'), { paint: 'stroke', strokeWidth: 3 });
  assert.deepEqual(
    [check.minX, check.maxX, check.minY, check.maxY],
    [2.5, 21.5, 4.5, 18.5],
    'the check path runs (4, 6) to (20, 17) and the stroke grows it by 1.5',
  );
  const circle = inkBox(lucideIcon('circle'), { paint: 'stroke', strokeWidth: 2 });
  assert.deepEqual([circle.minX, circle.maxX, circle.minY, circle.maxY], [1, 23, 1, 23]);
});

test('centers the ink of every glyph in the box the mask is drawn in', () => {
  const declared = names((token) => token.name.startsWith(GLYPH_PREFIX));
  const moved = [];
  for (const name of declared) {
    const entry = glyphs[name];
    const node = lucideIcon(entry.icon);
    const options = {
      paint: entry.paint ?? 'stroke',
      strokeWidth: entry['stroke-width'] ?? DEFAULT_STROKE_WIDTH,
    };
    /* A glyph that names its body is centerd on its main shape, held inside the box. */
    const body = entry.body?.map((index) => node[index]);
    const ink = inkBox(body ?? node, options);
    const whole = inkBox(node, options);
    const { dx, dy } =
      body === undefined
        ? centeringOffset(node, options)
        : opticalOffset(node, entry.body, options);
    for (const [axis, center, offset, min, max] of [
      ['x', (ink.minX + ink.maxX) / 2, dx, whole.minX, whole.maxX],
      ['y', (ink.minY + ink.maxY) / 2, dy, whole.minY, whole.maxY],
    ]) {
      const held = min + offset <= 0.0005 || max + offset >= VIEW_BOX - 0.0005;
      assert.ok(
        Math.abs(center + offset - VIEW_BOX / 2) <= 0.0005 || (body !== undefined && held),
        `${name} sits ${(center + offset - VIEW_BOX / 2).toFixed(4)} off center on ${axis}`,
      );
    }
    /* A drawing already on the center is emitted as Lucide wrote it. */
    if (dx === 0 && dy === 0) {
      assert.doesNotMatch(theme.base[name], /translate/, `${name} is moved by nothing`);
    } else {
      assert.match(
        theme.base[name],
        new RegExp(`transform='translate\\(${dx} ${dy}\\)'`),
        `${name} does not carry the offset that centers it`,
      );
      moved.push(name);
    }
  }
  assert.deepEqual(
    moved,
    [
      '--slotted-icon-check',
      '--slotted-icon-pin',
      '--slotted-icon-calendar',
      '--slotted-icon-triangle-alert',
      '--slotted-icon-caps-lock',
      '--slotted-icon-paperclip',
      '--slotted-icon-pipette',
      '--slotted-icon-trash',
      '--slotted-icon-play',
      '--slotted-icon-file-audio',
      '--slotted-icon-text-wrap',
      '--slotted-icon-bell',
      '--slotted-icon-funnel',
      '--slotted-icon-star',
      '--slotted-icon-check-check',
      '--slotted-icon-pencil',
    ],
    'the glyphs Lucide did not frame on their own center',
  );
});

test('reads Lucide at the version the React stories draw with', () => {
  const root = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const react = JSON.parse(readFileSync(join(ROOT, 'packages/react/package.json'), 'utf8'));
  assert.equal(
    root.devDependencies.lucide,
    react.devDependencies['lucide-react'],
    'a theme glyph and a story icon must be the same Lucide drawing',
  );
});

test('documents the layer every token belongs to', () => {
  const declared = rows(section('Layers')).slice(1);
  assert.deepEqual(
    declared.map(([layer]) => layer),
    contract.layers.map((layer) => `\`${layer}\``),
    'The layer table must name every layer the contract declares, in order',
  );

  for (const layer of contract.layers) {
    const counted = tokens((token) => token.layer === layer).length;
    const row = declared.find(([name]) => name === `\`${layer}\``);
    assert.equal(row?.at(-1), String(counted), `${layer} states the wrong token count`);
  }
});

test('documents the motion scale with the value each duration collapses to', () => {
  const motion = names(
    (token) =>
      token.axis === 'base' &&
      (token.name.startsWith('--slotted-duration-') || token.name.startsWith('--slotted-easing-')),
  );
  assertExactTable(
    'Motion',
    ['Token', 'Default value', 'Reduced-motion value'],
    motion.map((name) => {
      const reduced = theme.reducedMotion[name] ?? 'unchanged';
      return [
        `\`${name}\``,
        `\`${theme.base[name]}\``,
        reduced === 'unchanged' ? reduced : `\`${reduced}\``,
      ];
    }),
  );
});

test('documents the control typography every family shares', () => {
  assertBaseTable('Control typography', '--slotted-control-');
});

test('documents each scheme color in all three schemes', () => {
  assertSchemeTable('Shadow', (token) => token.type === 'shadow');
  /*
   * The component layer is excluded because it documents itself. `upload`'s
   * file-kind palette varies by scheme and is not a semantic color: it has its
   * own table under **File kind**, for the reason Avatar's sizes have their own
   * under **Avatar size**, and listing it here would say a family's palette is
   * something every family may read.
   */
  /*
   * The data scale is semantic and is not a surface, a text or a border: it is
   * what a series is painted with, and `chart` reads it as a set rather than
   * one token at a time. It has its own table under **Data** so that the
   * order — which is the scale's color-vision argument — is read as a list.
   */
  assertSchemeTable(
    'Semantic color',
    (token) =>
      token.type !== 'shadow' &&
      token.layer !== 'component' &&
      !token.name.startsWith('--slotted-tone-') &&
      !token.name.startsWith('--slotted-data-'),
  );
  assertSchemeTable('Data', (token) => token.name.startsWith('--slotted-data-'));
});

test('documents what forced colors replace each scheme token with', () => {
  const entries = tokens(
    (token) => token.axis === 'scheme' && !token.name.startsWith('--slotted-tone-'),
  );
  assertExactTable(
    'Forced colors',
    ['Token', 'Replacement'],
    entries.map((token) => [`\`${token.name}\``, `\`${token.forcedColor}\``]),
  );
});

test('documents the control geometry of every density', () => {
  const geometry = names(
    (token) => token.axis === 'density' && token.name.startsWith('--slotted-control-'),
  );

  assertExactTable(
    'Control geometry',
    ['Token', 'Comfortable', 'Compact', 'Dense'],
    geometry.map((name) => [
      `\`${name}\``,
      ...DENSITIES.map((density) => `\`${theme.densities[density][name]}\``),
    ]),
  );
});

/**
 * Control geometry is the one scale a family was ever tempted to alias, and
 * Button did until it was rebuilt. An alias looks harmless and is not: the
 * theme raises the control tokens under `@media (pointer: coarse)`, and a
 * family reading the alias never sees the larger touch target.
 *
 * The rule is about the value and not about the name, which the first
 * independent density scale made plain: `--slotted-avatar-size-*` states its
 * own lengths and aliases nothing, while a token named for a control that
 * merely forwarded `var(--slotted-control-height-md)` is the defect this test
 * exists to catch. What is refused is a density token whose value reaches the
 * control scale.
 */
test('leaves the density scale with no aliases in front of it', () => {
  const aliases = names(
    (token) =>
      token.axis === 'density' &&
      !token.name.startsWith('--slotted-control-') &&
      DENSITIES.some((density) =>
        /var\(\s*--slotted-control-/.test(String(theme.densities[density]?.[token.name] ?? '')),
      ),
  );
  assert.deepEqual(aliases, [], 'a density token in front of the control scale is an alias');
});

/**
 * A density scale outside control geometry is documented the way control
 * geometry is, so a family cannot add one and leave it unwritten. Avatar is the
 * only family that has needed one; the table is what makes the next one a
 * decision rather than a habit.
 */
test('documents every density scale that is not control geometry', () => {
  const scales = new Map();
  for (const name of names(
    (token) => token.axis === 'density' && !token.name.startsWith('--slotted-control-'),
  )) {
    /* `--slotted-avatar-size-xs` is documented under "Avatar size": the family
       it belongs to, then what it measures. */
    const [family, concept] = name.replace('--slotted-', '').split('-');
    const title = `${(family ?? '').replace(/^./, (first) => first.toUpperCase())} ${concept}`;
    scales.set(title, [...(scales.get(title) ?? []), name]);
  }

  for (const [title, scale] of scales) {
    assertExactTable(
      title,
      ['Token', 'Comfortable', 'Compact', 'Dense'],
      scale.map((name) => [
        `\`${name}\``,
        ...DENSITIES.map((density) => `\`${theme.densities[density][name]}\``),
      ]),
    );
  }
});

test('states the rules the contract enforces rather than leaving them to habit', () => {
  assert.match(foundation, /scale root/i);
  assert.match(foundation, /literal/i);
  assert.match(foundation, /forced-colors/i);
  assert.match(foundation, /pointer: coarse/i);
  assert.match(foundation, /24 × 24/);
});

test('scopes the law to the families the rebuild has reached', () => {
  assert.match(foundation, /binding for every family the rebuild has reached/i);
  assert.match(foundation, /legacy-families\.json/);
  assert.match(
    foundation,
    /infinite animations\s+must stop or disable[\s\S]*shortening is insufficient/i,
  );
});

/**
 * The element and the mask are one drawing. The module the `Glyph` element
 * renders is generated from the same manifest, and every Lucide element it
 * rewrites as path data keeps the ink box Lucide's own element has — the box
 * the centering offset was computed from.
 */
test('draws the glyph element from the drawing the mask is drawn from', async () => {
  const { changed } = await generateModule({ check: true });
  assert.equal(
    changed,
    false,
    'packages/core/src/glyph/glyphs.ts is out of date; run node scripts/generate-icon-glyphs.mjs',
  );
  const round = (box) => Object.values(box).map((value) => Number(value.toFixed(3)));
  for (const [name, entry] of Object.entries(glyphs)) {
    const node = lucideIcon(entry.icon);
    const options = {
      paint: entry.paint ?? 'stroke',
      strokeWidth: entry['stroke-width'] ?? DEFAULT_STROKE_WIDTH,
    };
    const asPaths = node.map(([tag, attributes]) => ['path', { d: pathOf(tag, attributes) }]);
    assert.deepEqual(
      round(inkBox(asPaths, options)),
      round(inkBox(node, options)),
      `${name}: the path form of "${entry.icon}" is not the same geometry`,
    );
  }
});
