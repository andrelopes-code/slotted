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
    new URL('../../../../specs/components/page-header/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./page-header.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./page-header.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>~+])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.pageHeader;

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
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
});

/**
 * The mechanics of the contract's `sticky`: the root sticks with a negative
 * offset the size of the header area, the title area at the inset inside it,
 * and pinned or revealed the root's offset is the inset — 0 unless floating.
 */
test('sticks the root with a negative offset and the title area at the inset', () => {
  const root = rule(ui);
  assert.match(root, /--_sticky-inset:0px/);
  assert.match(root, /position:sticky/);
  assert.match(
    root,
    /inset-block-start:calc\(var\(--_sticky-inset\) - var\(--slotted-page-header-collapse,0px\)\)/,
  );
  assert.match(root, /overflow-anchor:none/);
  const titleArea = rule(`${ui}>*>[data-part-title-area]`);
  assert.match(titleArea, /position:sticky/);
  assert.match(titleArea, /inset-block-start:var\(--_sticky-inset\)/);
  assert.match(titleArea, /z-index:2/);
  /* Revealed, manual, or pinned: the root's offset is the inset and the whole header stays. */
  const held = rule(
    `${ui}[data-revealed],${ui}[data-collapse='manual'],${ui}:has([data-part-pin][data-pressed])`,
  );
  assert.match(held, /inset-block-start:var\(--_sticky-inset\)/);
  /* Compact, the root and the title area are in the flow at nought, whatever the inset. */
  assert.match(rule(`${ui}[data-compact]`), /inset-block-start:0/);
  assert.match(rule(`${ui}[data-compact]>*>[data-part-title-area]`), /inset-block-start:0/);
});

/**
 * The contract's `variant`. `plain` paints no ground at rest and takes the
 * surface back once content passes under the chrome; `floating` is a box with
 * the hairline all round, rounded, held an inset below the edge, and lifted
 * by a shadow only while stuck. The pill keeps the surface in every one.
 */
/**
 * The title area sits inside the container the family renders, and a private
 * property the container also declares reaches it as the container's value:
 * `--_inset` there is the container's 16-pixel gutter, and a floating title
 * area read it as its sticky offset and never counted as stuck.
 */
test('reads its sticky inset under a name the container does not declare', () => {
  const container = readFileSync(new URL('../container/container.css', import.meta.url), 'utf8');
  assert.doesNotMatch(container, /--_sticky-inset\s*:/);
  assert.match(rule(`${ui}>*>[data-part-title-area]`), /inset-block-start:var\(--_sticky-inset\)/);
});

test('paints the three variants', () => {
  assert.match(rule(ui), /--_ground:var\(--_surface\)/);
  assert.match(rule(`${ui}[data-variant='plain']:not([data-stuck])`), /--_ground:transparent/);
  const floating = rule(`${ui}[data-variant='floating']`);
  /* Flush with the scroller's edge at rest, an inset would sit the box over the content under it. */
  assert.doesNotMatch(floating, /--_sticky-inset/);
  assert.match(floating, /border:var\(--_rule-size\) solid var\(--_rule\)/);
  assert.match(floating, /border-radius:var\(--_radius\)/);
  assert.match(floating, /box-sizing:border-box/);
  assert.doesNotMatch(floating, /box-shadow/);
  const title = rule(`${ui}[data-variant='floating']>*>[data-part-title-area]`);
  assert.match(title, /border-start-start-radius:calc\(var\(--_radius\) - var\(--_rule-size\)\)/);
  assert.match(title, /border-start-end-radius:calc\(var\(--_radius\) - var\(--_rule-size\)\)/);
  const stuck = rule(`${ui}[data-variant='floating'][data-stuck]`);
  assert.match(
    stuck,
    /--_sticky-inset:var\(--slotted-page-header-inset,var\(--slotted-space-4,0\.5rem\)\)/,
  );
  assert.match(stuck, /box-shadow:var\(--slotted-page-header-shadow,var\(--slotted-shadow-sm\)\)/);
  /* The title area slides to the inset with the root, not a frame before it. */
  assert.match(title, /transition:inset-block-start var\(--_duration\) var\(--_easing\)/);
  assert.match(rule(`${ui}>*>[data-part-controls]>*`), /background-color:var\(--_surface\)/);
});

