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
    new URL('../../../../specs/components/timeline/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./timeline.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./timeline.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('styles every part the contract declares', () => {
  for (const part of contract.members.timeline.parts) {
    const selector = part === 'root' ? '[data-ui-timeline]{' : `[data-part-${part.toLowerCase()}]`;
    assert.ok(normalized.includes(selector), `Missing part ${part}`);
  }
});

/**
 * The axes that change the paint. `mode`, `order`, `growing`, `timeFormat`
 * and `level` change the element, the arithmetic or the text, and nothing a
 * stylesheet can see; `connector` is read from the item under its own name.
 */
test('answers every value of every painted axis', () => {
  const painted = ['orientation', 'placement', 'variant', 'tone', 'size', 'connector'];
  for (const axis of painted) {
    for (const value of contract.axes[axis]) {
      /* The default paint of each, which no selector names. */
      if (axis === 'connector' && value === 'solid') continue;
      if (axis === 'placement' && value === 'end') continue;
      if (axis === 'size' && value === 'md') continue;
      assert.ok(normalized.includes(`[data-${axis}='${value}']`), `Missing ${axis} ${value}`);
    }
  }
});

/**
 * Each status is a shape as well as a color: pending is the variant's own
 * mark, complete is a filled disc with the check glyph knocked out of it, current is
 * a filled disc with a ring around it, loading is the shared spinner at a
 * dot's size. `high-contrast` paints every tone in one ink and forced colors
 * paint every ring in one, so the shape is what is left. The ring is a shadow,
 * because an outline in this library is the focus ring; forced colors drop
 * the shadow and get the ring back as an outline in their block.
 */
test('separates the statuses by shape as well as by color', () => {
  assert.ok(
    normalized.includes(
      '[data-current][data-part-marker]{box-shadow:000var(--slotted-border-width-thick,2px)var(--_surface),000var(--_reach)var(--_tone-mark),',
    ),
    'the current marker is ringed',
  );
  assert.ok(
    normalized.includes(
      '[data-current]:not([data-loading])[data-part-marker]{outline:var(--_edge)solidCanvasText;',
    ),
    'forced colors get the ring back',
  );
  assert.ok(
    normalized.includes(
      '[data-complete]:not([data-current])[data-part-marker]:has(>[data-check]){background-color:var(--_tone-mark);border-width:0;',
    ),
    'a finished dot fills the whole disc',
  );
  assert.ok(
    normalized.includes(
      '[data-part-marker]>[data-ui-icon][data-check]{--slotted-icon-size:calc(var(--_marker)-2*var(--slotted-space-1,0.125rem));color:var(--_surface);',
    ),
    'and knocks the check out of it in the ground',
  );
  assert.ok(
    normalized.includes('[data-part-marker]>[data-ui-spinner]{--slotted-spinner-size:var(--_dot);'),
  );
  assert.ok(normalized.includes('[data-complete][data-part-connector]'));
});

/**
 * An empty marker is a dot as large as the glyph a badge holds, and a spinner
 * is the same dot; a marker with a glyph or an avatar is a badge one step of
 * air wider than the glyph on each side. The rail widens to the badge only
 * when the timeline holds one.
 *
 * Every width the line is centerd in is the line's own width plus an even
 * number of pixels, so the line stands a whole number of pixels inside it.
 * An eight-pixel dot on a one-pixel line put the line three and a half pixels
 * in, and the browser drew it one device pixel off the dot's center at 100%,
 * 150% and 200%. The core is laid over the dot at a whole-pixel inset, never
 * centerd inside it as a smaller box.
 */
test('keeps every marker width on the line parity', () => {
  assert.ok(
    normalized.includes('--_dot:calc(var(--_rule)+round(up,var(--_glyph)-var(--_rule),2px));'),
  );
  assert.ok(normalized.includes('--_core:calc(var(--_rule)+round(nearest,'));
  assert.ok(normalized.includes('--_badge:calc(var(--_rule)+round(up,'));
  assert.ok(
    normalized.includes(
      '[data-ui-timeline]:has([data-part-marker]>:not([data-ui-spinner],[data-check])){--_rail:var(--_badge);}',
    ),
  );
  assert.ok(
    normalized.includes(
      '[data-part-marker]:not(:empty,:has(>[data-ui-spinner],>[data-check])){--_marker:var(--_badge);',
    ),
  );
  assert.ok(
    normalized.includes(
      "[data-part-marker]:empty::after{background-color:var(--_tone-mark);border-radius:inherit;content:'';inset:calc((var(--_marker)-var(--_core))/2);",
    ),
  );
  assert.ok(!/radial-gradient/.test(declarations), 'no gradient stands in for the dot');
});

/**
 * The line is a hairline border from the middle of this row's first line to
 * the middle of the next row's — the two markers' centers, whatever their
 * size — and the markers stand above it with a halo of the ground. A border
 * keeps its color under forced colors where a background does not, and
 * `dashed` is then a word rather than a gradient.
 */
