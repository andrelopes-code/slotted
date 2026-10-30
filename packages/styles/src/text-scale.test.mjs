import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * R7: no transition and no animation scales a box that holds text or hosts
 * layout. Scaling a box of text resamples the text and everything moving with
 * it — the letters shimmer and the composition reads as though it were sliding
 * — which is what the dialog panel did on the way in, at `0.98` → `1`, with a
 * title, a body and a row of buttons inside it.
 *
 * Scale stays for what has no text in it: a pulse ring, a dot, a thumb. It is
 * the distinction CK6 already drew when it revoked the scale of the checkbox's
 * mark and kept the one on the radio's dot, and the four boxes that failed it
 * — the dialog panel, the toast pile, the raised avatar and the stepper's
 * marker — say the same state now by opacity, by a translate or by their own
 * ground.
 *
 * A mirror is not motion: `scale: -1 1` turns a chevron around in a
 * right-to-left document and nothing travels, so the four families that write
 * one are not read as scaling anything.
 *
 * The exceptions are named one at a time, as `focus-ring.test.mjs` and
 * `state-rail.test.mjs` name theirs, and each one names the box it is about.
 */
const DECORATIVE = new Map([
  [
    'radio-group/indicator',
    'the dot: a masked circle, no text, grown in from 0.6 — the movement CK6 kept',
  ],
  [
    'result-state/media',
    'the illustration: an aria-hidden drawing around one glyph, never text — a tile settled in from 0.96 and a stack drawn sheared and narrowed at rest',
  ],
  ['slider/thumb', 'the thumb: an empty control the press grows under the finger'],
  [
    'tabs/marker',
    'the bar under the selected tab: an empty aria-hidden box, never text, slid by translate and scale from the box it was drawn in so the compositor runs it while the panel renders — 0 frames by left and inline-size against 13 with the main thread busy 300 ms',
  ],
  [
    'progress-indicator/indicator',
    'the travelling bar of an indeterminate linear indicator: an empty box, never text, scaled along the track so the compositor runs it while the main thread is busy',
  ],
  [
    'carousel/previous',
    'the round previous control: one aria-hidden Glyph named by aria-label, settled to 0.94 under the press',
  ],
  [
    'carousel/next',
    'the round next control: one aria-hidden Glyph named by aria-label, settled to 0.94 under the press',
  ],
  [
    'carousel/autoplay',
    'the round rotation control: one aria-hidden Glyph named by aria-label, settled to 0.94 under the press',
  ],
  [
    'color-picker/area-thumb',
    'the thumbs of the area and the channels: discs of colour with no text, grown to 1.15 while the pointer drags them',
  ],
  [
    'color-picker/preset',
    'a preset swatch: a square of colour with no text, its name in aria-label, lifted to 1.08 under the pointer and settled to 0.94 under the press',
  ],
  [
    'message/caret',
    'the streaming dot: an aria-hidden empty span and never text, grown in from 0 and breathing to 0.72',
  ],
  [
    'prompt-composer/submit',
    'the round send: a glyph box named by aria-label, settled to 0.9 under the press — the padded send that holds words is excluded by its selector',
  ],
  [
    'cascader/indicator',
    'the check of a single-selection node: one aria-hidden Glyph and never text, grown in from 0.8 as the node is chosen',
  ],
  [
    'menu/indicator',
    'the check or the dot of a menu item: one aria-hidden Glyph and never text, grown in from 0.8 as the item is checked',
  ],
  [
    'icon/(root)',
    'a glyph box: one aria-hidden svg and never text — text-field grows the new mark in from 0.8 when copy turns to a check and an eye to a crossed eye',
  ],
  [
    'text-field/busy',
    'the ring, the Caps Lock mark, the clear and the copy buttons inside the frame: glyph boxes with no text, grown in from 0.8 as they arrive and shrunk as they leave',
  ],
  [
    'rating/symbol',
    'the star and its lit copy: two glyph boxes with no text, lifted under the pointer and settled under the press',
  ],
  [
    'spinner/(root)',
    'the ring: an empty box painted with a mask, named by aria-label and never holding text, grown in from 0.6 on the frame the wait begins',
  ],
  ['status-indicator/mark::after', 'the pulse ring: an empty pseudo-element leaving the mark'],
]);

/** Values that turn a box around instead of resizing it. */
const MIRROR = /^-?1 -?1$|^-1$/;
const REST = /^(?:1|1 1|none)$/;

function stylesheets() {
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(join(source, entry.name))
        .filter((name) => name.endsWith('.css'))
        .map((name) => ({
          family: entry.name,
          path: join(entry.name, name),
          css: readFileSync(join(source, entry.name, name), 'utf8'),
        })),
    );
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Every innermost `selector { declarations }` pair, plus the `@keyframes`
 * blocks, which are the other place a scale is written.
 */
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
      if (open) {
        const body = css.slice(open.body, index);
        const declarations = body.slice(
          0,
          body.indexOf('{') === -1 ? undefined : body.indexOf('{'),
        );
        found.push({
          selector: open.selector.replace(/\s+/g, ' '),
          declarations,
          keyframes: stack.map((frame) => frame.selector).find((it) => it.startsWith('@keyframes')),
        });
      }
      start = index + 1;
    } else if (char === ';') {
      start = index + 1;
    }
  }
  return found;
}

