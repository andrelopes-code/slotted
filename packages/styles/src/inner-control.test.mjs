import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * R2: a composite family draws its own inner control — the clear in a field,
 * the close on a message, the paging arrow beside a tab list — and never
 * mounts `Button` or `IconButton` for it. A button carries a height, a
 * padding, a frame, a shadow and a radius of its own, none of which fit
 * inside a 32px control.
 *
 * The DOM half of that rule already holds (no `data-ui='button'` is rendered
 * inside any of these families). This test holds the style half, part by
 * part:
 *
 * 1. the box is sized from the control glyph scale
 *    (`--slotted-control-icon-size-*`) plus a step of air, capped at the
 *    inner size of a control at that step (`--slotted-control-inner-size-*`,
 *    the scale `kbd` and `tag` already take as their height inside a
 *    control) — `min(glyph + air, inner-size)` — and never from a control
 *    height. Before the cap, a clear mark measured 22px inside a 26px field
 *    at the compact step, where the inside of that field is 20px;
 * 2. at rest it has no frame and no shadow, and no ground;
 * 3. `hover` and `active` move the ground and nothing else — one step each,
 *    no ink change, no border, no shadow;
 * 4. `:focus-visible` draws the theme's ring (R3);
 * 5. the pointer target reaches `--slotted-target-min` — either the box does,
 *    or a transparent pseudo-element around it does — rather than the glyph
 *    growing to fill it;
 * 6. under `@media (pointer: coarse)` the target reaches
 *    `--slotted-target-comfortable` in both axes, and nothing the reader sees
 *    grows taller than it is wide. Either the box grows in both axes at once,
 *    or a transparent pseudo-element centred on the box reaches the
 *    comfortable size and the box keeps the size it has on a fine pointer. No
 *    coarse-pointer rule grows the block axis alone or clips the ground to a
 *    content box. The rule it replaces padded the box in the block axis and
 *    clipped the ground: the ground stayed 24 pixels square, and the border
 *    box, where the focus ring is drawn, stood 24 wide and 44 tall — measured
 *    on the Nexora demo at 390 pixels with touch emulation.
 *
 *    Two halves stacked in one column (a number field's steppers) cannot each
 *    be 44 tall inside a 44-pixel frame. Each is 44 wide and keeps its own half
 *    of the frame in the block axis (`inset-block: 0`), which is what the
 *    column physically holds. Two controls side by side in one frame (a clear
 *    and a trigger) are 44 tall, and neither target crosses the edge the two
 *    boxes share: a later halo drawn over an earlier box would take that
 *    box's presses.
 *
 * The field families additionally floor their glyph at the size SL3 fixed:
 * `--slotted-control-icon-size-*` falls to 12px and 13px at the dense step,
 * and a clear mark under 14px is a speck. The floor is a family token with a
 * 14px fallback (`--slotted-<family>-icon-size-min`) so a theme can retune
 * it and the sheet carries no literal.
 *
 * A `forced-colors` block is exempt: there the user agent owns every colour
 * and `Highlight` on hover is what survives.
 */
const PARTS = [
  { family: 'text-field', part: 'clear' },
  { family: 'text-field', part: 'reveal' },
  { family: 'select', part: 'clear' },
  { family: 'combobox', part: 'clear' },
  { family: 'multi-select', part: 'clear' },
  { family: 'entity-picker', part: 'clear' },
  { family: 'tags-input', part: 'clear' },
  { family: 'number-field', part: 'increment' },
  { family: 'number-field', part: 'decrement' },
  { family: 'currency-field', part: 'increment' },
  { family: 'currency-field', part: 'decrement' },
  { family: 'alert', part: 'dismiss' },
  { family: 'toast', part: 'close' },
  { family: 'tag', part: 'remove' },
  { family: 'breadcrumb', part: 'ellipsis' },
  { family: 'tabs', part: 'scroll' },
  { family: 'toolbar', part: 'overflow' },
  { family: 'dialog', part: 'close' },
  { family: 'dialog', part: 'fullscreen' },
  { family: 'drawer', part: 'close' },
  /**
   * The help beside a field's label: a glyph on a line of 13-pixel text, where
   * a `Button` would bring a control height into a row of type.
   */
  { family: 'field', part: 'help' },
  /**
   * A file's five controls. They are inner controls for the reason the rest of
   * this list is: each is a glyph on a row twenty-six pixels tall, and a
   * `Button` there would bring a height, a padding, a frame, a shadow and a
   * radius that do not fit inside it.
   */
  { family: 'upload', part: 'viewerExternal' },
  { family: 'upload', part: 'viewerClose' },
  { family: 'upload', part: 'start' },
  { family: 'upload', part: 'pause' },
  { family: 'upload', part: 'retry' },
  { family: 'upload', part: 'cancel' },
  { family: 'upload', part: 'remove' },
];

/** Families whose glyph is floored at 14px (SL3, with CB3 and TF1). */
const FLOORED = [
  'text-field',
  'select',
  'combobox',
  'multi-select',
  'entity-picker',
  'tags-input',
  'number-field',
  'currency-field',
];

/**
 * Rule 6 holds for every part above and for the inner controls the rest of
 * the audit does not read: the triggers beside a clear, the clear of a date
 * or time field, a picker's trigger, a filter rule's remove, a tab's dismiss,
 * a copy control, a table header's filter, and a chart's legend entries — a
 * text-bearing entry is wider than tall already, and its target is still the
 * comfortable one.
 */
const COARSE = [
  ...PARTS,
  { family: 'combobox', part: 'trigger' },
  { family: 'multi-select', part: 'trigger' },
  { family: 'entity-picker', part: 'trigger' },
  { family: 'date-field', part: 'clear' },
  { family: 'time-field', part: 'clear' },
  { family: 'datetime-field', part: 'clear' },
  { family: 'date-picker', part: 'trigger' },
  { family: 'time-picker', part: 'trigger' },
  { family: 'datetime-picker', part: 'trigger' },
  { family: 'date-range-picker', part: 'clear' },
  { family: 'date-range-picker', part: 'trigger' },
  { family: 'time-range-picker', part: 'clear' },
  { family: 'datetime-range-picker', part: 'clear' },
  { family: 'command-palette', part: 'clear' },
  { family: 'filter-bar', part: 'remove' },
  { family: 'filter-bar', part: 'more' },
  { family: 'tabs', part: 'dismiss' },
  { family: 'code-block', part: 'copy' },
  { family: 'code-block', part: 'wrap' },
  { family: 'description-list', part: 'copy' },
  { family: 'table', part: 'filter' },
  { family: 'chart', part: 'legend-item' },
  { family: 'chart', part: 'legend-more' },
];

/** Parts stacked in one column, whose block axis is their share of the frame. */
const STACKED = new Set(['number-field', 'currency-field']);

const COARSE_QUERY = '@media (pointer: coarse)';

const STATE = /:(?:hover|active|focus|disabled)\b|::/;
const PSEUDO = /::(?:before|after)\b/;

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
          /* The at-rules the rule is nested in, outermost first. */
          media: stack
            .map(({ selector }) => selector.replace(/\s+/g, ' '))
            .filter((selector) => selector.startsWith('@')),
        });
      }
      start = index + 1;
    } else if (char === ';') {
      start = index + 1;
    }
  }
  return found;
}

