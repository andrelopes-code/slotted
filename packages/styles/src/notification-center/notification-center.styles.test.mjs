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
    new URL('../../../../specs/components/notification-center/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./notification-center.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./notification-center.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.notificationCenter;
const item = `${ui}>[data-part-feed] [data-part-item]`;

/**
 * Every declaration the selector receives, across every rule whose selector
 * list names it: the visual's disc and glyph share one geometry block and
 * each has a block of its own, and a reader that stopped at the first `{`
 * would see one of the two. A selector list is read as the list it is.
 */
function rule(selector) {
  const wanted = selector.split(',');
  return normalized
    .split('}')
    .map((block) => block.split('{').slice(-2))
    .filter(([selectors]) => {
      const list = selectors?.split(',') ?? [];
      return wanted.every((one) => list.includes(one));
    })
    .map(([, body]) => body ?? '')
    .join('');
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}{`), 'the family has no base rule keyed on data-ui');
});

test('styles every part the contract declares', () => {
  for (const declared of member.parts) {
    if (declared === 'root') continue;
    assert.ok(
      normalized.includes(`[data-part-${declared.toLowerCase()}]`),
      `no rule reaches the ${declared} part`,
    );
  }
});

test('renders every part the contract declares, in at least one scene', () => {
  for (const declared of member.parts) {
    assert.match(
      fragment,
      new RegExp(`data-part="${declared}"`),
      `${declared} appears in no scene`,
    );
  }
  assert.match(fragment, /role="feed"/);
  assert.match(fragment, /<article[^>]*data-part="item"[^>]*tabindex="0"/);
});

/**
 * The item is reached through the feed with a descendant combinator, because
 * it stands either directly in the feed or inside a group; every part inside
 * the item is reached from the item with a child combinator, because the
 * content the consumer projects is other families with parts of the same
 * names — a button has a `label`, a result-state a `title` and a `description`.
 */
test('reaches the parts inside an item with a child combinator', () => {
  for (const part of ['visual', 'content', 'controls']) {
    assert.ok(normalized.includes(`[data-part-item]>[data-part-${part.toLowerCase()}]`), part);
    assert.ok(
      !normalized.includes(`[data-part-item] [data-part-${part.toLowerCase()}]`),
      `descendant ${part}`,
    );
  }
  for (const part of ['title', 'description', 'time', 'actions']) {
    assert.ok(normalized.includes(`>[data-part-content]>[data-part-${part.toLowerCase()}]`), part);
  }
  for (const part of ['read-toggle', 'dismiss']) {
    assert.ok(normalized.includes(`>[data-part-controls]>[data-part-${part.toLowerCase()}]`), part);
  }
});

/**
 * Unread says so with a wash mixed from the tone's text at the highlight
 * share and the semibold title; there is no dot and no fill. Read stands on the surface with the regular weight. The
 * tone is the item's, accent by default.
 */
test('paints unread with a wash and weight, and read with neither', () => {
  const root = rule(ui);
  assert.match(root, /--_tone-solid:var\(--slotted-tone-accent-solid/);
  assert.match(
    root,
    /--_unread-ground:color-mix\(in oklab,var\(--_tone-text\) calc\(var\(--slotted-highlight-tint-opacity,0\.075\) \* 100%\),transparent\)/,
  );
  assert.match(rule(`${item}:not([data-read])`), /background-color:var\(--_unread-ground\)/);
  assert.match(
    rule(`${item}:not([data-read])>[data-part-content]>[data-part-title]`),
    /font-weight:var\(--slotted-font-weight-semibold/,
  );
  for (const tone of ['secondary', 'success', 'warning', 'danger']) {
    assert.match(rule(`${item}[data-tone='${tone}']`), new RegExp(`--slotted-tone-${tone}-solid`));
  }
  assert.doesNotMatch(normalized, /\[data-part-unread\]/);
  assert.match(fragment, /data-part="item"[^>]*\bdata-read\b/);
});

/**
 * A toned row without a consumer visual gets the family's: the tone's glyph
 * filled — the tone's surface as a disc under the ringed glyph, at the ring's
 * own radius on the icon grid, the two on one box so they are concentric by
 * construction. A disc with its own edge under a smaller ringed glyph was a
 * circle inside a circle that rounded apart; a bare glyph read as loose.
 * Every glyph is a circle; a triangle is refused in this library.
 */
test('draws the tone glyph as the visual when the consumer gives none', () => {
  const own = rule(`${item}>[data-part-visual][data-tone]:has(>[data-tone-glyph])`);
  assert.match(rule(`${item}>[data-part-visual]:empty:not([data-tone])`), /display:none/);
  assert.doesNotMatch(own, /border|background-color/, 'the box draws a disc with an edge again');
  assert.match(own, /color:var\(--_tone-text\)/);
  assert.match(own, /block-size:var\(--_visual\)/);
  assert.match(own, /--slotted-icon-size:var\(--_visual-glyph\)/);
  assert.match(own, /justify-content:center/);
  assert.doesNotMatch(normalized, /mask|--_tone-glyph|\[data-part-visual\][^{]*::(before|after)/);
  const disc = own.replace(/\s+/g, '');
  assert.match(
    disc,
    /background-image:radial-gradient\(circle,var\(--_tone-surface\)calc\(var\(--_visual-glyph\)\*9\.5\/24-0\.5px\),transparentcalc\(var\(--_visual-glyph\)\*9\.5\/24\+0\.5px\)\)/,
    'the disc is not the ring radius on the grid',
  );
  assert.match(rule(ui), /--_visual-glyph:calc\(var\(--_visual\) \* 6 \/ 7\)/);
  assert.doesNotMatch(normalized, /--_tone-on-solid/);
  assert.doesNotMatch(normalized, /icon-triangle/);
  assert.match(
    rule(`${item}:not(:has(>[data-part-visual]))>[data-part-content]`),
    /grid-column:1 \/ 3/,
  );
  assert.match(rule(ui), /--_visual:var\(--slotted-avatar-size-sm,28px\)/);
  const visuals = [
    ...fragment.matchAll(
      /<span data-part="visual" data-tone="([a-z]+)"\s*>\s*<span data-ui="icon" data-part="root" data-tone-glyph="" aria-hidden="true"\s*>\s*<svg data-part="glyph" data-glyph="([a-z-]+)"/g,
    ),
  ];
  assert.ok(visuals.length > 0, 'the fragment draws no family visual');
  for (const [, tone, glyph] of visuals) {
    assert.equal(
      glyph,
      contract.toneGlyph[tone],
      `${tone} draws a glyph the contract does not name`,
    );
  }
  assert.match(
    rule(`${item}>[data-part-content]`),
    /margin-block-start:max\(0px,calc\(\(var\(--_visual\) - 1lh\) \/ 2\)\)/,
  );
});

/** The two controls the family draws: Glyph elements, a box on the inner-control scale, a halo to the target minimum. */
test('draws its two controls as Glyph elements on the inner-control scale', () => {
  const controls = `${item}>[data-part-controls]`;
  assert.match(rule(`${controls}>button`), /--slotted-icon-size:var\(--_glyph\)/);
  assert.doesNotMatch(normalized, /button::after/);
  for (const [part, glyphs] of [
    ['read-toggle', /^(check|dot)$/],
    ['dismiss', /^x$/],
  ]) {
    const drawn = [
      ...fragment.matchAll(
        new RegExp(
          `data-part="${part}"[^>]*>\\s*<span data-ui="icon" data-part="root" aria-hidden="true"\\s*>\\s*<svg data-part="glyph" data-glyph="([a-z-]+)"`,
          'g',
        ),
      ),
    ];
    assert.equal(
      drawn.length,
      (fragment.match(new RegExp(`data-part="${part}"`, 'g')) ?? []).length,
    );
    for (const [, glyph] of drawn) assert.match(glyph, glyphs, part);
  }
  assert.match(
    rule(ui),
    /--_control:min\(calc\(var\(--_glyph\) \+ 2 \* var\(--slotted-space-2,0\.25rem\)\),var\(--slotted-control-inner-size-md,24px\)\)/,
  );
  assert.match(
    rule(`${controls}>button::before`),
    /max\(var\(--_control\),var\(--slotted-target-min,24px\)\)/,
  );
  assert.doesNotMatch(normalized, /content:'[^']/);
});

/** A title that is a link covers the row; the controls stand above it. */
test('lets a linked title take the whole row and keeps the controls above it', () => {
  assert.match(
    rule(`${item}>[data-part-content]>a[data-part-title]::after`),
    /inset:0;position:absolute/,
  );
  assert.match(rule(`${item}>[data-part-controls]`), /z-index:1/);
  assert.match(rule(`${item}>[data-part-content]>[data-part-actions]`), /z-index:1/);
  assert.match(rule(item), /position:relative/);
});

test('clamps the title at two lines and the description at three, keeping the text', () => {
  assert.match(
    rule(`${item}>[data-part-content]>[data-part-title]`),
    /-webkit-line-clamp:var\(--slotted-notification-center-title-clamp,2\)/,
  );
  assert.match(
    rule(`${item}>[data-part-content]>[data-part-description]`),
    /-webkit-line-clamp:var\(--slotted-notification-center-description-clamp,3\)/,
  );
  assert.doesNotMatch(normalized, /text-overflow/);
});

/** The article is in the tab sequence and its ring is drawn inward, because the rows touch. */
test('draws the article ring inward and the controls ring outward', () => {
  assert.match(
    rule(`${item}:focus-visible`),
    /outline-offset:calc\(var\(--slotted-focus-ring-offset,2px\) \* -1\)/,
  );
  assert.match(
    rule(`${item}>[data-part-controls]>button:focus-visible`),
    /outline-offset:var\(--slotted-focus-ring-offset,2px\)/,
  );
});

/** Fresh and more are pills on the control scale, fresh in the accent pair, as timeline draws the same two. */
test('draws fresh in the accent pair and more in the secondary', () => {
  assert.match(
    rule(`${ui}>[data-part-fresh]`),
    /background-color:var\(--slotted-tone-accent-surface/,
  );
  assert.match(rule(`${ui}>[data-part-fresh]:enabled:hover`), /--slotted-tone-accent-subtle-hover/);
  assert.match(rule(`${ui}>button[data-part-more]:enabled:hover`), /--_hover/);
  assert.match(rule(`${ui}>div[data-part-more]`), /text-align:center/);
});

/** Two sizes: the popover's and the page's. */
test('offers two sizes on the control and type scales', () => {
  assert.match(
    rule(ui),
    /--_title-size:var\(--slotted-notification-center-title-size-md,var\(--slotted-font-size-lg/,
  );
  assert.match(
    rule(`${ui}[data-size='sm']`),
    /--slotted-notification-center-title-size-sm,var\(--slotted-font-size-md/,
  );
  assert.match(rule(`${ui}[data-size='sm']`), /--slotted-control-inner-size-sm/);
});

/**
 * A host that bounds the center — a popover under the bell — bounds the feed
 * alone: the header, the views and the footer stay where they are and the
 * feed scrolls between them, with the bar `scroll-area` draws. A host that
 * gives no height, a page, gets the whole feed and no bar.
 */
test('scrolls the feed alone when the host bounds it', () => {
  const feed = rule(`${ui}>[data-part-feed]`);
  assert.match(feed, /flex:1 1 auto/);
  assert.match(feed, /min-block-size:0/);
  assert.match(feed, /overflow-y:auto/);
  assert.match(feed, /overscroll-behavior:contain/);
  assert.match(feed, /scrollbar-gutter:stable/);
  assert.match(feed, /scrollbar-width:thin/);
  assert.match(feed, /scrollbar-color:var\(--_scrollbar-thumb\) var\(--_scrollbar-track\)/);
});

/**
 * A finger is not a pointer: the family's own controls grow to the
 * comfortable target under a coarse pointer, as the theme does for the
 * controls it owns, and the taller box is centerd on the visual's axis.
 */
test('raises its own controls to the comfortable target on a finger', () => {
  const coarse = normalized.slice(normalized.indexOf('@media (pointer:coarse)'));
  const controls = coarse
    .split(`${ui}>[data-part-feed] [data-part-item]>[data-part-controls]{`)[1]
    ?.split('}')[0];
  assert.ok(controls, 'the controls keep the pointer size on a finger');
  assert.match(controls, /--_control:var\(--slotted-target-comfortable,44px\)/);
  assert.match(
    controls,
    /margin-block-start:calc\(\(var\(--_visual\) - var\(--_control\)\) \/ 2\)/,
  );
});

/** Below 320 pixels the controls drop under the content rather than squeezing it; the media queries are forced colors and the coarse pointer. */
test('answers its own width and never the viewport', () => {
  assert.match(rule(ui), /container-name:notification-center/);
  assert.match(rule(ui), /container-type:inline-size/);
  assert.match(normalized, /@container notification-center \(max-width:319px\)/);
  assert.doesNotMatch(normalized, /@media \((?:min|max)-width/);
  assert.match(normalized, /@media \(forced-colors:active\)/);
});

/** The count is a chip with an edge, so it stays a chip where the sunken surface is the page's white. */
test('gives the count an edge in the ink and the highlight pair under forced colors', () => {
  assert.match(
    rule(`${ui} [data-part-count]`),
    /border:var\(--slotted-border-width-thin,1px\) solid color-mix\(in oklab,currentcolor 20%,transparent\)/,
  );
  assert.match(
    normalized,
    /\[data-part-count\]\{background-color:Highlight;border-color:Highlight;color:HighlightText;forced-color-adjust:none;\}/,
  );
});

/** The waiting rows are skeleton's; the family paints none of its own placeholder and no wash under them. */
test('draws no placeholder of its own while loading', () => {
  assert.match(
    rule(`${ui}>[data-part-feed]>[data-part-item][aria-hidden]`),
    /background-color:transparent/,
  );
  assert.match(fragment, /data-loading[\s\S]*data-ui="skeleton"/);
});
