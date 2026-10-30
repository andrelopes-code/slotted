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
  readFileSync(new URL('../../../../specs/components/tag/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./tag.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./tag.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
/**
 * Whitespace is collapsed rather than removed: a descendant selector and a
 * multi-word value both lose their meaning when every space goes. Parentheses
 * are collapsed too, because the formatter breaks a long value across lines
 * and leaves `var( --token`, which no assertion here spells.
 */
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;

/** The declarations of the first rule whose selector starts with `selector`. */
function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
  assert.ok(!/\.slotted-/.test(css), 'a class name is not contract');
});

test('answers every value of every axis the contract names', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      /* `pill`, `soft` and `horizontal` are the base rule rather than an
         override, so the sheet answers them by not needing a selector. */
      if (['pill', 'soft', 'md', 'horizontal'].includes(value)) continue;
      assert.ok(normalized.includes(`[data-${axis}='${value}']`), `Missing ${axis} ${value}`);
    }
  }
});

test('routes every tone through the same local properties', () => {
  for (const tone of contract.axes.tone) {
    if (tone === 'secondary') continue;
    const declared = rule(`${root}[data-tone='${tone}']`);
    for (const local of [
      '--_solid:',
      '--_solid-hover:',
      '--_solid-active:',
      '--_on-solid:',
      '--_surface:',
      '--_subtle-hover:',
      '--_subtle-active:',
      '--_border:',
      '--_text:',
    ]) {
      assert.ok(declared.includes(local), `Tone ${tone} does not set ${local}`);
    }
  }
});

/**
 * A `button` cannot contain a `button` and an `a` cannot contain either, so
 * the chip that both acts and removes puts its two controls side by side. The
 * sheet has to agree: the root paints, the body holds the inset, and the
 * remove control is the body's sibling rather than its child.
 */
test('paints the chip on the root and the inset on the body', () => {
  assert.match(rule(root), /border-radius:var\(--_radius\)/);
  assert.match(rule(`${ui} [data-part-body]`), /padding-inline:/);
  assert.ok(
    !normalized.includes('[data-part-body] [data-part-remove]'),
    'the remove control is a sibling of the body, never a descendant of it',
  );
});

/**
 * `docs/token-foundation.md` names this family's remove control as the case a
 * theme cannot correct on the family's behalf, and says what corrects it: the
 * family expands the hit area. Both axes are asked about here, which is what
 * TG2 was — the width was floored at the minimum and the height was never
 * measured, so the control was 24 wide and 22 tall, stretched inside a 24px
 * border box between two 1px edges, and it failed SC 2.5.8 on the axis nobody
 * had looked at.
 *
 * So the chip is its own line box and the target is the control's own: the
 * width from the inner-control rule (R2), the glyph plus a step of air on each
 * side floored at the minimum, and the rest from a transparent halo that grows
 * the press area only where the box falls short. Flooring the chip is what the
 * family did before and it is not enough: a floor on the outside cannot reach
 * the content box inside it.
 */
/**
 * SL9. A host that collapses a row of chips writes `hidden` on the ones that
 * ran over, and `display: inline-flex` on the root beats the user agent's own
 * `[hidden] { display: none }` — author styles win over the user agent sheet.
 * Without this rule the collapse hid nothing: six chosen values drew six chips
 * and two of them ran under the controls that end a select.
 */
test('lets a host take a chip out of the picture with hidden', () => {
  assert.match(rule(`${root}[hidden]`), /display:none/);
});

