import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/list-item/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./list-item.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
});

/**
 * A row composes other families, and they reuse this family's part names: a
 * `tag` in `end` has a `body` and a `label` of its own. A descendant selector
 * reached them, turned the tag's body into a column with its text on the top
 * edge and reset its label's line height and weight. Every rule reaches its
 * parts through the anatomy's own chain instead — `root > content > body >
 * label` — so the selectors stop where the row's parts stop.
 */
test('reaches its parts through the anatomy’s chain, never into a nested family', () => {
  /* `normalized` drops the space before a colon, and that space is the
     combinator in `[data-ui-list-item] :is(…)`. This pass keeps it. */
  const spaced = declarations
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>+~])\s*/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');
  const selectors = [...spaced.matchAll(/(?:^|[{};])([^{};@]+)\{/g)].flatMap(([, list]) => {
    const split = [];
    let depth = 0;
    let start = 0;
    for (let index = 0; index < list.length; index += 1) {
      if (list[index] === '(') depth += 1;
      if (list[index] === ')') depth -= 1;
      if (list[index] === ',' && depth === 0) {
        split.push(list.slice(start, index));
        start = index + 1;
      }
    }
    return [...split, list.slice(start)];
  });
  const descendant = selectors.filter((selector) => {
    if (!selector.startsWith(ui)) return false;
    let depth = 0;
    for (const character of selector) {
      if (character === '(') depth += 1;
      if (character === ')') depth -= 1;
      if (character === ' ' && depth === 0) return true;
    }
    return false;
  });
  assert.deepEqual(descendant, [], 'a descendant combinator reaches past the row’s own parts');
  const content = `${ui}>[data-part-content]`;
  for (const part of ['start', 'body', 'end']) {
    assert.ok(
      normalized.includes(`${content}>[data-part-${part.toLowerCase()}]{`),
      `${part} is not content’s child`,
    );
  }
  for (const part of ['label', 'description']) {
    assert.ok(
      normalized.includes(`${content}>[data-part-body]>[data-part-${part.toLowerCase()}]{`),
      `${part} is not body’s child`,
    );
  }
});

/**
 * A chooser in the leading column sits on the title's first line (LI2). The
 * column stands at the top of that line and is as tall as it, so `checkbox`'s
 * own lift lands the box on the line's center; centerd on the block it stood a
 * pixel low on one line and between the lines on two. The column is the
 * chooser's own square, fixed across densities as the chooser is (CK1).
 */
test('stands a chooser in the leading column on the title’s first line', () => {
  const chooser = rule(`${ui}>[data-part-content]>[data-part-start]:has(>[data-ui-checkbox])`);
  assert.match(chooser, /align-items:start/);
  assert.match(chooser, /inline-size:var\(--_control-size\)/);
  assert.match(
    chooser,
    /min-block-size:calc\(var\(--_font-size\) \* var\(--slotted-line-height-md,1\.5\)\)/,
  );
  assert.match(
    rule(root),
    /--_control-size:var\(--slotted-list-item-control-size,var\(--slotted-selection-size-md,16px\)\)/,
  );
  for (const [size, px] of [
    ['sm', '14px'],
    ['lg', '18px'],
  ]) {
    assert.match(
      rule(`${ui}[data-size='${size}']`),
      new RegExp(
        `--_control-size:var\\(--slotted-list-item-control-size-${size},var\\(--slotted-selection-size-${size},${px}\\)\\)`,
      ),
      `the ${size} step does not size the chooser's column`,
    );
  }
  /* The gap beside the chooser is the row's own control gap, nothing added. */
  const start = rule(`${ui}>[data-part-content]>[data-part-start]`);
  assert.match(start, /margin-inline-end:var\(--_gap\)/);
  assert.doesNotMatch(chooser, /margin-inline|padding-inline/);
});

/**
 * The consistency pass (LI3), as a list the sheet has to keep answering.
 */
