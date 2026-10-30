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
    new URL('../../../../specs/components/filter-bar/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./filter-bar.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./filter-bar.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

/**
 * Every part the contract declares is either drawn by this sheet or is another
 * family's root worn inside a part of this family's. `add`, `clear`, `apply`,
 * `reset`, `summary`, `add-rule`, `add-group`, `remove-group` and
 * `save-preset` are `button`'s and carry this family's part name on the
 * button itself, which `button.css` never selects; `search`, `preset`,
 * `field` and `operator` wrap a `text-field` or a `select`, whose sheets do
 * select their own root.
 */
test('styles or wears every part the contract declares', () => {
  const worn = new Set([
    'add',
    'clear',
    'apply',
    'reset',
    'add-rule',
    'add-group',
    'remove-group',
    'save-preset',
  ]);
  for (const part of contract.members.filterBar.parts) {
    if (worn.has(part)) continue;
    const selector =
      part === 'root' ? '[data-ui-filter-bar]{' : `[data-part-${part.toLowerCase()}]`;
    assert.ok(normalized.includes(selector), `Missing part ${part}`);
  }
  for (const wrapped of ['search', 'preset']) {
    assert.ok(
      normalized.includes(`[data-part-${wrapped.toLowerCase()}]>[data-ui-`),
      `${wrapped} wraps another family's root`,
    );
  }
});

/**
 * Two lines from 36rem up — the search, the consumer's controls and the
 * count, then the toolbar — and the fold under 36rem. The wide composition
 * that put the toolbar beside the search is gone with the measurement it
 * needed.
 */
test('composes by container query with the container on the root and the grid on the frame', () => {
  assert.ok(
    normalized.includes(
      '[data-ui-filter-bar][data-part-root]{container-name:slotted-filter-bar;container-type:inline-size;display:block;inline-size:100%;',
    ),
  );
  assert.ok(
    normalized.includes(
      "[data-part-frame]{align-items:start;column-gap:var(--_gap);display:grid;grid-template-areas:'searchendcount''barbarbar';",
    ),
  );
  assert.doesNotMatch(declarations, /min-width: 64rem/);
  assert.doesNotMatch(declarations, /data-bar-wrapped/);
  assert.match(declarations, /@container slotted-filter-bar \(max-width: 36rem\)/);
  assert.match(contract.responsive.narrow, /36rem/);
  /* The builder is portaled and measures itself. */
  assert.match(declarations, /@container slotted-filter-bar-builder \(max-width: 30rem\)/);
});

/**
 * The rule a pill opens carries the family's `data-ui` alone in a popover,
 * so the root's container rule must not reach it: a container has no
 * intrinsic inline size, and a shrink-wrapped popover measured it at zero
 * and wrapped every control one word per line. It is a column at a width
 * of its own instead.
 */
test('lays the popover editor out as a column at its own width, outside the root container', () => {
  assert.ok(
    normalized.includes(
      '[data-ui-filter-bar][data-part-rule]{display:grid;gap:var(--_gap);inline-size:var(--slotted-filter-bar-editor-size,18rem);max-inline-size:100%;',
    ),
  );
  assert.ok(!normalized.includes('[data-ui-filter-bar]:not([data-part-builder])'));
  assert.ok(
    normalized.includes(
      '[data-ui-filter-bar][data-part-rule]>[data-part-actions]{align-items:center;display:flex;gap:var(--_gap-sm);justify-content:flex-end;',
    ),
  );
});

/**
 * Under 36rem the bar is one row that scrolls sideways: the summary, every
 * chip — the folded ones too — and the empty pills, none of them shrinking.
 * What a phone does not draw leaves the focus order as well as the picture:
 * `visibility: hidden` is what `createArrowNavigation` reads to skip a stop,
 * and `display: none` alone leaves the computed visibility at `visible`. The
 * selector goes through the frame, so it outranks the rule that lays the
 * manual actions out.
 */
test('keeps every condition on one sideways row on a phone, and drops what it does not draw from the roving ring', () => {
  const narrow = normalized.slice(normalized.indexOf('(max-width:36rem)'));
  const row =
    narrow.split('[data-ui-filter-bar]>[data-part-frame]>[data-part-bar]{')[1]?.split('}')[0] ?? '';
  assert.match(row, /flex-wrap:nowrap;/);
  assert.match(row, /overflow-x:auto;/);
  assert.doesNotMatch(row, /margin|padding/);
  assert.ok(
    narrow.includes(
      '[data-ui-filter-bar]>[data-part-frame]>[data-part-bar]>:is([data-part-summary],[data-part-pill]):focus-visible{outline-offset:calc(var(--slotted-focus-ring-width,2px)*-1);}',
    ),
  );
  assert.ok(
    narrow.includes(
      '[data-ui-filter-bar]>[data-part-frame]>[data-part-bar]>:is([data-part-summary],[data-part-chip],[data-part-pill]){flex:none;}',
    ),
  );
  assert.ok(
    narrow.includes(
      '[data-ui-filter-bar]>[data-part-frame]>[data-part-bar]>:is([data-part-more],[data-part-add],[data-part-clear],[data-part-actions]),[data-ui-filter-bar][data-part-chip]>[data-part-chip-operator]{display:none;visibility:hidden;}',
    ),
  );
  assert.ok(
    narrow.includes(
      '[data-ui-filter-bar]>[data-part-frame]>[data-part-bar]>[data-part-chip][data-folded]{display:inline-flex;visibility:visible;}',
    ),
  );
  assert.ok(
    narrow.includes('[data-ui-filter-bar][data-part-chip-value]>[data-operator]{display:inline;}'),
  );
  assert.ok(narrow.includes('[data-part-summary]{display:inline-flex;visibility:visible;}'));
  assert.ok(normalized.includes('[data-part-summary]{display:none;visibility:hidden;}'));
  assert.ok(normalized.includes('[data-part-chip][data-folded]{display:none;visibility:hidden;}'));
});

/**
 * The shortcut is drawn as a legend at the end of the search; where the
 * primary input is a touch screen the legend names a key the reader has no
 * way to press, and the palette's footer is hidden under the same query.
 */
test('hides the shortcut legend where the primary input is a touch screen', () => {
  const touch = declarations.slice(declarations.indexOf('(hover: none) and (pointer: coarse)'));
  assert.ok(touch.length > 0, 'a touch-screen media query');
  assert.match(
    touch,
    /\[data-ui-filter-bar\] \[data-part-search\] \[data-ui-kbd\]\s*\{\s*display: none;/,
  );
});

/**
 * A nested group narrower than 30rem inside a wide builder stacks its row:
 * the field, then the operator and the operand across both columns, the
 * remove control in the second. A second track of `auto` took the spanning
 * operand's whole width — a spanning item hands its size to the non-flexible
 * track first — and left the field 34 pixels wide. The query reads the
 * group's own container, so the card form stays the builder's decision.
 */
test('stacks a builder rule on a fixed remove track so the spanning operand cannot widen it', () => {
  const narrow = declarations.slice(
    declarations.indexOf('slotted-filter-bar-group (max-width: 30rem)'),
  );
  const block = narrow.slice(0, narrow.indexOf('}') + 1);
  assert.match(block, /grid-template-columns: minmax\(0, 1fr\) var\(--slotted-target-min, 24px\);/);
  assert.doesNotMatch(block, /minmax\(0, 1fr\) auto/);
  assert.ok(normalized.includes('container-name:slotted-filter-bar-group;'));
});

/**
 * Under 30rem of the builder every rule is a card: its sentence, a button
 * that expands it, and its remove control on the sentence's first line; the
 * controls leave the picture and the tab order until the card is expanded.
 * A nested group is a rail, and the first "Where" is not drawn.
 */
test('lists rules as cards that expand in place when the builder is narrow', () => {
  const at = normalized.indexOf('@containerslotted-filter-bar-builder(max-width:30rem){');
  assert.notEqual(at, -1, 'a card form on the builder container');
  const cards = normalized.slice(at);
  assert.match(
    cards,
    /\[data-part-rule\],\[data-ui-filter-bar\]\[data-part-builder\]\[data-part-rule\]\[data-operands='0'\]\{background-color:var\(--_surface\);border:var\(--_border-width\)solidvar\(--_edge\);/,
  );
  assert.ok(
    cards.includes(
      '[data-part-rule]:not([data-expanded]):is([data-part-field],[data-part-operator],[data-part-operand]){display:none;visibility:hidden;}',
    ),
  );
  assert.match(
    cards,
    /border-inline-start:var\(--slotted-border-width-medium,2px\)solidvar\(--_edge\);/,
  );
  assert.ok(cards.includes('[data-part-rules]>[data-part-conjunction]:first-child{display:none;}'));
  assert.ok(
    normalized.includes(
      '[data-ui-filter-bar][data-part-builder][data-part-rule-summary]{display:none;visibility:hidden;}',
    ),
  );
});

/**
 * A pinned field with no condition is a slot: a dashed edge, no ground, no
 * lift, the muted ink and a plus. The accent pair it wore when filled is gone
 * with the filled state — a pinned field with a condition is a chip.
 */
test('draws an empty pinned field as a dashed slot, and no accent', () => {
  const pill = normalized.split('[data-ui-filter-bar][data-part-pill]{')[1]?.split('}')[0] ?? '';
  assert.match(pill, /background-color:transparent;/);
  assert.match(pill, /border:var\(--_border-width\)dashedvar\(--_edge\);/);
  assert.match(pill, /color:var\(--_muted\);/);
  assert.doesNotMatch(pill, /box-shadow/);
  assert.doesNotMatch(normalized, /data-filtered|--_filtered/);
  assert.ok(
    normalized.includes('[data-part-pill]>[data-ui-icon]{--slotted-icon-size:var(--_icon);'),
  );
  assert.doesNotMatch(declarations, /mask-image/);
});

/**
 * A chip is one capsule of segments: the capsule owns the edge, the ground
 * and the lift; each segment owns its hover and press; the seam divides; the
 * end segments take the capsule's corners so a ground or a ring follows the
 * curve. A segment's ring is drawn inward, as every inner control's is.
 */
test('writes a chip as one capsule of segments with inward rings', () => {
  const chip = normalized.split('[data-ui-filter-bar][data-part-chip]{')[1]?.split('}')[0] ?? '';
  assert.match(chip, /block-size:var\(--_height\);/);
  assert.match(chip, /border:var\(--_border-width\)solidvar\(--_edge\);/);
  assert.match(chip, /border-radius:var\(--_radius\);/);
  assert.match(chip, /box-shadow:var\(--slotted-control-shadow,none\);/);
  assert.doesNotMatch(chip, /overflow/);
  assert.ok(
    normalized.includes(
      '[data-ui-filter-bar][data-part-chip]>*+*{border-inline-start:var(--_border-width)solidvar(--_seam);}',
    ),
  );
  assert.ok(
    normalized.includes(
      '[data-ui-filter-bar][data-part-chip]>:focus-visible{outline:var(--slotted-focus-ring-width,2px)solidvar(--slotted-focus-ring-color,Highlight);outline-offset:calc(var(--slotted-focus-ring-width,2px)*-1);}',
    ),
  );
  assert.ok(normalized.includes('[data-part-chip][data-incomplete]{border-style:dashed;'));
  assert.match(
    normalized,
    /\[data-part-chip\]>:first-child\{border-end-start-radius:var\(--_radius\);/,
  );
  assert.match(
    normalized,
    /\[data-part-chip\]>:last-child\{border-end-end-radius:var\(--_radius\);/,
  );
});

/** The builder row's remove is this sheet's; the chip's is its own segment. Neither is painted by a pseudo-element. */
test('sizes a builder row’s remove and draws no cross in CSS', () => {
  assert.ok(
    normalized.includes(
      '[data-part-rule]>[data-part-remove]>[data-ui-icon]{--slotted-icon-size:var(--_icon);}',
    ),
  );
  assert.doesNotMatch(declarations, /\[data-part-(chip-)?remove\]::after/);
});

/** The field's name, the operator and the value are isolated runs, so a right-to-left name beside an ISO date reorders nothing. */
test('isolates the field name from its sentence', () => {
  assert.ok(
    normalized.includes(
      '[data-part-pill]>span:not([data-ui-icon]){min-inline-size:0;overflow:hidden;text-overflow:ellipsis;unicode-bidi:isolate;}',
    ),
  );
  assert.ok(
    normalized.includes(
      '[data-ui-filter-bar][data-part-chip]>*>span:not([data-ui]),[data-ui-filter-bar][data-part-chip-operator]{unicode-bidi:isolate;}',
    ),
  );
});

/** The bar sticks under the page chrome and never measures the header itself. */
test('reads the page property for sticky', () => {
  assert.ok(
    normalized.includes(
      '[data-ui-filter-bar][data-sticky]{background-color:var(--_surface);inset-block-start:var(--slotted-page-sticky-top,0px);',
    ),
  );
  assert.ok(normalized.includes('z-index:var(--slotted-z-index-sticky,100)'));
  assert.doesNotMatch(declarations, /--slotted-filter-bar-above/);
});

test('borrows the ring for every control of its own', () => {
  for (const part of ['pill', 'more']) {
    assert.ok(
      normalized.includes(
        `[data-part-${part.toLowerCase()}]:focus-visible{outline:var(--slotted-focus-ring-width,2px)solidvar(--slotted-focus-ring-color,Highlight);outline-offset:var(--slotted-focus-ring-offset,2px);}`,
      ),
      `${part} draws the shared ring`,
    );
  }
});

test('renders every part and every state in the harness fragment', () => {
  for (const part of contract.members.filterBar.parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `harness renders no ${part}`);
  }
  for (const state of Object.values(contract.stateAttributes)) {
    assert.ok(fragment.includes(state), `harness exercises no ${state}`);
  }
  for (const attribute of [
    'data-pinned',
    'data-incomplete',
    'data-compact',
    'data-expanded',
    'data-operator',
    'data-dirty',
    'data-folded',
    'data-apply="manual"',
    'data-depth="1"',
    'data-operands="2"',
    'data-operands="0"',
  ]) {
    assert.ok(fragment.includes(attribute), `harness exercises no ${attribute}`);
  }
  assert.ok(fragment.includes('role="search"'));
  assert.ok(fragment.includes('role="toolbar"'));
  assert.ok(fragment.includes('role="group"'));
  assert.ok(!fragment.includes('role="grid"'));
});

/**
 * A binding may render the condition inside one element of its own at
 * `display: contents`; the element is not a grid item, so the operator and
 * the operand are the rule's grid items and a child combinator misses both.
 * Under the stacked composition the miss put the operand in the remove
 * control's track, 24 pixels wide, and past the drawer's edge.
 */
test('reaches the operator and the operand through a display-contents wrapper', () => {
  for (const part of ['operator', 'operand']) {
    assert.doesNotMatch(
      normalized,
      new RegExp(`\\[data-part-rule\\][^{,]*>\\[data-part-${part}\\]`),
      `rule reaches ${part} as a child`,
    );
  }
  assert.ok(
    normalized.includes(
      '[data-part-rule]:is([data-part-operator],[data-part-operand]){grid-column:1/-1;}',
    ),
    'the stacked rule spans both parts across the row',
  );
});

/**
 * Below 36rem the consumer's `end` controls take a line of their own under
 * the row: sharing a line, an `auto` track for them took every pixel a
 * toolbar of three controls asked for (Nexora, 390 pixels).
 */
test("gives a narrow bar's end controls a line of their own", () => {
  const narrow = normalized.slice(normalized.indexOf('(max-width:36rem)'));
  assert.match(
    narrow,
    /grid-template-areas:'search''bar''count';grid-template-columns:minmax\(0,1fr\);/,
  );
  assert.match(
    narrow,
    /\[data-ui-filter-bar\]>\[data-part-frame\]:has\(>\[data-part-end\]:not\(:empty\)\)\{grid-template-areas:'search''bar''end''count';\}/,
  );
});

/**
 * Every member of the frame starts at the top of its line and the count is a
 * control tall with its line in the middle, so the search, the consumer's
 * controls and the count line up with the first line of pills even while
 * those wrap. On a phone the count is a line of its own and keeps its type's
 * height.
 */
test('starts every member at the top of its line and centers the count in a control height', () => {
  const count =
    normalized
      .split('[data-ui-filter-bar]>[data-part-frame]>[data-part-count]{')
      .find((block) => block.startsWith('color:'))
      ?.split('}')[0] ?? '';
  assert.match(count, /padding-block:max\(0px,calc\(\(var\(--_height\)-1lh\)\/2\)\);/);
  /**
   * The count is reached through the frame it belongs to. A descendant
   * selector also reached the count another family draws inside a control
   * placed in this bar — the column manager's trigger chip took this padding
   * and grew to the button's height.
   */
  assert.ok(!/\[data-ui-filter-bar\]\s+\[data-part-count\]/.test(declarations));
  assert.ok(!/\[data-loading\]\s+\[data-part-count\]/.test(declarations));
  const narrow = normalized.slice(normalized.indexOf('(max-width:36rem)'));
  assert.match(
    narrow,
    /\[data-ui-filter-bar\]>\[data-part-frame\]>\[data-part-count\]\{justify-self:start;padding-block:0;\}/,
  );
});

/**
 * The count waits in its own place: before the first answer it holds only the
 * spinner, sixteen pixels tall, and the text that replaces it is a line of the
 * bar's type — twenty. On a phone the count is a row of its own, so the rows
 * under the bar moved four pixels when the answer landed. The part keeps one
 * line of its type whatever it holds.
 */
test('keeps a line of its type for the count while the first answer is on its way', () => {
  const count =
    normalized
      .split('[data-ui-filter-bar]>[data-part-frame]>[data-part-count]{')
      .find((block) => block.startsWith('color:'))
      ?.split('}')[0] ?? '';
  assert.match(count, /min-block-size:1lh/);
});

/**
 * The builder row's remove control stood a target minimum on a touch screen,
 * 24 pixels in a row of 44-pixel fields. It reaches the comfortable target by
 * a transparent `::before` centerd on the box, and the box keeps its 24
 * pixels. The chip's segments and `more` already take the control height.
 */
test('makes the builder row’s remove and more full touch targets on a coarse pointer', () => {
  const at = normalized.indexOf('@media(pointer:coarse){');
  assert.notEqual(at, -1, 'a coarse-pointer block');
  const coarse = normalized.slice(at);
  const selector = '[data-ui-filter-bar]:is([data-part-more],[data-part-rule]>[data-part-remove])';
  const halo = coarse.split(`${selector}::before{`)[1]?.split('}')[0] ?? '';
  assert.match(
    halo,
    /inset:min\(0px,calc\(\(100%-var\(--slotted-target-comfortable,44px\)\)\/2\)\);/,
  );
  const box = coarse.split(`${selector}{`)[1]?.split('}')[0] ?? '';
  assert.doesNotMatch(box, /background-clip|padding-block|margin-block/);
  assert.ok(
    normalized.includes(
      '[data-ui-filter-bar][data-part-more]{align-items:center;appearance:none;background:none;block-size:var(--_height);',
    ),
  );
});
