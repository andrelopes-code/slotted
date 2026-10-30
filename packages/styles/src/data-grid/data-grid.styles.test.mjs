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

const css = readFileSync(new URL('./data-grid.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./data-grid.harness.html', import.meta.url), 'utf8'),
);
const contract = JSON.parse(
  readFileSync(new URL('../../../../specs/components/data-grid/contract.json', import.meta.url)),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalize = (text) =>
  text
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,:])\s*/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');
const normalized = normalize(declarations);
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rule = (selector) => {
  const match = normalized.match(new RegExp(`${escape(normalize(selector))}\\{([^}]*)\\}`));
  assert.ok(match, `no rule for \`${selector}\``);
  return match[1];
};

test('renders every part the contract declares, on the element and with the role it names', () => {
  for (const part of contract.members['data-grid'].parts) {
    const tag = contract.elements[part];
    const pattern = new RegExp(`<${tag === 'button' ? 'button' : tag}[^>]*data-part="${part}"`);
    assert.match(fragment, pattern, `${part} on a ${tag}`);
  }
  for (const [part, role] of Object.entries(contract.roles)) {
    const pattern = new RegExp(
      `data-part="${part}"[^>]*role="${role}"|role="${role}"[^>]*data-part="${part}"`,
    );
    assert.match(fragment, pattern, `${part} carries role ${role}`);
  }
});

/**
 * The DOM is `div` and every row is a CSS grid over one template the binding
 * writes on the root. A cell places itself explicitly, because with column
 * virtualisation the cells that are absent would otherwise move the ones that
 * are present into the wrong tracks.
 */
