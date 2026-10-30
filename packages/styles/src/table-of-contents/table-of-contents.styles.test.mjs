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

const css = readFileSync(new URL('./table-of-contents.css', import.meta.url), 'utf8');
const harness = withoutSelectorKeys(
  readFileSync(new URL('./table-of-contents.harness.html', import.meta.url), 'utf8'),
);
const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/table-of-contents/contract.json', import.meta.url),
    'utf8',
  ),
);

const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');

/** The `selector { body }` pairs of the sheet, innermost first, at-rules skipped. */
function rules(source) {
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, selector, body]) => ({ selector: selector.replace(/\s+/g, ' ').trim(), body }))
    .filter(({ selector }) => !selector.startsWith('@'));
}

test('stages every part the contract declares', () => {
  for (const part of contract.members.tableOfContents.parts) {
    assert.ok(harness.includes(`data-part="${part}"`), `${part} is never rendered`);
  }
  for (const layout of contract.axes.layout) {
    assert.ok(harness.includes(`data-layout="${layout}"`), `${layout} is never rendered`);
  }
  assert.ok(harness.includes('data-open=""'));
  assert.ok(harness.includes('data-loading=""'));
  assert.ok(harness.includes('data-numbered=""'));
});

/**
 * The track is a rule the list stands beside and the marker a part that
 * travels along it. Neither is written in a rule that names a state, which is
 * what `state-rail.test.mjs` (R1) refuses: the current link is said by its
 * ink and weight, and the track and the marker are drawn whether or not
 * anything is current.
 */
test('draws the track and the marker outside every state rule', () => {
  const track = rules(bare).filter(({ body }) =>
    /border-inline-start:|linear-gradient\(var\(--_track\)/.test(body),
  );
  assert.ok(track.length >= 2, 'the track is drawn nowhere');
  for (const { selector } of track) {
    assert.doesNotMatch(
      selector,
      /data-current|aria-current/,
      `${selector} draws the track for a state`,
    );
  }
  const marker = rules(bare).filter(({ selector }) => selector.includes('[data-part-marker]'));
  for (const { selector } of marker) {
    assert.doesNotMatch(selector, /data-current/, `${selector} keys the marker on a state`);
  }
  const current = rules(bare).find(
    ({ selector }) => selector === '[data-ui-table-of-contents] [data-part-link][data-current]',
  );
  assert.ok(current, 'the current link has no rule');
  assert.match(current.body, /color: var\(--_current\)/);
  assert.match(current.body, /font-weight/);
});

/**
 * The bar is a scroll container and a scroll container clips on both axes,
 * so a border with a marker hung over it would cut the marker off. The track
 * is the panel's background instead, and the panel keeps the track's height
 * under its content for the marker to stand on.
 */
test('paints the horizontal track as a background the marker can stand on', () => {
  const panel = rules(bare).find(
    ({ selector }) =>
      selector === "[data-ui-table-of-contents][data-layout='horizontal'] > [data-part-panel]",
  );
  assert.ok(panel);
  assert.match(panel.body, /background: linear-gradient\(var\(--_track\), var\(--_track\)\)/);
  assert.match(panel.body, /padding-block-end: var\(--_track-width\)/);
  assert.doesNotMatch(panel.body, /border-block-end/);
  const marker = rules(bare).find(
    ({ selector }) =>
      selector === "[data-ui-table-of-contents][data-layout='horizontal'] [data-part-marker]",
  );
  assert.match(marker.body, /inset-block-end: 0;/);
});

/** The bar shows the first level only, as Ant's horizontal Anchor does, and says so where it scrolls past its room. */
test('hides the groups in the bar and fades the edge it continues past', () => {
  assert.match(bare, /\[data-layout='horizontal'\] \[data-part-group\] \{\s*display: none;/);
  for (const side of ['start', 'end', 'both']) {
    assert.ok(bare.includes(`[data-overflow='${side}']`), `${side} overflow paints no fade`);
  }
  assert.match(bare, /--_fade-angle: 270deg/);
});

/** Where the page's chrome ends is read from the property `page` publishes and never measured here. */
test('pins the sticky column under the page chrome by the published property', () => {
  const sticky = rules(bare).find(
    ({ selector }) => selector === '[data-ui-table-of-contents][data-sticky]',
  );
  assert.match(
    sticky.body,
    /--_sticky-inset: var\(--slotted-table-of-contents-sticky-inset, var\(--slotted-space-5, 0.75rem\)\)/,
  );
  assert.match(
    sticky.body,
    /inset-block-start: calc\(var\(--slotted-page-sticky-top, 0px\) \+ var\(--_sticky-inset\)\)/,
  );
  assert.match(
    sticky.body,
    /max-block-size: calc\(100dvh - var\(--slotted-page-sticky-top, 0px\) - var\(--_sticky-inset\)\)/,
  );
  assert.match(sticky.body, /position: sticky/);
});

/** A weaker state holds itself back for the stronger one it can meet: hover never repaints the current link. */
test('holds hover and active back for current', () => {
  for (const { selector } of rules(bare)) {
    if (!/:hover|:active(?![-\w])/.test(selector)) continue;
    assert.ok(selector.includes(':not([data-current])'), `${selector} repaints the current link`);
  }
});

test('draws nothing while empty and rows of skeleton while loading', () => {
  assert.match(bare, /\[data-empty\]:not\(\[data-loading\]\) \{\s*display: none;/);
  assert.match(
    bare,
    /\[data-part-skeleton\] > \[data-ui-skeleton\] \{\s*--slotted-skeleton-block-size: var\(--_font-size\)/,
  );
});

/** The numbering is a counter per level, so a nested clause reads 2.1 and a top-level one 2. */
test('numbers with counters that reset per level', () => {
  assert.match(
    bare,
    /\[data-numbered\] :is\(\[data-part-list\], \[data-part-group\]\) \{\s*counter-reset: slotted-table-of-contents;/,
  );
  assert.match(bare, /content: counters\(slotted-table-of-contents, '\.'\) '\.';/);
});

/** The collapsed layer arrives along the axis it opens on and keeps only its fade under reduced motion (R7). */
test('lets the collapsed layer arrive downward and drops the movement under reduced motion', () => {
  assert.match(
    bare,
    /@keyframes slotted-table-of-contents-enter \{\s*from \{\s*opacity: 0;\s*translate: 0 calc\(-1 \* var\(--_enter-distance\)\);/,
  );
  assert.match(
    bare,
    /@media \(prefers-reduced-motion: reduce\) \{\s*@keyframes slotted-table-of-contents-enter \{\s*from \{\s*opacity: 0;\s*\}/,
  );
});
