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
    new URL('../../../../specs/components/radio-group/contract.json', import.meta.url),
    'utf8',
  ),
);
const checkboxCss = readFileSync(new URL('../checkbox/checkbox.css', import.meta.url), 'utf8');
const css = readFileSync(new URL('./radio-group.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./radio-group.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.radioGroup;

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

const part = (name) => `${ui} [data-part-${name.toLowerCase()}]`;

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
});

test('styles every part the contract declares', () => {
  for (const declared of member.parts) {
    if (declared === 'root') continue;
    assert.ok(
      normalized.includes(`[data-part-${declared.toLowerCase()}]`),
      `no rule reaches the ${declared} part`,
    );
  }
});

test('renders every part the contract declares, in at least one scene', () => {
  for (const declared of member.parts) {
    assert.match(
      fragment,
      new RegExp(`data-part="${declared}"`),
      `${declared} appears in no scene`,
    );
  }
});

/**
 * Every group in the fragment names its radios, because a `name` is what makes
 * the browser treat the set as one group: one tab stop, arrow keys that move
 * focus and selection together, and wrapping at both ends. A scene that forgot
 * it would photograph a set of unrelated radios that happen to look aligned.
 */
test('names every radio in every scene, which is what makes the set a group', () => {
  const radios = [...fragment.matchAll(/<input[^>]*type="radio"[^>]*>/g)].map(([tag]) => tag);
  assert.ok(radios.length > 0, 'the fragment renders no radio');
  for (const tag of radios) {
    assert.match(tag, /\sname="[^"]+"/, `a radio in the fragment has no name: ${tag}`);
  }
});

/** The dot is the control's next sibling, as the check is in `checkbox`. */
test('paints the dot from the control it stands on, through the sibling combinator', () => {
  assert.ok(normalized.includes(`${part('control')}:checked + [data-part-indicator]`));
});

