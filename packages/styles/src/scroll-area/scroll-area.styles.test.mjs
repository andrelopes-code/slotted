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

const source = readFileSync(new URL('./scroll-area.css', import.meta.url), 'utf8');

/**
 * A comment is not a rule, and this sheet's comments name the very declarations
 * the rules below refuse — the field's `::-webkit-scrollbar`, the
 * `scrollbar-width: none` every other implementation writes, the `[dir='rtl']`
 * this one does not use. Read whole, the file reported itself as three defects
 * it does not have. `packages/styles/src/states.test.mjs` records the same
 * mistake, made the same way.
 */
const css = source.replace(/\/\*[\s\S]*?\*\//g, ' ');
const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/scroll-area/contract.json', import.meta.url),
    'utf8',
  ),
);
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./scroll-area.harness.html', import.meta.url), 'utf8'),
);

/**
 * The whole of the family's headline decision, in one declaration each. A later
 * pass that reaches for a drawn thumb has to delete these.
 */
test('themes the platform scrollbar rather than hiding it', () => {
  assert.match(css, /scrollbar-color:\s*var\(--_thumb\) var\(--_track\)/);
  assert.match(css, /scrollbar-width:\s*thin/);

  assert.doesNotMatch(
    css,
    /::-webkit-scrollbar/,
    'the native bar is never hidden under a drawn one',
  );
  assert.doesNotMatch(
    css,
    /\[data-part-(?:scrollbar|thumb|corner)\]/,
    'a drawn scrollbar has parts, and this family draws none',
  );
});

/**
 * `scrollbar-width: none` removes the bar and nothing else: the content still
 * scrolls by wheel, by touch, by keyboard and by `scrollTo`. It is reachable
 * only through the axis, never as the family's own default.
 */
