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
  readFileSync(new URL('../../../../specs/components/tabs/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./tabs.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./tabs.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.tabs;
/**
 * Each part as the stylesheet reaches it: down the family's own chain of
 * children, never by descent, so a family inside a panel that names its own
 * parts `list`, `item` or `label` is not drawn as a tab list. The intermediate
 * steps sit in `:where()`, which keeps every selector at the specificity the
 * descendant form had.
 */
const PATHS = {
  list: `${ui}>[data-part-list]`,
  item: `${ui}>:where([data-part-list])>[data-part-item]`,
  tab: `${ui}>:where([data-part-list])>:where([data-part-item])>[data-part-tab]`,
  label: `${ui}>:where([data-part-list])>:where([data-part-item])>:where([data-part-tab])>[data-part-label]`,
  dismiss: `${ui}>:where([data-part-list])>:where([data-part-item])>[data-part-dismiss]`,
  panel: `${ui}>[data-part-panel]`,
  actions: `${ui}>[data-part-actions]`,
};
const part = (name) => PATHS[name];
/** The marker the list draws, reached like the item: down the chain, never by descent. */
const marker = `${ui}>:where([data-part-list])>[data-part-marker]`;
/** The same chain from a root carrying modifiers, such as `[data-fit='equal']`. */
const at = (modifiers, name) => `${ui}${modifiers}${PATHS[name].slice(ui.length)}`;
/** The paging controls are the root's own children; see the test that says why. */
const scroll = `${ui}>[data-part-scroll]`;

/**
 * Every declaration the selector receives, across every rule whose selector
 * list names it: the marker and the hover bar share one geometry block and
 * each has a block of its own, and a reader that stopped at the first `{`
 * would see one of the two.
 */
function rule(selector) {
  return normalized
    .split('}')
    .map((block) => block.split('{').slice(-2))
    .filter(([selectors]) => selectors?.split(',').includes(selector))
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
    /* The marker is drawn at runtime, by the fragment's script as by the bindings. */
    if (declared === 'marker') {
      assert.match(fragment, /createIndicator\(list, \{[\s\S]*?part: 'marker'/);
      continue;
    }
    assert.match(
      fragment,
      new RegExp(`data-part="${declared}"`),
      `${declared} appears in no scene`,
    );
  }
});

/**
 * The roles are the pattern's, and the fragment is the third place the DOM is
 * written. A scene that forgot one would photograph a row of buttons that
 * happens to look like a tab list.
 */
test('writes the pattern roles in every scene', () => {
  for (const [part, role] of Object.entries(contract.roles)) {
    assert.match(fragment, new RegExp(`role="${role}"`), `${part} carries no role in any scene`);
  }
  const tabs = [...fragment.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map(([tag]) => tag);
  assert.ok(tabs.length > 0, 'the fragment renders no tab');
  for (const tag of tabs) {
    assert.match(tag, /aria-controls="/, `a tab names no panel: ${tag}`);
    assert.match(tag, /aria-selected="(true|false)"/, `a tab states no selection: ${tag}`);
  }
});

/**
 * Four columns and two rows, and every part in a cell. An overlaid paging
 * control would need a gradient the width of the control, mirrored for a
 * right-to-left document, and it would cover the hairline it sits on.
 */
test('places every part in a grid cell rather than over one', () => {
  assert.match(rule(ui), /grid-template-columns:auto minmax\(0,1fr\) auto auto/);
  assert.match(rule(part('list')), /grid-column:2/);
  assert.match(rule(`${scroll}[data-direction='start']`), /grid-column:1/);
  assert.match(rule(`${scroll}[data-direction='end']`), /grid-column:3/);
  assert.match(rule(part('actions')), /grid-column:4/);
  assert.match(rule(part('panel')), /grid-column:1 \/ -1/);
  /* The things positioned over a cell are the marker the list draws, the
     hover bar on the item, and the dismiss's invisible touch target on a
     coarse pointer (R2.6). */
  const positioned = [...normalized.matchAll(/([^{}]+)\{[^{}]*position:absolute/g)].flatMap(
    ([, selector]) => selector.split(','),
  );
  assert.deepEqual(positioned, [marker, `${part('item')}::before`, `${part('dismiss')}::after`]);
});

/**
 * `md` is the base rule rather than a rule of its own, so a family that states
 * no size still reads the middle step of every control scale.
 */
test('answers every size the contract declares from the control scales', () => {
  for (const size of contract.axes.size.filter((step) => step !== 'md')) {
    assert.ok(normalized.includes(`${ui}[data-size='${size}']{`), `no rule answers ${size}`);
  }
  assert.ok(!normalized.includes(`${ui}[data-size='md']{`), 'md is the base, not a second rule');
  assert.match(rule(ui), /--_height:var\(--slotted-control-height-md/);
  assert.match(rule(`${ui}[data-size='sm']`), /--_height:var\(--slotted-control-height-sm/);
  assert.match(rule(`${ui}[data-size='lg']`), /--_height:var\(--slotted-control-height-lg/);
});

/**
 * Carbon states the rule for the whole field: horizontal tabs "should not wrap
 * to multiple lines or stack on top of each other; instead, they should scroll
 * horizontally". A wrapped tab list is two rows of tabs with one marker.
 */
test('scrolls a list that does not fit instead of wrapping it', () => {
  assert.match(rule(part('list')), /overflow-x:auto/);
  assert.doesNotMatch(rule(part('list')), /flex-wrap:wrap/);
  assert.match(rule(at("[data-fit='equal']", 'label')), /text-overflow:ellipsis/);
});

/**
 * The platform's scrollbar is the affordance until the family draws its own,
 * and `data-overflowing` is the only signal the family has that a script is
 * running at all.
 */
test('keeps a scrollbar until the paging controls replace it', () => {
  assert.match(rule(part('list')), /scrollbar-width:thin/);
  assert.match(rule(at('[data-overflowing]', 'list')), /scrollbar-width:none/);
});

/**
 * One marker the list draws, placed by `left` and sized by `inline-size`
 * from the selected tab's measured box, and never scaled: a bar per item could
 * only scale from an edge. Its thickness, rounding and inset are tokens, and
 * the thickness never falls below the thick border width.
 */
test('draws one marker in the list that slides to the selected tab', () => {
  const body = rule(marker);
  assert.match(body, /left:calc\(var\(--_indicator-start,0px\) \+ var\(--_left-inset\)/);
  assert.match(body, /inline-size:var\(--_length\)/);
  assert.match(body, /block-size:var\(--_marker-size\)/);
  assert.match(body, /border-radius:var\(--_marker-radius\)/);
  assert.match(body, /--_length:max\(var\(--slotted-space-6,1rem\),var\(--_span\)\)/);
  assert.doesNotMatch(declarations, /scale\(/);
  assert.match(
    rule(ui),
    /--_marker-size:max\(var\(--slotted-tabs-marker-size,3px\),var\(--slotted-border-width-thick,2px\)\)/,
  );
  assert.match(
    rule(ui),
    /--_marker-radius:var\(--slotted-tabs-marker-radius,var\(--slotted-radius-full/,
  );
  assert.match(
    rule(ui),
    /--_marker-inset:var\(--slotted-tabs-marker-inset,var\(--_padding-inline\)\)/,
  );
  assert.match(rule(part('list')), /position:relative/);
});

/** The marker excludes the closing control, and stands on the list's edge over the track. */
test('spans the tab’s content box and stands over the track', () => {
  assert.ok(
    normalized.includes(
      `${ui}:not([data-orientation='vertical'])>[data-part-list]:has(>[data-part-item][data-selected]>[data-part-dismiss])>[data-part-marker]{--_end-inset:0px;}`,
    ),
  );
  assert.match(
    rule(marker),
    /inset-block-end:calc\(var\(--_marker-lift,0px\) \+ var\(--_marker-offset\)\)/,
  );
  assert.match(rule(ui), /--_marker-offset:var\(--slotted-tabs-marker-offset,1px\)/);
  const track = rule(at("[data-variant='line'][data-track='line']", 'list'));
  assert.match(
    track,
    /box-shadow:inset 0 calc\(-1 \* var\(--_track-size\)\) 0 var\(--_track-color\)/,
  );
  assert.match(track, /padding-block-end:var\(--_track-size\)/);
});

/** The measurement is physical, so the inset on the left edge swaps under `:dir(rtl)`. */
test('mirrors the rules that cannot be written logically', () => {
  assert.ok(normalized.includes(`${ui}:dir(rtl)>:where([data-part-list])>[data-part-marker]{`));
  assert.ok(
    normalized.includes(
      `${ui}[data-orientation='vertical'][data-variant='line'][data-track='line']:dir(rtl)>[data-part-list]{`,
    ),
  );
  assert.doesNotMatch(declarations, /margin-left|margin-right|padding-left|padding-right/);
});

/**
 * The `high-contrast` scheme paints every surface `Canvas`, so a contained
 * selection said with a fill alone would be invisible in exactly the scheme
 * that exists for the people who need it most.
 */
test('says the selection with a mark as well as with a fill', () => {
  const selected = rule(`${at("[data-variant='contained']", 'item')}[data-selected]`);
  assert.match(selected, /background-color:var\(--slotted-tabs-contained-selected-background/);
  assert.match(rule(marker), /background-color:var\(--slotted-tabs-marker-color/);
  assert.match(declarations, /@media \(forced-colors: active\)/);
});

test('holds hover and press back for a disabled control and for the selected tab', () => {
  for (const selector of normalized.split('}').map((block) => block.split('{')[0])) {
    if (selector.includes('@')) continue;
    if (!/:hover|:active(?![-\w])/.test(selector)) continue;
    assert.ok(selector.includes(':not(:disabled)'), `${selector} answers a disabled control`);
  }
  assert.ok(
    normalized.includes(`${part('tab')}:not(:disabled):not([aria-selected='true']):hover{`),
    'a selected tab answers hover as if it were not selected',
  );
});

/**
 * At the dense step with `size="sm"` the glyph is twelve pixels, under the
 * twenty-four WCAG 2.2 SC 2.5.8 asks for. The box around it is the target.
 */
test('gives the two glyph controls the target their glyphs are too small to be', () => {
  /* Both are inner controls (R2): the mark with a step of air around it,
     capped at the inner-control size and never below the minimum target. The
     paging control is as tall as the row it pages and that wide; the closing
     control is that square. */
  const paging = rule(scroll);
  assert.match(
    paging,
    /inline-size:max\(var\(--slotted-target-min,24px\),min\(calc\(var\(--_icon-size\) \+ 2 \* var\(--slotted-space-2,0\.25rem\)\),var\(--_inner-size\)\)\)/,
  );
  assert.match(paging, /min-block-size:var\(--_height\)/);
  assert.match(
    rule(ui),
    /--_dismiss-size:max\(var\(--slotted-target-min,24px\),min\(calc\(var\(--_icon-size\) \+ 2 \* var\(--slotted-space-2,0\.25rem\)\),var\(--_inner-size\)\)\)/,
  );
  const dismiss = rule(part('dismiss'));
  assert.match(dismiss, /inline-size:var\(--_dismiss-size\)/);
  assert.match(dismiss, /block-size:var\(--_dismiss-size\)/);
});

/**
 * T3, the question T1 left open: a paging control at its own end keeps its
 * track or gives it up.
 *
 * It keeps it. Both controls are drawn only while the list overflows, so the
 * empty track exists exactly when the other control is live and a reader has a
 * pointer on it — and giving the track up would slide the whole list twenty
 * four pixels plus the gap under that pointer, on the first page and again on
 * the last. The cost of keeping it is that a list at its start begins one
 * track in from the edge; the cost of dropping it is a target moving out from
 * under a finger mid-press. MUI's `TabScrollButton` reserves the same track
 * for the same reason.
 *
 * Hidden rather than removed is what says it: `visibility: hidden` leaves the
 * box in the grid and takes the control out of the picture and out of the
 * pointer's way.
 */
test('keeps the track of a paging control that has reached its end', () => {
  const disabled = rule(`${scroll}:disabled`);
  assert.match(disabled, /visibility:hidden/);
  assert.ok(
    !/display:none/.test(disabled),
    'a collapsed track moves the list under the pointer using the other control',
  );
  /* The two tracks are `auto` columns, so they cost nothing while the family
     is not overflowing and the bindings draw no control at all. */
  assert.match(rule(ui), /grid-template-columns:auto minmax\(0,1fr\) auto auto/);
});

/*
 * Closing a tab closes a view and destroys nothing: the closing control takes
 * the neutral ground of the dialog's close, on a round box.
 */
test('draws the closing control neutral and round', () => {
  assert.match(rule(part('dismiss')), /border-radius:var\(--slotted-radius-full,9999px\)/);
  const hover = rule(`${part('dismiss')}:not(:disabled):hover`);
  const active = rule(`${part('dismiss')}:not(:disabled):active`);
  assert.match(hover, /--slotted-tone-secondary-subtle-hover/);
  assert.match(active, /--slotted-tone-secondary-subtle-active/);
  assert.doesNotMatch(hover + active, /danger|text-inverse/);
});

/**
 * The box overhangs the mark on every side, so a box set flush against the
 * label leaves a hole where the overhang is. Both margins take the overhang
 * back, which puts the mark the tab's own inset from the last letter and from
 * the end of the item.
 */
test('aligns the closing control by its mark rather than by its box', () => {
  const dismiss = rule(part('dismiss'));
  assert.match(dismiss, /align-self:center/);
  assert.match(
    dismiss,
    /margin-inline-end:calc\(var\(--_padding-inline\) - var\(--_dismiss-overhang\)\)/,
  );
  assert.match(
    dismiss,
    /margin-inline-start:calc\(var\(--_padding-inline\) - var\(--_dismiss-overhang\)\)/,
  );
  assert.match(
    rule(`${part('item')}:has(>[data-part-dismiss])>[data-part-tab]`),
    /padding-inline-end:0/,
  );
});

/**
 * The closing control keeps the library's outward ring: it is shorter than the
 * item and centred in it, so nothing about the ring reaches the edge the
 * scroller clips at, and an inset ring on a twenty-four pixel box would be
 * drawn through the mark.
 */
test('rings the closing control from outside and the tab from inside', () => {
  assert.match(
    rule(`${part('dismiss')}:focus-visible`),
    /outline-offset:var\(--slotted-focus-ring-offset,2px\)/,
  );
  assert.match(
    rule(`${part('tab')}:focus-visible`),
    /outline-offset:calc\(-1 \* \(var\(--slotted-focus-ring-offset,2px\) \+ var\(--_marker-size\)\)\)/,
  );
});

/**
 * A list standing on a line the page already drew: two hairlines a pixel apart
 * read as one smudge, and no surveyed implementation offers a way out —
 * Cloudscape ships a whole `container` variant for the same case.
 */
test('can stand on a line the page already drew', () => {
  assert.ok(normalized.includes(`${at("[data-variant='line'][data-track='line']", 'list')}{`));
  assert.doesNotMatch(rule(at("[data-track='none']", 'list')), /box-shadow/);
  assert.match(fragment, /data-track="none"/);
});

test('paints no glyph of its own, and never draws one as a character', () => {
  /* The cross and the chevron are Glyph elements the bindings render; the
     sheet only sizes the box they sit in. */
  assert.doesNotMatch(declarations, /--slotted-icon-(x|chevron-right)\b/);
  assert.doesNotMatch(declarations, /\[data-part-(dismiss|scroll)\]::before/);
  assert.match(rule(part('dismiss')), /--slotted-icon-size:var\(--_icon-size\)/);
  assert.match(rule(scroll), /--slotted-icon-size:var\(--_icon-size\)/);
  /* An empty `content` materialises a box; what is refused is a character
     standing in for artwork, so the pattern is a string with something in it. */
  assert.doesNotMatch(declarations, /content:\s*['"][^'"]/);
});

/**
 * One glyph, turned. A chevron is symmetrical about the axis it is flipped on,
 * and the box's own `directional` mirror handles a right-to-left document.
 */
test('points each paging control along the reading direction', () => {
  assert.match(rule(`${scroll}[data-direction='start']>[data-ui-icon]`), /rotate:0\.5turn/);
  assert.ok(!normalized.includes(`${ui}:dir(rtl) [data-part-scroll]`));
});

/**
 * `[hidden]` carries `display: none` at a specificity any rule here would beat,
 * so the attribute is restated rather than relied on.
 */
test('hides a panel with the attribute the platform already understands', () => {
  assert.match(rule(`${part('panel')}[hidden]`), /display:none/);
  assert.match(fragment, /data-part="panel"[^>]*hidden/);
});

test('transitions what the eye has to follow, and takes every duration from the scale', () => {
  /* The slide is translate and scale from the box the mark was drawn in, on the compositor. */
  assert.match(
    rule(`${marker}[data-moving]`),
    /animation:slotted-tabs-marker-slide var\(--slotted-duration-medium\) var\(--_marker-easing\)/,
  );
  assert.match(
    normalized,
    /@keyframes slotted-tabs-marker-slide\{from\{translate:var\(--_indicator-shift,0px 0px\);scale:var\(--_indicator-scale,1 1\);\}\}/,
  );
  assert.doesNotMatch(rule(`${marker}[data-moving]`), /transition:/);
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\[data-part-marker\]\[data-moving\] \{\s*animation: none;/,
  );
  assert.match(rule(part('tab')), /transition:/);
  assert.match(
    rule(`${part('panel')}:not([hidden])`),
    /animation:slotted-tabs-panel-in var\(--slotted-duration-short\)/,
  );
  assert.doesNotMatch(declarations, /\d+m?s(?![\w-])/);
  assert.doesNotMatch(declarations, /\binfinite\b/);
});

/** A vertical list turns the track, the marker and the grid a quarter. */
test('turns the whole family for a vertical list rather than rearranging it', () => {
  assert.match(
    rule(`${ui}[data-orientation='vertical']`),
    /grid-template-columns:auto minmax\(0,1fr\)/,
  );
  assert.match(rule(at("[data-orientation='vertical']", 'list')), /flex-direction:column/);
  assert.match(rule(`${ui}[data-orientation='vertical']>[data-part-scroll]`), /display:none/);
  const vertical = rule(
    `${ui}[data-orientation='vertical']>:where([data-part-list])>[data-part-marker]`,
  );
  assert.match(vertical, /block-size:var\(--_length\)/);
  assert.match(vertical, /inline-size:var\(--_marker-size\)/);
  assert.match(vertical, /inset-block:calc\(var\(--_indicator-start,0px\)/);
});

/**
 * The grid carries no column gap of its own: three gaps stood around two
 * empty paging columns and an empty actions column, and the list's track
 * started eight pixels in and stopped sixteen short of the family's edge. The
 * parts that fill those columns carry the distance, so a list alone runs
 * edge to edge.
 */
test('keeps the list edge to edge when nothing stands beside it', () => {
  const root = /\[data-ui-tabs\]\s*\{([\s\S]*?)\n\s*\}/.exec(css)?.[1] ?? '';
  assert.doesNotMatch(root, /column-gap/);
  assert.match(
    css,
    /\[data-part-scroll\]\[data-direction='start'\]\s*\{[^}]*margin-inline-end:\s*var\(--slotted-tabs-actions-gap/,
  );
  assert.match(
    css,
    /\[data-part-scroll\]\[data-direction='end'\]\s*\{[^}]*margin-inline-start:\s*var\(--slotted-tabs-actions-gap/,
  );
  assert.match(
    css,
    /\[data-part-actions\]\s*\{[^}]*margin-inline-start:\s*var\(--slotted-tabs-actions-gap/,
  );
});

/** One explicit row: a list with no panel beside it sits on its own edge, with no gap under it. */
test('keeps no row gap under a list that has no panel', () => {
  const root = /\[data-ui-tabs\]\s*\{([\s\S]*?)\n\s*\}/.exec(css)?.[1] ?? '';
  assert.match(root, /grid-template-rows:\s*auto;/);
  assert.doesNotMatch(root, /grid-template-rows:\s*auto auto/);
});

/**
 * The paging controls are the root's own children, and every rule keys them
 * that way. A descendant selector reached any `scroll` part inside a panel: a
 * table's scroller in a tab panel was drawn as a 24-pixel paging button, and
 * the table squeezed into it one word per line.
 */
test('draws only its own paging controls, not a scroll part inside a panel', () => {
  assert.ok(!normalized.includes(`${ui} [data-part-scroll]`), 'a descendant scroll selector');
  assert.ok(!normalized.includes(`${ui}[data-orientation='vertical'] [data-part-scroll]`));
  assert.ok(!/:has\(\[data-part-scroll\]/.test(normalized), 'a :has() that reaches into panels');
});

/**
 * Every part is reached down the family's own chain of children. A descendant
 * selector reached the parts of any family inside a panel or the actions slot:
 * a description list's `list` part was drawn as a scrolling flex row with the
 * tab track under it, and a badge's `label` inside a tab took the tab label's
 * clipping. Neither a descendant combinator before a part nor a `:has()` that
 * descends is left.
 */
test('reaches only its own parts, never the parts of a family inside it', () => {
  assert.ok(!normalized.includes(' [data-part='), 'a descendant combinator before a part');
  assert.ok(!/:has\(\[data-part-/.test(normalized), 'a :has() that descends');
  for (const [name, path] of Object.entries(PATHS)) {
    assert.ok(normalized.includes(path), `no rule reaches ${name} down the chain`);
  }
});

/**
 * A vertical list stands beside its panel, and the root's row gap is the
 * distance between the two in a horizontal family. With no column gap the
 * panel's first letter touched the track the list draws on its end edge.
 */
test('keeps a vertical list as far from its panel as a horizontal one', () => {
  assert.match(
    rule(`${ui}[data-orientation='vertical']`),
    /column-gap:var\(--slotted-tabs-gap,var\(--slotted-space-6,1rem\)\)/,
  );
});
