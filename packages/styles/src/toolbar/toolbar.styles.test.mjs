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
    new URL('../../../../specs/components/toolbar/contract.json', import.meta.url),
    'utf8',
  ),
);
const buttonGroupCss = readFileSync(
  new URL('../button-group/button-group.css', import.meta.url),
  'utf8',
);
const css = readFileSync(new URL('./toolbar.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./toolbar.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.toolbar;
const part = (name) => `${ui} [data-part-${name.toLowerCase()}]`;

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
 * The bar is a container for controls it does not own, so every scene holds
 * real controls from other families. A scene of empty divs would photograph a
 * box with a gap in it.
 */
test('holds real controls in every scene, and writes the roving tabindex it applies', () => {
  const bars = [...fragment.matchAll(/role="toolbar"/g)];
  assert.ok(bars.length >= 3, 'the fragment renders too few bars to judge');
  assert.match(fragment, /data-ui="button"/);
  assert.match(fragment, /data-ui="checkbox"/);
  assert.match(fragment, /data-ui="text-field"/);
  const stops = [...fragment.matchAll(/tabindex="0"/g)];
  assert.equal(stops.length, bars.length, 'each bar holds exactly one tab stop');
});

test('writes the pattern roles in the markup, on the parts that carry them', () => {
  assert.match(fragment, /role="toolbar"/);
  assert.match(fragment, /role="group"/);
  assert.match(fragment, /role="separator"/);
  const separators = [...fragment.matchAll(/<div data-part="separator"[^>]*>/g)].map(([t]) => t);
  for (const tag of separators) {
    assert.match(tag, /aria-orientation="(vertical|horizontal)"/, `${tag} states no orientation`);
  }
});

/** `md` is the base rule rather than a rule of its own. */
test('answers every size the contract declares from the control scales', () => {
  for (const size of contract.axes.size.filter((step) => step !== 'md')) {
    assert.ok(normalized.includes(`${ui}[data-size='${size}']{`), `no rule answers ${size}`);
  }
  assert.ok(!normalized.includes(`${ui}[data-size='md']{`), 'md is the base, not a second rule');
  assert.match(rule(ui), /--_gap:var\(--slotted-control-gap-md/);
  assert.match(rule(`${ui}[data-size='sm']`), /--_gap:var\(--slotted-control-gap-sm/);
  assert.match(rule(`${ui}[data-size='lg']`), /--_gap:var\(--slotted-control-gap-lg/);
});

/**
 * The bar sizes its own rhythm and nothing inside it. A family that resized
 * another family's control would own state it cannot see, which is what
 * Fluent's context-driven size does.
 */
test('sizes the bar and never the controls in it', () => {
  assert.doesNotMatch(declarations, /\[data-ui-button\]/);
  for (const line of declarations.split('}')) {
    if (!line.includes('font-size')) continue;
    assert.ok(
      line.includes('[data-part-overflow]') || line.includes('--_font-size:'),
      'a type step is set on something other than the one control this family draws',
    );
  }
  assert.match(rule(ui), /padding:var\(--slotted-toolbar-inset,var\(--_pad\)\)/);
});

/**
 * Three families arrange controls in a row, and each owns one question. This
 * one owns the keyboard, so it declares no gap, alignment or joining axis;
 * `button-group` owns the joined bar and where it sits on the line.
 */
test('leaves the shape of a run of actions to the family that owns it', () => {
  assert.doesNotMatch(declarations, /\[data-gap=/);
  assert.doesNotMatch(declarations, /\[data-justify=/);
  assert.doesNotMatch(declarations, /\[data-attached\]/);
  assert.match(buttonGroupCss, /\[data-justify='end'\]/);
});

test('answers every axis value the contract declares', () => {
  assert.ok(normalized.includes(`${ui}[data-orientation='vertical']{`));
  assert.ok(normalized.includes(`${ui}[data-variant='outline']{`));
  assert.ok(normalized.includes(`${ui}:is([data-overflow='scroll'],[data-overflow='menu']){`));
});

/**
 * A bar that scrolls must scroll past its controls rather than squeeze them: a
 * flex item narrower than its content is what the browser prefers, and a row of
 * squeezed buttons is not a row that scrolls.
 */
test('scrolls past its controls instead of shrinking them', () => {
  const oneLine = rule(`${ui}:is([data-overflow='scroll'],[data-overflow='menu'])`);
  assert.match(oneLine, /flex-wrap:nowrap/);
  assert.match(oneLine, /overflow-x:auto/);
  assert.match(rule(`${ui}:is([data-overflow='scroll'],[data-overflow='menu'])>*`), /flex:none/);
  assert.match(rule(ui), /flex-wrap:wrap/);
});

/**
 * The boundary a group draws and the boundary a rule draws are the same
 * distance, and both derive from the bar's own gap: a fixed nested distance
 * puts the clusters of a loosely spaced bar closer together than the controls
 * inside them.
 */
test('separates a group by more than it separates the controls inside it', () => {
  assert.match(rule(part('group')), /gap:calc\(var\(--_gap\) \/ 2\)/);
  assert.match(
    rule(`${part('group')}:not(:first-child)`),
    /margin-inline-start:calc\(var\(--_gap\) \/ 2\)/,
  );
  assert.match(rule(part('separator')), /margin-inline:calc\(var\(--_gap\) \/ 2\)/);
});

/**
 * A rule that runs the full height of the controls beside it reads as the edge
 * of a box that is not there, so it stops a step short at each end.
 */
test('draws the rule one hairline wide and short of the controls at each end', () => {
  const separator = rule(part('separator'));
  assert.match(separator, /inline-size:var\(--slotted-border-width-thin,1px\)/);
  assert.match(separator, /margin-block:var\(--_separator-inset\)/);
  assert.match(separator, /background-color:var\(--slotted-toolbar-separator-color/);
});

/**
 * Forced colours flatten a background to `Canvas`, and the separator is a
 * background rather than a border, so keeping the paint is the only way the
 * boundary is still there to read.
 */
test('keeps the rule visible when the system replaces the palette', () => {
  assert.match(declarations, /@media \(forced-colors: active\)/);
  assert.ok(
    normalized.includes(
      `@media (forced-colors:active){${part('separator')}{background-color:CanvasText;forced-color-adjust:none;}`,
    ),
  );
});

/**
 * A flex container assigns items to lines at their base size and grows them
 * afterwards, so a spacer with a zero basis moves what follows to the end of
 * its own line and pushes nothing onto the next one.
 */
test('pushes a run to the end without deciding where every control sits', () => {
  assert.match(rule(part('spacer')), /flex:1 1 0/);
  assert.doesNotMatch(rule(ui), /justify-content/);
  assert.doesNotMatch(rule(part('group')), /justify-content/);
});

/**
 * A bar built from a permission filter renders empty often, and an empty box
 * still consumes the gap of the row that holds it.
 */
test('takes no room when it holds nothing', () => {
  assert.match(rule(`${ui}:empty`), /display:none/);
});

/**
 * Every state of a control in a bar belongs to that control, and the family
 * paints none of them: no rule here reaches a `[data-ui]` other than its own,
 * and none writes the `data-disabled` a `button` sets on itself.
 *
 * The one exception is the one control the family draws: the overflow trigger
 * is this family's own `button`, so its states are this family's to paint, and
 * the contract declares each of them.
 */
test('paints only the states of the one control it draws itself', () => {
  assert.deepEqual(member.states, ['default', 'hover', 'active', 'focus-visible', 'open']);
  assert.doesNotMatch(declarations, /\[data-disabled\]/);

  for (const state of [':hover', ':active', ':focus-visible', ':disabled', '[data-open]']) {
    for (const line of declarations.split('}')) {
      if (!line.includes(state)) continue;
      assert.match(
        line,
        /\[data-part-overflow\]/,
        `${state} is painted on something other than the control this family draws`,
      );
    }
  }
});

/** A weaker state holds itself back for the stronger ones. */
test('holds hover and press back for a trigger the platform disabled', () => {
  assert.ok(normalized.includes(`${part('overflow')}:not(:disabled):hover{`));
  assert.ok(normalized.includes(`${part('overflow')}:not(:disabled):active{`));
});

test('writes every rule in logical properties, and takes no duration at all', () => {
  assert.doesNotMatch(declarations, /margin-left|margin-right|padding-left|padding-right/);
  assert.doesNotMatch(declarations, /\d+m?s(?![\w-])/);
});

/**
 * The overflow trigger is as tall as the bar's items and as wide as its glyph
 * and a step of air: on a touch screen, beside items grown to the comfortable
 * target, it stayed 24 pixels wide — the one control of a page header's
 * actions a finger could miss.
 */
test('makes the overflow trigger a full touch target on a coarse pointer', () => {
  const coarse = /@media \(pointer:coarse\)\{([\s\S]*?)\}\}/.exec(normalized)?.[1] ?? '';
  const trigger = coarse.split(`[data-ui-toolbar] [data-part-overflow]{`)[1]?.split('}')[0] ?? '';
  /* Both axes in one rule and one value, so the box is square whatever the
     bar's height is. */
  const side = 'max(var(--slotted-target-comfortable,44px),var(--_height))';
  assert.ok(trigger.includes(`min-inline-size:${side}`), trigger);
  assert.ok(trigger.includes(`min-block-size:${side}`), trigger);
});