test('gives the remove control its target on both axes', () => {
  assert.ok(
    !/--_block-size:max\(/.test(rule(root)),
    'the chip carries its own line box; the target is the control’s',
  );
  assert.match(
    rule(root),
    /--_own-size:calc\(var\(--_font-size\) \* var\(--_line-height\) \+ 2 \* var\(--_inset-block\) \+ 2 \* var\(--_edge-width\)\)/,
  );
  /* Inside a control the chip is the foundation's inner size, and its line and
     inset are derived from that height; alone, the derivations return its own. */
  assert.match(rule(root), /--_block-size:var\(--slotted-control-inner-size,var\(--_own-size\)\)/);
  assert.match(
    rule(root),
    /--_inset:max\(0px,calc\(\(var\(--_block-size\) - var\(--_line\) - 2 \* var\(--_edge-width\)\) \/ 2\)\)/,
  );
  assert.match(
    rule(`${ui} [data-part-remove]`),
    /inline-size:max\(var\(--slotted-target-min,24px\),min\(calc\(var\(--_icon-size\) \+ 2 \* var\(--slotted-space-2,0\.25rem\)\),var\(--_inner-size\)\)\)/,
  );
  assert.match(rule(`${ui} [data-part-remove]`), /position:relative/);
  const halo = rule(`${ui} [data-part-remove]::after`);
  assert.match(halo, /position:absolute/);
  assert.match(halo, /inset:min\(0px,calc\(\(100% - var\(--slotted-target-min,24px\)\) \/ 2\)\)/);
});

/**
 * The bindings render both marks as the `Glyph` element; the sheet sizes their
 * icon boxes and paints neither, and the fragment writes the markup they do.
 */
test('draws the remove glyph and the selection mark as Glyph elements', () => {
  assert.ok(!normalized.includes(`${ui} [data-part-remove]::before`));
  assert.ok(!/mask/.test(declarations), 'no mask stands in for a glyph');
  assert.match(rule(`${ui} [data-part-remove]`), /--slotted-icon-size:var\(--_icon-size\)/);
  assert.match(rule(`${ui} [data-part-indicator]`), /--slotted-icon-size:var\(--_icon-size\)/);
  assert.ok(!/content:'[^']+'/.test(normalized), 'a character is never an icon');
  const drawn = (part, glyph) =>
    new RegExp(
      `data-part="${part}"[^>]*>\\s*<span data-ui="icon" data-part="root" aria-hidden="true"\\s*>\\s*<svg data-part="glyph" data-glyph="${glyph}"`,
      'g',
    );
  for (const [part, glyph] of [
    ['remove', 'x'],
    ['indicator', 'check'],
  ]) {
    const written = (fragment.match(new RegExp(`data-part="${part}"`, 'g')) ?? []).length;
    assert.ok(written > 0, `no ${part} in the fragment`);
    assert.equal(
      (fragment.match(drawn(part, glyph)) ?? []).length,
      written,
      `${part} draws ${glyph}`,
    );
  }
});

/**
 * The one motion the family has, and the reason it has it: the words move to
 * make room for the mark, and an eye that cannot follow that reads the row as
 * having jumped.
 */
test('animates the selection mark arriving, from the motion scale', () => {
  const declared = rule(`${ui} [data-part-indicator]`);
  assert.match(declared, /transition:/);
  assert.match(declared, /inline-size var\(--slotted-duration-short\)/);
  assert.ok(!/\d+m?s/.test(declared.replace(/var\([^)]*\)/g, '')), 'a literal duration');
});

test('reacts to every state the contract declares, on the control that holds it', () => {
  for (const state of contract.members.tagToggle.states) {
    if (state === 'default') continue;
    const selector = { disabled: '[data-disabled]', selected: '[data-selected]' }[state];
    assert.ok(normalized.includes(selector ?? `:${state}`), `Missing state ${state}`);
  }
});

/**
 * Three variants, two mechanisms. `solid` and `outline` step along the tone's
 * own ramp; `soft` cannot, because the tinted ramp ends at `surface`, so its
 * step is a state layer over whatever ground the chip already has.
 */
test('gives a tinted chip a hover step the tone ramp does not carry', () => {
  assert.match(normalized, /--_state-hover:color-mix\(in oklab,currentColor/);
  assert.ok(
    normalized.includes("[data-variant='soft']:not([data-disabled]):not([data-selected])"),
    'the tinted step is not held back for the stronger states',
  );
});

/** `dashed` is the outline painting with its edge in dashes, until it is selected. */
test('draws a dashed tag as an outline whose edge is dashed', () => {
  assert.ok(normalized.includes(`${root}[data-variant='dashed']{background-color:transparent`));
  assert.ok(
    normalized.includes(`${root}[data-variant='dashed']:not([data-selected]){border-style:dashed;`),
  );
});

test('keeps a border under forced colours, where the tone is discarded', () => {
  assert.ok(
    normalized.includes(`@media (forced-colors:active){${root}{border-color:currentColor`),
    'a solid and an outline tag are otherwise indistinguishable',
  );
});

test('renders every declared part in the harness fragment', () => {
  const parts = new Set(Object.values(contract.members).flatMap((member) => member.parts));
  for (const part of parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `the fragment renders no ${part}`);
  }
});

test('exercises every declared state in the harness fragment', () => {
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.ok(fragment.includes(attribute), `the fragment never shows ${state}`);
  }
});

test('hands its glyph size to an icon placed in a slot', () => {
  // The icon family reads `--slotted-icon-size` from its container; a bare
  // glyph host reads the slot's font-size instead. Both are the slot's scale.
  const rule = normalized.split(`${ui} [data-part-end]{`)[1]?.split('}')[0] ?? '';
  assert.ok(rule.includes('--slotted-icon-size:var(--_icon-size)'));
  assert.ok(rule.includes('font-size:var(--_icon-size)'));
});