test('removes the bar only where the consumer asked for it', () => {
  const hidden = /\[data-scrollbars='none'\][^{]*\{[^}]*scrollbar-width:\s*none/;
  assert.match(css, hidden);
  assert.equal(
    [...css.matchAll(/scrollbar-width:\s*none/g)].length,
    1,
    'the bar is removed in exactly one rule, and that rule is the axis',
  );
});

/**
 * The veil is a mask, so it covers everything the element paints. Two rules
 * follow from that and both were found in a capture rather than in a test.
 */
test('keeps the veil off the frame and off the focus ring', () => {
  const maskRule =
    /\[data-ui-scroll-area\] > \[data-part-viewport\] \{[\s\S]*?mask-composite: intersect;/;
  assert.match(css, maskRule, 'the mask is on the viewport');
  assert.doesNotMatch(
    css,
    /\[data-ui-scroll-area\] \{[^}]*mask-image/,
    'a mask on the root fades the border the consumer put there',
  );

  const focus =
    /\[data-ui-scroll-area\]:has\(\s*> \[data-part-viewport\]:focus-visible\[data-focus-origin='keyboard'\]\s*\) \{[^}]*outline:/;
  assert.match(css, focus, 'the ring is drawn by the element the mask is not on');
  assert.doesNotMatch(
    css,
    /\[data-part-viewport\]:focus-visible \{[^}]*outline:/,
    'a ring on the masked element is a ring the veil cuts',
  );
});

/**
 * A gradient cannot be given a logical direction, so the two physical inline
 * lengths swap once, in one rule. Every other rule states the logical edge.
 *
 * Without it a right-to-left document veils the edge the reader can already
 * see, which the RTL capture is what showed.
 */
test('mirrors the inline veil, once, with a selector that reads the direction', () => {
  assert.match(
    css,
    /:dir\(rtl\) > \[data-part-viewport\] \{\s*--_fade-left: var\(--_scroll-area-fade-inline-end\);\s*--_fade-right: var\(--_scroll-area-fade-inline-start\);/,
  );
  assert.doesNotMatch(css, /\[dir='rtl'\]/, 'an attribute misses a direction set in CSS');
});

/**
 * The four lengths are registered so they interpolate: an unregistered custom
 * property animates discretely, and the veil would snap.
 */
test('registers the four lengths so the veil moves rather than appears', () => {
  for (const edge of ['block-start', 'block-end', 'inline-start', 'inline-end']) {
    assert.match(css, new RegExp(`@property --_scroll-area-fade-${edge}`));
  }
  assert.equal(
    [...css.matchAll(/syntax: '<length-percentage>'/g)].length,
    4,
    'a percentage is how the reach is capped against a short box, so the type has to allow one',
  );
});

/**
 * A veil that is a fifth of a tall panel is a third of a short one, and at a
 * third it stops being a hint. `splitter` caps its own gaps the same way.
 */
test('caps the veil against the box it is drawn in', () => {
  assert.match(css, /--_fade: min\(var\(--slotted-scroll-area-fade-size[\s\S]*?\), 20%\)/);
});

/**
 * `docs/component-features.md` §4 names printing in this family's own sentence,
 * and no surveyed implementation answers it.
 */
test('prints the whole content rather than the visible slice', () => {
  const print = css.slice(css.indexOf('@media print'));
  assert.match(print, /max-block-size: none/);
  assert.match(print, /overflow: visible/);
  assert.match(print, /mask-image: none/);
});

/**
 * The system owns the palette under forced colors, and a veil over system text
 * is a legibility loss with nothing bought.
 */
test('gives the palette back under forced colors', () => {
  const forced = css.slice(css.indexOf('@media (forced-colors: active)'));
  assert.match(forced, /mask-image: none/);
  assert.match(forced, /scrollbar-color: auto/);
});

/**
 * The fragment is the third place this family's DOM is written, and it drifts.
 * Every part the contract declares has to appear in it, and so does every value
 * of every axis — a scene the harness cannot photograph is a decision nobody
 * looked at.
 */
test('exercises every part and every axis value in the harness', () => {
  for (const part of contract.members.scrollArea.parts) {
    if (part === 'root') continue;
    assert.ok(fragment.includes(`data-part="${part}"`), `no scene renders ${part}`);
  }

  const axes = {
    'data-axis': ['block', 'inline', 'both'],
    'data-scrollbars': ['auto', 'always', 'hover', 'none'],
    'data-gutter': ['auto', 'stable', 'both-edges'],
    'data-fade': ['both', 'end', 'none'],
  };
  for (const [attribute, values] of Object.entries(axes)) {
    for (const value of values) {
      assert.ok(
        fragment.includes(`${attribute}="${value}"`),
        `no scene renders ${attribute}="${value}"`,
      );
    }
  }

  for (const edge of contract.edges.attributes) {
    assert.ok(fragment.includes(edge), `no scene renders ${edge}`);
  }
});

/**
 * `overscroll-behavior` is per axis, and an axis the area does not scroll on
 * still counts: Chrome kept the page's wheel inside a one-line code block
 * whose viewport was `overflow-y: hidden` under `contain`. The axis that does
 * not scroll lets the wheel through, whatever chaining the area chose.
 */
test('lets the wheel through on the axis it does not scroll', () => {
  const flat = css.replace(/\s+/g, '');
  const inline =
    "[data-ui-scroll-area][data-axis='inline']>[data-part-viewport]{overscroll-behavior-y:auto;overscroll-behavior-block:auto;}";
  const block =
    "[data-ui-scroll-area][data-axis='block']>[data-part-viewport]{overscroll-behavior-x:auto;overscroll-behavior-inline:auto;}";
  assert.ok(flat.includes(inline), 'an inline area passes the vertical wheel on');
  assert.ok(flat.includes(block), 'a block area passes the horizontal wheel on');
  const lastChaining = Math.max(
    flat.lastIndexOf("[data-overscroll='auto']"),
    flat.lastIndexOf("[data-overscroll='none']"),
  );
  assert.ok(flat.indexOf(inline) > lastChaining, 'the axis rule wins over a chosen `none`');
});

/**
 * A click on a non-interactive descendant focuses the region, and the next
 * Shift makes it match `:focus-visible`; the ring follows the origin the
 * binding writes (`createFocusOrigin`), not the browser heuristic.
 */
test('draws the viewport ring for a focus from the keyboard only', () => {
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)].map((m) =>
    m[1].replace(/\s+/g, ' ').trim(),
  );
  const ring = rules.filter(
    (selector) => selector.includes('[data-part-viewport]') && selector.includes(':focus-visible'),
  );
  assert.ok(ring.length > 0, 'the region has a ring');
  for (const selector of ring) {
    assert.match(selector, /:focus-visible\[data-focus-origin='keyboard'\]/, selector);
  }
  const flat = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  assert.ok(
    flat.includes('[data-part-viewport]:focus { outline: none; }'),
    'the browser’s own ring is suppressed for a focus from the pointer',
  );
});