function declaration(declarations, property) {
  const match = new RegExp(`(?:^|[;\\s])${property}\\s*:\\s*([^;]+)`).exec(declarations);
  return match ? match[1].replace(/\s+/g, ' ').trim() : undefined;
}

/** Splits a selector list on the commas that are not inside `[]` or `()`. */
function selectorList(selector) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < selector.length; index += 1) {
    const char = selector[index];
    if (char === '[' || char === '(') depth += 1;
    else if (char === ']' || char === ')') depth -= 1;
    else if (char === ',' && depth === 0) {
      parts.push(selector.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(selector.slice(start));
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

/** The compound after the last combinator: the element the rule is about. */
function lastCompound(selector) {
  let depth = 0;
  let start = 0;
  for (let index = 0; index < selector.length; index += 1) {
    const char = selector[index];
    if (char === '[' || char === '(') depth += 1;
    else if (char === ']' || char === ')') depth -= 1;
    else if (depth === 0 && /[\s>+~]/.test(char)) start = index + 1;
  }
  return selector.slice(start);
}

/**
 * The box a rule is about, named as the family and the part rather than as the
 * selector, so the rule that declares the scale and the rule that transitions
 * it resolve to one name however each was written.
 */
function box(family, selector) {
  const compound = lastCompound(selector);
  const ui = /\[data-ui-([a-z0-9-]+)\]/.exec(compound);
  const part = /\[data-part-([a-z0-9-]+)\]/.exec(compound);
  const pseudo = /::[a-z-]+/.exec(compound);
  return `${ui ? ui[1] : family}/${part ? part[1] : '(root)'}${pseudo ? pseudo[0] : ''}`;
}

/** Whether a rule's declarations resize the box rather than turn it around. */
function scales(declarations) {
  const value = declaration(declarations, 'scale');
  const transform = declaration(declarations, 'transform');
  if (value !== undefined && !REST.test(value) && !MIRROR.test(value)) return `scale: ${value}`;
  if (transform !== undefined && /(?:^|[\s(])scale[XYZ3d]*\(/.test(transform)) {
    return `transform: ${transform}`;
  }
  return undefined;
}

/** Every box in the package, with what is animated on it and what scales it. */
function survey() {
  const animated = new Set();
  const scaled = [];
  const movingFrames = new Set();
  const sheets = stylesheets().map((sheet) => ({
    ...sheet,
    parsed: rules(stripComments(sheet.css)),
  }));

  for (const { parsed } of sheets) {
    for (const { declarations, keyframes } of parsed) {
      if (keyframes === undefined || scales(declarations) === undefined) continue;
      movingFrames.add(/@keyframes\s+([\w-]+)/.exec(keyframes)[1]);
    }
  }

  for (const { family, path, parsed } of sheets) {
    for (const { selector, declarations, keyframes } of parsed) {
      if (keyframes !== undefined || selector.startsWith('@')) continue;
      const transition = [
        declaration(declarations, 'transition'),
        declaration(declarations, 'transition-property'),
      ]
        .filter(Boolean)
        .join(',');
      const animation = [
        declaration(declarations, 'animation'),
        declaration(declarations, 'animation-name'),
      ]
        .filter(Boolean)
        .join(',');
      const resized = scales(declarations);
      const frame = [...movingFrames].find((name) => animation.includes(name));

      for (const one of selectorList(selector)) {
        const name = box(family, one);
        if (/(?:^|[\s,])(?:scale|transform|all)(?:[\s,]|$)/.test(transition)) animated.add(name);
        if (frame !== undefined) {
          animated.add(name);
          scaled.push({ name, path, selector: one, value: `animation: ${frame}` });
        }
        if (resized !== undefined) scaled.push({ name, path, selector: one, value: resized });
      }
    }
  }

  return { animated, scaled };
}

test('no transition scales a box that holds text (R7)', () => {
  const { animated, scaled } = survey();
  const offenders = scaled
    .filter(({ name }) => animated.has(name) && !DECORATIVE.has(name))
    .map(({ name, path, selector, value }) => `${path}: ${selector} — ${name} — ${value}`);
  assert.deepEqual(
    offenders,
    [],
    `A scale animated on a box that holds text (R7):\n  ${offenders.join('\n  ')}`,
  );
});

test('every decorative exception is a scale the package still draws', () => {
  const { animated, scaled } = survey();
  const drawn = new Set(scaled.filter(({ name }) => animated.has(name)).map(({ name }) => name));
  for (const [name, reason] of DECORATIVE) {
    assert.ok(drawn.has(name), `${name} is named as an exception (${reason}) and scales nothing`);
  }
});

test('reads the scales it guards', () => {
  const { scaled } = survey();
  assert.ok(scaled.length >= 8, `Expected the families' scales, found ${scaled.length}`);
});
