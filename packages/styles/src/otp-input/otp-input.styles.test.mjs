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
    new URL('../../../../specs/components/otp-input/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./otp-input.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./otp-input.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.otpInput;

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
 * The control lies over the boxes and paints nothing: not its text, not its
 * caret, not its selection, not a ground or an edge or a ring. `opacity` is
 * left at 1 on purpose — iOS shows no paste menu on an invisible control —
 * so everything it would paint is made transparent one property at a time.
 */
test('lays the control over the boxes and makes everything it paints transparent', () => {
  const input = rule(`${ui}>[data-part-input]`);
  assert.match(input, /position:absolute/);
  assert.match(input, /inset:0/);
  assert.match(input, /color:transparent/);
  assert.match(input, /caret-color:transparent/);
  assert.match(input, /background-color:transparent/);
  assert.match(input, /border:0/);
  assert.match(input, /outline:none/);
  assert.match(input, /z-index:1/);
  assert.doesNotMatch(input, /opacity:0/, 'an invisible control loses the iOS paste menu');
  /* Important, so a page's own unlayered `::selection` cannot paint the
     selected character in its ink beside the boxes. */
  const selection = rule(`${ui}>[data-part-input]::selection`);
  assert.match(selection, /background-color:transparent !important/);
  assert.match(selection, /color:transparent !important/);
  assert.match(selection, /-webkit-text-fill-color:transparent !important/);
  assert.match(normalized, /\[data-part-input\]\{-webkit-user-drag:none/);
});

/**
 * A code is a number and a number does not mirror: the row is left-to-right
 * in both directions, and it is as wide as its boxes so a right-to-left field
 * still places it at the line's start.
 */
test('keeps the row left-to-right and no wider than its boxes', () => {
  const frame = rule(root);
  assert.match(frame, /direction:ltr/);
  assert.match(frame, /inline-size:fit-content/);
  assert.match(frame, /max-inline-size:100%/);
});

/**
 * A box is a square on the control height, framed like a text field with the
 * same tokens, and it shrinks before the row overflows.
 */
test('draws each box as a framed square on the control height that can shrink', () => {
  const slot = rule(`${ui} [data-part-slot]`);
  assert.match(slot, /block-size:var\(--_height\)/);
  assert.match(slot, /inline-size:var\(--_height\)/);
  assert.match(slot, /flex:0 1 auto/);
  assert.match(slot, /min-inline-size:calc\(var\(--_height\) \* 0\.6\)/);
  assert.match(slot, /border:var\(--slotted-control-border-width,1px\) solid/);
  assert.match(slot, /var\(--slotted-control-border-color,ButtonBorder\)/);
  for (const size of contract.axes.size) {
    assert.match(
      rule(`${root}[data-size='${size}']`),
      new RegExp(`--_height:var\\(--slotted-control-height-${size}`),
    );
  }
});

/** The placeholder is paint on an empty box, so `:empty` keeps reading the DOM. */
test('paints the placeholder as a pseudo-element on an empty box', () => {
  assert.match(rule(`${ui} [data-part-slot]:empty::before`), /content:attr\(data-placeholder\)/);
});

/**
 * The caret is drawn only where the cursor is, only while the control has
 * focus, and only in an empty box — a filled current box is a selection. It
 * blinks on the loop scale and stands still under reduced motion.
 */
test('draws a caret in the current empty box and stops it under reduced motion', () => {
  const caret = rule(
    `${root}:has(>[data-part-input]:focus) [data-part-slot][data-current]:empty::after`,
  );
  assert.match(caret, /animation:slotted-otp-input-blink var\(--slotted-duration-loop\)/);
  assert.match(caret, /background-color:currentcolor/);
  assert.match(caret, /inline-size:var\(--_caret-width\)/);
  assert.match(normalized, /@media \(prefers-reduced-motion:reduce\)\{[^}]*animation:none/);
});

/**
 * The ring belongs to the current box and answers the control's focus. Its
 * colour is retargeted under `[data-invalid]` rather than repainted, the rule
 * every field family inherits from `text-field`.
 */
test('rings the current box in the theme colour and retargets it when invalid', () => {
  const ring = rule(`${root}:has(>[data-part-input]:focus-visible) [data-part-slot][data-current]`);
  assert.match(
    ring,
    /outline:var\(--slotted-focus-ring-width,2px\) solid var\(--slotted-focus-ring-color,Highlight\)/,
  );
  assert.match(
    ring,
    /box-shadow:var\(--slotted-control-shadow-focus-geometry,0 1px 4px -1px\) var\(--slotted-focus-ring-color,Highlight\)/,
  );
  assert.match(
    rule(`${root}[data-invalid]`),
    /--slotted-focus-ring-color:var\(--slotted-otp-input-invalid-focus-ring-color,var\(--slotted-focus-ring-color-invalid,Highlight\)\)/,
  );
});

/**
 * Invalid outranks the current box's accent edge, and disabled is matched on
 * the control as well as on the root, because a disabled `fieldset` disables
 * a control that was never told so.
 */
test('holds the current edge back for invalid and reads disabled from the control too', () => {
  assert.ok(
    normalized.includes(
      `${root}:not([data-invalid]):has(>[data-part-input]:focus) [data-part-slot][data-current]{`,
    ),
  );
  assert.ok(normalized.includes(`${root}:has(>[data-part-input]:disabled) [data-part-slot]{`));
});

/** The transparent control stays transparent when the system owns the palette. */
test('keeps the control invisible under forced colours', () => {
  assert.match(
    normalized,
    /@media \(forced-colors:active\)\{\[data-ui-otp-input\]>\[data-part-input\]\{forced-color-adjust:none/,
  );
});

test('exercises every part and every mirrored state in the harness', () => {
  for (const part of member.parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `the harness never renders ${part}`);
  }
  for (const attribute of Object.values(contract.stateAttributes)) {
    assert.ok(fragment.includes(attribute), `the harness never shows ${attribute}`);
  }
  assert.ok(fragment.includes('data-attached'));
  assert.ok(fragment.includes('data-mask'));
  assert.ok(fragment.includes('data-placeholder='));
  assert.ok(fragment.includes('<fieldset disabled'));
});
