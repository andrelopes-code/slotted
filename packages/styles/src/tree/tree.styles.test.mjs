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
  readFileSync(new URL('../../../../specs/components/tree/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./tree.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./tree.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const part = (name) => `${ui} [data-part-${name.toLowerCase()}]`;

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

test('draws every part the contract declares', () => {
  for (const name of contract.members.tree.parts) {
    /* The root is styled by the identifier a consumer selects the family by,
       which is what `identity.test.mjs` asks of every family; the other
       fourteen are reached by their part. */
    const styled =
      name === 'root'
        ? normalized.includes(`${ui}{`)
        : normalized.includes(`[data-part-${name.toLowerCase()}]`);
    assert.ok(styled, `${name} is declared and never styled`);
    assert.ok(
      fragment.includes(`data-part="${name}"`),
      `${name} is declared and never rendered in the harness`,
    );
  }
});

/**
 * The trap this family met twice. A custom property composed on an ancestor
 * resolves its `var()` calls there, so `--_depth: var(--slotted-tree-depth, 0)`
 * on the root would hand every row the root's own value — nought — and the
 * whole tree would draw flat. The two rules that need the depth read it
 * directly, and nothing aliases it.
 */
test('reads the per-node depth where it is used, never through an alias', () => {
  assert.ok(
    !normalized.includes('--_depth:'),
    'the depth is aliased on an ancestor, where it resolves once and stops varying',
  );
  const row = rule(`${part('row')}`);
  assert.match(row, /var\(--slotted-tree-depth,0\)/);
  const guide = rule(`${part('guide')}`);
  assert.match(guide, /var\(--slotted-tree-depth,0\)/);
});

/**
 * A container query styles the container's descendants and never the container
 * itself, so a rule for the root inside one matches nothing. Written on the
 * root it looked correct and did nothing: the indent did not move at 240
 * pixels, and only the harness said so.
 */
test('retunes the indent on the canvas, because the root is not its own descendant', () => {
  const queries = [...declarations.matchAll(/@container[^{]*\{([\s\S]*?)\n {2}\}/g)].map(
    ([, body]) => body,
  );
  assert.ok(queries.length >= 2, 'the family declares no container query');
  for (const body of queries) {
    assert.ok(
      !/\[data-ui-tree\]\s*\{/.test(body),
      'a container query targets the container itself, which matches nothing',
    );
  }
  assert.ok(
    declarations.includes('container-type: inline-size'),
    'the root declares no query container',
  );
});

/**
 * The chevron and the mark are the `Glyph` element the binding draws, so the
 * sheet paints neither. A leaf keeps its expander box with nothing drawn in it:
 * the harness renders a chevron on every branch and on no leaf.
 */
test('draws the chevron and the mark with the Glyph element, never a mask', () => {
  assert.ok(!/mask/.test(normalized), 'the sheet still paints a glyph with a mask');
  const chevron =
    /data-part="expander"[^>]*>\s*<span data-ui="icon"[^>]*>\s*<svg data-part="glyph" data-glyph="chevron-right">/;
  assert.match(fragment, chevron);
  assert.match(fragment, /data-part="expander"[^>]*>\s*<\/span/, 'no leaf in the harness');
  assert.match(
    fragment,
    /data-part="indicator"[^>]*>\s*<span data-ui="icon"[^>]*>\s*<svg data-part="glyph" data-glyph="check">/,
  );
  assert.match(
    fragment,
    /data-part="indicator"[^>]*>\s*<span data-ui="icon"[^>]*>\s*<svg data-part="glyph" data-glyph="minus">/,
  );
});

/**
 * R1 in this family's own words. The selected state is said by the ground, the
 * ink and the mark; the fact that a collapsed branch holds a selection is said
 * by ink alone. Neither may reach for a bar on the start edge, and
 * `state-rail.test.mjs` holds every family to the same rule.
 */
test('says a selection without a bar on the start edge', () => {
  const selected = rule(
    `${ui} [data-part-node][data-selected]:not([data-disabled])>[data-part-row]`,
  );
  assert.match(selected, /background-color:var\(--_selected-surface\)/);
  assert.match(selected, /color:var\(--_selected-text\)/);
  const within = rule(
    `${ui} [data-part-node][data-selected-within]:not([data-selected]):not([data-disabled])>[data-part-row]`,
  );
  assert.match(within, /color:var\(--_selected-text\)/);
  assert.ok(!within.includes('background-color'), 'the fact shouts as loudly as the state');
});

/**
 * A chosen folder and its children are selected together and their bands are
 * adjacent, so the band carries no radius: two adjacent selected rows are often
 * a parent and a child, in two different lists, where the `:has(+ …)` repair
 * `listbox` uses cannot reach.
 */
test('paints the band square, so a cascade reads as one block', () => {
  const selected = rule(
    `${ui} [data-part-node][data-selected]:not([data-disabled])>[data-part-row]`,
  );
  assert.ok(!selected.includes('border-radius'), 'the selected band carries a radius');
});

/** A family that waits stands the shared ring where the chevron stands. */
test('draws no wait of its own', () => {
  assert.ok(
    !/animation:[^;]*infinite/.test(normalized),
    'the family loops an animation of its own',
  );
  const loader = rule(part('loader'));
  assert.match(loader, /--slotted-spinner-size:var\(--_icon-size\)/);
  assert.match(fragment, /data-part="loader" data-ui="spinner"/);
});

/**
 * A node's name, its second line and its count are data of unknown direction.
 * In a right-to-left document an English `4 kB` was laid out as `kB 4`, and the
 * closing quote of `“invoices”` moved to the front.
 */
test('lets each piece of consumer text take its own direction', () => {
  const carriers = [
    ...declarations.matchAll(/([^{}]+)\{[^{}]*unicode-bidi:\s*plaintext[^{}]*\}/g),
  ].map(([, selector]) => selector);
  assert.equal(carriers.length, 1, 'the direction rule is written more than once, or not at all');
  for (const name of ['label', 'description', 'meta', 'empty']) {
    assert.ok(
      carriers[0].includes(`[data-part-${name.toLowerCase()}]`),
      `${name} takes the document's direction`,
    );
  }
});

/**
 * The guide sits under the chevron of the level above, which is half a glyph
 * from the start of that level's cell and not half a step. The two agree only
 * at `md`; at `sm`, at `lg` and under both container queries they do not, and
 * every line was off its chevron at five of the nine combinations.
 */
test('places the guide on the chevron, not on the middle of the indent', () => {
  const guide = rule(part('guide'));
  assert.match(
    guide,
    /inset-inline-start:calc\(var\(--_inset-inline\)\s*\+\s*var\(--_icon-size\)\s*\/\s*2\)/,
  );
  assert.ok(!guide.includes('var(--_indent)/2'), 'the guide is placed on the step, not the glyph');
});

/**
 * The line ran to half the row on a last child, where an elbow would turn. With
 * no elbow to turn into, a chain of only children drew a staircase of short
 * segments and read as broken. A straight line is what every surveyed
 * implementation draws.
 */
test('draws one straight line per level, with nothing shortened', () => {
  assert.ok(
    !normalized.includes(':last-child>[data-part-row] [data-part-guide]'),
    'a last child shortens its line, which reads as a break rather than as an end',
  );
  assert.match(rule(part('guide')), /inset-block:0/);
});

/**
 * A gap is drawn between two cells even when one is empty, so a tree whose
 * nodes carry no icon opened with a gutter down its start edge. Each optional
 * cell carries its own margin instead, which is `menu`'s rule and `listbox`'s.
 */
test('gives each cell its own margin, so an absent cell costs nothing', () => {
  const row = rule(part('row'));
  assert.ok(!/(^|;)gap:/.test(row), 'the row states a gap, which an empty cell still pays for');
  for (const name of ['expander', 'indicator', 'icon', 'loader']) {
    assert.match(rule(part(name)), /margin-inline-end:var\(--_gap\)/, `${name} carries no margin`);
  }
});

/**
 * A mark needs a cell, and a cell empty on every unchosen row is a gutter down
 * the whole tree. `highlight` says the selection with the ground and the ink,
 * as Primer, Carbon and the pattern's own examples do.
 */
test('draws no cell for a mark in the modes that have none', () => {
  assert.match(
    normalized,
    /\[data-ui-tree\]:is\(\[data-indicator='highlight'\],\[data-indicator='none'\]\) \[data-part-indicator\]\{display:none/,
  );
});

/**
 * A tree where some nodes carry a picture and others do not keeps every name in
 * one column. Primer asks the consumer to pass a visual on every item or to
 * accept two columns of names.
 */
test('keeps the names in one column when only some nodes have a picture', () => {
  assert.match(
    normalized,
    /:has\(\[data-part-icon\]\) \[data-part-row\]:not\(:has\(\[data-part-icon\]\)\) \[data-part-label\]\{margin-inline-start:calc\(var\(--_icon-size\)\s*\+\s*var\(--_gap\)\)/,
  );
});

/**
 * The box a tree draws is the box `checkbox` draws. Two selection controls on
 * one page that differ by a pixel of edge or a pixel of clearance are two
 * controls, and a reader reads them as two. The values are compared against
 * `checkbox.css` itself rather than restated here, so a change to either family
 * that parts them fails this test.
 */
test('draws the checkbox the checkbox family draws', () => {
  const other = readFileSync(new URL('../checkbox/checkbox.css', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,:>])\s*/g, '$1');
  const box = rule(part('indicator'));
  const mark = rule(`${part('indicator')}>[data-ui-icon]`);

  for (const token of [
    '--slotted-selection-size-md',
    '--slotted-border-width-medium',
    '--slotted-border-strong',
    '--slotted-radius-xs',
  ]) {
    assert.ok(other.includes(token), `checkbox no longer reads ${token}`);
  }
  assert.match(box, /border:var\(--_check-border\)\s*solid var\(--slotted-border-strong\)/);
  assert.match(box, /border-radius:var\(--slotted-radius-xs,2px\)/);
  assert.match(normalized, /--_check-border:var\(--slotted-border-width-medium,1\.5px\)/);
  assert.match(normalized, /--_check-size:var\(--slotted-selection-size-md,16px\)/);

  /* The clearance: a whole two pixels on every side, at every step, which is
     the number `checkbox` arrived at and the reason it is not a fraction. */
  assert.match(normalized, /--_mark-inset:var\(--slotted-tree-mark-inset,2px\)/);
  assert.ok(other.includes('--_mark-inset:var(--slotted-checkbox-mark-inset,2px)'));
  assert.match(mark, /clip-path:inset\(0% 100% 0% 0%\)/);
  assert.ok(other.includes('clip-path:inset(0% 100% 0% 0%)'));
  assert.match(mark, /(?:^|;)color:var\(--slotted-tone-accent-on-solid\)/);

  const chosen = rule(
    `${ui} [data-part-node]:is([data-selected],[data-indeterminate])>[data-part-row] [data-part-indicator]`,
  );
  assert.match(chosen, /background-color:var\(--slotted-tone-accent-solid\)/);
  assert.match(chosen, /border-color:var\(--slotted-tone-accent-solid\)/);
});

/**
 * What a reader sees on a row is the distance from its deepest guide line to
 * its own chevron, and that distance is `step - glyph / 2`, because the line
 * sits on the centre of the chevron one level up. Read from the space scale the
 * step moved against the glyph: measured on the built page, five pixels at
 * `sm`, eight at `md`, eleven at `lg`, and nought at 240 pixels, where the line
 * met the chevron. Stated from the glyph it is eight everywhere, and `md` keeps
 * the sixteen it already had.
 */
test('states the indent from the glyph, so one distance holds at every size', () => {
  assert.match(
    normalized,
    /--_indent:var\(--slotted-tree-indent,calc\(var\(--_icon-size\)\s*\/\s*2\s*\+\s*var\(--slotted-space-4,0\.5rem\)\)\)/,
  );
  for (const step of ['sm', 'lg']) {
    const rule_ = rule(`${ui}[data-size='${step}']`);
    assert.ok(
      !rule_.includes('--_indent'),
      `${step} restates the indent, which is what parted the step from the glyph`,
    );
  }
  const queries = [...declarations.matchAll(/@container[^{]*\{([\s\S]*?)\n {2}\}/g)].map(
    ([, body]) => body,
  );
  for (const body of queries) {
    if (!body.includes('--_indent')) continue;
    assert.match(
      body,
      /--_indent:\s*calc\(var\(--_icon-size\) \/ 2 \+ var\(--slotted-space-[23]/,
      'a narrow width restates the indent without the glyph in it',
    );
  }
});

/**
 * The line is a redundant aid — the indent and `aria-level` carry the hierarchy
 * on their own — so it owes no ratio, and both ends of the scale are wrong for
 * it: the subtle step is 1.23:1 in `light` and reads as absent, the strong step
 * is 3.59:1 and rules the row like a table. The mix lands at 2.26:1 and 2.39:1.
 *
 * It is a mix of two tokens rather than one token faded into transparency,
 * because in `high-contrast` both ends are black: the mix degenerates to black
 * and the line keeps that scheme's full strength with no rule reading the
 * scheme.
 */
test('mixes the guide between the two ends of the border scale', () => {
  assert.match(
    normalized,
    /--_guide-color:var\(--slotted-tree-guide-color,color-mix\(in oklab,var\(--slotted-border-strong\)\s*60%,var\(--slotted-border-subtle\)\)\)/,
  );
  const guide = rule(part('guide'));
  assert.match(guide, /var\(--_guide-color\)/);
});

/**
 * The family is built on `ul` and `li`, so it is exposed to whatever reset the
 * page around it has. The reference page gave every `li` after the first seven
 * pixels of margin and every `ul` eighteen of inset per level; the guide line
 * spans one row, so the margin broke it into segments and the inset walked it
 * inward as the tree got deeper. The page was fixed where the page is, and this
 * is the half that holds under the next reset nobody has seen yet.
 */
test("states its own list geometry rather than inheriting the page's", () => {
  const node = rule(part('node'));
  for (const property of [
    'margin-block:0',
    'margin-inline:0',
    'padding-block:0',
    'padding-inline:0',
  ]) {
    assert.ok(node.includes(property), `a node inherits ${property.split(':')[0]} from the page`);
  }
  /* The normaliser strips the space before a `:`, so the selector is looked up
     in the shape it takes after normalising rather than as it is authored. */
  const lists = rule(`${ui}:is([data-part-canvas],[data-part-group])`);
  assert.match(lists, /list-style:none/);
  assert.match(lists, /margin-block:0/);
  assert.match(lists, /padding-inline:0/);
});

/**
 * The node holds focus and the row draws the ring. Left to the user agent the
 * node drew one as well — Chrome's is a white line inside a dark one — so a
 * focused branch showed two rings at once, the browser's around the whole
 * subtree and the family's around the row inside it.
 */
test('draws one focus ring, on the row, and none on the node', () => {
  assert.match(rule(part('node')), /outline:none/);
  const ring = rule(
    `${ui} [data-part-node]:focus-visible>[data-part-row],${ui} [data-part-canvas]:focus-visible [data-part-node][data-current]>[data-part-row]`,
  );
  assert.match(
    ring,
    /outline:var\(--slotted-focus-ring-width,2px\)\s*solid var\(--slotted-focus-ring-color\)/,
  );
  assert.match(rule(part('canvas')), /outline:none/);
});

/** Both directions are drawn, because the guide is the one part with a physical gradient. */
test('mirrors the guide and the chevron for a right-to-left document', () => {
  assert.match(normalized, /\[data-part-guide\]:dir\(rtl\)\{/);
  assert.match(normalized, /\[data-part-expander\]:dir\(rtl\)>\[data-ui-icon\]\{rotate:180deg/);
});

/**
 * Under `expandOn="expander"` the chevron box grows to the target minimum with
 * padding. A glyph that filled the border box grew with it: 24 pixels of
 * chevron beside 16-pixel icons. The `icon` box is sized by the icon size, and
 * the padding stays transparent hit area.
 */
test('sizes the chevron glyph by the icon size, whatever the box grows to', () => {
  assert.match(rule(part('expander')), /--slotted-icon-size:var\(--_icon-size\)/);
});