test('draws the dot as the glyph element, never as a mask or a character', () => {
  assert.match(rule(part('indicator')), /--slotted-icon-size:var\(--_size\)/);
  assert.doesNotMatch(declarations, /mask-image/);
  /* An empty `content` materialises a box — the tile's edge, the stretched
     target — and is not a mark. What is refused is a character standing in for
     artwork, so the pattern is a string with something in it. */
  assert.doesNotMatch(declarations, /content:\s*['"][^'"]/);
});

/**
 * The circle is the one visual difference between the two families, and it is
 * one declaration. Everything else — the square it is drawn in, the lift onto
 * the first line, the target on the label — is the same decision, reached
 * through the same foundation tokens rather than through `checkbox`'s
 * selectors.
 */
test('differs from checkbox in the corner and in nothing else structural', () => {
  assert.match(rule(part('control')), /border-radius:var\(--slotted-radius-full,9999px\)/);
  assert.doesNotMatch(declarations, /data-ui=['"]checkbox['"]/);
  assert.match(checkboxCss, /--slotted-selection-size-md/);
  assert.match(
    rule(root),
    /--_size:var\(--slotted-radio-group-size,var\(--slotted-selection-size-md,16px\)\)/,
  );
});

/**
 * The circle is the selection scale's, fixed across densities, edged at the
 * medium step in the strong colour — the same decisions `checkbox` takes for
 * its square (CK5, CK3).
 */
test('takes its circle from the selection scale and edges it as checkbox does', () => {
  for (const [size, px] of [
    ['sm', '14px'],
    ['md', '16px'],
    ['lg', '18px'],
  ]) {
    assert.match(
      rule(`${root}[data-size='${size}']`),
      new RegExp(
        `--_size:var\\(--slotted-radio-group-size,var\\(--slotted-selection-size-${size},${px}\\)\\)`,
      ),
      `data-size="${size}" does not read the selection scale`,
    );
  }
  assert.doesNotMatch(declarations, /--slotted-control-icon-size-/);
  assert.match(
    rule(part('control')),
    /border:var\(--slotted-radio-group-border-width,var\(--slotted-border-width-medium,1\.5px\)\) solid var\(--slotted-radio-group-border-color,var\(--slotted-border-strong,ButtonBorder\)\)/,
  );
});

/**
 * Chosen is a dot of the accent's solid step on the surface, inside an edge of
 * the same colour: the ground does not fill (CK5). The dot fills the control's
 * own box — the glyph is authored at half its grid — so its centre is the
 * circle's centre at every step (CK4).
 */
test('says chosen with the edge and the dot, and leaves the ground alone', () => {
  const checked = rule(`${part('control')}:checked`);
  assert.match(
    checked,
    /border-color:var\(--slotted-radio-group-checked-border-color,var\(--slotted-tone-accent-solid\)\)/,
  );
  assert.doesNotMatch(checked, /background-color/);
  const indicator = rule(part('indicator'));
  assert.match(
    indicator,
    /color:var\(--slotted-radio-group-mark-color,var\(--slotted-tone-accent-solid\)\)/,
  );
  assert.match(indicator, /block-size:var\(--_size\)/);
  assert.match(indicator, /inline-size:var\(--_size\)/);
  assert.match(indicator, /scale:0\.6/);
  /* Invalid moves the dot with the edge. */
  assert.match(
    rule(`${root}[data-invalid] [data-part-control]:checked + [data-part-indicator]`),
    /color:var\(--slotted-radio-group-invalid-mark-color,var\(--slotted-tone-danger-solid\)\)/,
  );
});

/**
 * The halo, as `checkbox` draws it: a wash behind the circle and the label
 * together, standing half the gap off the circle and half as far again past
 * the text, lit by hover alone. Its corner is
 * the circle's radius plus that half, so a one-line wash is a pill whose ends
 * are concentric with the circle.
 */
test('lights the circle and its label as one wash, lit by hover alone', () => {
  const label = rule(`${root}:not([data-variant='tile']) [data-part-label]`);
  assert.match(label, /justify-self:start/);
  assert.match(label, /position:relative/);
  const halo = rule(`${root}:not([data-variant='tile']) [data-part-label]::after`);
  assert.match(
    halo,
    /background-color:var\(--slotted-radio-group-halo-color,var\(--slotted-tone-accent-text\)\)/,
  );
  assert.match(halo, /border-radius:calc\(var\(--_size\) \/ 2 \+ var\(--_halo-spread\)\)/);
  assert.match(halo, /inset-block:calc\(var\(--_lift\) - var\(--_halo-spread\)\)/);
  assert.match(halo, /inset-inline-end:calc\(-1\.5 \* var\(--_halo-spread\)\)/);
  assert.match(
    halo,
    /inset-inline-start:calc\(-1 \* \(var\(--_size\) \+ var\(--_label-gap\) \+ var\(--_halo-spread\)\)\)/,
  );
  assert.match(halo, /direction:var\(--_direction\)/);
  assert.doesNotMatch(halo, /box-shadow/);
  assert.match(
    rule(`${root}:not([data-variant='tile']) [data-part-label]:empty::after`),
    /inset-inline-end:calc\(var\(--_label-gap\) - var\(--_halo-spread\)\)/,
  );
  assert.match(halo, /opacity:0/);
  assert.match(halo, /z-index:-1/);
  assert.match(rule(root), /--_halo-spread:calc\(var\(--_label-gap\) \/ 2\)/);
  assert.doesNotMatch(normalized, /--slotted-selection-halo-size/);
  assert.match(rule(part('item')), /isolation:isolate/);
  assert.match(rule(part('item')), /position:relative/);
  assert.ok(
    normalized.includes(
      `${root}:not([data-readonly]) [data-part-control]:hover:not(:disabled) ~ [data-part-label]::after,${root}:not([data-readonly]) [data-part-control]:not(:disabled) ~ [data-part-label]:hover::after{opacity:var(--slotted-selection-halo-opacity,0.12);}`,
    ),
    'hover does not light the halo, or lights it from somewhere else',
  );
  const hover = rule(`${root}:not([data-readonly]) [data-part-control]:hover:not(:disabled)`);
  assert.match(
    hover,
    /border-color:var\(--slotted-radio-group-hover-border-color,var\(--slotted-tone-accent-border\)\)/,
  );
  assert.doesNotMatch(hover, /background-color/);
  assert.match(
    rule(`${root}[data-label-placement='start'] [data-part-label]`),
    /justify-self:stretch/,
  );
  assert.match(
    rule(`${root}[data-label-placement='start'] [data-part-label]::after`),
    /inset-inline-end:calc\(-1 \* \(var\(--_size\) \+ var\(--_label-gap\) \+ var\(--_halo-spread\)\)\);inset-inline-start:calc\(-1\.5 \* var\(--_halo-spread\)\)/,
  );
});

test('lifts the circle onto the first line of a label that wraps', () => {
  assert.match(
    rule(root),
    /--_lift:calc\(\(var\(--_font-size\) \* var\(--_line-height\) - var\(--_size\)\) \/ 2\)/,
  );
  assert.match(rule(part('control')), /margin-block-start:var\(--_lift\)/);
  assert.match(rule(part('indicator')), /margin-block-start:var\(--_lift\)/);
});

/**
 * The row is its line (CK3), as `checkbox` keeps it: no minimum and no slack
 * on the label, and the WCAG 2.2 target is the label's `::before` around
 * the circle.
 */
test('keeps the row at its line and hits the target around the circle', () => {
  const label = rule(part('label'));
  assert.doesNotMatch(label, /min-block-size/);
  assert.doesNotMatch(label, /padding-block/);
  assert.doesNotMatch(declarations, /--_label-slack/);
  assert.match(rule(root), /--_target:var\(--slotted-target-min,24px\)/);
  const target = rule(`${root}:not([data-variant='tile']) [data-part-label]::before`);
  assert.match(target, /block-size:var\(--_target\)/);
  assert.match(target, /inline-size:var\(--_target\)/);
  assert.match(
    target,
    /inset-block-start:calc\(var\(--_lift\) \+ var\(--_size\) - var\(--_target\)\)/,
  );
  assert.match(
    target,
    /inset-inline-start:calc\(\(var\(--_size\) - var\(--_target\)\) \/ 2 - var\(--_size\) - var\(--_label-gap\)\)/,
  );
  assert.match(
    rule(`${root}[data-label-placement='start'] [data-part-label]::before`),
    /inset-inline-end:calc\(-1 \* \(var\(--_size\) \+ var\(--_label-gap\)\)\);inset-inline-start:auto/,
  );
  assert.doesNotMatch(target, /box-shadow|opacity/);
  assert.match(target, /direction:var\(--_direction\)/);
  assert.ok(normalized.includes(`${root}{--_direction:ltr;}`));
  assert.ok(normalized.includes(`${root}:dir(rtl){--_direction:rtl;}`));
  assert.doesNotMatch(declarations, /overflow-clip-margin/);
});

/**
 * A row of choices that runs past its container is a row whose last option
 * nobody can see, and a set of options is not a scroll region.
 */
test('wraps a horizontal group rather than clipping or scrolling it', () => {
  const horizontal = rule(`${root}[data-orientation='horizontal']`);
  assert.match(horizontal, /flex-wrap:wrap/);
  assert.match(horizontal, /column-gap:calc\(var\(--_gap\) \* 2\)/);
});

test('answers every size the contract declares', () => {
  for (const size of contract.axes.size) {
    assert.ok(normalized.includes(`${root}[data-size='${size}']{`), `no rule answers ${size}`);
  }
});

test('swaps the two columns for the other placement', () => {
  assert.match(
    rule(`${root}[data-label-placement='start'] [data-part-item]`),
    /grid-template-columns:minmax\(0,1fr\) auto/,
  );
  assert.doesNotMatch(declarations, /margin-left|margin-right|padding-left|padding-right/);
});

test('holds hover and press back for disabled and for read-only', () => {
  for (const selector of normalized.split('}').map((block) => block.split('{')[0])) {
    if (selector.includes('@')) continue;
    if (!/:hover|:active/.test(selector)) continue;
    assert.ok(selector.includes(':not(:disabled)'), `${selector} answers a disabled control`);
    assert.ok(selector.includes(':not([data-readonly])'), `${selector} answers a read-only group`);
  }
});

/** The chosen option keeps its accent, because the value is real. */
test('does not paint read-only as if it were disabled', () => {
  const readonly = rule(`${root}[data-readonly] [data-part-control]:not(:checked)`);
  assert.match(readonly, /background-color:var\(--slotted-radio-group-readonly-background/);
  assert.doesNotMatch(readonly, /--slotted-disabled/);
});

test('answers the disabled element as well as the mirrored attribute', () => {
  assert.ok(
    normalized.includes(`${root}[data-disabled] [data-part-control],${part('control')}:disabled{`),
  );
});

/**
 * One disabled option inside an otherwise live group dims its own label, which
 * a group-level attribute cannot reach: the general sibling combinator is what
 * carries the element's own state across to the text beside it.
 */
test('dims the label of a single disabled option, not only of a disabled group', () => {
  assert.ok(normalized.includes(`${part('control')}:disabled ~ [data-part-label]`));
});

test('restates the pair forced colors would collapse', () => {
  assert.match(declarations, /@media \(forced-colors: active\)/);
  assert.ok(
    normalized.includes(
      `@media (forced-colors:active){${part('control')}{background-color:Field;border-color:FieldText;}`,
    ),
  );
  /* The dot is the accent on the field, so under forced colours it is
     Highlight on Field rather than HighlightText on Highlight. */
  assert.ok(
    normalized.includes(`${part('control')}:checked + [data-part-indicator]{color:Highlight;}`),
  );
});

test('transitions the two changes the eye has to follow, from the scale', () => {
  assert.match(
    rule(part('indicator')),
    /transition:opacity var\(--slotted-duration-medium\) var\(--slotted-control-transition-easing\),scale var\(--slotted-duration-medium\)/,
  );
  assert.match(
    rule(part('control')),
    /transition:background-color var\(--slotted-control-transition-duration\)/,
  );
  assert.doesNotMatch(declarations, /\d+m?s(?![\w-])/);
});

/**
 * The `high-contrast` scheme paints `--slotted-tone-danger-border` the same
 * black as every other border, so an invalid control told apart by colour alone
 * would be identical to a valid one in exactly the scheme that exists for
 * people who need the difference.
 */
/**
 * The theme maps the danger fill to `ButtonFace` under forced colours, and a
 * checked invalid option painted its edge and its dot in it: the dot vanished
 * into the field. The forced block restates the checked pair for an invalid
 * option too, the dot in `Highlight` and the wider edge in `CanvasText`.
 */
test('keeps a checked invalid option checked under forced colours', () => {
  const forced = normalized.slice(normalized.lastIndexOf('@media (forced-colors:active)'));
  const control = `${root}[data-invalid] [data-part-control]`;
  assert.ok(
    forced.includes(`${control}:checked{background-color:Field;border-color:CanvasText;}`),
    forced,
  );
  assert.ok(
    forced.includes(`${control}:checked + [data-part-indicator]{color:Highlight;}`),
    forced,
  );
  assert.match(forced, /\[data-variant='tile'\]\[data-invalid\][^{]*\{--_tile-edge:CanvasText;/);
});

/**
 * The edge thickens by `--slotted-control-invalid-edge-width`, the width every
 * invalid control adds (WCAG 1.4.1), as a border so forced colours keep it. A
 * tile adds the same width to whatever its state draws, so a chosen invalid
 * tile is still wider than a chosen valid one.
 */
test('says invalid with weight as well as with colour', () => {
  const invalid = rule(`${root}[data-invalid] [data-part-control]`);
  assert.match(
    invalid,
    /border-width:calc\(var\(--slotted-radio-group-border-width,var\(--slotted-border-width-medium,1\.5px\)\) \+ var\(--slotted-radio-group-invalid-edge-width,var\(--slotted-control-invalid-edge-width,1px\)\)\)/,
  );
  assert.match(
    rule(`${root}[data-variant='tile'][data-invalid] [data-part-item]`),
    /--_tile-invalid-edge:var\(--slotted-radio-group-invalid-edge-width,var\(--slotted-control-invalid-edge-width,1px\)\)/,
  );
  assert.doesNotMatch(
    rule(`${root}[data-variant='tile'][data-invalid] [data-part-item]`),
    /--_tile-edge-width:/,
    'invalid replaces the width instead of adding to it',
  );
  assert.match(
    rule(`${root}[data-variant='tile'] [data-part-item]::before`),
    /border:calc\(var\(--_tile-edge-width\) \+ var\(--_tile-invalid-edge,0px\)\) solid var\(--_tile-edge\)/,
  );
  assert.match(invalid, /border-color:var\(--slotted-radio-group-invalid-border-color/);
});

/**
 * A choice with a description is two rows tall. At one control gap the second
 * row sat as near the next label as its own, so proximity named the wrong
 * owner. The distance doubles exactly where the second row exists, and the
 * public override still wins.
 */
test('separates two described choices by twice the distance it separates bare ones', () => {
  const described = rule(`${root}:has([data-part-description])`);
  assert.match(described, /row-gap:var\(--slotted-radio-group-gap,calc\(var\(--_gap\) \* 2\)\)/);
  assert.match(rule(root), /gap:var\(--slotted-radio-group-gap,var\(--_gap\)\)/);
});

/**
 * The distance from a label to its description is one number in both variants.
 * The label's slack supplies part of it in the plain variant and none of it in
 * a tile, so the padding is the remainder rather than a second decision.
 */
test('puts a description one step from its label, and one step nearer inside a tile', () => {
  assert.match(rule(root), /--_description-gap:var\(--slotted-space-3,0\.375rem\)/);
  assert.match(rule(part('description')), /padding-block-start:var\(--_description-gap\)/);
  assert.match(
    rule(`${root}[data-variant='tile'] [data-part-item]`),
    /--_description-gap:var\(--slotted-radio-group-tile-description-gap,var\(--slotted-space-2,0\.25rem\)\)/,
  );
});

/**
 * Stretched — a dialog body filling a phone's height — the rows shared the
 * surplus and the description drifted from the label it belongs to.
 */
test('never distributes surplus height between its rows', () => {
  assert.match(declarations, /align-content:\s*start/);
});
