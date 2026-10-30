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
    new URL('../../../../specs/components/toggle-group/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./toggle-group.css', import.meta.url), 'utf8');
const harness = withoutSelectorKeys(
  readFileSync(new URL('./toggle-group.harness.html', import.meta.url), 'utf8'),
);
/** The sheet with its prose removed: a comment is not a rule. */
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
/**
 * The same sheet with every space taken out. A selector's shape survives a
 * formatter reflowing it across three lines; an assertion written against one
 * particular line break does not.
 */
const dense = rules.replace(/\s+/g, '');

test('paints every part the contract declares, and no part it does not', () => {
  const painted = new Set([...rules.matchAll(/\[data-part-([a-z-]+)\]/g)].map(([, part]) => part));
  for (const part of contract.members.toggleGroup.parts) {
    assert.ok(painted.has(part), `the stylesheet never selects the ${part} part`);
    assert.match(harness, new RegExp(`data-part="${part}"`), `no scene renders the ${part} part`);
  }
  for (const part of painted) {
    assert.ok(
      contract.members.toggleGroup.parts.includes(part),
      `the stylesheet paints ${part}, which the contract does not declare`,
    );
  }
});

/**
 * "On" is one colour across the system, and it is the pair
 * `docs/token-foundation.md` names for the chosen row, card, option and
 * toggle: the accent ground inside the accent edge. `button` paints a pressed
 * ToggleButton with the same pair, so a toggle that is on reads the same
 * whichever of the two families drew it.
 */