test('is one control height tall per density, with one inline inset per density', () => {
  const base = rule(root);
  assert.match(
    base,
    /--_min-block:var\(--slotted-list-item-min-block-size,var\(--slotted-control-height-md,34px\)\)/,
  );
  assert.match(
    base,
    /--_pad-inline:var\(--slotted-list-item-padding-inline,var\(--slotted-control-padding-inline-md,13px\)\)/,
  );
  /* The block inset is what is left of the control height around one line,
     so a one-line row is the control height rather than eight pixels more. */
  assert.match(
    base,
    /--_pad-block:var\(--slotted-list-item-padding-block,max\(var\(--slotted-space-2,0\.25rem\),calc\(\(var\(--_min-block\) - var\(--_font-size\) \* var\(--slotted-line-height-md,1\.5\)\) \/ 2\)\)\)/,
  );
  for (const size of ['sm', 'lg']) {
    assert.match(
      rule(`${ui}[data-size='${size}']`),
      /--_pad-block:var\(--slotted-list-item-padding-block-/,
    );
    assert.match(
      rule(`${ui}[data-size='${size}']`),
      /--_min-block:var\(--slotted-list-item-min-block-size-/,
    );
  }
  const content = rule(`${ui}>[data-part-content]`);
  assert.match(content, /min-block-size:var\(--_min-block\)/);
  assert.match(content, /padding-block:var\(--_pad-block\)/);
  assert.match(content, /padding-inline:var\(--_pad-inline\)/);
});

test('draws the leading visual at the control glyph size in the row’s own ink, and the second line muted', () => {
  assert.match(
    rule(root),
    /--_icon-size:var\(--slotted-list-item-icon-size,var\(--slotted-control-icon-size-md,16px\)\)/,
  );
  const start = rule(`${ui}>[data-part-content]>[data-part-start]`);
  assert.match(start, /color:var\(--_text\)/);
  assert.match(start, /min-inline-size:var\(--_icon-size\)/);
  assert.doesNotMatch(start, /background|border-radius/);
  assert.match(
    rule(`${ui}>[data-part-content]>[data-part-body]>[data-part-description]`),
    /color:var\(--_muted\)/,
  );
  assert.match(
    rule(root),
    /--_muted:var\(--slotted-list-item-color-muted,var\(--slotted-text-muted,GrayText\)\)/,
  );
  assert.match(
    rule(`${ui}>[data-part-content]>[data-part-body]`),
    /row-gap:var\(--slotted-list-item-body-gap,var\(--slotted-space-1,0\.125rem\)\)/,
  );
});

test('rules between rows only in the divided variants, one hairline in the subtle border', () => {
  assert.match(
    rule(root),
    /--_rule:var\(--slotted-list-item-border-color,var\(--slotted-border-subtle,ButtonBorder\)\)/,
  );
  assert.match(
    rule(root),
    /--_rule-width:var\(--slotted-list-item-border-width,var\(--slotted-border-width-thin,1px\)\)/,
  );
  assert.match(rule(root), /--_rule-shadow:0 0 0 0 transparent/);
  assert.match(
    rule(`${ui}:is([data-variant='ruled'],[data-variant='framed']):not(:first-child)`),
    /--_rule-shadow:0 calc\(var\(--_rule-width\) \* -1\) 0 0 var\(--_rule\)/,
  );
  assert.doesNotMatch(rule(`${ui}[data-variant='plain']`), /--_rule-shadow/);
});

/**
 * The rule is drawn by the row below, outward, on the last pixel of the row
 * above — which is the pixel a selected or current row's inset edge ends on.
 * Painted later, the rule covered it, and every selected row in a ruled list
 * was a box with no bottom. The row after one of those draws no rule: the
 * edge above it is the line. A run of selected rows is one box, so the second
 * of two draws its edge without the top it would double.
 */
test('closes the edge of a selected or current row the rule below would cover', () => {
  assert.match(
    rule(
      `${ui}:is([data-selected],[data-current]):not(:first-child),${ui}:is([data-selected],[data-current]) + ${ui}`,
    ),
    /--_rule-shadow:0 0 0 0 transparent/,
  );
  const joined = rule(`${ui}[data-selected] + ${ui}[data-selected]`);
  assert.match(
    joined,
    /--_edge-shadow:inset 0 calc\(var\(--_rule-width\) \* -1\) 0 0 var\(--_selected-edge\)/,
  );
  assert.match(joined, /inset var\(--_rule-width\) 0 0 0 var\(--_selected-edge\)/);
  assert.match(joined, /inset calc\(var\(--_rule-width\) \* -1\) 0 0 0 var\(--_selected-edge\)/);
  assert.ok(
    normalized.indexOf(`${ui}:is([data-selected],[data-current]):not(:first-child),`) >
      normalized.indexOf(
        `${ui}:is([data-variant='ruled'],[data-variant='framed']):not(:first-child){`,
      ),
    'the reset must follow the rule it undoes',
  );
});

/**
 * Five appearances on an interactive row, no two alike: hover and press are
 * the neutral pair's two steps, selected is the accent ground (never hover's),
 * focus is the ring, disabled is the muted ink with the pointer withdrawn.
 */
test('paints hover, active, selected, focus-visible and disabled as five different pictures', () => {
  assert.match(
    rule(root),
    /--_hover:var\(--slotted-list-item-background-hover,var\(--_subtle-hover\)\)/,
  );
  assert.match(
    rule(root),
    /--_active:var\(--slotted-list-item-background-active,var\(--_subtle-active\)\)/,
  );
  assert.match(
    rule(root),
    /--_selected-surface:var\(--slotted-list-item-background-selected,var\(--slotted-tone-accent-surface,Canvas\)\)/,
  );
  assert.ok(normalized.includes(':hover){--_fill:var(--_hover);}'), 'hover does not lay the wash');
  assert.ok(
    normalized.includes(':active){--_fill:var(--_active);}'),
    'press does not go one step further',
  );
  assert.ok(
    normalized.includes(`${ui}[data-selected]{--_fill:var(--_selected-surface);`),
    'selected does not lay the accent ground',
  );
  assert.match(
    rule(`${ui}>[data-part-content]:focus-visible`),
    /outline:var\(--slotted-focus-ring-width,2px\) solid var\(--slotted-focus-ring-color,Highlight\)/,
  );
  assert.match(rule(`${ui}[data-disabled]`), /--_text:/);
  assert.match(rule(`${ui}[data-disabled]`), /--_muted:/);
});

/**
 * Nothing leaves the row at 240px (LI4, the rule `#Alert:2` sets): the text
 * column can shrink below its longest word, and the independent targets take
 * their own line below the breakpoint — a line that counts its own inset,
 * because at `flex-basis: 100%` a content box plus the row's inline padding
 * stood twenty-six pixels wider than the row.
 */
test('yields at 240px: the content shrinks and the actions take a line that fits', () => {
  assert.match(rule(`${ui}>[data-part-content]`), /min-inline-size:0/);
  assert.match(rule(`${ui}>[data-part-content]>[data-part-body]`), /min-inline-size:0/);
  const actions = rule(`${ui}>[data-part-actions]`);
  assert.match(actions, /box-sizing:border-box/);
  const narrow = normalized.split('@container slotted-list-item (max-inline-size:22rem){')[1] ?? '';
  assert.match(
    narrow.split(`${ui}>[data-part-actions]{`)[1]?.split('}')[0] ?? '',
    /flex-basis:100%/,
    'the actions do not take their own line below the breakpoint',
  );
  /* A pair of glyph targets is narrower than the visual: it keeps its line. */
  const glyphs =
    narrow.split(`${ui}>[data-part-actions]:not(:has(>:not([data-shape]))){`)[1]?.split('}')[0] ??
    '';
  assert.match(glyphs, /flex-basis:auto/, 'icon-only targets take a line of their own');
  assert.match(glyphs, /padding-block-end:0/);
});
