import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * The fragment as its regular expressions read it: the selector keys the
 * stylesheet matches are left out, and every tag stands on one line, as it did
 * before the formatter wrapped the tags the keys made long.
 */
function withoutSelectorKeys(markup) {
  return markup
    .replace(/\s+data-(?:part|ui)-[a-z0-9-]+=""/g, '')
    .replace(/<[^<>]+>/g, (tag) => tag.replace(/\s+/g, ' ').replace(/ (\/?>)$/, '$1'));
}

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/image/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./image.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./image.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;

const rules = [...normalized.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(([, selector]) => !selector.includes('@'))
  .map(([, selector, body]) => ({
    selectors: selector.split(',').map((one) => one.trim()),
    body,
  }));

function rule(selector) {
  return rules.find((candidate) => candidate.selectors.includes(selector))?.body ?? '';
}

function selects(selector) {
  return rules.some((candidate) => candidate.selectors.includes(selector));
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
});

test('styles every part the contract declares', () => {
  for (const part of contract.members.image.parts) {
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

test('names the family and the part together, so a rule for the box stays on the box', () => {
  for (const selector of normalized.matchAll(/(^|\})([^{}]+)\{/g)) {
    for (const part of (selector[2] ?? '').split(',')) {
      if (!part.includes(`[data-part-root]`)) continue;
      assert.ok(part.includes(ui), `"${part.trim()}" reaches the root without naming the family`);
    }
  }
});

/**
 * A value is answered either by a rule of its own or by being the default the
 * base rule already states. `idle` and `loading` are the base rule itself —
 * the picture hidden and the ground showing, because there is nothing to show
 * yet — and `custom` on `position` is the token the instance wrote, read by
 * the base rule.
 */
test('answers every value of every axis the contract names', () => {
  const { defaults } = contract.members.image;
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      if (axis === 'status' && (value === 'idle' || value === 'loading')) continue;
      if (axis === 'position' && value === 'custom') continue;
      const answered =
        rules.some((candidate) =>
          candidate.selectors.some((one) => one.includes(`[data-${axis}='${value}']`)),
        ) || defaults[axis] === value;
      assert.ok(answered, `Missing ${axis} ${value}`);
    }
  }
});

/**
 * The layers reach their parts through a descendant selector and never a
 * child one, because the frame from `aspect-ratio` may stand between the
 * root and them, and the sheet writes no ratio of its own: that is the other
 * family's, composed rather than restated.
 */
test('composes the frame rather than restating it, and reaches its layers at either depth', () => {
  assert.ok(!normalized.includes('aspect-ratio:'), 'the ratio belongs to aspect-ratio');
  for (const part of ['image', 'placeholder', 'fallback']) {
    assert.ok(
      selects(`${root} [data-part-${part.toLowerCase()}]`),
      `${part} is not reached as a descendant`,
    );
    assert.ok(
      !normalized.includes(`> [data-part-${part.toLowerCase()}]`),
      `${part} is reached as a child`,
    );
  }
  assert.ok(rule(`${ui} [data-part-picture]`).includes('display:contents'));
});

/**
 * Three layouts, each a different answer to how wide and how tall the box
 * is: its own, its parent's, or its frame's. `framed` writes no block size,
 * which is the whole reason it exists apart from `fill`.
 */
test('takes its size from the picture, the parent, or the frame', () => {
  const base = rule(root);
  assert.ok(base.includes('inline-size:fit-content'));
  assert.ok(base.includes('max-inline-size:100%'));
  const fill = rule(`${root}[data-layout='fill']`);
  assert.ok(fill.includes('block-size:100%') && fill.includes('inline-size:100%'));
  const framed = rule(`${root}[data-layout='framed']`);
  assert.ok(framed.includes('inline-size:100%') && !framed.includes('block-size'));
});

/**
 * The fit and the focal point are private properties both the picture and
 * the blurred preview read, so the preview is cropped exactly where the
 * picture will be. The picture's rule names the root part, which is what puts
 * it above the frame's own `contain`.
 */
test('routes fit and position through one pair of properties the picture and the preview share', () => {
  for (const fit of contract.axes.fit) {
    if (fit === 'cover') continue;
    assert.ok(rule(`${root}[data-fit='${fit}']`).includes(`--_fit:${fit}`), `fit ${fit}`);
  }
  assert.ok(rule(root).includes('--_fit:cover'));
  const picture = rule(`${root} [data-part-image]`);
  assert.ok(picture.includes('object-fit:var(--_fit)'));
  assert.ok(picture.includes('object-position:var(--_position)'));
  const preview = rule(`${root}[data-placeholder='blur'] [data-part-placeholder] > img`);
  assert.ok(preview.includes('object-fit:var(--_fit)'));
  assert.ok(preview.includes('object-position:var(--_position)'));
  assert.ok(preview.includes('filter:blur('));
});

/**
 * `object-position` has no logical keywords, so `start` and `end` are the
 * family's and mirror under `dir="rtl"`. `custom` is the token on the
 * instance, read once in the base rule.
 */
test('mirrors the focal point with the writing direction', () => {
  assert.ok(rule(`${root}[data-position='start']`).includes('--_position:left'));
  assert.ok(rule(`${root}[data-position='end']`).includes('--_position:right'));
  assert.ok(rule(`${root}[data-position='start']:dir(rtl)`).includes('--_position:right'));
  assert.ok(rule(`${root}[data-position='end']:dir(rtl)`).includes('--_position:left'));
  assert.ok(rule(root).includes('--_position:var(--slotted-image-position,center)'));
});

/**
 * The picture arrives over the ground rather than replacing it between two
 * frames, on the motion scale the theme collapses under reduced motion; the
 * ground leaves on the same clock. Nothing loops.
 */
test('crosses the picture over the placeholder instead of swapping them', () => {
  const picture = rule(`${root} [data-part-image]`);
  assert.ok(picture.includes('opacity:0'));
  assert.ok(picture.includes('transition:opacity var(--slotted-duration-short)'));
  assert.ok(rule(`${root}[data-status='loaded'] [data-part-image]`).includes('opacity:1'));
  assert.ok(rule(`${root}[data-status='loaded'] [data-part-placeholder]`).includes('opacity:0'));
  assert.ok(!/animation/.test(normalized));
});

/**
 * The fallback is out of the flow until the picture fails, so content a
 * consumer puts in it is neither focusable nor announced while the picture
 * is fine; it has a minimum of its own because a picture that reserved
 * nothing and failed has no box. The glyph is an `Icon` the binding draws,
 * sized from the slot; the sheet paints no icon of its own.
 */
test('paints the fallback only in error, with a box of its own and the glyph sized', () => {
  const idle = rule(`${root} [data-part-fallback]`);
  assert.ok(idle.includes('display:none'));
  assert.ok(idle.includes('--slotted-icon-size:var(--slotted-image-glyph-size'));
  const failed = rule(`${root}[data-status='error'] [data-part-fallback]`);
  assert.ok(failed.includes('display:grid'));
  assert.ok(failed.includes('min-block-size:var(--slotted-image-fallback-min-size'));
  assert.ok(failed.includes('background-color:var(--_ground)'));
  assert.ok(!normalized.includes('mask-image'), 'the glyph is an element, not a mask');
  assert.ok(!/content:'[^']+'/.test(normalized), 'no character stands in for the glyph');
});

/**
 * The edge is a pseudo-element painted last, because an inset shadow on the
 * root is painted under the children and the picture covered it. Turning
 * `bordered` on writes the colour and moves nothing.
 */
test('draws the edge over the layers, and moves nothing when it is turned on', () => {
  const edge = rule(`${root}::after`);
  assert.ok(edge.includes('box-shadow:inset 0 0 0 var(--_edge-width) var(--_edge)'));
  assert.ok(edge.includes('grid-area:1 / 1'));
  assert.ok(edge.includes('pointer-events:none'));
  assert.ok(rule(`${root}[data-bordered]`).includes('--_edge:var(--slotted-border-subtle'));
  assert.ok(!rule(`${root}[data-bordered]`).includes('border-width'));
});

/**
 * An image is a picture, not a command, and paints nothing at rest. The three
 * interactive selectors are the ones the browser itself treats as interactive,
 * and a `<button disabled>` holds the hover back, as the shared states test
 * requires of every family.
 */
test('paints hover and focus for the link or button it can become', () => {
  assert.ok(
    rule(`button${root}:not(:disabled):hover`).includes('--_edge:var(--slotted-border-strong'),
  );
  assert.ok(rule(`${root}:any-link:not([data-disabled]):hover`).length > 0);
  assert.ok(rule(`${root}:focus-visible`).includes('outline:var(--slotted-focus-ring-width'));
  assert.ok(!/:active(?!\))/.test(normalized), 'a picture is not a momentary action');
});

test('exercises every axis value, both stand-ins, the interactive root and a real grid', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      if (axis === 'status' && value === 'idle') continue;
      assert.ok(fragment.includes(`data-${axis}="${value}"`), `no scene shows ${axis} ${value}`);
    }
  }
  for (const part of contract.members.image.parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `no scene renders ${part}`);
  }
  assert.ok(fragment.includes('data-bordered'));
  assert.ok(/<a\s+href="#"\s+data-ui="image"/.test(fragment), 'no scene makes the root a link');
  assert.ok(
    /<button\s+type="button"\s+data-ui="image"/.test(fragment),
    'no scene makes it a button',
  );
  for (const scene of contract.scenarios.image) {
    if (['playground', 'status', 'accessibility'].includes(scene)) continue;
    assert.ok(fragment.includes(`data-scene="${scene}"`), `no ${scene} scene`);
  }
});