test('paints an item that is on with the foundation pair and not with a fill', () => {
  assert.match(
    dense,
    /background:var\(--slotted-toggle-group-pressed-background,var\(--slotted-tone-accent-subtle-active/,
  );
  assert.match(
    dense,
    /border-color:var\(--slotted-toggle-group-pressed-border-color,var\(--slotted-tone-accent-border/,
  );
  assert.match(
    dense,
    /color:var\(--slotted-toggle-group-pressed-color,var\(--slotted-tone-accent-text/,
  );
  assert.ok(
    !/--slotted-tone-accent-solid/.test(css),
    'a toggle that is on took a solid fill, which makes it look like a primary action',
  );
});

/**
 * ── The bar's frame is the items' own edges ───────────────────────────
 *
 * The root states no border and no padding, so the group is exactly
 * `--slotted-control-height-*` tall and a bar beside a text field in a form
 * lines up with it. The first pass framed the root as well, and the reviewer
 * read the result correctly: a coloured border inside a grey one, and an edge
 * that was one pixel in places and two in others.
 */
test('leaves the frame to the items, so the bar is one control tall', () => {
  const rootRule = dense.match(/\[data-ui-toggle-group\]\[data-part-root\]\{([^}]*)\}/);
  assert.ok(rootRule, 'no rule sets up the root');
  assert.ok(!/(^|;)border:/.test(rootRule[1]), 'the root frames itself again');
  assert.ok(!/(^|;)padding:/.test(rootRule[1]), 'the root insets itself again');
  assert.ok(!/border-radius:/.test(rootRule[1]), 'the root rounds itself again');
  assert.match(dense, /\[data-part-item\]\{[^}]*block-size:var\(--_height\)/);
});

/**
 * One border in each shared column: the items overlap by one border width, the
 * trailing edge of the item before gives way, and the leading edge of the item
 * that follows is what is seen. Two borders a pixel apart are one line on paper
 * and two lines at 110%, 150% and 175% zoom, where the browser snaps each
 * border box to device pixels on its own — the defect `button-group` measured.
 *
 * An item that is on is the exception in both directions: it states its own
 * four edges, and the neighbour after it gives up the leading edge that would
 * otherwise be painted over the accent one.
 */
test('joins the items by overlapping one edge and painting one of them', () => {
  assert.match(dense, /--_overlap:calc\(-1\*var\(--_border-width\)\)/);
  assert.match(dense, /margin-inline-start:var\(--_overlap\)/);
  assert.match(dense, /margin-block-start:var\(--_overlap\)/);
  assert.match(
    dense,
    /\[data-part-item\]:not\(:last-child\):not\(\[data-pressed\]\)\{border-inline-end-color:transparent/,
  );
  assert.match(
    dense,
    /\[data-part-item\]:not\(:last-child\):not\(\[data-pressed\]\)\{border-block-end-color:transparent/,
  );
  assert.match(
    dense,
    /\[data-part-item\]\[data-pressed\]\+\[data-part-item\]\{border-inline-start-color:transparent/,
  );
  assert.match(
    dense,
    /\[data-part-item\]\[data-pressed\]\+\[data-part-item\]\{border-block-start-color:transparent/,
  );
});

/**
 * The border is always there and only its colour moves. A border that appears
 * when an item is pressed moves every label in the bar by a pixel, and an item
 * that is on has to be raised or the neighbour that follows it in the document
 * paints over the edge it just stated.
 */
test('never changes the presence of an edge, only its colour', () => {
  assert.match(dense, /\[data-part-item\]\{[^}]*border:var\(--_border-width\)solidtransparent/);
  assert.ok(
    !/box-shadow:inset/.test(dense),
    'the pressed edge is an inset ring again, which leaves a hairline against the frame',
  );
  assert.match(dense, /\[data-part-item\]\[data-pressed\]\{z-index:1;\}/);
});

/**
 * The items touch in a joined bar, so an outward ring is drawn over the
 * neighbours either side of it: at offset zero it covered the neighbour's own
 * edge, and the seam beside a focused item read thicker than every other seam
 * in the same bar. A negative offset of exactly the ring's width puts the
 * ring's outer edge on the item's border box, so it replaces that item's
 * border instead of standing beside it.
 */
test('draws the focus ring inside the item in a joined bar, and outside it otherwise', () => {
  assert.match(dense, /:focus-visible\{outline:var\(--slotted-focus-ring-width/);
  assert.match(dense, /:focus-visible\{[^}]*outline-offset:var\(--slotted-focus-ring-offset/);
  assert.match(
    dense,
    /\[data-attached\]\[data-part-item\]:focus-visible\{outline-offset:calc\(-1\*var\(--slotted-focus-ring-width/,
  );
});

/**
 * A bar that will not give way runs out through the side of the column that
 * holds it and takes the layout with it. The floor is the item's own height,
 * so no item is ever narrower than it is tall and the WCAG target holds.
 */
test('lets an item give way, and never below the target size', () => {
  assert.match(dense, /flex:01auto/);
  assert.match(dense, /min-inline-size:var\(--_height\)/);
  assert.match(dense, /--_height:var\(--slotted-control-height-md/);
});

/** Every density the theme states, read from the control scale and not restated. */
test('answers every density through the control scale', () => {
  for (const step of ['sm', 'md', 'lg']) {
    assert.match(dense, new RegExp(`--slotted-control-height-${step}`));
    assert.match(dense, new RegExp(`--slotted-control-padding-inline-${step}`));
    assert.match(dense, new RegExp(`--slotted-control-font-size-${step}`));
    assert.match(dense, new RegExp(`--slotted-control-icon-size-${step}`));
  }
});

/**
 * An item that is on and unavailable keeps both facts: the ground says
 * unavailable and the edge says on. In `high-contrast` the disabled ground is
 * the page's own white, so the edge is the only thing left carrying it.
 */
test('keeps saying which item is on when the group is unavailable', () => {
  const disabledPressed = dense.match(
    /\[data-part-item\]\[data-pressed\]:disabled,[^{]*\{([^}]*)\}/,
  );
  assert.ok(disabledPressed, 'no rule paints an item that is on and unavailable');
  assert.match(disabledPressed[1], /background:var\([^)]*disabled-pressed-background/);

  const disabledEdge = dense.match(
    /\[data-variant='outline'\]\[data-part-item\]:disabled,[^{]*\{([^}]*)\}/,
  );
  assert.ok(disabledEdge, 'an unavailable item states no edge');
  assert.match(disabledEdge[1], /border-color:var\([^)]*disabled-border-color/);
});
/** The label keeps its string; the library truncates without removing content. */
test('clips a long label rather than dropping it', () => {
  assert.match(
    dense,
    /\[data-part-label\]\{overflow:hidden;text-overflow:ellipsis;white-space:nowrap/,
  );
});

test('states no distance between joined items and one between separated ones', () => {
  assert.match(dense, /\[data-part-root\]:not\(\[data-attached\]\)\{gap:var\(--_separation\)/);
  assert.match(dense, /--_separation:calc\(var\(--_gap\)\*2\)/);
});
