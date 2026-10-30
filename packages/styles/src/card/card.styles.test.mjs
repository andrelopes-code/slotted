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
  readFileSync(new URL('../../../../specs/components/card/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./card.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./card.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
/**
 * Whitespace is collapsed rather than removed: a descendant selector and a
 * multi-word value both lose their meaning when every space goes.
 *
 * The parentheses are collapsed too, because the formatter breaks a long value
 * across lines and leaves `var( --token` — which no assertion here spells, so a
 * declaration was read as absent purely because it had grown too long for one
 * line.
 */
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;

/** The declarations of the first rule whose selector starts with `selector`. */
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
  for (const part of contract.members.card.parts) {
    if (part === 'root') continue;
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

/**
 * Wave 0 added `--slotted-surface-raised` so that no family would invent a
 * neutral background again. Card is the first to read it.
 */
test('takes its background from the foundation surface, not from a color of its own', () => {
  assert.ok(
    rule(ui).includes(
      '--_card-surface-rest:var(--slotted-card-background,var(--slotted-surface-raised',
    ),
  );
  assert.ok(rule(ui).includes('background-color:var(--_card-surface)'));
});

/**
 * A real border has to reserve its own width, so a hairline becoming a 2px
 * selected edge shifts every region by a pixel. The edge moves to a pseudo
 * element over the border box, which is how five of the six surveyed systems
 * that solve this solve it, and it stays a border rather than a box-shadow so
 * that it survives forced colors.
 */
test('draws its edge out of flow, so a wider edge moves no content', () => {
  assert.ok(rule(ui).includes('border:none'), 'the root still reserves a border width');
  const edge = rule(`${ui}::before`);
  assert.ok(edge.includes('border:var(--_card-edge-width) solid var(--_card-edge)'));
  assert.ok(edge.includes('position:absolute'));
  assert.ok(edge.includes('inset:0'));
  assert.ok(edge.includes('pointer-events:none'));
  assert.ok(!edge.includes('box-shadow'), 'a shadow is removed under forced colors');
});

/**
 * Each fill answers a state in the property that fill is made of: the elevated
 * card raises its shadow and holds its edge, the outlined card darkens its edge
 * and never fills, the filled card moves its fill alone. Before this the three
 * shared one grey, and a hovered card took the same value as the disabled card
 * beside it.
 */
test('gives each fill its own answer to hover and to press', () => {
  const elevated = rule(`${ui}[data-fill='elevated']`);
  assert.ok(elevated.includes('--_card-shadow-hover:'), 'elevated does not move its elevation');
  assert.ok(
    elevated.includes('--_card-edge-hover:var(--_card-edge-rest)'),
    'elevated moves its edge',
  );

  const subtle = rule(`${ui}[data-fill='subtle']`);
  assert.ok(subtle.includes('--_card-surface-hover:'), 'subtle does not move its fill');
  assert.ok(
    subtle.includes('--_card-edge-hover:var(--_card-edge-rest)'),
    'the filled card moves its edge as well as its fill',
  );

  assert.ok(rule(ui).includes('--_card-shadow-active:'), 'no fill answers a press');
});

/**
 * A state value may only reference a resting one. `--_card-edge-hover:
 * var(--_card-edge)` reads as "hold the edge still" and is a cycle, because the
 * hover rule sets `--_card-edge` from `--_card-edge-hover`. CSS resolves a cycle
 * to the guaranteed-invalid value, so the `border` shorthand becomes invalid at
 * computed-value time and the edge vanishes instead of holding.
 *
 * It shipped that way in three places at once — `elevated`, `subtle` and every
 * selected card — and no capture caught it, because the one fill that was
 * hovered was the one fill without the cycle.
 */
test('never lets a state value depend on the value that state sets', () => {
  for (const property of ['surface', 'edge', 'shadow']) {
    const live = `--_card-${property}`;
    for (const state of ['hover', 'active', 'disabled']) {
      const pattern = new RegExp(`--_card-${property}-${state}:([^;]*);`, 'g');
      for (const [, value] of declarations.matchAll(pattern)) {
        assert.ok(
          !new RegExp(`var\\(\\s*${live}\\s*[,)]`).test(value),
          `--_card-${property}-${state} reads ${live}, which the ${state} rule sets from it`,
        );
      }
    }
  }
});

/**
 * The link's stretched hit area already carried the pointer; the chooser was
 * left with the default arrow over a surface that is entirely clickable.
 */
test('says with the pointer that the whole surface is a target', () => {
  const interactive = normalized.split('{cursor:pointer;')[0].split('}').pop();
  assert.ok(interactive?.includes('[data-part-selection]'), 'a choice card shows no pointer');
  assert.ok(interactive?.includes('[data-part-link]'), 'a destination card shows no pointer');
  assert.ok(
    interactive?.includes(':not([data-disabled])'),
    'a disabled card still invites a click',
  );
});

/**
 * A popover opened inside a card in a later wave must not be cut off by the
 * card, so the root never clips and the media clips itself instead.
 */
test('never clips its own content', () => {
  assert.ok(!rule(ui).includes('overflow:'), 'the root clips, and an overlay inside it would too');
  assert.ok(rule(`${ui} > [data-part-media]`).includes('overflow:hidden'));
});

test('rounds only the corners the media actually touches', () => {
  assert.ok(
    rule(`${ui} > [data-part-media]:first-child`).includes(
      'border-start-start-radius:var(--_card-radius)',
    ),
  );
  assert.ok(
    rule(`${ui} > [data-part-media]:last-child`).includes(
      'border-end-end-radius:var(--_card-radius)',
    ),
  );
});

/**
 * The rhythm is padding rather than a gap on the root, which is what lets an
 * absent region collapse to nothing instead of leaving its gap behind.
 */
test('carries the vertical rhythm in each region rather than in a gap', () => {
  assert.ok(!rule(ui).includes('row-gap:'), 'a gap would survive the region it separated');
  assert.ok(
    rule(`${ui} >:is([data-part-header],[data-part-body],[data-part-footer])`).includes(
      'padding-block:var(--_card-region-gap)',
    ),
  );
});

test('gives a region at either end the padding its missing neighbour would carry', () => {
  assert.ok(
    normalized.includes(':is([data-part-header],[data-part-body],[data-part-footer]):first-child'),
  );
  assert.ok(
    normalized.includes(':is([data-part-header],[data-part-body],[data-part-footer]):last-child'),
  );
  assert.ok(
    normalized.includes(
      '> [data-part-media] +:is([data-part-header],[data-part-body],[data-part-footer])',
    ),
    'the region beside a bleeding media is at an end too',
  );
});

test('answers its own inline size rather than the viewport', () => {
  assert.ok(rule(`${ui}[data-orientation='horizontal']`).includes('container-type:inline-size'));
  assert.ok(rule(`${ui}[data-orientation='horizontal']`).includes('container-name:slotted-card'));
  assert.match(css, /@container slotted-card \(max-inline-size:/);
  assert.doesNotMatch(
    css,
    /@media[^{]*width/,
    'component layout answers the container, not the page',
  );
});

test('lays the media beside the regions in the orientation that says so', () => {
  assert.deepEqual(contract.axes.orientation, ['vertical', 'horizontal']);
  assert.ok(rule(`${ui}[data-orientation='horizontal']`).includes('display:grid'));
  assert.ok(
    rule(`${ui}[data-orientation='horizontal'] > [data-part-media]`).includes(
      'grid-area:1 / 1 / -1 / 2',
    ),
    'the media has to span every row of the content column',
  );
});

test('stretches the hit area of the one link a card resolves to', () => {
  const overlay = rule(`${ui} [data-part-link]::after`);
  assert.ok(overlay.includes('position:absolute'));
  assert.ok(overlay.includes('inset:0'));
});

test('keeps the footer above that hit area, so a secondary action stays operable', () => {
  assert.ok(rule(`${ui} > [data-part-footer]`).includes('position:relative'));
});

/**
 * A browser without `:has()` drops the whole rule and keeps the native
 * outline. Suppressing the action's ring outside a `:has()` selector would
 * leave that browser with no visible focus at all.
 */
test('suppresses the action ring only where it can draw the card ring instead', () => {
  const suppressed = normalized.split('{outline:none;')[0].split('}').pop() ?? '';
  assert.ok(
    suppressed.includes(`${ui}:has([data-part-link]) [data-part-link]:focus-visible`),
    'the link keeps a ring of its own inside the card ring',
  );
  assert.ok(
    suppressed.includes(`${ui}:has([data-part-selection])`),
    'the choice control keeps a ring of its own inside the card ring',
  );
  const ring = rule(
    `${ui}:has(:is([data-part-link],[data-part-selection]:is(input,button)):focus-visible)`,
  );
  assert.ok(
    ring.includes('outline:var(--slotted-focus-ring-width'),
    'the card draws no ring for a focused choice control',
  );
});

test('answers a choice card, not only a card that resolves somewhere', () => {
  for (const selector of normalized.split('}')) {
    if (!/:hover|:active/.test(selector)) continue;
    assert.ok(
      selector.includes('[data-part-selection]'),
      `"${selector}" answers the pointer only for a card that holds a link`,
    );
  }
});

test('holds hover back for a disabled card and a disabled action', () => {
  for (const selector of normalized.split('}')) {
    if (!selector.includes(':hover')) continue;
    assert.ok(
      selector.includes(':not([data-disabled])') && selector.includes(':not(:disabled)'),
      `"${selector}" paints hover without holding it back`,
    );
  }
});

/**
 * Selected is the accent ground under a one-pixel accent edge (C1, R1): the
 * pair a selected row paints, never a thicker stroke. Hover and press on a
 * chosen card step the ground through the accent's tints, as a chosen row's
 * do. The control inside carries the state where the scheme flattens both.
 */
test('says selected with the accent ground and a hairline accent edge', () => {
  const selected = rule(`${ui}[data-selected]`);
  assert.match(
    selected,
    /--_card-surface-rest:var\(--slotted-card-background-selected,var\(--slotted-tone-accent-surface,Canvas\)\)/,
  );
  assert.match(
    selected,
    /--_card-surface-hover:var\(--slotted-card-background-selected-hover,var\(--slotted-tone-accent-subtle-hover,Canvas\)\)/,
  );
  assert.match(
    selected,
    /--_card-surface-active:var\(--slotted-card-background-selected-active,var\(--slotted-tone-accent-subtle-active,Canvas\)\)/,
  );
  assert.match(
    selected,
    /--_card-edge-rest:var\(--slotted-card-edge-color-selected,var\(--slotted-tone-accent-border,CanvasText\)\)/,
  );
  assert.match(
    selected,
    /--_card-edge-width:var\(--slotted-card-edge-width-selected,var\(--slotted-border-width-thin,1px\)\)/,
  );
  assert.doesNotMatch(selected, /border-width-thick|surface-inverse/);
});

/**
 * `data-selected` is painted by the card; the control inside announces it. The
 * card reserves the control a column of its own, because the chooser shipped as
 * a browser default dropped beside a heading.
 */
test('keeps a column for the control that makes the card a choice', () => {
  assert.ok(
    normalized.includes(
      `${ui} > [data-part-header]:has([data-part-selection]){grid-template-columns:auto minmax(0,1fr) auto`,
    ),
    'the header does not open a column for the selection control',
  );
  const selection = rule(`${ui} > [data-part-header] > [data-part-selection]`);
  assert.ok(selection.includes('grid-column:1'), 'the control does not lead');
  assert.ok(selection.includes('grid-row:1'), 'the control leaves the title row');
  /* On the title's first line (C1, R5): a slot one line of the title's step
     tall, the control centerd in it, so a wrapped title keeps its control
     beside the first line rather than in the middle of the block. */
  assert.ok(selection.includes('align-self:start'), 'the control is centerd on the block');
  assert.ok(selection.includes('align-items:center'), 'the control is not centerd on the line');
  assert.match(selection, /block-size:var\(--_selection-line\)/);
  assert.match(
    selection,
    /--_selection-line:var\(--slotted-card-selection-line,calc\(var\(--slotted-font-size-lg,1rem\) \* var\(--slotted-line-height-lg,1\.5\)\)\)/,
  );
});

/**
 * The control is the selection scale's square, the one checkbox and radio draw
 * in, fixed across densities (C1 after CK1).
 */
test('sizes that control from the selection scale', () => {
  const control = rule(`${ui} > [data-part-header] > [data-part-selection] >:is(input,button)`);
  assert.ok(control.includes('var(--slotted-selection-size-md,16px)'));
  assert.ok(!control.includes('--slotted-control-icon-size'));
  assert.ok(
    !control.includes('accent-color:'),
    'the card paints the control, which follows the scheme on its own',
  );
});

/**
 * The corner takes the last column whether the header has two or three, so
 * opening a column for the control does not move the badge.
 */
test('keeps the corner in the last column at either header width', () => {
  assert.ok(
    rule(`${ui} > [data-part-header] > [data-part-actions]`).includes('grid-column:-2 / -1'),
  );
});

test('withdraws the hit area it added when the card is marked disabled', () => {
  assert.ok(
    rule(`${ui}[data-disabled] [data-part-link]::after`).includes('display:none'),
    'a card that says disabled must not keep behaving like a destination',
  );
});

test('takes every duration from the motion scale', () => {
  assert.ok(rule(ui).includes('var(--slotted-duration-short)'));
  assert.doesNotMatch(css, /\d+m?s(?![\w-])/);
});

test('scales its own inset without touching the space scale', () => {
  for (const [size, inset] of [
    ['sm', '--slotted-space-5'],
    ['lg', '--slotted-space-8'],
  ]) {
    const rule_ = rule(`${ui}[data-size='${size}']`);
    assert.ok(
      rule_.includes(`--_card-inset-block:var(--slotted-card-padding-block-${size},var(${inset}`),
      `${size} does not reach ${inset}`,
    );
  }
});

/**
 * A shadow is removed outright in a forced-colors document, so an elevated
 * card keeps the hairline every card has rather than trading it for the lift.
 */
test('adds elevation to the edge rather than replacing it', () => {
  const elevated = rule(`${ui}[data-fill='elevated']`);
  assert.ok(elevated.includes('--_card-shadow-rest:var(--slotted-card-shadow'));
  assert.ok(
    !elevated.includes('--_card-edge-rest:'),
    'an elevated card that drops its edge has none in forced colors',
  );
  assert.ok(
    rule(`${ui}[data-fill='subtle']`).includes(
      '--_card-surface-rest:var(--slotted-card-background-subtle',
    ),
  );
});

test('keeps a corner in the header for a badge, a status or a menu', () => {
  const header = rule(`${ui} > [data-part-header]`);
  assert.ok(header.includes('display:grid'));
  assert.ok(header.includes('grid-template-columns:minmax(0,1fr) auto'));

  const actions = rule(`${ui} > [data-part-header] > [data-part-actions]`);
  assert.ok(actions.includes('grid-row:1'), 'a title wrapping to two lines drags the corner down');
  assert.ok(actions.includes('position:relative'), 'the corner sits under the stretched hit area');
});

/**
 * A rule between two regions is composition, not an axis: the family only has
 * to keep a Divider from being squashed, and to place it in the content column
 * of a horizontal card.
 */
test('lets a Divider stand between two regions', () => {
  assert.ok(rule(`${ui} > [data-ui-divider]`).includes('flex-shrink:0'));
  assert.ok(
    rule(`${ui}[data-orientation='horizontal'] > [data-ui-divider]`).includes('grid-column:2'),
  );
});

/**
 * `container-type` removes the inline contribution of the element it is on, so
 * a horizontal card in a flex row collapses to one word per line. Reproduced in
 * the `packed` scene of the harness before this line existed.
 */
test('fills the inline size it is given rather than collapsing in a packed row', () => {
  assert.ok(rule(`${ui}[data-orientation='horizontal']`).includes('inline-size:100%'));
});

test('exercises every declared part in the harness fragment', () => {
  for (const part of contract.members.card.parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `no scene renders the ${part} part`);
  }
  assert.match(fragment, new RegExp(`data-ui="${contract.ui}"`));
});

test('exercises every declared state in the harness fragment', () => {
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.ok(fragment.includes(attribute), `no scene renders the ${state} state`);
  }
});

/**
 * A card publishes its current ground, so a family that states a ground of
 * its own — a table's rows, a grid's cells — stands on the card's rather than
 * on the page's surface, a darker band inside a raised card.
 */
test('publishes its ground to the families inside it', () => {
  assert.match(rule(ui), /--slotted-ground:var\(--_card-surface\)/);
});
