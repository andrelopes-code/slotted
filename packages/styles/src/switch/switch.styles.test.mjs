import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { STATE_PRECEDENCE } from '../../../../specs/contract.schema.mjs';

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
    new URL('../../../../specs/components/switch/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./switch.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./switch.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.switch;

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

test('renders every part in at least one harness scene', () => {
  for (const part of member.parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `no scene renders the ${part} part`);
  }
});

/**
 * The control keeps everything that makes it a control and gives up every
 * pixel of its own appearance. It is transparent rather than clipped away,
 * because a control removed from the layout takes its hit area with it — and
 * this one *is* the hit area.
 */
test('leaves the control invisible, operable and over the pill it answers', () => {
  const control = rule(`${ui}>[data-part-control]`);
  assert.match(control, /appearance:none/);
  assert.match(control, /opacity:0/);
  assert.match(control, /grid-area:1 \/ 1/);
  assert.match(control, /inline-size:var\(--_track-inline\)/);
  assert.match(control, /cursor:pointer/);
  /* The track shares the cell and comes later in the DOM, so without this it
     paints over the control and swallows every press on the pill. */
  assert.match(control, /z-index:1/);
  assert.match(rule(`${ui}>[data-part-track]`), /pointer-events:none/);
  assert.doesNotMatch(control, /display:none|visibility:hidden/);
});

/**
 * The pill is 22 pixels tall at `md` and less at the tighter densities, so the
 * WCAG 2.2 minimum is recovered on the box the control covers. Neither the
 * theme nor the track can do it: the theme does not know the family's
 * geometry, and the track is the paint.
 *
 * SW2: it is recovered there and nowhere else. The row and the label carried
 * the same minimum as well, which made a one-line Switch row 28.5 pixels
 * against the 19.5 of the Checkbox beside it in the same form — a target paid
 * for three times over, and CK3 had already taken that model out of `checkbox`
 * and `radio-group`. The control keeps it and gives its own overhang back
 * through two negative margins, so what it presses is 24 and what it
 * contributes to the row is the pill.
 */
test('holds the target minimum on the control alone', () => {
  const control = rule(`${ui}>[data-part-control]`);
  assert.match(control, /block-size:var\(--_target-block\)/);
  assert.match(
    rule(root),
    /--_target-block:max\(var\(--_track-block\),var\(--slotted-target-min,24px\)\)/,
  );
  assert.match(
    control,
    /margin-block-end:calc\(\(var\(--_track-block\) - var\(--_target-block\)\) \/ 2\)/,
  );
  assert.match(
    control,
    /margin-block-start:calc\(var\(--_lift\) \+ \(var\(--_track-block\) - var\(--_target-block\)\) \/ 2\)/,
  );
  for (const part of [root, `${ui}>[data-part-label]`]) {
    assert.doesNotMatch(
      rule(part),
      /min-block-size:var\(--slotted-target-min,24px\)/,
      'the row is the pill and the label, never the target',
    );
  }
  /* The label's padding is optical now: it centres the words on the pill. */
  assert.match(rule(`${ui}>[data-part-label]`), /padding-block:var\(--_label-slack\)/);
  assert.match(
    rule(root),
    /--_label-slack:max\(0px,\(var\(--_track-block\) - var\(--_font-size\) \* var\(--_line-height\)\) \/ 2\)/,
  );
});

/**
 * Every measurement is a proportion of the control glyph scale, which is one
 * of the three the theme restates per density. A second scale here would be a
 * family deciding on its own what a dense table means.
 */
