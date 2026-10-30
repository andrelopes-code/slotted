import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * R5: a status mark — the glyph a message draws beside its words to say how
 * serious it is — belongs to the title's first line, not to the surface it
 * sits on. A sixteen-pixel glyph from the control scale, parked in the first
 * column of a grid and centerd on the whole block, reads as a sticker; the
 * mark that reads as part of the composition is the one that takes the
 * title's own size and sits on the title's own line.
 *
 * This test holds the rule for every family that draws one, part by part:
 *
 * 1. the mark is sized from the title's type (`1em` of a root whose font size
 *    is the title's, the title's own size variable, or a filled disc one
 *    step above `1em`, rounded to even pixels) — never from
 *    `--slotted-control-icon-size-*`;
 * 2. it aligns to the first line, in one of two forms: `align-self: start`
 *    and a block-start margin of half the difference between the line and
 *    the mark; or (`anchor: 'baseline'`) `align-self: baseline` and a
 *    relative offset of half the mark less one `cap`, rounded to a whole
 *    pixel, which ties the mark to the glyphs' own pixel snapping — the
 *    fractional margin of the first form lands the mark a pixel above or
 *    below the capitals depending on where the box falls on the page; or
 *    (`anchor: 'inline'`) an inline box inside the first line whose
 *    `vertical-align` puts its center `0.5cap` above the baseline, rounded
 *    to the device pixel;
 * 3. the distance from the mark to the words is `--slotted-space-4` (8px), and
 *    every restatement of it — a reach, a size — keeps that step;
 * 4. nothing is drawn behind it: no radius, no border, no shadow, no padding,
 *    and the only ground is the `Glyph` element's own ink;
 * 5. where the family has a `solid` variant, the mark takes the ink the words
 *    are read in on that fill.
 *
 * `[data-loading]` rings, supplied artwork (`:not(:empty)`) and the
 * `forced-colors` block are exempt: a ring is a border by construction, a
 * page's own icon owns its size, and under forced colors the user agent owns
 * every color.
 */
const MARKS = [
  {
    family: 'alert',
    part: 'icon',
    anchor: 'baseline',
    size: /^var\(--_mark-size\)$/,
    sizeValue: /^round\(nearest,\s*1\.2em,\s*2px\)$/,
    gap: '--_column-gap',
    solid: "[data-variant='solid']",
  },
  {
    family: 'toast',
    part: 'icon',
    anchor: 'baseline',
    size: /^var\(--_mark-size\)$/,
    sizeValue: /^round\(nearest,\s*1\.2em,\s*2px\)$/,
    gap: '--_column-gap',
    solid: "[data-variant='solid']",
  },
  {
    family: 'inline-message',
    part: 'icon',
    anchor: 'inline',
    size: /^var\(--_mark-size\)$/,
    sizeValue: /^round\(nearest,\s*1em,\s*2px\)$/,
    gap: '--_column-gap',
  },
  {
    family: 'dialog',
    part: 'icon',
    size: /^var\(--_status-size\)$/,
    sizeValue: /^var\(--_title-font-size\)$/,
    gap: '--_mark-gap',
  },
];

const STATE =
  /:(?:hover|active|focus|disabled)\b|::|\[data-loading\]|\[data-mark='dot'\]|:not\(:empty\)/;

function stylesheet(family) {
  return readFileSync(join(source, family, `${family}.css`), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
}

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

/** Every innermost `selector { declarations }` pair, whatever it is nested in. */
function rules(css) {
  const found = [];
  const stack = [];
  let start = 0;
  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    if (char === '{') {
      stack.push({ selector: css.slice(start, index).trim(), body: index + 1 });
      start = index + 1;
    } else if (char === '}') {
      const open = stack.pop();
      if (open && !open.selector.startsWith('@')) {
        const body = css.slice(open.body, index);
        const declarations = body.slice(
          0,
          body.indexOf('{') === -1 ? undefined : body.indexOf('{'),
        );
        found.push({
          selector: open.selector.replace(/\s+/g, ' '),
          declarations: parse(declarations),
        });
      }
      start = index + 1;
    } else if (char === ';') {
      start = index + 1;
    }
  }
  return found;
}

function parse(block) {
  const declarations = {};
  for (const entry of block.split(';')) {
    const colon = entry.indexOf(':');
    if (colon === -1) continue;
    declarations[entry.slice(0, colon).trim()] = entry
      .slice(colon + 1)
      .replace(/\s+/g, ' ')
      .trim();
  }
  return declarations;
}

/** Every value a private property is given anywhere in the sheet. */
function privateProperties(css) {
  const values = new Map();
  for (const { declarations } of rules(css)) {
    for (const [property, value] of Object.entries(declarations)) {
      if (!property.startsWith('--_')) continue;
      values.set(property, [...(values.get(property) ?? []), value]);
    }
  }
  return values;
}

