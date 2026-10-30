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
    new URL('../../../../specs/components/alert/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./alert.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./alert.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
/**
 * Whitespace is collapsed rather than removed: a descendant selector and a
 * multi-word value both lose their meaning when every space goes. Parentheses
 * are collapsed too, because the formatter breaks a long value across lines and
 * leaves `var( --token`, which no assertion here spells.
 */
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;

/** The declarations of the first rule whose selector starts with `selector`. */
function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
});

test('styles every part the contract declares', () => {
  for (const part of contract.members.alert.parts) {
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

/**
 * The layout decision the anatomy rests on. `content` is the live region, so
 * the actions and the dismiss control cannot be inside it — they are placed in
 * the grid as siblings, and a stylesheet that nested them would be describing a
 * different family from the one the contract declares.
 */
test('places the actions and the dismiss control outside the region that announces', () => {
  for (const part of ['icon', 'content', 'actions', 'dismiss']) {
    assert.ok(
      normalized.includes(`${ui}>[data-part-${part.toLowerCase()}]`),
      `${part} is not placed as a child of the root`,
    );
  }
  assert.match(rule(`${ui}>[data-part-content]`), /grid-column:2/);
  assert.match(rule(`${ui}>[data-part-actions]`), /grid-column:2/);
  assert.match(rule(`${ui}>[data-part-actions]`), /grid-row:2/);
  assert.match(rule(`${ui}>[data-part-dismiss]`), /grid-column:3/);
});

/**
 * A fixed two-row template would leave a row gap under every alert with no
 * actions, which is the defect the first draft of this grid had. The row is
 * implicit, so it exists only when something is placed in it.
 */
test('creates the row of actions only when there are actions', () => {
  assert.match(rule(root), /grid-template-columns:auto minmax\(0,1fr\) auto/);
  assert.ok(!/grid-template-areas/.test(normalized), 'a fixed template reserves an empty row');
});

/* The glyph each tone draws is the binding's, from the contract's map; the
   sheet gives every tone its own colour and paints no glyph. */
test('gives every tone its own colour and leaves the glyph to the binding', () => {
  assert.doesNotMatch(normalized, /mask-image|--_glyph:/);
  for (const tone of Object.keys(contract.toneGlyphs)) {
    const declarations = rule(`${root}[data-tone='${tone}']`);
    assert.ok(declarations.length > 0, `${tone} has no rule`);
    assert.ok(
      declarations.includes(`--_text:var(--slotted-tone-${tone}-text)`),
      `${tone} does not take its own text role`,
    );
  }
});

/**
 * The mark is a filled disc with the tone's symbol cut out of it, on the
 * title's first line: the binding's `Glyph` drawing a hand-drawn status mark,
 * whose silhouette fills its box, so the box is the mark. The size is rounded to an even number of pixels, the
 * disc is hung from the first line's baseline and lowered by a whole number of
 * pixels so its centre is the capitals' centre and it is snapped by the same
 * amount as the glyphs, and its own height is cancelled so the words sit where
 * they sit with no mark. `packages/styles/src/status-mark.test.mjs` holds the shared part of
 * the rule for every family that draws a mark.
 */
test('draws the mark as a disc with the symbol cut out, on the title’s first line', () => {
  assert.match(rule(root), /--_mark-size:round\(nearest,\s*1\.2em,\s*2px\)/);
  const icon = rule(`${ui}>[data-part-icon]`);
  assert.match(icon, /align-self:baseline/);
  assert.match(icon, /position:relative/);
  assert.match(icon, /block-size:var\(--_mark-size\)/);
  assert.match(icon, /inline-size:var\(--_mark-size\)/);
  assert.match(
    icon,
    /inset-block-start:round\(nearest,\s*\(var\(--_mark-size\) - 1cap\) \/ 2,\s*1px\)/,
  );
  assert.match(icon, /margin-block-start:calc\(-1 \* var\(--_mark-size\)\)/);
  assert.match(icon, /--slotted-icon-size:var\(--_mark-size\)/);
  assert.ok(!/content:'[^']/.test(icon), 'the mark is drawn with a character');
  assert.match(rule(`${ui}>[data-part-content]`), /align-self:baseline/);
  assert.match(icon, /contain:layout/);
  for (const glyph of Object.values(contract.toneGlyphs)) {
    if (glyph === null) continue;
    assert.match(
      fragment,
      new RegExp(`data-glyph="${glyph}" data-solid`),
      `no scene draws the ${glyph} mark solid`,
    );
  }
  /* A neutral note states no severity, so no scene draws it a blank disc. */
  assert.doesNotMatch(fragment, /data-glyph="circle"/);
});

test('paints one tone three ways, and gives soft an edge of its own', () => {
  for (const variant of contract.axes.variant) {
    assert.ok(rule(`${root}[data-variant='${variant}']`).length > 0, `${variant} has no rule`);
  }
  /* In `high-contrast` the tone surfaces are the page's own white, so a soft
     alert with no edge is coloured text with no box around it. */
  assert.match(rule(`${root}[data-variant='soft']`), /border-color:var\(--_border\)/);
  assert.match(rule(`${root}[data-variant='solid']`), /color:var\(--_on-solid\)/);
});

/**
 * A page banner runs to both edges of what holds it, so it draws no corner and
 * no inline edge and keeps the one edge that separates it from the page below.
 */
test('takes the corners off the reach that runs to the edges', () => {
  const page = rule(`${root}[data-reach='page']`);
  assert.match(page, /--_radius:var\(--slotted-alert-radius,0\)/);
  assert.match(page, /border-inline-width:0/);
  assert.match(page, /border-block-start-width:0/);
});

test('scales its type and its dismiss glyph with density, through the control scales', () => {
  for (const [reach, step] of [
    ['inline', 'sm'],
    ['page', 'lg'],
  ]) {
    const declarations = rule(`${root}[data-reach='${reach}']`);
    assert.ok(
      declarations.includes(`--_font-size:var(--slotted-control-font-size-${step}`),
      `${reach} does not read the control type scale`,
    );
    assert.ok(
      declarations.includes(`--_glyph-size:var(--slotted-control-icon-size-${step}`),
      `${reach} does not read the control glyph scale`,
    );
  }
});

/**
 * R2 and WCAG 2.2 2.5.8. The dismiss control is an inner control, not a
 * button: its box is the glyph plus a step of air on each side, capped at the
 * inner-control size and floored at `--slotted-target-min` — a literal here
 * would be correct today and unhittable on a touch screen.
 */
test('sizes the dismiss control from its glyph, floored at the target minimum', () => {
  assert.match(
    rule(root),
    /--_dismiss-size:var\(--slotted-alert-dismiss-size,max\(var\(--slotted-target-min,24px\),min\(calc\(var\(--_glyph-size\) \+ 2 \* var\(--slotted-space-2,0\.25rem\)\),var\(--_inner-size\)\)\)\)/,
  );
  const dismiss = rule(`${ui}>[data-part-dismiss]`);
  assert.match(dismiss, /block-size:var\(--_dismiss-size\)/);
  assert.match(dismiss, /inline-size:var\(--_dismiss-size\)/);
});

/**
 * `states.test.mjs` refuses an unguarded weak state across the whole package;
 * this states the same rule about this family in particular, because the guard
 * that is right here is `:enabled` rather than an attribute — the control the
 * states belong to is a real button.
 */
test('holds hover and press back for a control the browser has refused', () => {
  for (const selector of normalized.matchAll(/(^|\})([^{}@]+)\{/g)) {
    for (const part of (selector[2] ?? '').split(',')) {
      if (!/:hover|:active(?![-\w])/.test(part)) continue;
      assert.ok(part.includes(':enabled'), `"${part.trim()}" paints a weak state unguarded`);
    }
  }
});

/**
 * The ring on the control is inset because the control sits at the corner of
 * the box, and a ring outside it would be drawn over the border or clipped by
 * it. The ring on the box itself is outside, and it exists because the root is
 * a programmatic focus destination.
 */
test('draws a focus ring on the control and on the box, and insets only one', () => {
  assert.match(
    rule(`${ui}>[data-part-dismiss]:focus-visible`),
    /outline-offset:calc\(-1 ?\* ?var\(--slotted-focus-ring-width/,
  );
  assert.match(rule(`${root}:focus-visible`), /outline-offset:var\(--slotted-focus-ring-offset/);
});

/**
 * The box animates its departure always. `display` rides along so the box
 * holds its place until the fade is over instead of snapping out from under
 * the content below it. A transition is read from the state being entered, so
 * the closed box carries the leaving curve and the open box the entering one.
 */
test('animates the message leaving on the exit curve and arriving on the enter curve', () => {
  assert.match(rule(root), /transition-behavior:allow-discrete/);
  assert.ok(
    rule(root).includes('display var(--slotted-duration-short) var(--slotted-easing-enter)'),
  );
  const closed = rule(`${root}[hidden]`);
  assert.match(closed, /display:none/);
  assert.match(closed, /opacity:0/);
  assert.ok(closed.includes('display var(--slotted-duration-short) var(--slotted-easing-exit)'));
});

/**
 * `@starting-style` also applies on first paint, so an unconditional entry
 * would fade in every alert already on the page. Only a live alert, whose
 * arrival is the message, has a starting style.
 */
test('gives a starting style to a live alert and to no other', () => {
  const starts = [...normalized.matchAll(/@starting-style\{([^{]+)\{/g)].map(
    ([, selector]) => selector,
  );
  assert.deepEqual(starts, [`${root}:is([data-live='polite'],[data-live='assertive'])`]);
});

/**
 * The line box is rounded to an even pixel on the root and on the description,
 * so a message of one line is a whole number of pixels tall and the controls
 * centred on it land on whole pixels.
 */
test('rounds every line box it sets to an even pixel', () => {
  const even = /line-height:round\(nearest,calc\(var\(--_line-height\) \* 1em\),2px\)/;
  assert.match(rule(root), even);
  assert.match(rule(`${ui} [data-part-description]`), even);
});

/**
 * Actions at the end join the mark's and the words' baseline group, so their
 * labels stand on the message's first line, and the dismiss control keeps its
 * own place on that line, after them.
 */
test('stands actions at the end on the message’s first line, before the dismiss control', () => {
  const wide = normalized.slice(normalized.indexOf('@container slotted-alert (min-width:40rem)'));
  const block = (part) =>
    wide.split(`${ui}[data-actions-placement='end']>[data-part-${part}]{`)[1]?.split('}')[0] ?? '';
  assert.match(block('actions'), /align-self:baseline/);
  assert.match(block('actions'), /grid-column:3/);
  assert.match(block('actions'), /grid-row:1/);
  assert.equal(block('dismiss'), 'grid-column:4;');
});

/**
 * Eight per cent of white over the `danger` fill moved OKLab lightness by
 * 0.019, under the 0.02 a surface step has to reach; ten moves it by 0.025.
 */
test('washes the dismiss control at a strength every fill can show', () => {
  assert.match(rule(root), /--slotted-alert-state-layer-hover,10%/);
  assert.match(rule(root), /--slotted-alert-state-layer-active,16%/);
});

/**
 * Two composition changes that answer the box rather than the window, and a
 * container the family names itself — an alert inside a card inside a page
 * would otherwise resolve against whichever ancestor happened to be a
 * container first.
 */
test('answers its own inline size, in a container it owns', () => {
  assert.match(rule(root), /container-type:inline-size/);
  assert.match(rule(root), /container-name:slotted-alert/);
  /* `contain: inline-size` makes the intrinsic width zero, so a box placed in
     a column that shrink-wraps its children collapses to one character wide
     unless the width is stated. Found in the rendered page, not in a test. */
  assert.match(rule(root), /inline-size:100%/);
  const queries = [...css.matchAll(/@container slotted-alert \(([^)]+)\)/g)].map(
    ([, query]) => query,
  );
  assert.deepEqual(queries, ['max-width: 22rem', 'min-width: 40rem']);
});

/**
 * The theme remaps every colour a family reads, so a family writes a forced
 * colours rule only for something the theme cannot reach: here a border
 * painted in its own transparent fill, which the system does not remap. The
 * mark's glyph fills with `currentcolor`, which the system has already forced.
 */
test('keeps an edge and a silhouette when the system takes the palette', () => {
  const block = css.slice(css.indexOf('forced-colors: active'));
  assert.match(block, /border-color:\s*CanvasText/);
  assert.doesNotMatch(block, /\[data-part-icon\]/);
});

/**
 * The theme maps the accent fill to `Highlight` and its ink to
 * `HighlightText`, which the browser keeps; the backplate it draws behind text
 * is `Canvas`, so a solid alert's words were white on white. Every variant is
 * repainted, at the specificity that outranks the variant's own rule.
 */
test('repaints every variant in the system palette', () => {
  const block = normalized.slice(normalized.indexOf('forced-colors:active'));
  const variants = block.split(`${root}[data-variant]{`)[1]?.split('}')[0] ?? '';
  assert.match(variants, /background-color:Canvas/);
  assert.match(variants, /border-color:CanvasText/);
  assert.match(variants, /color:CanvasText/);
});

/* ── The fragment, which is the third place this DOM is written ─────────── */

test('renders every part the contract declares in at least one scene', () => {
  for (const part of contract.members.alert.parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `no scene renders the ${part} part`);
  }
});

test('renders every value of every painted axis', () => {
  for (const axis of ['tone', 'variant', 'reach']) {
    for (const value of contract.axes[axis]) {
      assert.match(
        fragment,
        new RegExp(`data-${axis}="${value}"`),
        `no scene renders ${axis}="${value}"`,
      );
    }
  }
});

/**
 * The rule the family exists for, checked in the markup rather than described
 * in a comment: the live role is written on `content`, and the two interactive
 * parts are that element's siblings.
 */
test('writes the live role on the text and on nothing else', () => {
  for (const [live, role] of Object.entries(contract.liveRoles)) {
    if (role === null) continue;
    assert.match(
      fragment,
      new RegExp(`data-part="content" role="${role}"`),
      `no scene announces with live="${live}"`,
    );
  }
  for (const match of fragment.matchAll(/<[^>]*\brole="(status|alert)"[^>]*>/g)) {
    assert.match(match[0], /data-part="content"/, `${match[0]} announces and is not the text`);
  }
});

/**
 * The box is a landmark rather than a live region, and the title is what names
 * it. A `section` with no accessible name is a plain grouping element, which is
 * why an alert with no title is allowed to carry no `aria-labelledby`.
 */
test('names the landmark with the title the message already has', () => {
  const titled = [...fragment.matchAll(/<section\s+data-ui="alert"[\s\S]*?<\/section>/g)].filter(
    (match) => match[0].includes('data-part="title"'),
  );
  assert.ok(titled.length > 0, 'no scene renders a titled alert');
  for (const [markup] of titled) {
    const labelled = /aria-labelledby="([^"]+)"/.exec(markup);
    if (labelled === null) continue;
    assert.match(
      markup,
      new RegExp(`data-part="title" id="${labelled[1]}"`),
      'the label points at something other than the title',
    );
  }
});

test('makes the box a programmatic focus destination and never a tab stop', () => {
  assert.match(fragment, /tabindex="-1"/);
  assert.ok(!/tabindex="0"/.test(fragment), 'the box is in the tab sequence');
});

/**
 * A word no language can break must not size the words' own track. The
 * 240-pixel capture showed `Zahlungsbestätigung` setting the track to its own
 * width and the words standing outside the box: `break-word` wraps only after
 * the track has already grown to fit the word. `anywhere` lowers the
 * min-content size the grid reads, and the clamped track is the other half.
 */
test('breaks an unbreakable title inside the box rather than growing the box', () => {
  assert.match(rule(`${ui}>[data-part-content]`), /grid-template-columns:minmax\(0,1fr\)/);
  for (const part of ['title', 'description']) {
    const words = rule(`${ui} [data-part-${part.toLowerCase()}]`);
    assert.match(words, /overflow-wrap:anywhere/, `${part} keeps break-word`);
    assert.match(words, /min-inline-size:0/, `${part} does not shrink`);
  }
});