test('derives its geometry from the control scales', () => {
  const base = rule(root);
  assert.match(base, /--_thumb-size:var\(--slotted-control-icon-size-md/);
  assert.match(base, /--_gutter:var\(--slotted-space-1/);
  assert.match(base, /--_track-block:calc\(var\(--_thumb-size\)/);
  assert.match(base, /--_travel:calc\(var\(--_thumb-size\) \+ var\(--_gutter\)\)/);
  for (const size of contract.axes.size) {
    assert.ok(
      normalized.includes(`${root}[data-size='${size}']{`),
      `the ${size} step sets nothing`,
    );
  }
});

/**
 * The travel is the whole of the family's motion, and it is written on the
 * inline axis so a right-to-left document mirrors it with no second rule. A
 * physical translation would need a `[dir]` selector, which is the defect
 * `packages/styles/src/logical.test.mjs` exists to prevent one step earlier.
 */
test('moves the thumb along the writing direction, through the motion scale', () => {
  const thumb = rule(`${ui}>[data-part-track]>[data-part-thumb]`);
  assert.match(thumb, /inset-inline-start:var\(--_gutter\)/);
  assert.match(thumb, /transition:inset-inline-start var\(--slotted-control-transition-duration\)/);
  assert.doesNotMatch(normalized, /translate:[^;]*var\(--_travel\)/);
  assert.doesNotMatch(normalized, /\[dir=/);
  assert.match(
    normalized,
    /inset-inline-start:calc\(var\(--_gutter\) \+ var\(--_travel\)\)/,
    'the checked thumb does not travel',
  );
});

/**
 * `docs/component-features.md` asks for the state to be perceptible beyond
 * colour *and* beyond position. The mark is what supplies it, and it is real
 * geometry from the theme's glyph scale rather than a character.
 */
test('draws the mark as the glyph element, never as a mask or a character', () => {
  const mark = rule(`${ui}>[data-part-track]>[data-part-thumb]>[data-ui-icon]`);
  assert.match(mark, /block-size:70%/);
  assert.match(mark, /inline-size:70%/);
  assert.match(mark, /color:var\(--slotted-switch-mark-color,var\(--slotted-tone-accent-solid\)\)/);
  assert.doesNotMatch(declarations, /mask-image/);
  assert.doesNotMatch(declarations, /content:'[^']+'/, 'a character is never an icon');
});

/**
 * The anatomy `checkbox` settled one item earlier in the same wave, down to
 * the numbers: two binary controls in one list have to line up, and the way to
 * guarantee that is to derive both from the same places — the grid, the column
 * the label sits in, and the row the description takes under it.
 */
test('lays the label beside the pill and the description under the label', () => {
  assert.match(rule(root), /grid-template-columns:auto minmax\(0,1fr\)/);
  const label = rule(`${ui}>[data-part-label]`);
  assert.match(label, /grid-column:2/);
  assert.match(label, /grid-row:1/);
  assert.match(label, /overflow-wrap:anywhere/);
  const description = rule(`${ui}>[data-part-description]`);
  assert.match(description, /grid-column:2/);
  assert.match(description, /grid-row:2/);
  assert.match(description, /padding-block-start:var\(--_description-gap\)/);
});

/**
 * The gap between the pill and the text is the grid's column gap, opened only
 * when a label stands beside the pill. It was the label's inline-start
 * padding, and a padding is laid out in the label's own direction: a label in
 * Arabic inside a row in Portuguese took the gap on its far side and set its
 * text against the pill. The padding was also what made the gap toggle the
 * setting, so the control takes that job over: it grows by the gap towards the
 * text and gives the growth back as a negative margin, the pattern it already
 * uses for its block overhang, so the row is no wider and the gap still
 * presses the switch.
 */
test('opens the gap on the grid and keeps it pressable in both arrangements', () => {
  assert.match(rule(`${root}:has(>[data-part-label])`), /column-gap:var\(--_gap\)/);
  for (const selector of [
    `${ui}>[data-part-label]`,
    `${ui}>[data-part-description]`,
    `${root}[data-label-placement='start']>[data-part-label],${root}[data-label-placement='start']>[data-part-description]`,
  ]) {
    assert.doesNotMatch(rule(selector), /padding-inline/, `${selector} pads the gap again`);
  }
  /* Beside the pill the label hugs its words; before it, it takes the row. */
  assert.ok(normalized.includes(`${ui}>[data-part-label]{justify-self:start;}`));
  assert.match(
    rule(`${root}[data-label-placement='start']>[data-part-label]`),
    /justify-self:stretch/,
  );
  const reach = rule(`${root}:has(>[data-part-label])>[data-part-control]`);
  assert.match(reach, /inline-size:calc\(var\(--_track-inline\) \+ var\(--_gap\)\)/);
  assert.match(reach, /margin-inline-end:calc\(-1 \* var\(--_gap\)\)/);
  assert.match(
    rule(`${root}[data-label-placement='start']:has(>[data-part-label])>[data-part-control]`),
    /margin-inline-end:0;margin-inline-start:calc\(-1 \* var\(--_gap\)\)/,
  );
});

/**
 * The pill at the end of the row, which is the settings row every product
 * writes. `1fr` on the label's column rather than `max-content`, so a list of
 * rows ends with every control at the same distance from the edge.
 */
test('swaps the two columns for the label-first arrangement', () => {
  assert.match(
    rule(`${root}[data-label-placement='start']`),
    /grid-template-columns:minmax\(0,1fr\) auto/,
  );
  assert.ok(
    normalized.includes(
      `${root}[data-label-placement='start']>[data-part-control],${root}[data-label-placement='start']>[data-part-track]{grid-area:1 / 2;}`,
    ),
    'the control does not move to the second column',
  );
});

/**
 * The ring belongs to the track, because the track is the switch a reader
 * sees, and it answers the transparent control over it.
 */
test('draws one ring, on the part a reader can see', () => {
  const focus = rule(`${root}:has(>[data-part-control]:focus-visible)>[data-part-track]`);
  assert.match(focus, /outline:var\(--slotted-focus-ring-width,2px\) solid/);
  assert.match(focus, /outline-offset:var\(--slotted-focus-ring-offset,2px\)/);
  assert.match(rule(`${ui}>[data-part-control]`), /outline:none/);
});

/**
 * The ring is retargeted rather than repainted: every rule that draws focus
 * reads `--slotted-focus-ring-color`, so pointing that one name at the invalid
 * colour on the root moves the ring without restating it.
 */
test('retargets the ring for the invalid state instead of repainting it', () => {
  const invalid = rule(`${root}[data-invalid]`);
  assert.match(invalid, /--slotted-focus-ring-color:var\(/);
  assert.match(invalid, /--slotted-focus-ring-color-invalid/);
});

/**
 * A control can be disabled by something that never told it so: a disabled
 * `fieldset` disables every control inside it. Left to the mirrored attribute
 * alone, such a switch looked fully operable and answered nothing — the defect
 * the deleted `input` family recorded and no rebuild may reintroduce.
 */
test('answers the element as well as the attribute for every shared state', () => {
  for (const state of ['checked', 'disabled']) {
    const pseudo = state === 'checked' ? ':checked' : ':disabled';
    assert.ok(
      normalized.includes(`:has(>[data-part-control]${pseudo})`),
      `${state} is read from the attribute alone`,
    );
  }
  assert.match(fragment, /<fieldset disabled>/, 'no scene renders a disabled fieldset');
});

/**
 * A weaker state holds itself back for every stronger one, in the order
 * `STATE_PRECEDENCE` declares. Hover and press are held back by the guard the
 * shared test enforces; the mark is held back for `loading`, which the shared
 * test cannot see because neither state is a pseudo-class.
 */
test('holds the mark back for the state that outranks it', () => {
  assert.ok(
    STATE_PRECEDENCE.indexOf('loading') < STATE_PRECEDENCE.indexOf('checked'),
    'the precedence this rule depends on has moved',
  );
  assert.ok(
    normalized.includes(
      `${root}:is([data-checked],:has(>[data-part-control]:checked)):not([data-loading])>[data-part-track]>[data-part-thumb]>[data-ui-icon]{opacity:1;}`,
    ),
    'a loading switch still shows the mark it is not sure about',
  );
});

/**
 * Read-only outranks checked, so it takes the ground back from it. Its edge
 * stays neutral: drawn in the accent colour, the border and the focus ring
 * were the same blue two pixels apart and neither could be told from the other.
 */
test('paints read-only as hollow rather than as grey, in both states', () => {
  assert.ok(
    STATE_PRECEDENCE.indexOf('readonly') < STATE_PRECEDENCE.indexOf('checked'),
    'the precedence this rule depends on has moved',
  );
  const readonlyChecked = rule(
    `${root}[data-readonly]:is([data-checked],:has(>[data-part-control]:checked))>[data-part-track]`,
  );
  assert.match(readonlyChecked, /background-color:var\(--slotted-switch-readonly-background/);
  assert.match(readonlyChecked, /--slotted-control-border-color/);
  assert.doesNotMatch(readonlyChecked, /--slotted-disabled-/, 'read-only looks disabled');
});

/**
 * The pending arc is the one thing in the family that loops, and an animation
 * that repeats forever has to stop under reduced motion rather than hurry.
 * The geometry does not change while it runs: a control that resizes while it
 * saves moves the row under the pointer.
 */
test('stops the pending arc under reduced motion, and never resizes while it runs', () => {
  const arc = rule(`${root}[data-loading]>[data-part-track]>[data-part-thumb]::after`);
  assert.match(arc, /animation:slotted-switch-pending var\(--slotted-duration-loop\)/);
  assert.match(arc, /infinite/);
  assert.doesNotMatch(arc, /inline-size|block-size/, 'the arc changes the thumb’s box');
  const reduced = normalized.slice(normalized.indexOf('@media (prefers-reduced-motion:reduce)'));
  assert.match(reduced, /animation:none/);
});

test('takes every duration and easing from the motion scale', () => {
  assert.doesNotMatch(declarations, /(?<![\w-])\d+(?:\.\d+)?m?s(?![\w-])/);
});

/**
 * Stretched — a dialog body filling a phone's height — the rows shared the
 * surplus and the description drifted from the label it belongs to.
 */
test('never distributes surplus height between its rows', () => {
  assert.match(declarations, /align-content:\s*start/);
});