test('runs the line from center to center as a border', () => {
  assert.match(
    declarations,
    /\[data-part-connector\] \{[^}]*border-inline-start: var\(--_rule\) solid var\(--_line\)/,
  );
  assert.ok(normalized.includes('inset-block-start:0.5lh'));
  assert.ok(normalized.includes('inset-block-end:calc(-0.5lh-var(--_item-gap))'));
  assert.ok(normalized.includes('box-shadow:000var(--_line-gap)var(--_surface)'));
  assert.ok(
    normalized.includes(
      "[data-connector='dashed'][data-part-connector]{border-block-start-style:dashed;border-inline-start-style:dashed;}",
    ),
  );
  assert.ok(!/linear-gradient/.test(declarations), 'no gradient stands in for a dash');
});

/**
 * The marker centers on the title's first line by the rule `toast` and
 * `alert` draw their marks with: half the difference between one line and the
 * mark, measured in the rail whose type is the title's.
 */
test('centers the marker on the first line of the title, on a whole pixel', () => {
  assert.ok(normalized.includes('--_lift:round(nearest,calc((1lh-var(--_marker))/2),1px)'));
  assert.ok(!normalized.includes('--_lift:calc('), 'no lift left unrounded');
  assert.ok(normalized.includes('margin-block-start:var(--_lift)'));
});

/**
 * Every length an event's position sums is a whole pixel: the leading, the
 * room the horizontal list keeps for the ring, the first side of an
 * alternating row. The secondary text takes the title's size, so no event is
 * set taller than its own title's line.
 */
test('stacks events on whole pixels, with the secondary text at the title size', () => {
  assert.ok(
    normalized.includes('--_leading:round(up,calc(var(--_font-size)*var(--_line-height)),1px);'),
  );
  assert.ok(!normalized.includes('line-height:var(--_line-height)'), 'no fractional leading');
  assert.ok(normalized.includes('padding-block:round(up,var(--_reach),1px)'));
  assert.ok(normalized.includes('[before]round(down,calc((100%-var(--_rail))/2-var(--_gap)),1px)'));
  assert.ok(
    normalized.includes('--_meta-size:var(--slotted-timeline-meta-font-size,var(--_font-size));'),
  );
  assert.ok(!normalized.includes('var(--slotted-font-size-sm'), 'no fixed secondary size');
});

/**
 * A face in the marker is the smallest avatar rounded to the line's parity,
 * never the badge: 21 put the initials at 8.4 pixels.
 */
test('draws an avatar marker at the smallest avatar', () => {
  assert.ok(
    normalized.includes(
      '--_avatar:calc(var(--_rule)+round(up,var(--slotted-avatar-size-xs,24px)-var(--_rule),2px));',
    ),
  );
  assert.ok(
    normalized.includes(
      '[data-part-marker]>[data-ui-avatar]{--slotted-avatar-size:var(--_avatar);}',
    ),
  );
  assert.ok(
    normalized.includes(
      '[data-ui-timeline]:has([data-part-marker]>[data-ui-avatar]){--_rail:max(var(--_badge),var(--_avatar));}',
    ),
  );
});

/**
 * The tinted ramp ends at the surface `fresh` rests on, so its steps are a
 * state layer of its own ink; the group heading, with no ground, settles by
 * a hairline. Each press differs from its hover in every scheme.
 */
test('steps the fresh pill by state layer and presses the group heading in place', () => {
  assert.ok(
    normalized.includes(
      '[data-part-fresh]:enabled:hover{background-color:color-mix(inoklab,var(--_tone-surface),currentColorvar(--slotted-timeline-state-layer-hover,8%));}',
    ),
  );
  assert.ok(
    normalized.includes(
      '[data-part-fresh]:enabled:active{background-color:color-mix(inoklab,var(--_tone-surface),currentColorvar(--slotted-timeline-state-layer-active,14%));}',
    ),
  );
  assert.ok(!normalized.includes('--slotted-tone-accent-subtle-'), 'no tinted role under fresh');
  assert.ok(
    normalized.includes(
      '[data-part-group-trigger]:enabled:active{color:var(--_strong);translate:0var(--slotted-border-width-thin,1px);}',
    ),
  );
  assert.ok(
    normalized.includes(
      'translatevar(--slotted-duration-instant)var(--slotted-control-transition-easing);',
    ),
    'the settle is listed in the transition',
  );
});

/**
 * A fold is one movement: the chevron, the list's height, its ink and the
 * heading's distance share `--_fold`, the duration and curve `collapsible`
 * folds with. A folded list stays laid out at no height, so the page below
 * slides with it and a group open at the first render grows from nothing
 * earlier — no `@starting-style` is involved in a group.
 */