test('lays every row out as a grid over the template the binding writes', () => {
  /* The grid's own rows only — the children of its row groups. A widget in a
     cell may hold rows of its own (a multi-select's chips are a `row`), and a
     descendant selector laid those out on this grid's template. */
  const groups =
    '> [data-part-scroll] > :is([data-part-head],[data-part-body],[data-part-pinned-rows],[data-part-summary],[data-part-loader])';
  const row = rule(`[data-ui-data-grid] ${groups} > [role='row']`);
  assert.match(row, /display:grid;/);
  /* The filler after the template is `auto`, not `1fr`: an `fr` filler shared
     the free space with a flexible column, which then stopped at half the
     frame; `auto` stretches only where no flexible track exists. */
  assert.match(row, /grid-template-columns:var\(--slotted-data-grid-template,none\) auto;/);
  const cell = rule(`[data-ui-data-grid] ${groups} > [role='row'] > *`);
  assert.match(cell, /grid-column:var\(--slotted-data-grid-column,auto\);/);
  assert.doesNotMatch(normalized, /\[data-ui-data-grid\] \[role='row'\]\{/);
});

/**
 * A row is as wide as the frame, or as the template's minimum when that is
 * wider — never as wide as its longest value. Sized to `max-content`, a
 * flexible column grew with a long name past the frame on a phone, and the
 * name never truncated; `fit-content` stops at the frame and lets the cell's
 * own overflow rule work, while a template of fixed widths still scrolls.
 */
test('sizes rows and row groups to fit the frame, not to their longest value', () => {
  const groups =
    '> [data-part-scroll] > :is([data-part-head],[data-part-body],[data-part-pinned-rows],[data-part-summary],[data-part-loader])';
  for (const selector of [
    `[data-ui-data-grid] ${groups} > [role='row']`,
    `[data-ui-data-grid] ${groups}`,
  ]) {
    const block = rule(selector);
    assert.match(block, /inline-size:fit-content;/);
    assert.match(block, /min-inline-size:100%;/);
    assert.doesNotMatch(block, /inline-size:max-content;/);
  }
});

/**
 * The virtual window is padding and height on the body, never a transform: a
 * transformed ancestor would stand between a pinned column's `sticky` and the
 * scroller it must resolve against.
 */
test('windows rows with padding and height, and never with a transform', () => {
  const body = rule('[data-ui-data-grid] > [data-part-scroll] > [data-part-body]');
  assert.match(body, /block-size:var\(--slotted-data-grid-window-total,auto\);/);
  assert.match(body, /padding-block-start:var\(--slotted-data-grid-window-start,0\);/);
  assert.doesNotMatch(declarations, /transform\s*:/);
});

/**
 * The cursor at rest is an inset shadow in the theme's ring color at 60%,
 * and under `:focus-visible` the same trace is an outline in the ring color
 * whole, drawn inward because a cell has no margin for an outer ring.
 */
test('draws the cursor inward, at rest as a shadow and under focus as the ring', () => {
  const rest = rule(
    "[data-ui-data-grid] [role='gridcell'][data-current]:not([data-editing]),[data-ui-data-grid] [role='rowheader'][data-current]:not([data-editing]),[data-ui-data-grid] [role='columnheader'][data-current]",
  );
  assert.match(rest, /box-shadow:inset 0 0 0 var\(--_ring-width\) var\(--_cursor-rest\);/);
  const focus = rule(
    "[data-ui-data-grid] [role='row'] > [role='gridcell']:focus-visible:not([data-editing]),[data-ui-data-grid] [role='row'] > [role='rowheader']:focus-visible:not([data-editing]),[data-ui-data-grid] [role='row'] > [role='columnheader']:focus-visible",
  );
  assert.match(
    focus,
    /outline:var\(--_ring-width\) solid var\(--slotted-focus-ring-color,Highlight\);/,
  );
  assert.match(focus, /outline-offset:calc\(var\(--_ring-width\) \* -1\);/);
  assert.match(
    normalized,
    /--_cursor-rest:color-mix\(in oklab,var\(--slotted-focus-ring-color,Highlight\) 60%,transparent\);/,
  );
});

/** A pinned cell covers what slides under it with the row's own ground. */
test('pins a column with sticky at the offset the binding writes, on the row’s own ground', () => {
  for (const edge of ['start', 'end']) {
    const pinned = rule(`[data-ui-data-grid] [data-pinned='${edge}']`);
    assert.match(pinned, /position:sticky;/);
    assert.match(pinned, /background-color:inherit;/);
    assert.match(
      pinned,
      new RegExp(`inset-inline-${edge}:var\\(--slotted-data-grid-pin-offset,0\\);`),
    );
  }
  const corner = rule('[data-ui-data-grid] > [data-part-scroll] > [data-part-head] [data-pinned]');
  assert.match(corner, /z-index:calc\(var\(--slotted-z-index-sticky,100\) \+ 2\);/);
  /* The zone's edge is the hairline the rows are ruled with; while something
     slides under it the line casts a short shadow, never a stronger line: a
     dark rule down the body read as a frame inside the frame. */
  const edge = rule('[data-ui-data-grid] [data-pinned][data-pin-edge]::after');
  assert.match(edge, /background-color:var\(--_rule\);/);
  assert.match(edge, /inline-size:var\(--_rule-width\);/);
  const hidden = rule(
    "[data-ui-data-grid] [data-part-scroll][data-overflowing]:not([data-at-start]) [data-pinned='start'][data-pin-edge]::after",
  );
  assert.match(
    hidden,
    /background-image:linear-gradient\(to right,var\(--_rule\) var\(--_rule-width\),var\(--_edge-shadow\) var\(--_rule-width\),transparent\);/,
  );
  assert.doesNotMatch(normalized, /\[data-pin-edge\]::after\{[^}]*--_rule-strong/);
  /* The cells end where the rule under the row begins: the track is the row
     less the rule, or a pinned cell painted above its row covered the rule. */
  const body = rule(
    "[data-ui-data-grid]:is([data-variant='ruled'],[data-variant='framed']) > [data-part-scroll] > :is([data-part-body],[data-part-pinned-rows])",
  );
  assert.match(body, /--_track:calc\(var\(--_row-block\) - var\(--_rule-width\)\);/);
  const fixed = rule(
    "[data-ui-data-grid][data-rows='fixed'] > [data-part-scroll] > :is([data-part-body],[data-part-pinned-rows]) > [data-part-row]",
  );
  assert.match(fixed, /block-size:var\(--_row-block\);grid-auto-rows:var\(--_track\);/);
});

/**
 * A cell in edit hands its inset to the plain control and the control stands
 * inside the cell's trace — the track less the ring on both sides, the editor
 * kept the ring's width back from every edge — so nothing the control draws
 * lands on the trace; it keeps the grid's type and silences the control's own
 * ring so the cell's trace is the only one. Every cell in edit carries the
 * resting trace; the cursor's own carries it whole.
 */
test('hands the editing cell’s inset, height and type to the plain control', () => {
  const editing = rule('[data-ui-data-grid] [data-part-cell][data-editing]');
  assert.match(editing, /(^|;)padding:0;/);
  for (const step of ['sm', 'md', 'lg']) {
    assert.match(
      editing,
      new RegExp(`--slotted-control-padding-inline-${step}:var\\(--_pad-inline\\);`),
    );
    assert.match(
      editing,
      new RegExp(
        `--slotted-control-height-${step}:calc\\(var\\(--_track\\) - var\\(--_ring-width\\) \\* 2\\);`,
      ),
    );
  }
  assert.match(editing, /--slotted-control-font-size-sm:var\(--_font-size\);/);
  assert.match(editing, /--slotted-focus-ring-width:0px;/);
  assert.match(editing, /box-shadow:inset 0 0 0 var\(--_ring-width\) var\(--_cursor-rest\);/);
  const editor = rule('[data-ui-data-grid] [data-part-cell] > [data-part-editor]');
  assert.match(editor, /margin:var\(--_ring-width\);/);
  const invalid = rule('[data-ui-data-grid] [data-part-cell][data-editing][data-invalid]');
  assert.match(invalid, /--slotted-focus-ring-color:var\(--slotted-focus-ring-color-invalid\);/);
  /* The filter row's control stands inside its cell's trace the same way. */
  const operand = rule(
    '[data-ui-data-grid] [data-part-filter-cell] > [data-part-filter-operand],[data-ui-data-grid] [data-part-filter-cell] > :not([data-part]) > [data-part-filter-operand]',
  );
  assert.match(operand, /margin:var\(--_ring-width\);/);
});

/**
 * `result-state` inside the empty part has an `actions` part of the same
 * name as the row actions; the reveal rule is scoped to the cell's own child
 * so it never hides that family's buttons. Read on the first capture of the
 * empty scene, where every action button was missing.
 */
test('scopes the row-actions reveal to the cell’s own child', () => {
  assert.doesNotMatch(normalized, /\[data-ui-data-grid\] \[data-part-actions\]\{/);
  const actions = rule('[data-ui-data-grid] [data-part-cell] > [data-part-actions]');
  assert.match(actions, /opacity:0;/);
  assert.match(
    normalized,
    /\[data-part-row\]\[data-current\] \[data-part-cell\] > \[data-part-actions\]/,
  );
});

/**
 * The compact filter form the invocation asked for: three columns — the join,
 * the operator at a stated width, the operand taking the rest — and the panel
 * stating its own width rather than taking the operands' natural one.
 */
test('lays the filter panel out as one line per condition', () => {
  const panel = rule('[data-ui-data-grid][data-part-filter-panel]');
  assert.match(panel, /grid-template-columns:max-content var\(--_operator-size\) minmax\(0,1fr\);/);
  assert.match(panel, /inline-size:var\(--slotted-data-grid-filter-panel-size,24rem\);/);
  /* The popover pads its header and its body, not its surface; the panel
     stands in the surface and takes the `sm` inset itself, and the layer that
     holds it is given the panel's measure. Read live: at the popover's own
     sixteen rem the panel stood out of the surface on both sides. */
  assert.match(
    panel,
    /padding:var\(--slotted-popover-padding-block-sm,var\(--slotted-space-4,0\.5rem\)\) var\(--slotted-popover-padding-inline-sm,var\(--slotted-space-5,0\.75rem\)\);/,
  );
  /* The panel is found anywhere under the content, not as its child: the
     Angular binding draws it inside a host element of its own, and a child
     combinator left that popover at sixteen rem with the panel out of it. */
  const layer = rule(
    '[data-ui-popover]:has(> [data-part-content] [data-ui-data-grid][data-part-filter-panel])',
  );
  assert.doesNotMatch(
    normalized,
    /\[data-part-content\] > \[data-ui-data-grid\]\[data-part-filter-panel\]/,
  );
  assert.match(
    layer,
    /--slotted-popover-measure-sm:calc\(var\(--slotted-data-grid-filter-panel-size,24rem\) \+ 2 \* \(var\(--slotted-popover-gap,0\.5rem\) \+ var\(--slotted-border-width-thin,1px\)\)\);/,
  );
  assert.match(
    normalized,
    /--_operator-size:var\(--slotted-data-grid-filter-operator-size,7rem\);/,
  );
  const join = rule('[data-ui-data-grid][data-part-filter-panel] [data-part-filter-join]');
  assert.match(join, /grid-column:1;/);
});

/** The filter row is a row of the grid on the band's lighter step, and its operator is one character. */
/**
 * Both bindings share this stylesheet, and the Angular one draws some parts
 * inside host elements of its own (`display: contents`): the filter panel,
 * the filter row's operand, the editor's control. A child combinator that
 * reaches one of those from outside the host holds for React alone. Read
 * live, the Angular panel stood out of a sixteen-rem popover and the Angular
 * operand had no clip. A hosted part is reached as a child or through an
 * element with no part of its own.
 */
test('reaches every part a binding may host through its host element', () => {
  const through = (part) =>
    new RegExp(`>:not\\(\\[data-part\\]\\)(:last-child)?>\\[data-part-${part}\\]`);
  for (const selector of normalized.match(/[^{}]+(?=\{)/g) ?? []) {
    for (const part of ['filter-panel', 'filter-operand']) {
      const asChild = new RegExp(`(^|[^)])>\\[data-part-${part}\\]`);
      if (!asChild.test(selector)) continue;
      assert.match(
        selector,
        through(part),
        `${selector} reaches ${part} as a child but not through its host`,
      );
    }
    /* The control inside the editor and the operand is a family of its own,
       hosted the same way. */
    if (/\[data-part-(editor|filter-operand)\](\[[^\]]*\])*>\[data-part-root\]/.test(selector)) {
      assert.match(
        selector,
        /\[data-part-(editor|filter-operand)\](\[[^\]]*\])*>:not\(\[data-part\]\)(:last-child)?>\[data-part-root\]/,
        `${selector} reaches a hosted control as a child but not through its host`,
      );
    }
  }
});

test('draws the filter row on the band and its operator on a square inner target', () => {
  const cell = rule('[data-ui-data-grid] [data-part-filter-row] > [data-part-filter-cell]');
  assert.match(cell, /background-color:var\(--_band-surface\);/);
  const button = rule(
    '[data-ui-data-grid] [data-part-filter-cell] [data-part-filter-operator] > button',
  );
  assert.match(button, /inline-size:var\(--slotted-control-inner-size-sm,22px\);/);
  assert.match(button, /block-size:var\(--slotted-control-inner-size-sm,22px\);/);
});

/** The sort mark takes no room on an unsorted column; the menu keeps its room and reveals. */
test('reserves room for the column menu and none for an unsorted mark', () => {
  const sort = rule('[data-ui-data-grid] [data-part-column-header] > [data-part-sort]');
  assert.match(sort, /display:none;/);
  const sorted = rule(
    '[data-ui-data-grid] [data-part-column-header][data-sorted] > [data-part-sort]',
  );
  assert.match(sorted, /display:inline-flex;/);
  const menu = rule('[data-ui-data-grid] [data-part-column-menu]');
  assert.match(menu, /opacity:0;/);
  const filter = rule(
    '[data-ui-data-grid] [data-part-column-header] [data-part-filter]:not([data-filtered],[data-open])',
  );
  assert.match(filter, /display:none;/);
});

/** A value keeps its own direction inside a right-to-left grid. */
test('keeps a cell value’s own writing direction', () => {
  const value = rule(
    '[data-ui-data-grid] [data-part-cell] > span:not([data-ui], [data-part]),[data-ui-data-grid] [data-part-row-header] > span:not([data-ui], [data-part]),[data-ui-data-grid] [data-part-summary-cell] > span:not([data-ui], [data-part])',
  );
  assert.match(value, /unicode-bidi:plaintext;/);
});

/**
 * On a touch screen the row grows to the comfortable target through the
 * control scale, and the family's own controls — the column menu, the
 * filter trigger, the expander — grow with it: a 24-pixel button in a
 * 44-pixel row is a target a thumb misses.
 */
test('grows its own controls to the row on a coarse pointer', () => {
  const coarse = declarations.slice(declarations.indexOf('@media (pointer: coarse)'));
  const root = coarse.slice(coarse.indexOf('[data-ui-data-grid][data-part-root]'));
  const block = root.slice(root.indexOf('{') + 1, root.indexOf('}'));
  assert.match(
    normalize(block),
    /--_control:min\(var\(--slotted-target-comfortable,44px\),calc\(min\(var\(--_row-block\),var\(--_head-block\)\) - var\(--_ring-width\) \* 2\)\);/,
  );
});

/**
 * The controls stood the row less the cursor's ring on a coarse pointer, 40
 * pixels in a 44-pixel header: under the touch target the brief sets. The
 * ground keeps that size, so the cursor's ring still shows round it, and the
 * box grows to the target by a padding its ground does not paint; the margins
 * give the growth back, so the header and the column's name keep their room.
 */
test('makes its own controls a full touch target on a coarse pointer, with the ground they had', () => {
  const coarse = declarations.slice(declarations.indexOf('@media (pointer: coarse)'));
  const block = (selector) => {
    const at = coarse.indexOf(selector);
    const rest = coarse.slice(at);
    return normalize(rest.slice(rest.indexOf('{') + 1, rest.indexOf('}')));
  };
  const root = block('[data-ui-data-grid][data-part-root]');
  assert.match(root, /--_target:var\(--slotted-target-comfortable,44px\);/);
  assert.match(root, /--_reach:max\(0px,calc\(\(var\(--_target\) - var\(--_control\)\) \/ 2\)\);/);
  const controls = block('[data-ui-data-grid] [data-part-column-help],');
  assert.match(controls, /background-clip:content-box;/);
  assert.match(controls, /box-sizing:content-box;/);
  assert.match(controls, /padding:var\(--_reach\);/);
  assert.match(controls, /margin:calc\(var\(--_reach\) \* -1\);/);
});

/**
 * The empty scene is as wide as the frame's viewport and carries its own
 * padding. Measured from the content edge, the box was its padding wider than
 * the frame, and a grid whose columns all fit gained a sideways scroll the
 * moment a filter emptied it.
 */
test('keeps the empty scene’s padding inside the frame’s viewport', () => {
  const body = rule('[data-ui-data-grid] > [data-part-scroll] > [data-part-empty]');
  assert.match(body, /inline-size:var\(--slotted-data-grid-viewport,100%\)/);
  assert.match(body, /padding:/);
  assert.match(body, /box-sizing:border-box/);
});

/**
 * The loader stands in for body rows. Measured against the header's ruler, a
 * consumer who set a row height of its own had every box move when the rows
 * arrived — the failure a skeleton exists to prevent.
 */
test('reserves the body row’s height in the loader, not the header’s', () => {
  const cell = rule(
    '[data-ui-data-grid] > [data-part-scroll] > [data-part-loader] > [data-part-row] > *',
  );
  assert.match(cell, /min-block-size:max\(var\(--_row-block\),/);
});

/**
 * The column help is one of the family's own header controls — the same
 * square, ground and ring — drawn with the circled question mark `Glyph`, and never
 * hidden: a mark a hover reveals is a mark a coarse pointer never sees.
 */
test('draws the column help as a header control that is always shown', () => {
  const shared = rule(
    '[data-ui-data-grid] [data-part-column-help],[data-ui-data-grid] [data-part-column-menu],[data-ui-data-grid] [data-part-column-header] [data-part-filter],[data-ui-data-grid] [data-part-expander],[data-ui-data-grid] [data-part-group-toggle],[data-ui-data-grid] [data-part-tree-toggle]',
  );
  assert.match(shared, /inline-size:var\(--_control\);/);
  assert.match(shared, /block-size:var\(--_control\);/);
  assert.match(
    fragment,
    /data-part="column-help"[^>]*>\s*<span data-ui="icon"[^>]*>\s*<svg data-part="glyph" data-glyph="circle-question">/,
  );
  assert.doesNotMatch(
    normalized,
    /\[data-part-column-help\]\{[^}]*opacity:0/,
    'the help is never hidden at rest',
  );
  assert.match(normalized, /\[data-ui-data-grid\] \[data-part-column-help\]:focus-visible,/);
});

/** The description is read through `aria-describedby` and takes no room in the header. */
test('keeps the column description for the reader only', () => {
  const hidden = rule('[data-ui-data-grid] [data-part-column-description]');
  assert.match(hidden, /position:absolute;/);
  assert.match(hidden, /clip-path:inset\(50%\);/);
  assert.match(hidden, /inline-size:1px;/);
});

/** The menu's layer is a portal: the description atop it is scoped to the menu, muted and inset like its items. */
test('sets the column menu description as a muted caption over the items', () => {
  const caption = rule('[data-ui-menu] [data-part-column-menu-description]');
  assert.match(caption, /color:var\(--slotted-text-muted,GrayText\);/);
  assert.match(caption, /padding-inline:var\(--slotted-control-padding-inline-sm,0\.625rem\);/);
  assert.match(caption, /font-size:var\(--slotted-font-size-xs,0\.75rem\);/);
  /* The menu's content is a grid of tracks: the caption crosses them all. */
  assert.match(caption, /grid-column:1 \/ -1;/);
});

/**
 * The columns a narrow frame took out are drawn at the foot of their row: one
 * cell across every track on the row's second line, as wide as the frame and
 * still while the row scrolls, its fields starting where the first data
 * column's text does and filling as many columns as the frame has room for.
 */
test('draws the pop-in on the row’s second line, across the frame, after the gutters', () => {
  const popin = rule('[data-ui-data-grid] [data-part-popin]');
  assert.match(popin, /grid-column:1 \/ -1;/);
  assert.match(popin, /grid-row:2;/);
  assert.match(popin, /display:grid;/);
  assert.match(popin, /grid-template-columns:repeat\(auto-fill,minmax\(min\(9rem,100%\),1fr\)\);/);
  assert.match(popin, /column-gap:var\(--slotted-space-4,0\.5rem\);/);
  assert.match(popin, /row-gap:var\(--slotted-space-2,0\.25rem\);/);
  assert.match(popin, /position:sticky;/);
  assert.match(popin, /inset-inline-start:0;/);
  assert.match(popin, /max-inline-size:var\(--slotted-data-grid-viewport,100%\);/);
  assert.match(
    popin,
    /padding-inline:calc\(var\(--slotted-data-grid-leading,0px\) \+ var\(--_pad-inline\)\) var\(--_pad-inline\);/,
  );
  assert.match(popin, /padding-block:0 var\(--_pad-block\);/);
  /* The values' line is the density's row, grown to its content and no
     further than the cap; the pop-in's line has no cap. A fixed length as a
     track's maximum is where an auto-height grid grows every track to. */
  const row = rule(
    '[data-ui-data-grid][data-popin] > [data-part-scroll] > :is([data-part-body],[data-part-pinned-rows]) > [data-part-row]',
  );
  assert.match(row, /grid-template-rows:minmax\(var\(--_track\),auto\) auto;/);
  const summary = rule(
    "[data-ui-data-grid][data-popin] > [data-part-scroll] > [data-part-summary] > [role='row']",
  );
  assert.match(summary, /grid-template-rows:minmax\(var\(--_head-block\),auto\) auto;/);
  /* The chooser, the expander, the values and the actions are centerd on the
     values' line, as in a fixed row. */
  const first = rule(
    "[data-ui-data-grid][data-popin] :is([data-part-body],[data-part-pinned-rows]) > [data-part-row] > :is([role='gridcell'],[role='rowheader']):not([data-part-popin])",
  );
  assert.match(first, /align-items:center;/);
});

/**
 * An auto row grows to its content and stops at the cap. The cap is the
 * cell's, not the track's: `minmax(track, cap)` in a grid whose height is its
 * content is a track grown to the cap, and every auto row was four rows tall.
 */
test('grows an auto row to its content, capped by its cells and not its track', () => {
  const row = rule(
    "[data-ui-data-grid][data-rows='auto'] > [data-part-scroll] > :is([data-part-body],[data-part-pinned-rows]) > [data-part-row]",
  );
  assert.match(row, /grid-auto-rows:minmax\(var\(--_track\),auto\);/);
  assert.doesNotMatch(normalized, /minmax\(var\(--_track\),var\(--_row-max-block\)\)/);
  const cell = rule(
    "[data-ui-data-grid][data-rows='auto'] :is([data-part-body],[data-part-pinned-rows]) > [data-part-row] > :is([role='gridcell'],[role='rowheader']):not([data-part-popin])",
  );
  assert.match(cell, /max-block-size:var\(--_row-max-block\);/);
  assert.match(cell, /overflow-y:clip;/);
});

test('grounds a plain header’s pinned cells on the surface, not on a band the row lacks', () => {
  const pinned = rule(
    "[data-ui-data-grid][data-variant='plain'] > [data-part-scroll] > [data-part-head] [data-pinned],[data-ui-data-grid][data-variant='plain'] > [data-part-scroll] > [data-part-head] > [role='row'] > [data-part-selection]",
  );
  assert.match(pinned, /background-color:var\(--_surface\);/);
});

test('draws no resting pin edge beside a pop-in, which the edge could not run past', () => {
  const edge = rule('[data-ui-data-grid][data-popin] [data-pinned][data-pin-edge]::after');
  assert.match(edge, /background-color:transparent;/);
});

/**
 * A phone's width spent on the gutters' indent left one column of fields
 * where the row's whole width holds two; with room for one column only, a
 * label above its value doubles every field's height.
 */
test('starts a compact frame’s pop-in at the row’s padding and sets one column of fields inline', () => {
  const at = (condition) =>
    normalized.match(
      new RegExp(`@container ${escape(normalize(condition))}\\{([\\s\\S]*?\\})\\}`),
    )?.[1] ?? '';
  assert.match(
    normalize(rule('[data-ui-data-grid] [data-part-popin]')),
    /container:slotted-data-grid-popin \/ inline-size;/,
  );
  assert.match(
    normalize(rule('[data-ui-data-grid][data-narrow] [data-part-popin]')),
    /padding-inline-start:var\(--_pad-inline\);/,
  );
  const single = at('slotted-data-grid-popin (width < 19rem)');
  assert.match(single, /\[data-part-popin-field\]\{[^}]*display:grid;/);
  assert.match(single, /grid-template-columns:minmax\(0,7\.5rem\) minmax\(0,1fr\);/);
});

test('sets a pop-in field as its label above its value, whole and at the start', () => {
  const field = rule('[data-ui-data-grid] [data-part-popin-field]');
  assert.match(field, /flex-direction:column;/);
  assert.match(field, /min-inline-size:0;/);
  const label = rule('[data-ui-data-grid] [data-part-popin-label]');
  assert.match(label, /color:var\(--_muted\);/);
  assert.match(label, /font-size:var\(--slotted-font-size-xs,0\.75rem\);/);
  assert.match(label, /overflow-wrap:anywhere;/);
  const value = rule('[data-ui-data-grid] [data-part-popin-value]');
  assert.match(value, /min-inline-size:0;/);
  /* An empty value keeps its line, so the fields beside it stay aligned. */
  assert.match(value, /min-block-size:var\(--_line\);/);
  assert.match(value, /justify-content:start;/);
  assert.match(value, /text-align:start;/);
  /* Whole, whatever the column's own text treatment: the field has the room. */
  const text = rule(
    '[data-ui-data-grid] [data-part-popin-value][data-text] > span:not([data-ui],[data-part]),[data-ui-data-grid] [data-part-popin-value] > span:not([data-ui],[data-part])',
  );
  assert.match(text, /overflow:visible;/);
  assert.match(text, /overflow-wrap:anywhere;/);
  assert.match(text, /white-space:normal;/);
  assert.match(text, /text-align:left;/);
  assert.match(
    rule('[data-ui-data-grid]:dir(rtl) [data-part-popin-value] > span:not([data-ui],[data-part])'),
    /text-align:right;/,
  );
});

/** The pop-in's column header is a name for a reader and takes no track of the template. */
test('keeps the pop-in’s column header for the reader only', () => {
  const hidden = rule('[data-ui-data-grid] [data-part-popin-header]');
  assert.match(hidden, /position:absolute;/);
  assert.match(hidden, /clip-path:inset\(50%\);/);
  assert.match(hidden, /inline-size:1px;/);
});

/**
 * A skeleton row stands in for a body row and takes its box. The binding
 * counts the skeleton rows by the measured height of the rows it has drawn,
 * `--slotted-data-grid-loader-row-size`; a skeleton row drawn at the density's
 * base height beside that count left the frame's lower half empty whenever the
 * real rows were taller — Nexora's orders reload drew three rows of 34 pixels
 * in a frame of 466. The row is at least the measured height, so the count and
 * the drawing agree and nothing moves when the rows arrive.
 */
test('draws a skeleton row as tall as the rows it stands in for', () => {
  const cells = rule(
    '[data-ui-data-grid] > [data-part-scroll] > [data-part-loader] > [data-part-row] > *',
  );
  assert.match(
    cells,
    /min-block-size:max\(var\(--_row-block\),var\(--slotted-data-grid-loader-row-size,0px\)\)/,
  );
});

/**
 * A drag down the page that starts over the grid belongs to the page. The
 * scroller is a scroll container on both axes whatever it overflows on, and
 * a contained block axis swallowed the gesture where the grid is as tall as
 * its rows — every phone screen. Across, the containment stays: a sideways
 * drag over the columns is not the browser's back gesture.
 */
test('chains a vertical drag to the page and contains a horizontal one', () => {
  const scroll = rule('[data-ui-data-grid] > [data-part-scroll]');
  assert.match(scroll, /overscroll-behavior-block:auto;/);
  assert.match(scroll, /overscroll-behavior-inline:contain;/);
  assert.ok(!/overscroll-behavior:contain/.test(normalized));
});

/**
 * Every mark the family owns — the sort chevron, the column's help, menu and
 * filter, the expander, the group and tree toggles, the loader's ring and the
 * row's grip — is the `Glyph` element the binding draws. The sheet sizes,
 * turns and spins the `icon` box and paints no glyph of its own.
 */
test('draws every mark it owns with the Glyph element, never a mask', () => {
  assert.doesNotMatch(normalized, /mask/, 'the sheet still paints a glyph with a mask');
  for (const [part, glyph] of [
    ['sort', 'chevron-down'],
    ['column-help', 'circle-question'],
    ['column-menu', 'ellipsis'],
    ['filter', 'funnel'],
    ['expander', 'chevron-right'],
    ['group-toggle', 'chevron-right'],
    ['tree-toggle', 'chevron-right'],
    ['tree-toggle', 'loader-circle'],
    ['row-handle', 'grip-vertical'],
  ]) {
    assert.match(
      fragment,
      new RegExp(
        `data-part="${part}"[^>]*>\\s*<span data-ui="icon"[^>]*>\\s*<svg data-part="glyph" data-glyph="${glyph}">`,
      ),
      `${part} draws no ${glyph} in the harness`,
    );
  }
});

test('stands on the ground its container publishes before the page surface', () => {
  assert.match(
    normalized,
    /--_surface:var\(--slotted-data-grid-surface,var\(--slotted-ground,var\(--slotted-surface,Canvas\)\)\)/,
  );
});

/**
 * Nothing the grid writes while it scrolls reaches past the body. As a size
 * container the scroller made the browser lay out everything inside it
 * whenever a row entered or left, and the window's offset, inherited, restyled
 * every row and cell on every step; `data-grid.perf.browser.test.tsx` measures
 * both against the grid's first render.
 */
test('keeps the scroller from being a size container and the window offsets from inheriting', () => {
  const declarationsOnly = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(declarationsOnly, /container-type\s*:\s*(inline-)?size/);
  assert.doesNotMatch(declarationsOnly, /\bcq(i|w|h|b|min|max)\b/);
  for (const property of ['--slotted-data-grid-window-start', '--slotted-data-grid-window-total']) {
    assert.match(
      declarationsOnly,
      new RegExp(`@property ${property} \\{\\s*syntax: '\\*';\\s*inherits: false;`),
      `${property} is not registered without inheritance`,
    );
  }
});

/**
 * A refresh dims the rows and a veil refuses the press. `pointer-events: none`
 * on the body is inherited, and toggling it restyled every cell: 8 of the 9 ms
 * a 70-row grid spent on `aria-busy` (`busy.perf.browser.test.tsx` in React).
 */
test('refuses a press on busy rows through a veil, not an inherited property', () => {
  const body = "[data-ui-data-grid][aria-busy='true'] > [data-part-scroll] > [data-part-body]";
  assert.match(rule(body), /opacity:0\.55/);
  assert.doesNotMatch(rule(body), /pointer-events/);
  assert.match(rule(`${body}::after`), /position:absolute/);
  assert.match(
    rule('[data-ui-data-grid] > [data-part-scroll] > [data-part-body]'),
    /position:relative/,
  );
});
