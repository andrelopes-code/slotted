#!/usr/bin/env node
/**
 * Draws every `--slotted-icon-*` glyph of a theme from the Lucide icon its
 * manifest names, and writes the data URIs into the theme's `values.json`.
 *
 * A glyph is a `mask-image`, so the artwork is painted black and the black
 * becomes the mask's alpha. The geometry is Lucide's own, read from the
 * `lucide` package at the version `lucide-react` is pinned to, so a mark a
 * family draws from a token and a mark a story draws from `lucide-react` or
 * `@ng-icons/lucide` are the same drawing. Nothing in `values.json` is
 * authored by hand: an edit to a glyph is an edit to `glyphs.json`, followed
 * by a build.
 *
 * Usage:
 *   node scripts/generate-icon-glyphs.mjs [--theme <theme dir>] [--check]
 *
 * `--theme` passes a theme directory and defaults to `packages/themes/src/default`.
 * `--check` writes nothing and exits 1 when the theme's glyphs differ from the
 * manifest's.
 *
 * The default theme's manifest also draws `packages/core/src/glyph/glyphs.ts`:
 * the same geometry as path data, which the `Glyph` element of each binding
 * renders as a real `<svg>`. A family draws its own icons with that element;
 * the mask tokens remain for the families still listed in
 * `packages/styles/src/glyph-element.test.mjs`.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { icons } from 'lucide';

import { centeringOffset, opticalOffset } from './glyph-ink.mjs';

export const GLYPH_PREFIX = '--slotted-icon-';
export const DEFAULT_STROKE_WIDTH = 2;

const ROOT = new URL('..', import.meta.url);
const DEFAULT_THEME = 'packages/themes/src/default';

/** `circle-question-mark` → `CircleQuestionMark`, the key the `lucide` map uses. */
function pascal(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/** The Lucide icon node — `[[tag, attributes], ...]` — for a kebab-case name. */
export function lucideIcon(name) {
  const node = icons[pascal(name)];
  if (!node) {
    throw new Error(`Lucide has no icon named "${name}"`);
  }
  return node;
}

/**
 * The characters a `data:` URI inside `url("…")` cannot carry literally. The
 * rest — spaces, quotes, commas, slashes — stay readable, the way every glyph
 * has been written so far.
 */
function encode(svg) {
  return svg.replace(
    /[<>#"%{}|\\^`]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function element(tag, attributes) {
  const attrs = Object.entries(attributes)
    .map(([key, value]) => `${key}='${value}'`)
    .join(' ');
  return `<${tag} ${attrs}/>`;
}

/**
 * One glyph as the theme states it. `paint` is `stroke` (Lucide's own
 * rendering, the default) or `fill`: the same geometry painted solid, for the
 * marks that stand in for a photograph or a dot rather than annotate a line.
 *
 * The drawing is Lucide's, and where it sits in the box is not. A mask is
 * centerd on whatever consumes it, so what has to be centerd is the painted
 * ink: Lucide frames each icon for the set, and `check` comes out half a unit
 * above the middle of its own viewBox — 0.208 | 0.250 | 0.292px in a checkbox
 * at the three size steps, which is the whole of what CK6 could not remove
 * from the sheet (CK9). The children are therefore emitted unchanged, inside a
 * group that moves them onto the center when they are not already on it.
 */
export function renderGlyph({
  icon,
  'stroke-width': strokeWidth = DEFAULT_STROKE_WIDTH,
  paint = 'stroke',
  body,
}) {
  if (paint !== 'stroke' && paint !== 'fill') {
    throw new Error(`Unknown paint "${paint}" for "${icon}": expected "stroke" or "fill"`);
  }
  const root =
    paint === 'fill'
      ? { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'black' }
      : {
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'black',
          'stroke-width': String(strokeWidth),
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        };
  const node = lucideIcon(icon);
  const drawing = node.map(([tag, attributes]) => element(tag, attributes)).join('');
  const { dx, dy } =
    body === undefined
      ? centeringOffset(node, { paint, strokeWidth })
      : opticalOffset(node, body, { paint, strokeWidth });
  const children =
    dx === 0 && dy === 0 ? drawing : `<g transform='translate(${dx} ${dy})'>${drawing}</g>`;
  const svg = `<svg${Object.entries(root)
    .map(([key, value]) => ` ${key}='${value}'`)
    .join('')}>${children}</svg>`;
  return `url("data:image/svg+xml,${encode(svg)}")`;
}

/* ── The element: the same drawing as path data ────────────────────────── */

/** Where the module the families draw their glyph elements from is written. */
export const GLYPH_MODULE = 'packages/core/src/glyph/glyphs.ts';

const num = (value) => String(Number(Number(value).toFixed(4)));

function points(list) {
  const values = String(list)
    .trim()
    .split(/[\s,]+/)
    .map(num);
  const pairs = [];
  for (let index = 0; index < values.length; index += 2) {
    pairs.push(`${values[index]} ${values[index + 1]}`);
  }
  return pairs;
}

/**
 * One Lucide element as path data, so a glyph is a list of `d` strings and a
 * binding draws every glyph with one `<path>` per entry: the geometry is
 * Lucide's, only the notation changes. A circle and an ellipse are two arcs, a
 * rectangle its four sides with the corner arcs Lucide rounds it with.
 */
export function pathOf(tag, attributes) {
  const a = attributes;
  switch (tag) {
    case 'path':
      return a.d;
    case 'line':
      return `M${num(a.x1)} ${num(a.y1)}L${num(a.x2)} ${num(a.y2)}`;
    case 'polyline':
    case 'polygon': {
      const [first, ...rest] = points(a.points);
      return `M${first}${rest.map((pair) => `L${pair}`).join('')}${tag === 'polygon' ? 'Z' : ''}`;
    }
    case 'circle':
    case 'ellipse': {
      const rx = Number(tag === 'circle' ? a.r : a.rx);
      const ry = Number(tag === 'circle' ? a.r : a.ry);
      const cx = Number(a.cx);
      const cy = Number(a.cy);
      return `M${num(cx - rx)} ${num(cy)}a${num(rx)} ${num(ry)} 0 1 0 ${num(2 * rx)} 0a${num(rx)} ${num(ry)} 0 1 0 ${num(-2 * rx)} 0`;
    }
    case 'rect': {
      const x = Number(a.x ?? 0);
      const y = Number(a.y ?? 0);
      const w = Number(a.width);
      const h = Number(a.height);
      const rx = Math.min(Number(a.rx ?? a.ry ?? 0), w / 2);
      const ry = Math.min(Number(a.ry ?? a.rx ?? 0), h / 2);
      if (rx === 0 || ry === 0) return `M${num(x)} ${num(y)}h${num(w)}v${num(h)}h${num(-w)}Z`;
      const arc = (dx, dy) => `a${num(rx)} ${num(ry)} 0 0 1 ${num(dx)} ${num(dy)}`;
      return (
        `M${num(x + rx)} ${num(y)}h${num(w - 2 * rx)}${arc(rx, ry)}v${num(h - 2 * ry)}` +
        `${arc(-rx, ry)}h${num(-(w - 2 * rx))}${arc(-rx, -ry)}v${num(-(h - 2 * ry))}${arc(rx, -ry)}Z`
      );
    }
    default:
      throw new Error(`Lucide element <${tag}> has no path form`);
  }
}

/**
 * One glyph as the element draws it: the paint, the stroke width, the offset
 * that puts the ink on the center (the one the mask applies), and the paths.
 * A manifest entry that names its `body` — the indices of the elements that
 * make the main shape — is centerd on that shape instead (`opticalOffset`).
 */
export function drawGlyph({
  icon,
  'stroke-width': strokeWidth = DEFAULT_STROKE_WIDTH,
  paint = 'stroke',
  body,
}) {
  const node = lucideIcon(icon);
  const { dx, dy } =
    body === undefined
      ? centeringOffset(node, { paint, strokeWidth })
      : opticalOffset(node, body, { paint, strokeWidth });
  return {
    paint,
    strokeWidth: paint === 'fill' ? 0 : strokeWidth,
    offset: [dx, dy],
    paths: node.map(([tag, attributes]) => pathOf(tag, attributes)),
  };
}

/** The TypeScript module, keyed by the token's name without its prefix. */
export function renderGlyphModule(manifest, version) {
  const entries = Object.entries(manifest).map(([token, entry]) => {
    const drawing = drawGlyph(entry);
    return `  '${token.slice(GLYPH_PREFIX.length)}': ${JSON.stringify(drawing)},`;
  });
  return [
    '/**',
    ` * Generated by scripts/generate-icon-glyphs.mjs from packages/themes/src/default/glyphs.json`,
    ` * and lucide@${version}. Do not edit: change the manifest and run \`pnpm generate:glyphs\`.`,
    ' */',
    "import type { GlyphDrawing } from './glyph';",
    '',
    'export const GLYPHS = {',
    ...entries,
    '} as const satisfies Record<string, GlyphDrawing>;',
    '',
  ].join('\n');
}

async function lucideVersion() {
  const pkg = JSON.parse(await readFile(new URL('package.json', ROOT), 'utf8'));
  return pkg.devDependencies.lucide;
}

/** The module formatted as the repository formats TypeScript. */
export async function glyphModuleSource(manifest) {
  const { format, resolveConfig } = await import('prettier');
  const file = new URL(GLYPH_MODULE, ROOT).pathname;
  const options = (await resolveConfig(file)) ?? {};
  return format(renderGlyphModule(manifest, await lucideVersion()), {
    ...options,
    filepath: file,
  });
}

/** Every glyph of a manifest, keyed by token name, in manifest order. */
export function renderGlyphs(manifest) {
  const glyphs = {};
  for (const [token, entry] of Object.entries(manifest)) {
    if (!token.startsWith(GLYPH_PREFIX)) {
      throw new Error(`"${token}" is not a glyph token: expected the ${GLYPH_PREFIX} prefix`);
    }
    glyphs[token] = renderGlyph(entry);
  }
  return glyphs;
}

export async function readManifest(themeDir) {
  return JSON.parse(await readFile(new URL('glyphs.json', themeDir), 'utf8'));
}

/**
 * The theme with its glyphs redrawn, and whether anything changed. Only the
 * tokens the manifest names are written; the theme keeps every other value and
 * its key order.
 */
export async function generate(themeDir, { check = false } = {}) {
  const themeUrl = new URL('values.json', themeDir);
  const before = await readFile(themeUrl, 'utf8');
  const theme = JSON.parse(before);
  const glyphs = renderGlyphs(await readManifest(themeDir));

  const stale = Object.keys(theme.base).filter(
    (token) => token.startsWith(GLYPH_PREFIX) && !(token in glyphs),
  );
  if (stale.length > 0) {
    throw new Error(`glyphs.json names no icon for: ${stale.join(', ')}`);
  }
  for (const [token, value] of Object.entries(glyphs)) {
    theme.base[token] = value;
  }

  const after = `${JSON.stringify(theme, null, 2)}\n`;
  const changed = after !== before;
  if (changed && !check) {
    await writeFile(themeUrl, after);
  }
  return { changed, tokens: Object.keys(glyphs) };
}

/**
 * The glyph module redrawn from the default theme's manifest, and whether it
 * changed. The element and the mask are one drawing: both come from here.
 */
export async function generateModule({ check = false } = {}) {
  const url = new URL(GLYPH_MODULE, ROOT);
  const after = await glyphModuleSource(await readManifest(new URL(`${DEFAULT_THEME}/`, ROOT)));
  const before = await readFile(url, 'utf8').catch(() => '');
  const changed = after !== before;
  if (changed && !check) {
    await mkdir(new URL('.', url), { recursive: true });
    await writeFile(url, after);
  }
  return { changed };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const themeArg = args[args.indexOf('--theme') + 1];
  const themeDir =
    args.includes('--theme') && themeArg
      ? pathToFileURL(`${resolve(themeArg)}/`)
      : new URL(`${DEFAULT_THEME}/`, ROOT);

  const { changed, tokens } = await generate(themeDir, { check });
  if (check && changed) {
    console.error(`values.json glyphs are out of date; run: node scripts/generate-icon-glyphs.mjs`);
    process.exit(1);
  }
  if (!args.includes('--theme') || themeDir.href === new URL(`${DEFAULT_THEME}/`, ROOT).href) {
    const module = await generateModule({ check });
    if (check && module.changed) {
      console.error(`${GLYPH_MODULE} is out of date; run: node scripts/generate-icon-glyphs.mjs`);
      process.exit(1);
    }
    console.log(`${module.changed ? 'wrote' : 'kept'} ${GLYPH_MODULE}`);
  }
  console.log(
    `${changed ? 'wrote' : 'kept'} ${tokens.length} glyphs in ${themeDir.pathname}values.json`,
  );
}
