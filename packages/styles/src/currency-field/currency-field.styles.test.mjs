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
    new URL('../../../../specs/components/currency-field/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./currency-field.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./currency-field.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.currencyField;

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
 * An amount whose digits change width as they are typed over is an amount that
 * moves under the reader's eye, and cents-first entry rewrites the whole string
 * on every keystroke.
 */
test('sets the value in tabular figures without an axis to ask for it', () => {
  assert.match(rule(`${ui}>[data-part-input]`), /font-variant-numeric:tabular-nums/);
});

/**
 * A formatted amount carries no strong character, so its run would take the
 * paragraph's direction and print the sign after the value in a right-to-left
 * document.
 */
test('orders the value by its own content rather than by the paragraph', () => {
  assert.match(rule(`${ui}>[data-part-input]`), /unicode-bidi:plaintext/);
});

/**
 * `plaintext` pins the run left-to-right, so a logical `text-align` would
 * resolve against the pinned run rather than against the document. Both
 * alignments therefore name a physical side, each under the direction that
 * makes it the right one.
 */
test('names a physical side for each alignment, under the direction guard', () => {
  assert.match(rule(`${ui}[data-align='end']>[data-part-input]`), /text-align:right/);
  assert.match(rule(`${ui}[data-align='end']:dir(rtl)>[data-part-input]`), /text-align:left/);
  assert.match(rule(`${ui}[data-align='start']>[data-part-input]`), /text-align:left/);
  assert.match(rule(`${ui}[data-align='start']:dir(rtl)>[data-part-input]`), /text-align:right/);
});

/**
 * Every step reads the control scales, which are the only ones the theme
 * restates per density, so an amount in a dense table shrinks whole rather than
 * in parts.
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
});

/** A transparent border has no system color to be remapped to. */
test('gives the plain variant an edge under forced colors', () => {
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(
    rule(`${root}[data-variant='plain']`),
    /border-color:transparent/,
    'the plain variant keeps its border at rest',
  );
});

test('recovers the split stepper hit area outside its paint', () => {
  for (const part of ['decrement', 'increment']) {
    assert.ok(
      normalized.includes(`${ui}[data-stepper='split']>[data-part-${part.toLowerCase()}]::after`),
      `the split ${part} button has no recovered hit area`,
    );
  }
  assert.match(
    rule(
      `${ui}[data-stepper='split']>[data-part-decrement]::after,${ui}[data-stepper='split']>[data-part-increment]::after`,
    ),
    /inset:min\(0px,calc\(\(100% - var\(--slotted-target-min,24px\)\) \/ 2\)\)/,
  );
});

/**
 * The column stands one step inside the frame's edge with no rule of its own,
 * and each half gives the inset back to the pointer up to the frame.
 */
test('insets a stacked stepper and returns the inset to the pointer', () => {
  assert.match(rule(`${root}[data-stepper='stacked']`), /padding-inline-end:0/);

  const column = rule(`${ui}>[data-part-stepper]`);
  assert.match(column, /padding-block:var\(--_column-inset\)/);
  assert.match(column, /padding-inline-end:var\(--_column-inset\)/);
  assert.doesNotMatch(column, /border/);

  assert.match(
    rule(`${ui}>[data-part-stepper]>[data-part-increment]::after`),
    /inset-block:calc\(var\(--_column-inset\) \* -1\) 0/,
  );
  assert.match(
    rule(`${ui}>[data-part-stepper]>[data-part-decrement]::after`),
    /inset-block:0 calc\(var\(--_column-inset\) \* -1\)/,
  );
});

test('splits the column into two concentric halves with no line between them', () => {
  const half = rule(`${ui}>[data-part-stepper]>button`);
  assert.match(half, /block-size:50%/);
  assert.match(half, /border-radius:var\(--_column-radius\)/);
  assert.doesNotMatch(declarations, /--slotted-currency-field-stepper-border-color/);
});

/** The split buttons are `text-field`'s inner controls: square, inset, concentric. */
test('insets the split buttons concentrically', () => {
  assert.match(rule(`${root}[data-stepper='split']`), /padding-inline:var\(--_inset\)/);
  const button = rule(
    `${ui}[data-stepper='split']>[data-part-decrement],${ui}[data-stepper='split']>[data-part-increment]`,
  );
  assert.match(button, /block-size:var\(--_action-size\)/);
  assert.match(button, /inline-size:var\(--_action-size\)/);
  assert.match(button, /border-radius:var\(--_action-radius\)/);
});

/**
 * The departure from the sibling family, and the reason it is deliberate: a
 * quantity is a token between a minus and a plus and reads centerd, while an
 * amount is a figure compared down a column and keeps its alignment.
 */
test('keeps the amount aligned between two split steppers rather than centering it', () => {
  assert.doesNotMatch(normalized, /text-align:center/);
  assert.match(
    rule(`${ui}[data-stepper='split']>[data-part-input]`),
    /padding-inline:var\(--_padding-inline\)/,
    'the digits sit at a different inset from every other arrangement',
  );
});

/**
 * A character is never an icon, and neither is a mask: the marks are the
 * `Glyph` element the binding renders. The stylesheet sizes the box and turns
 * the stacked increment's down chevron half a turn into the up one.
 */
test('sizes the stepper glyph element and paints none itself', () => {
  assert.doesNotMatch(declarations, /content:\s*'[^']+'/, 'a rule draws a character as an icon');
  assert.doesNotMatch(declarations, /mask-image/);
  assert.match(
    rule(`${ui} [data-part-decrement],${ui} [data-part-increment]`),
    /--slotted-icon-size:var\(--_icon-size\)/,
  );
  assert.match(
    rule(`${ui}[data-stepper='stacked'] [data-part-increment]>[data-ui-icon]`),
    /rotate:0\.5turn/,
  );
});

/**
 * Pointing one name at the invalid color on the element moves the frame's
 * outline, the shadow under it and both steppers' rings at once.
 */
test('retargets the ring rather than repainting every rule that draws it', () => {
  const invalid = rule(`${root}[data-invalid]`);
  assert.match(invalid, /--slotted-focus-ring-color:var\(/);
  assert.match(invalid, /--slotted-focus-ring-color-invalid/);
  assert.match(invalid, /border-color:var\(--slotted-currency-field-invalid-border-color/);
});

/**
 * A control can be disabled by something that never told it so: a disabled
 * `fieldset` disables every control inside it.
 */
test('paints a control disabled by an ancestor as well as by its own attribute', () => {
  assert.ok(
    normalized.includes(`${root}[data-disabled],${root}:has(>[data-part-input]:disabled){`),
    'the frame answers only its own attribute',
  );
  assert.match(
    rule(`${root}[data-disabled],${root}:has(>[data-part-input]:disabled)`),
    /box-shadow:none/,
  );
});

/** Read-only keeps its ink: the amount is real, focusable, copyable and submitted. */
test('separates read-only from disabled by ground rather than by ink', () => {
  const readonly = rule(`${root}[data-readonly]`);
  assert.match(readonly, /background-color:var\(--slotted-currency-field-readonly-background/);
  assert.doesNotMatch(readonly, /color:var\(--slotted-disabled-foreground/);
});

test('takes every duration from the motion scale', () => {
  assert.doesNotMatch(declarations, /(?<![\w-])\d+(?:\.\d+)?m?s(?![\w-])/);
  assert.match(rule(root), /var\(--slotted-control-transition-duration\)/);
});

/* ── The fragment is a third place the DOM is written, after React and Angular ── */

test('renders every part the contract declares in at least one scene', () => {
  for (const part of member.parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `no scene renders the ${part} part`);
  }
});

/**
 * `clamp` is a policy over the value, `formatOn` is a policy over when the text
 * is rewritten, and `currencyDisplay` is a formatting option. None of the three
 * reaches the DOM, and none can be photographed.
 */
test('renders every value of every axis that reaches the DOM', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    if (axis === 'clamp' || axis === 'formatOn' || axis === 'currencyDisplay') continue;
    for (const value of values) {
      assert.match(
        fragment,
        new RegExp(`data-${axis}="${value}"`),
        `no scene renders ${axis}="${value}"`,
      );
    }
  }
});

test('writes the split arrangement in the order it is painted', () => {
  const split = fragment
    .split('data-stepper="split"')
    .slice(1)
    .map((scene) => scene.split('</div>')[0] ?? '');
  assert.ok(split.length > 0, 'no scene renders the split arrangement');
  for (const scene of split) {
    assert.ok(
      scene.indexOf('data-part="decrement"') < scene.indexOf('data-part="input"'),
      'the split arrangement paints decrement first and reads it second',
    );
    assert.ok(
      scene.indexOf('data-part="increment"') > scene.indexOf('data-part="input"'),
      'the split arrangement paints increment last and reads it earlier',
    );
    assert.ok(!scene.includes('data-part="stepper"'), 'a split stepper needs no box to share');
  }
});

/** The APG's role, its whole value set, and the steppers kept out of the tab order. */
test('renders the sourced pattern rather than a picture of it', () => {
  assert.match(fragment, /role="spinbutton"/);
  for (const property of contract.ariaValue) {
    assert.ok(fragment.includes(property), `no scene renders ${property}`);
  }
  for (const button of fragment.match(/<button[\s\S]*?>/g) ?? []) {
    assert.match(button, /tabindex="-1"/, 'a stepper is in the tab order');
    assert.match(button, /aria-label="/, 'a stepper has no accessible name');
    assert.match(button, /type="button"/, 'a stepper would submit the form it sits in');
  }
});

test('renders every attribute state the contract declares', () => {
  for (const attribute of Object.values(contract.stateAttributes)) {
    assert.ok(fragment.includes(attribute), `no scene renders ${attribute}`);
  }
  assert.match(fragment, /<fieldset disabled/, 'no scene shows a control disabled by an ancestor');
  assert.match(fragment, /<button\b[^>]*\bdisabled\s*>/, 'no scene shows a stepper at its bound');
});

/**
 * The three things a currency field has to hold and a number field does not: a
 * currency with no cent, a currency with three, and an accounting negative.
 */
test('renders the amounts the family exists to hold', () => {
  assert.match(fragment, /JP¥/, 'no scene shows a currency with no cent');
  assert.match(fragment, /KWD 1\.480,500/, 'no scene shows a currency with three');
  assert.match(fragment, /\(\$1,234\.56\)/, 'no scene shows an accounting negative');
  assert.match(fragment, /Reais brasileiros/, 'no scene shows the currency written as a name');
});

/**
 * The sibling's drag mark, with one rule the sibling's single letters never
 * needed: the mark is a bidi run of its own, so `R$` stays `R$` in rtl.
 */
test('draws the scrub mark as a horizontal drag that keeps its own reading order', () => {
  const mark = rule(`${ui} [data-part-scrub]`);
  assert.match(mark, /cursor:ew-resize/);
  assert.match(mark, /touch-action:none/);
  assert.match(mark, /unicode-bidi:plaintext/);
  assert.match(mark, /user-select:none/);
  assert.match(
    rule(`${ui}:is([data-disabled],[data-readonly]) [data-part-scrub]`),
    /cursor:default/,
  );
});