/** The root keeps its box. */
test('keeps a box on the root rather than dissolving it', () => {
  assert.doesNotMatch(normalized, /display:contents/);
  const root = rule(ui);
  assert.match(root, /container-type:inline-size/);
  assert.match(root, /container-name:page-header/);
  assert.match(root, /background-color:var\(--_ground\)/);
});

/**
 * Collapsed by the control the area is a 0fr row, and only then: scrolled
 * out, the offset is what hides it, and a 0fr row would jump the scroll.
 */
test('collapses by the control as a grid track, and never while scrolled out', () => {
  const area = rule(`${ui}>*>[data-part-header-area]`);
  assert.match(area, /grid-template-rows:1fr/);
  assert.match(area, /transition:grid-template-rows var\(--_duration\)/);
  const collapsed = rule(
    `${ui}:not([data-expanded]):not([data-scrolled])>*>[data-part-header-area]`,
  );
  assert.match(collapsed, /grid-template-rows:0fr/);
  assert.ok(
    !normalized.includes(`${ui}:not([data-expanded])>*>[data-part-header-area]{`),
    'a rule collapses the area whenever expanded is false, scrolled or not',
  );
});

/**
 * The chrome's edge is one hairline the whole width of the header, in every
 * state, and no shadow: the reviewer read the shadow as ugly and the rule
 * inside the container as one that stopped short of the header's edge. The
 * one shadow is a floating header's while stuck, a box lying on the content.
 */
test('draws one full-width edge on the root and no shadow', () => {
  const root = rule(ui);
  assert.match(root, /border-block-end:var\(--_rule-size\) solid var\(--_rule\)/);
  assert.match(root, /overflow-x:clip/);
  assert.match(root, /z-index:calc\(var\(--slotted-z-index-sticky,100\)\s*\+\s*3\)/);
  const floatingStuck = `${ui}[data-variant='floating'][data-stuck]{`;
  assert.doesNotMatch(
    normalized.replace(floatingStuck + rule(floatingStuck.slice(0, -1)), ''),
    /box-shadow/,
  );
  /* With tabs under it the edge the pill straddles is above them, drawn wider than the container. */
  const above = rule(`${ui}:has(>*>[data-part-tabs]:not(:empty))>*>[data-part-controls]::before`);
  assert.match(above, /inset-inline:-50vw/);
  assert.match(above, /border-block-start:var\(--_rule-size\) solid var\(--_rule\)/);
  /* And the tabs' own track is the root's edge. */
  assert.match(rule(`${ui}>*>[data-part-tabs]`), /--slotted-tabs-track-color:transparent/);
});

/** One attribute where Fiori has seven slots. */
test('shows a child of the title area in one state only through data-when', () => {
  assert.ok(
    normalized.includes(
      `${ui}[data-expanded]>*>[data-part-title-area] [data-part][data-when='snapped'][data-when],${ui}:not([data-expanded])>*>[data-part-title-area] [data-part][data-when='expanded'][data-when]{display:none;}`,
    ),
    'data-when is not honoured for both values',
  );
  /* Five attribute selectors, and after the heading's own display rule. */
  assert.ok(
    normalized.indexOf("[data-part][data-when='snapped'][data-when]") >
      normalized.indexOf('[data-part-heading]{-webkit-box-orient'),
    'the data-when rule comes before the heading rule it has to outweigh',
  );
});

/**
 * The marks are the Glyph elements the bindings render — the arrow in a
 * `directional` box, so the binding mirrors it — and the sheet only sizes and
 * turns the box.
 */