test('folds a group as one movement, with the page below sliding', () => {
  assert.ok(
    normalized.includes(
      '[data-part-group]{--_fold:var(--slotted-duration-medium)var(--slotted-control-transition-easing,var(--slotted-easing-standard));}',
    ),
  );
  assert.ok(
    normalized.includes(
      '[data-part-group-indicator]>[data-ui-icon]{rotate:-90deg;transition:rotatevar(--_fold);}',
    ),
  );
  assert.ok(
    normalized.includes(
      'transition:block-sizevar(--_fold),opacityvar(--_fold),visibilityvar(--_fold);',
    ),
  );
  assert.ok(
    normalized.includes(
      '[data-part-group-list][hidden]{block-size:0;display:flex;opacity:0;visibility:hidden;}',
    ),
  );
  assert.ok(
    normalized.includes('[data-part-group-label]{transition:margin-block-endvar(--_fold);}'),
  );
  assert.ok(!/group-list'\]:not\(\[hidden\]\)/.test(normalized), 'no starting style on a group');
});

/**
 * The bindings keep the fresh pill mounted and write `hidden` at a count of
 * zero; the author's `display: flex` would otherwise keep it on the page. It
 * grows in and folds away on the group's movement, height and border and
 * the distance under it included, so the events below slide by it.
 */
test('folds the fresh pill it keeps in and out, the events below sliding', () => {
  assert.ok(
    normalized.includes(
      '[data-part-fresh][hidden]{block-size:0;border-block-width:0;display:none;margin-block-end:0;min-block-size:0;opacity:0;',
    ),
  );
  assert.ok(
    normalized.includes(
      '@starting-style{[data-ui-timeline][data-part-fresh]:not([hidden]){block-size:0;border-block-width:0;margin-block-end:0;min-block-size:0;opacity:0;}}',
    ),
  );
  assert.ok(
    normalized.includes(
      'block-sizevar(--_fold),min-block-sizevar(--_fold),border-block-widthvar(--_fold),margin-block-endvar(--_fold),opacityvar(--_fold),displayvar(--_fold)allow-discrete;',
    ),
  );
});

/**
 * The glyph in a badge takes the badge's parity. An odd badge keeps the line
 * in its middle; an even glyph in it stood half a pixel in and was painted
 * half a CSS pixel off center at every zoom.
 */
test('centers a badge glyph on whole pixels', () => {
  assert.ok(
    normalized.includes(
      '[data-part-marker]>[data-ui-icon]{--slotted-icon-size:calc(var(--_badge)-2*round(down,(var(--_badge)-var(--_glyph))/2,1px));',
    ),
  );
});

/**
 * The family answers its own inline size, on the root, and its breakpoints
 * are literals because a container condition cannot read a custom property.
 */
test('reflows by container query with the breakpoints the contract records', () => {
  assert.ok(normalized.includes('[data-ui-timeline]{'));
  assert.match(declarations, /container-name: slotted-timeline;\s*container-type: inline-size;/);
  assert.ok(normalized.includes('@containerslotted-timeline(max-width:30rem)'));
  assert.ok(normalized.includes('@containerslotted-timeline(max-width:20rem)'));
  assert.equal(contract.reflow.breakpoint, '30rem');
  assert.ok(normalized.includes(":not([data-reflow='false'])"));
});

test('lets the opposite column exist only when an item projects it', () => {
  assert.ok(
    normalized.includes(':has([data-part-opposite]){--_opposite-column:var(--_opposite);}'),
  );
});

/**
 * The feed's articles are tab stops and draw the theme's ring; the three
 * controls the family paints hold hover and press back behind `:enabled`.
 */
test('draws focus on the article and guards the controls', () => {
  assert.ok(normalized.includes('[data-part-item][tabindex]:focus-visible{'));
  for (const control of [
    '[data-part-group-trigger]',
    '[data-part-fresh]',
    'button[data-part-more]',
  ]) {
    assert.ok(normalized.includes(`${control}:enabled:hover`), `${control} hover`);
    assert.ok(normalized.includes(`${control}:enabled:active`), `${control} press`);
    assert.ok(normalized.includes(`${control}:focus-visible`), `${control} focus`);
  }
});

/**
 * The ring is `spinner`'s and the chevron and the check are `Glyph` elements
 * the bindings render: the family draws no arc, no mask and no character of
 * its own, and turns the chevron's icon box rather than swapping the glyph.
 */
test('borrows the ring and turns the chevron glyph', () => {
  assert.ok(!/animation:/.test(declarations), 'the family animates nothing itself');
  assert.ok(!/mask/.test(declarations), 'no mask stands in for a glyph');
  assert.ok(normalized.includes('[data-part-group-indicator]>[data-ui-icon]{rotate:-90deg;'));
  assert.ok(
    normalized.includes(
      '[data-open]>[data-part-group-label][data-part-group-indicator]>[data-ui-icon]{rotate:0deg;',
    ),
  );
  for (const indicator of fragment.matchAll(
    /<span aria-hidden="true" data-part="group-indicator"\s*>([\s\S]*?)<\/span\s*>\s*<\/span/g,
  )) {
    assert.match(indicator[1], /data-ui="icon"[\s\S]*data-glyph="chevron-down"/);
  }
  assert.ok(!/content:\s*['"][^'"]+['"]/.test(declarations), 'no character stands in for a glyph');
});

test('renders every part in the harness fragment', () => {
  for (const part of contract.members.timeline.parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `harness renders no ${part}`);
  }
  for (const state of ['data-current', 'data-complete', 'data-loading', 'data-open']) {
    assert.ok(fragment.includes(state), `harness exercises no ${state}`);
  }
  assert.ok(fragment.includes('role="feed"'));
  assert.ok(fragment.includes('aria-posinset="1"'));
});