function audit({ family, part, rest = /./, size, sizeValue, gap, solid, anchor = 'start' }) {
  const css = withoutForcedColors(stylesheet(family));
  const privates = privateProperties(css);
  const own = rules(css).filter(({ selector }) =>
    selector.includes(`[data-part-${part.toLowerCase()}]`),
  );
  const atRest = own.filter(({ selector }) => !STATE.test(selector) && rest.test(selector));
  const findings = [];

  const declared = (property) =>
    atRest.flatMap(({ declarations }) =>
      property in declarations ? [declarations[property]] : [],
    );

  /* 1. Sized from the title's type. */
  for (const property of ['block-size', 'inline-size']) {
    const values = declared(property);
    if (values.length === 0) findings.push(`states no ${property}`);
    for (const value of values) {
      if (!size.test(value)) findings.push(`${property} is ${value}, not the mark's size`);
    }
  }
  const sizeName = declared('inline-size')[0]?.match(/--_[a-z-]+/)?.[0];
  for (const value of privates.get(sizeName) ?? []) {
    if (!sizeValue.test(value)) findings.push(`${sizeName} is ${value}, not the title's size`);
  }
  if (privates.get(sizeName) === undefined) findings.push(`${sizeName} is never defined`);

  /* 2. On the first line. */
  if (anchor === 'inline') {
    if (!declared('display').some((value) => /^inline-(?:flex|block)$/.test(value))) {
      findings.push('is not an inline box on the first line');
    }
    const offsets = declared('vertical-align');
    if (offsets.length === 0) findings.push('has no offset from the baseline');
    for (const value of offsets) {
      if (
        !/^round\(nearest,\s*calc\(0\.5cap - var\(--_[a-z-]+\) \/ 2\),\s*(?:0\.5|1)px\)$/.test(
          value,
        )
      ) {
        findings.push(`vertical-align "${value}" does not center the mark on the capitals`);
      }
    }
  } else if (anchor === 'baseline') {
    if (!declared('align-self').includes('baseline')) findings.push('is not on the baseline');
    if (!declared('position').includes('relative')) findings.push('is not offset relatively');
    const offsets = declared('inset-block-start');
    if (offsets.length === 0) findings.push('has no offset from the baseline');
    for (const value of offsets) {
      if (!/^round\(nearest,\s*\(var\(--_[a-z-]+\) - 1cap\) \/ 2,\s*1px\)$/.test(value)) {
        findings.push(`inset-block-start "${value}" is not half the mark less the capitals`);
      }
    }
  } else {
    if (!declared('align-self').includes('start')) findings.push('is not aligned to the start');
    const margins = declared('margin-block-start');
    if (margins.length === 0) findings.push('has no block-start margin onto the first line');
    for (const value of margins) {
      if (!/^calc\(\s*\(.+ - var\(--_[a-z-]+\)\) \/ 2\s*\)$/.test(value)) {
        findings.push(`margin-block-start "${value}" is not half the line less the mark`);
      }
    }
  }

  /* 3. Eight pixels to the words, at every restatement. */
  const gaps = privates.get(gap) ?? [];
  if (gaps.length === 0) findings.push(`states no ${gap}`);
  for (const value of gaps) {
    if (!/--slotted-space-4, 0\.5rem/.test(value) || /--slotted-space-(?!4\b)\d/.test(value)) {
      findings.push(`${gap} "${value}" is not the 8px step`);
    }
  }
  if (!declared('margin-inline-end').some((value) => value.includes(gap))) {
    findings.push(`does not carry ${gap} to the words`);
  }

  /* 4. Nothing behind it. */
  for (const { selector, declarations } of atRest) {
    for (const property of ['border-radius', 'border', 'box-shadow', 'padding']) {
      const value = declarations[property];
      if (value !== undefined && !/^(?:0|none)$/.test(value)) {
        findings.push(`draws ${property} behind the mark (${selector})`);
      }
    }
    if ('background-image' in declarations || 'background' in declarations) {
      findings.push(`paints a ground behind the mark (${selector})`);
    }
  }

  /* 5. Monochrome on a solid fill. */
  if (solid) {
    const fill = rules(css).filter(({ selector }) => selector.includes(solid));
    const monochrome = fill.some(({ declarations }) =>
      Object.values(declarations).some((value) => value.includes('--_on-solid')),
    );
    if (!monochrome) findings.push('does not take the on-solid ink on the solid variant');
  }

  return findings;
}

for (const mark of MARKS) {
  test(`${mark.family}: [data-part-${mark.part.toLowerCase()}] sits on the title's first line at the title's size (R5)`, () => {
    const findings = audit(mark);
    assert.deepEqual(
      findings,
      [],
      `${mark.family} [data-part-${mark.part.toLowerCase()}]:\n  ${findings.join('\n  ')}`,
    );
  });
}

test('reads the rules it guards', () => {
  const guarded = MARKS.flatMap(({ family, part }) =>
    rules(withoutForcedColors(stylesheet(family))).filter(({ selector }) =>
      selector.includes(`[data-part-${part.toLowerCase()}]`),
    ),
  );
  /* 13 since the marks became `Glyph` elements: the mask, its per-tone image
     and its `:not(:empty)` guard were rules of their own, and went with it. */
  assert.ok(guarded.length >= 13, `Expected the status-mark rules, found ${guarded.length}`);
});
