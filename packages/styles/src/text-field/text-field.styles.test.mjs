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
    new URL('../../../../specs/components/text-field/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./text-field.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./text-field.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.textField;

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
  for (const part of member.parts) {
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

/**
 * The frame carries the border, the ground and the ring; the control gives up
 * all three and keeps the value. Two rings would otherwise nest, and a border
 * inside a border is a control drawn twice.
 */
/**
 * Only when a button is the first or last thing in the frame, and then the air
 * beside it is the air above it: the ground a hover paints is a smaller copy
 * of the frame, and its corner is the frame's less that air
 *. With an
 * `end` of text after it the frame keeps its own padding, because text is
 * inset like text.
 */
test('insets a button at either end concentrically with the frame', () => {
  const frame = rule(root);
  assert.match(
    frame,
    /--_inset:max\(0px,calc\(\(var\(--_height\) - 2 \* var\(--slotted-control-border-width,1px\) - var\(--_action-size\)\) \/ 2\)\)/,
  );
  assert.match(
    frame,
    /--_action-radius:max\(var\(--slotted-radius-xs,2px\),calc\(var\(--slotted-text-field-radius,var\(--slotted-control-radius,4px\)\) - var\(--_inset\)\)\)/,
  );
  assert.match(
    rule(
      `${root}:has(>:is([data-part-clear],[data-part-copy],[data-part-reveal]):not([hidden]):last-child,>[data-part-end]:last-child>[data-part-action]:last-child)`,
    ),
    /padding-inline-end:var\(--_inset\)/,
  );
  assert.match(
    rule(`${root}:has(>[data-part-start]:first-child>[data-part-action]:first-child)`),
    /padding-inline-start:var\(--_inset\)/,
  );
});

test('gives the frame the box and the control the value', () => {
  const frame = rule(root);
  assert.match(frame, /border:var\(--slotted-control-border-width,1px\) solid/);
  assert.match(frame, /display:flex/);
  assert.match(frame, /min-inline-size:0/);

  const input = rule(`${ui}>[data-part-input]`);
  assert.match(input, /border:0/);
  assert.match(input, /background-color:transparent/);
  assert.match(input, /outline:none/);
  assert.match(input, /padding:0/);
  assert.match(input, /min-inline-size:0/);
});

/**
 * Every step reads the control scales, which are the only ones the theme
 * restates per density, so a control in a dense table shrinks whole rather
 * than in parts. A hand-written height is what the deleted `input` family
 * shipped and what stopped it from answering density at all.
 */
test('takes every step from the control scales rather than stating one', () => {
  for (const size of contract.axes.size) {
    const step = rule(`${root}[data-size='${size}']`);
    assert.match(step, new RegExp(`--_height:var\\(--slotted-control-height-${size}`));
    assert.match(step, new RegExp(`--_font-size:var\\(--slotted-control-font-size-${size}`));
    assert.match(
      step,
      new RegExp(`--_padding-inline:var\\(--slotted-control-padding-inline-${size}`),
    );
    assert.match(
      step,
      new RegExp(
        `--_icon-size:max\\(var\\(--_icon-floor\\),var\\(--slotted-control-icon-size-${size}`,
      ),
    );
  }
  assert.doesNotMatch(declarations, /block-size:\s*\d+px/, 'a step is stated in pixels');
});

/**
 * The drawn button and the target are two measurements, and the family owes
 * both. The drawn box is square, sized by its glyph and bounded by the frame,
 * so the frame keeps air above and below it; the WCAG 2.2 minimum of 24 CSS
 * pixels is recovered outside the paint, because at `sm` with `dense` the whole
 * control is 24 pixels tall and nothing drawn inside it can also be 24.
 *
 * The rule is the minimum, not the drawing: what this holds is that the target
 * reaches `--slotted-target-min` in both axes and never shrinks a box that is
 * already larger.
 */
test('draws every button inside the frame and keeps the target minimum', () => {
  const frame = rule(root);
  assert.match(frame, /--_inner-size:var\(--slotted-control-inner-size-md,24px\)/);
  assert.match(
    frame,
    /--_action-size:var\(--slotted-text-field-action-size,min\(calc\(var\(--_icon-size\) \+ 2 \* var\(--slotted-space-2,0\.25rem\)\),var\(--_inner-size\)\)\)/,
  );

  const action = rule(
    `${ui}>:is([data-part-clear],[data-part-copy],[data-part-reveal]),${ui}>:is([data-part-start],[data-part-end])>[data-part-action]`,
  );
  assert.match(action, /min-inline-size:var\(--_action-size\)/);
  assert.match(action, /block-size:var\(--_action-size\)/);
  assert.match(action, /border-radius:var\(--_action-radius\)/);
  assert.match(action, /position:relative/);
  assert.match(action, /--slotted-icon-size:var\(--_icon-size\)/);

  const target = rule(
    `${ui}>:is([data-part-clear],[data-part-copy],[data-part-reveal])::after,${ui}>:is([data-part-start],[data-part-end])>[data-part-action]::after`,
  );
  assert.match(target, /position:absolute/);
  assert.match(
    target,
    /inset:min\(0px,calc\(\(100% - var\(--slotted-target-min,24px\)\) \/ 2\)\)/,
    'the hit area does not reach the WCAG 2.2 minimum in both axes',
  );
});

/**
 * A button without text has to carry its name in an attribute, so the
 * attribute that makes it accessible is the one that keeps it square; a
 * button named by its own words takes a step of air a side and the value's
 * ink.
 */
test('pads a labelled action and keeps an icon action square', () => {
  const labelled = rule(
    `${ui}>:is([data-part-start],[data-part-end])>[data-part-action]:not([aria-label],[aria-labelledby])`,
  );
  assert.match(labelled, /padding-inline:var\(--slotted-space-3,0\.375rem\)/);
  assert.match(
    labelled,
    /color:var\(--slotted-text-field-action-label-color,var\(--slotted-text,CanvasText\)\)/,
  );
});

/**
 * A glyph fills the whole icon box and a character fills only its own advance
 * width, so two adornments placed at the same padding edge start together and
 * read as if they did not. The adornment that draws no glyph takes the margin
 * the glyph box already has, on both sides, in terms of that box rather than
 * per density.
 */
test('aligns a text adornment optically with a glyph one', () => {
  const adornment = rule(
    `${ui}>[data-part-start]:not(:has(svg,img,[data-ui-icon],[data-part-action])),${ui}>[data-part-end]:not(:has(svg,img,[data-ui-icon],[data-part-action]))`,
  );
  assert.match(adornment, /padding-inline:calc\(var\(--_icon-size\) \/ 8\)/);
  assert.match(
    rule(`${ui}>[data-part-start],${ui}>[data-part-end]`),
    /unicode-bidi:plaintext/,
    'the optical inset replaced the bidi isolation instead of joining it',
  );
});

/**
 * The shadow and the ring are one decision. A framed control carries the
 * foundation's resting shadow, a focused one redraws it in the focus ring's
 * color, and a control nobody can reach carries none.
 */
test('lifts the frame at rest, in the state color on focus, and never while disabled', () => {
  assert.match(
    rule(root),
    /box-shadow:var\(--slotted-text-field-shadow,var\(--slotted-control-shadow,none\)\)/,
  );
  assert.match(
    rule(`${root}:has(>[data-part-input]:focus-visible)`),
    /box-shadow:var\(--slotted-control-shadow-focus-geometry,[^)]*\) var\(--slotted-focus-ring-color/,
  );
  assert.match(
    rule(`${root}[data-disabled],${root}:has(>[data-part-input]:disabled)`),
    /box-shadow:none/,
  );
});

/**
 * Invalid retargets the ring rather than repainting it. Every rule that draws
 * focus reads `--slotted-focus-ring-color`, so the outline, the shadow under
 * the frame and the ring on either button all move with one declaration — which
 * is the rule the remaining controls inherit rather than restate.
 */
test('points the focus ring at the invalid color rather than repainting it', () => {
  assert.match(
    rule(`${root}[data-invalid]`),
    /--slotted-focus-ring-color:var\(--slotted-text-field-invalid-focus-ring-color,var\(--slotted-focus-ring-color-invalid/,
  );
});

/**
 * The glyphs are the `Glyph` element the binding renders inside each button,
 * never a mask or a character. The stylesheet only sizes the `icon` box, at
 * the control's own icon step.
 */
/**
 * Color alone does not say a field is wrong (WCAG 1.4.1): in `high-contrast`
 * the control edge, the danger border and both rings are one black. An
 * invalid frame adds an inset edge of `--slotted-control-invalid-edge-width`
 * inside its border, at rest and under focus, so its line is thicker than a
 * valid one's in every scheme. The edge is a shadow rather than a wider
 * border, so the field's box and its text do not move.
 */
test('draws an invalid frame with a thicker edge, at rest and under focus', () => {
  const width =
    'var(--slotted-text-field-invalid-edge-width,var(--slotted-control-invalid-edge-width,1px))';
  const color = 'var(--slotted-text-field-invalid-border-color,var(--slotted-tone-danger-border))';
  const invalid = rule(`${root}[data-invalid]`);
  assert.ok(invalid.includes(`--_invalid-edge-width:${width}`), invalid);
  assert.ok(invalid.includes(`--_invalid-edge-color:${color}`), invalid);
  assert.ok(
    invalid.includes(
      '--_invalid-edge:inset 0 0 0 var(--_invalid-edge-width) var(--_invalid-edge-color)',
    ),
    invalid,
  );
  assert.ok(invalid.includes('box-shadow:var(--_invalid-edge)'), 'no edge at rest');
  assert.ok(
    rule(`${root}[data-invalid]:has(>[data-part-input]:focus-visible)`).includes(
      'box-shadow:var(--_invalid-edge),var(--slotted-control-shadow-focus-geometry,0 1px 4px -1px) var(--slotted-focus-ring-color,Highlight)',
    ),
    'no edge under focus',
  );
});

/**
 * The `plain` ring is drawn inside the box, at minus the ring offset, and it
 * covered the border and an edge as wide as the border: a focused invalid
 * cell and a focused valid one were the same pixels. The edge reaches past it.
 */
test('takes the plain variant’s edge past the ring drawn inside it', () => {
  assert.ok(
    rule(
      `${root}[data-variant='plain'][data-invalid]:has(>[data-part-input]:focus-visible)`,
    ).includes(
      'box-shadow:inset 0 0 0 calc(var(--slotted-focus-ring-offset,2px) - var(--slotted-control-border-width,1px) + var(--_invalid-edge-width)) var(--_invalid-edge-color)',
    ),
  );
});

/**
 * Forced colors remove box shadows, and the edge was one. It comes back as an
 * outline inside the border; focused, the invalid ring is double.
 */
test('keeps the invalid width under forced colors', () => {
  const forced = normalized.slice(normalized.lastIndexOf('@media (forced-colors:active)'));
  assert.ok(
    forced.includes(
      `${root}[data-invalid]{outline:var(--_invalid-edge-width) solid CanvasText;outline-offset:calc(-1 * (var(--slotted-control-border-width,1px) + var(--_invalid-edge-width)));}`,
    ),
    forced,
  );
  assert.match(
    forced,
    /\[data-variant='plain'\]\[data-invalid\]:has\(>\[data-part-input\]:focus-visible\)\{outline:calc\(var\(--slotted-focus-ring-width,2px\) \+ var\(--_invalid-edge-width\)\) double/,
  );
});

test('paints no glyph itself', () => {
  assert.doesNotMatch(declarations, /mask-image/);
  assert.doesNotMatch(declarations, /content:'[^']+'/, 'a character is drawn as an icon');
});

/**
 * The family draws its own clear button, so WebKit's would be the second one.
 */
test('withdraws the search decorations the platform would add', () => {
  assert.ok(normalized.includes('[data-part-input]::-webkit-search-cancel-button'));
  assert.match(
    rule(
      `${ui}>[data-part-input]::-webkit-search-cancel-button,${ui}>[data-part-input]::-webkit-search-decoration`,
    ),
    /appearance:none/,
  );
});

/**
 * Chrome paints its own ground over an autofilled control and the inset shadow
 * is the only way to reach it. The signal is kept rather than erased: an
 * autofilled value is a fact worth seeing, repainted in a color the theme
 * owns instead of in the browser's yellow.
 */
test('repaints autofill in the theme rather than erasing the signal', () => {
  const autofill = rule(`${ui}>[data-part-input]:autofill`);
  assert.match(autofill, /box-shadow:inset 0 0 0 100px/);
  assert.match(
    autofill,
    /--slotted-text-field-autofill-background,var\(--slotted-tone-accent-surface\)/,
  );
  assert.match(autofill, /-webkit-text-fill-color/);
});

/**
 * The ring answers the control's focus rather than the frame's, because a
 * browser matches `:focus-visible` on a text input for a pointer press as well
 * as for a Tab — which is right for a control whose caret is what moved.
 */
test('rings the frame for the control, and each button for itself', () => {
  assert.match(
    rule(`${root}:has(>[data-part-input]:focus-visible)`),
    /outline:var\(--slotted-focus-ring-width,2px\) solid/,
  );
  assert.match(
    rule(
      `${ui}>:is([data-part-clear],[data-part-copy],[data-part-reveal]):focus-visible,${ui}>:is([data-part-start],[data-part-end])>[data-part-action]:focus-visible`,
    ),
    /outline-offset:calc\(var\(--slotted-focus-ring-offset,2px\) \* -1\)/,
  );
});

/**
 * A disabled `fieldset` disables every control inside it and tells none of
 * them, so the attribute alone left such a control looking operable and
 * answering nothing. The deleted `input` family found that defect; a rebuild
 * may not reintroduce it.
 */
test('answers a control the browser disabled without telling it', () => {
  assert.ok(normalized.includes(`${root}:has(>[data-part-input]:disabled)`));
  assert.match(
    rule(`${root}[data-disabled],${root}:has(>[data-part-input]:disabled)`),
    /cursor:not-allowed/,
  );
});

/**
 * A weaker state holds itself back for every stronger one it can meet, and
 * `invalid` outranks `hover`: a control reporting an error does not stop
 * looking wrong because the pointer is over it.
 */
test('holds hover back for readonly, invalid and disabled', () => {
  for (const selector of normalized.split('}').filter((block) => block.includes(':hover'))) {
    const head = selector.split('{')[0] ?? '';
    if (!head.includes(root)) continue;
    assert.ok(head.includes(':not([data-disabled])'), `${head} answers hover while disabled`);
    assert.ok(head.includes(':not([data-readonly])'), `${head} answers hover while read-only`);
    assert.ok(head.includes(':not([data-invalid])'), `${head} answers hover while invalid`);
  }
  assert.ok(
    normalized.indexOf(`${root}[data-invalid]{`) >
      normalized.indexOf(`${root}:hover:not([data-disabled])`),
    'invalid is written before hover and loses to it',
  );
});

/** Read-only is not disabled: the value is real, focusable and submitted. */
test('keeps read-only legible and tells it apart from disabled', () => {
  const readonly = rule(`${root}[data-readonly]`);
  assert.match(readonly, /background-color:var\(--slotted-text-field-readonly-background/);
  assert.doesNotMatch(readonly, /color:var\(--slotted-disabled/);
  assert.doesNotMatch(readonly, /cursor:not-allowed/);
});

/**
 * A transparent border has no system color to be remapped to, so the `plain`
 * control would lose its only edge exactly where an edge matters most. It is
 * the one rule the theme cannot write on the family's behalf.
 */
test('gives the borderless variant an edge under forced colors', () => {
  assert.match(declarations, /@media \(forced-colors: active\)/);
  assert.match(rule(`${root}[data-variant='plain']`), /border-color:transparent/);
  assert.ok(
    normalized.includes(
      `@media (forced-colors:active){${root}[data-variant='plain']{border-color:ButtonBorder;}`,
    ),
    'the plain variant keeps no edge under forced colors',
  );
});

/* ------------------------------------------------------------- fragment - */

test('renders every part the contract declares in at least one scene', () => {
  for (const part of member.parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `${part} is in no scene`);
  }
});

test('renders every state the contract declares in at least one scene', () => {
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.match(fragment, new RegExp(attribute), `${state} is in no scene`);
  }
});

test('exercises every step and every variant on the page', () => {
  for (const size of contract.axes.size) {
    assert.match(fragment, new RegExp(`data-size="${size}"`), `${size} is in no scene`);
  }
  for (const variant of contract.axes.variant) {
    assert.match(fragment, new RegExp(`data-variant="${variant}"`), `${variant} is in no scene`);
  }
});

/**
 * The count and the field are the same scene, because the number is the
 * control's and the place is the field's — and neither half can be looked at
 * without the other.
 */
test('shows the control inside the field that places its count', () => {
  assert.match(fragment, /data-ui="field"/);
  assert.match(fragment, /data-part="counter"/);
  assert.match(fragment, /data-part="counter" data-invalid/);
});

/**
 * The two table scenes are compact tables. Density is the theme axis
 * `data-slotted-density`; no family reads a `data-density` attribute.
 */
test('states the tables of its scenes as compact on the theme axis', () => {
  assert.doesNotMatch(fragment, /\sdata-density=/);
  assert.equal(fragment.match(/data-ui="table"[^>]*data-slotted-density="compact"/g)?.length, 2);
});

/**
 * A mark beside words is centerd on the band the letters occupy, not on the
 * line box, which keeps room for descenders and drops the mark below the
 * letters (docs/build-briefing.md, _A mark beside a line of text is aligned to
 * the text_). Measured in Chrome: the chevron's center and the letters' band
 * agree to 0.00 px.
 */
test('centers the mark of a worded button on the letters, not on the line box', () => {
  const flat = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  assert.match(flat, /align-items: baseline;/);
  assert.match(
    flat,
    /margin-block-start: calc\(\(1cap \+ 1ex\) \/ 4 - var\(--_icon-size\) \/ 2\);/,
  );
  assert.match(flat, /translate: 0 calc\(var\(--_icon-size\) \/ 2 - \(1cap \+ 1ex\) \/ 4\);/);
});