/** `{ property: value }` for one declaration block. */
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

/** A value with every private property it reads written out, to a depth. */
function expand(value, privates, depth = 6) {
  if (depth === 0) return value;
  return value.replace(/--_[a-z0-9-]+/g, (name) =>
    privates.has(name)
      ? `${name}(${expand(privates.get(name).join(' | '), privates, depth - 1)})`
      : name,
  );
}

function selectorSays(selector, part) {
  return selector.includes(`[data-part-${part.toLowerCase()}]`);
}

function atRest(selector) {
  return !STATE.test(selector);
}

function audit(family, part) {
  const css = withoutForcedColors(stylesheet(family));
  const privates = privateProperties(css);
  const own = rules(css).filter(({ selector }) => selectorSays(selector, part));
  const findings = [];

  /**
   * The inline axis is the one every part owns: a paging control beside a
   * tab list or an overflow control in a toolbar is as tall as the row it
   * sits in, and that height may read the control scale; its width may not.
   */
  const rest = own.filter(
    ({ selector, media }) => atRest(selector) && !media.includes(COARSE_QUERY),
  );
  const widths = rest.flatMap(({ declarations }) =>
    ['inline-size', 'min-inline-size']
      .filter((property) => property in declarations)
      .map((property) => expand(declarations[property], privates)),
  );
  const sizes = rest.flatMap(({ declarations }) =>
    ['inline-size', 'min-inline-size', 'block-size', 'min-block-size']
      .filter((property) => property in declarations)
      .map((property) => expand(declarations[property], privates)),
  );
  if (!widths.some((value) => value.includes('--slotted-control-icon-size-'))) {
    findings.push('is not sized from --slotted-control-icon-size-*');
  }
  if (!widths.some((value) => value.includes('--slotted-control-inner-size-'))) {
    findings.push('is not capped at --slotted-control-inner-size-*');
  }
  if (widths.some((value) => /--slotted-control-height-/.test(value))) {
    findings.push('is sized from a control height');
  }

  for (const { selector, declarations } of rest) {
    const border = declarations.border;
    if (border !== undefined && !/^(?:0|none)$/.test(border)) {
      findings.push(`draws a frame at rest (${selector})`);
    }
    const shadow = declarations['box-shadow'];
    if (shadow !== undefined && shadow !== 'none') {
      findings.push(`draws a shadow at rest (${selector})`);
    }
  }
  if (!rest.some(({ declarations }) => declarations.padding === '0')) {
    findings.push("keeps the user agent's button padding, which squeezes the glyph");
  }
  const ground = rest.some(({ declarations }) =>
    /^(?:transparent|none)$/.test(
      declarations['background-color'] ?? declarations.background ?? '',
    ),
  );
  if (!ground) findings.push('paints a ground at rest');

  for (const state of ['hover', 'active']) {
    const moves = own.filter(({ selector }) => new RegExp(`:${state}\\b`).test(selector));
    if (moves.length === 0) {
      findings.push(`has no ${state} rule`);
      continue;
    }
    for (const { selector, declarations } of moves) {
      const extra = Object.keys(declarations).filter((property) => property !== 'background-color');
      if (extra.length > 0) {
        findings.push(`${state} moves ${extra.join(', ')} as well as the ground (${selector})`);
      }
    }
  }

  const ring = own.some(
    ({ selector, declarations }) =>
      /:focus-visible/.test(selector) &&
      /--slotted-focus-ring-color/.test(declarations.outline ?? ''),
  );
  if (!ring) findings.push('has no focus ring of its own');

  const boxReaches = sizes.some((value) => value.includes('--slotted-target-min'));
  const haloReaches = own.some(
    ({ selector, declarations }) =>
      PSEUDO.test(selector) &&
      declarations.position === 'absolute' &&
      /--slotted-target-min/.test(declarations.inset ?? ''),
  );
  if (!boxReaches && !haloReaches) findings.push('reaches no 24px target');

  return findings;
}