test('paints no mark of its own, and turns the chevron by state', () => {
  assert.doesNotMatch(normalized, /mask-image/, 'a mark is an svg, not a mask');
  assert.doesNotMatch(normalized, /--slotted-icon-(chevron-down|pin|pin-off|arrow-left)\b/);
  assert.doesNotMatch(normalized, /content:'[^']+'/, 'a mark is drawn with a character');
  const back = rule(`${ui}>*>[data-part-title-area]>[data-part-nav]>[data-part-back]`);
  assert.match(back, /--slotted-icon-size:var\(--_icon-size\)/);
  const toggle = rule(
    `${ui}[data-expanded]>*>[data-part-controls]>*>[data-part-toggle]>[data-ui-icon]`,
  );
  assert.match(toggle, /rotate:180deg/);
});

/**
 * The two inner controls are the family's own (R2): a ring in the theme's
 * colour, a reach to the target minimum, and a hover that moves the ground
 * and nothing else, held back for a disabled control.
 */
test('draws the toggle and the pin as inner controls with a ring and a reachable target', () => {
  const controls = rule(
    `${ui}>*>[data-part-controls]>*>[data-part-toggle],${ui}>*>[data-part-controls]>*>[data-part-pin]`,
  );
  assert.match(controls, /min-block-size:var\(--slotted-target-min,24px\)/);
  assert.match(controls, /min-inline-size:var\(--slotted-target-min,24px\)/);
  const ring = rule(
    `${ui}>*>[data-part-controls]>*>[data-part-toggle]:focus-visible,${ui}>*>[data-part-controls]>*>[data-part-pin]:focus-visible`,
  );
  assert.match(
    ring,
    /outline:var\(--slotted-focus-ring-width,2px\) solid var\(--slotted-focus-ring-color,Highlight\)/,
  );
  const hover = rule(
    `${ui}>*>[data-part-controls]>*>[data-part-toggle]:not(:disabled):hover,${ui}>*>[data-part-controls]>*>[data-part-pin]:not(:disabled):hover`,
  );
  assert.match(hover, /background-color:var\(--slotted-tone-secondary-subtle-hover/);
});

/** The pill straddles the chrome's edge from a zero-height row after the header area. */
test('places the controls on a zero-height row that carries the rule', () => {
  const row = rule(`${ui}>*>[data-part-controls]`);
  assert.match(row, /block-size:0/);
  assert.doesNotMatch(row, /border-block-start/);
  assert.match(row, /position:relative/);
  const pill = rule(`${ui}>*>[data-part-controls]>*`);
  assert.match(pill, /position:absolute/);
  assert.match(pill, /translate:0 -50%/);
  assert.match(
    fragment,
    /data-part="header-area"[\s\S]*data-part="controls"[\s\S]*data-part="tabs"/,
  );
});

/** The snapped heading is one line, a step smaller; expanded it clamps at two. */
test('clamps the heading at two lines expanded and one line snapped', () => {
  const heading = rule(
    `${ui}>*>[data-part-title-area]>[data-part-title-row]>[data-part-title]>[data-part-heading]`,
  );
  assert.match(heading, /-webkit-line-clamp:2/);
  assert.doesNotMatch(heading, /transition/);
  assert.match(heading, /font-size:var\(--_heading-size\)/);
  const snapped = rule(
    `${ui}:not([data-expanded])>*>[data-part-title-area]>[data-part-title-row]>[data-part-title]>[data-part-heading]`,
  );
  assert.match(snapped, /white-space:nowrap/);
  assert.match(snapped, /text-overflow:ellipsis/);
  assert.match(snapped, /display:block/);
  assert.match(snapped, /font-size:var\(--_snapped-heading-size\)/);
});

/** The placeholder is skeleton's; this sheet says only how wide it is. */
test('paints no placeholder of its own while loading', () => {
  assert.doesNotMatch(normalized, /animation:/);
  assert.match(
    rule(
      `${ui}[data-loading]>*>[data-part-title-area]>[data-part-title-row]>[data-part-title]>[data-part-heading]`,
    ),
    /--slotted-skeleton-inline-size:24ch/,
  );
  assert.match(fragment, /data-loading[\s\S]*data-ui="skeleton"/);
});

/** The family answers its own width, not the viewport's. */
test('reorders below 600 pixels by container query', () => {
  assert.match(normalized, /@container page-header \(width < 600px\)/);
  assert.doesNotMatch(normalized, /@media \(max-width/);
});

/**
 * The marks are stroked with `currentColor`, the host's ink, which forced
 * colours already remap: nothing is restated for them.
 */
test('restates nothing for its marks under forced colours', () => {
  assert.doesNotMatch(normalized, /::before\{[^}]*forced-color-adjust/);
});

/**
 * Nothing the family owns is reached with a descendant combinator from the
 * root, because what the consumer projects is other families with parts of
 * the same names — a description-list has a `description`, a card has
 * `actions`.
 */
test('reaches its own parts with child combinators only', () => {
  for (const part of ['description', 'actions', 'heading', 'content', 'header']) {
    const descendant = new RegExp(`\\[data-ui-page-header\\][^{]*? \\[data-part-${part}\\]`);
    assert.ok(!descendant.test(normalized), `a descendant rule reaches ${part}`);
  }
});

/**
 * A header is a fixed cost on every screen, so nothing in it grows without a
 * bound: two lines for the subheading, three for the description, the whole
 * string kept in the DOM.
 */
test('bounds the subheading and the description', () => {
  const subheading = rule(
    `${ui}>*>[data-part-title-area]>[data-part-title-row]>[data-part-title]>[data-part-subheading]`,
  );
  assert.match(subheading, /-webkit-line-clamp:2/);
  const description = rule(
    `${ui}>*>[data-part-header-area]>[data-part-content]>[data-part-description]`,
  );
  assert.match(description, /-webkit-line-clamp:3/);
});

/** Collapsed by the control, the area is at zero: the columns give up the half pill they reserved. */
test('leaves no band under the title when the control collapses the area', () => {
  const columns = normalized
    .split(`${ui}:not([data-expanded]):not([data-scrolled])>*>[data-part-header-area]>*{`)
    .slice(1)
    .map((segment) => segment.split('}')[0]);
  assert.ok(columns.some((segment) => /padding-block:0/.test(segment)));
});

/** One way back at a time: beside breadcrumbs the arrow yields; below 600 pixels it returns. */
test('shows the way back only where the breadcrumbs are not', () => {
  const beside = rule(
    `${ui}>*>[data-part-title-area]>[data-part-nav]>[data-part-back]:has(~[data-part-breadcrumbs]:not(:empty))`,
  );
  assert.match(beside, /display:none/);
  const narrow =
    /@container page-header \(width < 600px\)\{([\s\S]*?)\}\}/.exec(normalized)?.[1] ?? '';
  assert.match(
    narrow,
    /\[data-part-back\]:has\(~\[data-part-breadcrumbs\]:not\(:empty\)\)\{display:inline-flex/,
  );
});

/** The reviewer's fourth round: weight on the marks, a ground under the pressed pin, arrows on the actions' line and mirrored in RTL. */
test('draws the controls with weight, the pressed pin on a ground, and the arrows aligned and mirrored', () => {
  const marks = rule(
    `${ui}>*>[data-part-controls]>*>[data-part-toggle],${ui}>*>[data-part-controls]>*>[data-part-pin]`,
  );
  assert.match(marks, /--slotted-icon-size:var\(--slotted-control-icon-size-md,16px\)/);
  const pressed = rule(`${ui}>*>[data-part-controls]>*>[data-part-pin][data-pressed]`);
  assert.match(pressed, /background-color:var\(--slotted-tone-accent-surface/);
  const navigation = rule(
    `${ui}>*>[data-part-title-area]>[data-part-title-row]>[data-part-navigation]`,
  );
  assert.match(navigation, /padding-block:var\(--slotted-space-2,0\.25rem\)/);
  assert.match(
    normalized,
    /\[data-part-navigation\]:dir\(rtl\)\s*:is\(svg,\s*\[data-ui-icon\]\)\s*\{scale:-1 1/,
  );
});

/** Too much of the screen to hold: the pin is not offered on a tall header, nor below 600 pixels. */
test('hides the pin on a tall header and on a phone', () => {
  assert.match(rule(`${ui}[data-tall]>*>[data-part-controls]>*>[data-part-pin]`), /display:none/);
  const narrow =
    /@container page-header \(width < 600px\)\{([\s\S]*?)\}\}/.exec(normalized)?.[1] ?? '';
  assert.match(narrow, /\[data-part-controls\]>\*>\[data-part-pin\]\{display:none/);
});

/**
 * Compact, nothing sticks: the root and the title area are in the flow and
 * scroll away with the page. On a phone a record's header and tabs held 40
 * per cent of the screen for the whole scroll. `relative` keeps the stacking
 * the pill relies on, at an offset of nought.
 */
test('takes the root and the title area out of sticky below the compact size class', () => {
  const root = rule(`${ui}[data-compact]`);
  assert.match(root, /position:relative/);
  assert.match(root, /inset-block-start:0/);
  assert.match(rule(`${ui}[data-compact]>*>[data-part-title-area]`), /position:relative/);
});

/**
 * Below 600 pixels the actions cluster grows, so that alone on a wrapped row
 * it takes the row. Beside a title that leaves it room — one short button
 * after a short heading at 570 pixels — the grown box put the button at its
 * own start, mid-row, off the edge every other width aligns it to. The
 * cluster's content stands at its end whichever row it lands on.
 */
test('keeps the actions at the end of their row on a phone', () => {
  const narrow =
    /@container page-header \(width < 600px\)\{([\s\S]*?)\}\}/.exec(normalized)?.[1] ?? '';
  assert.match(
    narrow,
    /\[data-part-title-row\]>\[data-part-actions\]\{[^}]*justify-content:flex-end/,
  );
});

/**
 * The title row aligns its clusters to the start, so a heading that wraps to
 * two lines keeps the actions on its first. A heading of one line is shorter
 * than a control — by three pixels with a pointer, by sixteen on a touch
 * screen, where every control is a 44-pixel target — and stood at the top of
 * the row with the button hanging under it. The title's box is at least a
 * control tall and centres its heading, so one line stands on the control's
 * axis and two lines still grow from the top.
 */
test('stands a one-line heading on the axis of the control beside it', () => {
  const title = rule(`${ui}>*>[data-part-title-area]>[data-part-title-row]>[data-part-title]`);
  assert.match(title, /min-block-size:var\(--slotted-control-height-md/);
  assert.match(title, /align-items:center/);
});

/**
 * A toolbar pads its controls for the reach of their focus rings, so in the
 * actions it stood a control and two insets tall — 52 pixels beside a title
 * of 51 on a touch screen, and a record whose actions land with its answer
 * moved its body by the difference. The row gives the inset back.
 */
test('gives a toolbar in the actions a control’s height in the title row', () => {
  const actions = `${ui}>*>[data-part-title-area]>[data-part-title-row]>[data-part-actions]`;
  const folding = rule(
    `${actions}>[data-ui-toolbar]:not([data-variant='outline']):is([data-overflow='menu'],[data-overflow='scroll'])`,
  );
  assert.match(
    folding,
    /margin-block:calc\(-1 \* var\(--slotted-toolbar-inset,max\(var\(--slotted-space-2/,
  );
  assert.match(folding, /--slotted-focus-ring-offset/);
  const wrapping = rule(`${actions}>[data-ui-toolbar]:not([data-variant='outline'])`);
  assert.match(
    wrapping,
    /margin-block:calc\(-1 \* var\(--slotted-toolbar-inset,var\(--slotted-space-2/,
  );
});

/**
 * The way back stood a target-min tall on a coarse pointer, 24 pixels among
 * 44-pixel controls. The link reaches the comfortable target by padding and
 * gives it back as a negative margin, so the nav row keeps its height.
 */
test('makes the way back a full touch target on a coarse pointer, and moves nothing', () => {
  const coarse = /@media \(pointer:coarse\)\{([\s\S]*?)\}\}/.exec(normalized)?.[1] ?? '';
  const back =
    coarse
      .split(`${ui}>*>[data-part-title-area]>[data-part-nav]>[data-part-back]{`)[1]
      ?.split('}')[0] ?? '';
  assert.match(
    back,
    /--_reach:max\(0px,calc\(\(var\(--slotted-target-comfortable,44px\) - var\(--slotted-target-min,24px\)\) \/ 2\)\);/,
  );
  assert.match(back, /padding-block:var\(--_reach\);/);
  assert.match(back, /margin-block:calc\(var\(--_reach\) \* -1\);/);
});

/**
 * The contract promises that a toolbar in the actions folds what does not fit
 * into its menu before the row wraps. Above 600 pixels the row still wrapped:
 * at 1024 a record's toolbar of six commands took a row of its own under the
 * title, 42 pixels more header, instead of folding two of them.
 */
test('folds a menu toolbar before the title row wraps, at every width', () => {
  const folding = ":has(>[data-part-actions]>[data-ui-toolbar][data-overflow='menu'])";
  const row = rule(`${ui}>*>[data-part-title-area]>[data-part-title-row]${folding}`);
  assert.match(row, /flex-wrap:nowrap/);
  const actions = rule(
    `${ui}>*>[data-part-title-area]>[data-part-title-row]>[data-part-actions]:has(>[data-ui-toolbar][data-overflow='menu'])`,
  );
  // The cluster's width is the row's remainder, never its own content: sized by its content it
  // was the trigger alone once everything had folded, did not grow when the row did, and the
  // actions stayed folded after a window went from 600 pixels back to 1400.
  assert.match(actions, /flex:1 1 0%/);
  assert.doesNotMatch(actions, /flex:0 /);
  // It never gives way below its menu's trigger and inset: at 390 pixels with touch a cluster at
  // no minimum put the trigger past the screen's edge.
  const floor =
    /min-inline-size:calc\(var\(--slotted-control-height-md,34px\)\+2 \* var\(--slotted-toolbar-inset,max\(var\(--slotted-space-2/;
  assert.match(actions, floor);
  // The toolbar fills the cluster, so the room it measures follows the row, and its controls
  // stand at the end without losing the start of a bar that scrolls.
  const bar = rule(
    `${ui}>*>[data-part-title-area]>[data-part-title-row]>[data-part-actions]>[data-ui-toolbar][data-overflow='menu']`,
  );
  assert.match(bar, /flex:1 1 0%/);
  assert.match(bar, /justify-content:safe flex-end/);
  // The title starts from its own width at every width and does not grow past it: the phone's
  // 60% held a SKU's code and its two marks to two lines beside a toolbar that could still have
  // folded, and a title that grew took the room the cluster measures.
  const title = rule(
    `${ui}>*>[data-part-title-area]>[data-part-title-row]${folding}>[data-part-title]`,
  );
  assert.match(title, /flex:0 1 auto/);
  const narrow =
    /@container page-header \(width < 600px\)\{([\s\S]*?)\}\}/.exec(normalized)?.[1] ?? '';
  // On a phone the cluster is still the row's: beside a plain title its remainder, under a rich
  // one the whole of a row of its own. A content-sized cluster is the defect above.
  const phone = [
    ...narrow.matchAll(
      /\[data-part-actions\]:has\(>\[data-ui-toolbar\]\[data-overflow='menu'\]\)\{([^}]*)\}/g,
    ),
  ].map(([, body]) => body);
  assert.deepEqual(
    phone,
    ['flex:1 1 100%;'],
    'no phone rule sizes the folding cluster by its content',
  );
  assert.match(
    narrow,
    /:has\(>\[data-part-visual\],>\[data-part-title\]>:is\(\[data-part-subheading\],\[data-part-marks\]:not\(:empty\)\)\)>\[data-part-actions\]/,
  );
});

/** Compact, the subheading gives the title column one line, as it does snapped. */
test('holds the subheading to one line on a phone', () => {
  const narrow =
    /@container page-header \(width < 600px\)\{([\s\S]*?)\}\}/.exec(normalized)?.[1] ?? '';
  const subheading =
    narrow.split(`[data-part-title]>[data-part-subheading]{`)[1]?.split('}')[0] ?? '';
  assert.match(subheading, /white-space:nowrap/);
  assert.match(subheading, /text-overflow:ellipsis/);
});

/**
 * A toolbar that folds into its menu measures the width it is given, so on a
 * phone the actions stay on the title row and shrink; loose actions keep
 * taking a wrapped row of their own.
 */
test('keeps a folding toolbar on the title row on a phone', () => {
  const narrow =
    /@container page-header \(width < 600px\)\{([\s\S]*?)\}\}/.exec(normalized)?.[1] ?? '';
  // Loose actions take a wrapped row of their own; a folding toolbar keeps the title row by the
  // rules that hold at every width (the test above).
  assert.match(narrow, /\[data-part-title-row\]>\[data-part-actions\]\{flex:1 1 auto/);
});

/**
 * Beside the heading the marks share a wrapping line whose break depends on
 * the record: a code and "Below reorder point" did not fit at 390 pixels where
 * the placeholders had, and every box under the header moved 25 pixels when the
 * answer landed. Compact, the marks take a line of their own under the heading,
 * waiting and loaded alike.
 */
test('gives the marks a line of their own on a phone, whatever they say', () => {
  const narrow =
    /@container page-header \(width < 600px\)\{([\s\S]*?)\}\}/.exec(normalized)?.[1] ?? '';
  const marks = narrow.split(`[data-part-title]>[data-part-marks]{`)[1]?.split('}')[0] ?? '';
  assert.match(marks, /flex-basis:100%/);
});

/**
 * A wrapping flex row's own width is the sum of its items as if on one line:
 * the title of a record beside a folding toolbar measured its heading, its
 * marks and its subheading end to end — 769 pixels for two lines of 420 — and
 * the toolbar, left 61 pixels, folded every command into its menu beside empty
 * room. Beside a folding toolbar the title is a grid whose own width is its
 * widest line.
 */
test('measures a title beside a folding toolbar by its widest line, not its parts end to end', () => {
  const folding = ":has(>[data-part-actions]>[data-ui-toolbar][data-overflow='menu'])";
  const title = `${ui}>*>[data-part-title-area]>[data-part-title-row]${folding}>[data-part-title]`;
  const grid = rule(title);
  assert.match(grid, /display:grid/);
  assert.match(grid, /grid-template-columns:minmax\(0,auto\) auto/);
  assert.match(rule(`${title}>[data-part-heading]`), /grid-column:1/);
  assert.match(rule(`${title}>[data-part-subheading]`), /grid-column:1 \/ -1/);
  const narrow =
    /@container page-header \(width < 600px\)\{([\s\S]*?)\}\}/.exec(normalized)?.[1] ?? '';
  assert.match(
    narrow,
    new RegExp(
      `${title.replace(/[[\]()*+?.\\^$|]/g, '\\$&')}>\\[data-part-marks\\]\\{grid-column:1 \\/ -1`,
    ),
  );
});

/**
 * A ground with alpha is composited once: the root paints it, and the title
 * area paints it only over a header area it has to cover. Stuck, the root
 * takes the theme's backdrop filter, and gives it up for a reader who asked
 * for less transparency and under forced colours. The composited alpha and the
 * computed filter are read in Chrome by `tools/harness/scenarios/page-header-glass.mjs`.
 */
test('paints one ground under a title with nothing to cover, and filters the backdrop while stuck', () => {
  const flat = declarations.replace(/\s+/g, ' ');
  assert.match(
    flat,
    /\[data-ui-page-header\]:not\(:has\(> \* > \[data-part-header-area\]\)\) > \* > \[data-part-title-area\] \{ background-color: transparent; \}/,
  );
  assert.match(
    flat,
    /\[data-ui-page-header\]\[data-stuck\] \{ -webkit-backdrop-filter: var\(--slotted-page-header-backdrop-filter, var\(--_backdrop, none\)\); backdrop-filter: var\(--slotted-page-header-backdrop-filter, var\(--_backdrop, none\)\); \}/,
  );
  assert.match(
    flat,
    /@media \(prefers-reduced-transparency: reduce\), \(forced-colors: active\) \{ \[data-ui-page-header\]\[data-stuck\] \{ -webkit-backdrop-filter: none; backdrop-filter: none; \} \}/,
  );
  assert.match(fragment, /data-scene="glass"/);
});