for (const { family, part } of PARTS) {
  test(`${family}: [data-part-${part.toLowerCase()}] is an inner control, not a button (R2)`, () => {
    const findings = audit(family, part);
    assert.deepEqual(
      findings,
      [],
      `${family} [data-part-${part.toLowerCase()}]:\n  ${findings.join('\n  ')}`,
    );
  });
}

for (const family of FLOORED) {
  test(`${family}: the glyph never falls under the family's floor (SL3)`, () => {
    const css = stylesheet(family);
    const privates = privateProperties(css);
    const floor = privates.get('--_icon-floor');
    assert.deepEqual(
      floor,
      [`var(--slotted-${family}-icon-size-min, 14px)`],
      `${family} states no --_icon-floor of 14px`,
    );
    const sizes = privates.get('--_icon-size') ?? [];
    assert.ok(sizes.length >= 1, `${family} states no --_icon-size`);
    for (const value of sizes) {
      assert.match(
        value,
        /^max\(var\(--_icon-floor\), var\(--slotted-control-icon-size-(?:sm|md|lg), \d+px\)\)$/,
        `${family}: --_icon-size "${value}" is not floored`,
      );
    }
  });
}

const COMFORTABLE = /--slotted-target-comfortable/;

function coarseAudit(family, part) {
  const all = rules(withoutForcedColors(stylesheet(family))).filter(({ selector }) =>
    selectorSays(selector, part),
  );
  const coarse = all.filter(({ media }) => media.includes(COARSE_QUERY));
  const boxes = coarse.filter(({ selector }) => !PSEUDO.test(selector));
  const findings = [];

  const reads = (declarations, ...properties) =>
    properties.some((property) => COMFORTABLE.test(declarations[property] ?? ''));

  const boxReaches =
    boxes.some(({ declarations }) => reads(declarations, 'inline-size', 'min-inline-size')) &&
    boxes.some(({ declarations }) => reads(declarations, 'block-size', 'min-block-size'));

  /* The pseudo-element that reaches the size, and the rule that draws it. */
  const halos = coarse.filter(
    ({ selector, declarations }) =>
      PSEUDO.test(selector) && reads(declarations, 'inset', 'inset-inline'),
  );
  const drawn = halos.some(({ selector }) => {
    const kind = PSEUDO.exec(selector)[0];
    return all.some(
      ({ selector: other, declarations }) =>
        other.includes(kind) &&
        declarations.position === 'absolute' &&
        declarations.content !== undefined,
    );
  });
  const contained = all.some(
    ({ selector, declarations }) =>
      !PSEUDO.test(selector) && /^(?:relative|absolute)$/.test(declarations.position ?? ''),
  );
  const both = halos.some(({ declarations }) => reads(declarations, 'inset'));
  /* A stacked half reaches the comfortable size in the inline axis only; its
     block axis is its share of the column, set outside the coarse query, and
     no coarse rule grows it into the other half. */
  const stacked =
    STACKED.has(family) &&
    halos.some(
      ({ selector, declarations }) =>
        selector.includes('[data-part-stepper]') &&
        (declarations['inset-block'] ?? '0') === '0' &&
        reads(declarations, 'inset-inline'),
    );
  const haloReaches = drawn && contained && both && (!STACKED.has(family) || stacked);

  if (!boxReaches && !haloReaches) {
    findings.push('reaches no --slotted-target-comfortable target on a coarse pointer');
  }

  for (const { selector, declarations } of boxes) {
    if (declarations['background-clip'] === 'content-box') {
      findings.push(`clips its ground to the content box on a coarse pointer (${selector})`);
    }
    for (const [block, inline] of [
      ['block-size', 'inline-size'],
      ['min-block-size', 'min-inline-size'],
      ['padding-block', 'padding-inline'],
    ]) {
      if (block in declarations && declarations[inline] !== declarations[block]) {
        findings.push(`grows ${block} alone on a coarse pointer (${selector})`);
      }
    }
  }

  return findings;
}

for (const { family, part } of COARSE) {
  test(`${family}: [data-part-${part.toLowerCase()}] is a comfortable target on a coarse pointer, drawn no taller than wide (R2.6)`, () => {
    const findings = coarseAudit(family, part);
    assert.deepEqual(
      findings,
      [],
      `${family} [data-part-${part.toLowerCase()}]:\n  ${findings.join('\n  ')}`,
    );
  });
}

test('reads the rules it guards', () => {
  const guarded = PARTS.flatMap(({ family, part }) =>
    rules(withoutForcedColors(stylesheet(family))).filter(({ selector }) =>
      selectorSays(selector, part),
    ),
  );
  assert.ok(guarded.length >= 80, `Expected the inner-control rules, found ${guarded.length}`);
});
