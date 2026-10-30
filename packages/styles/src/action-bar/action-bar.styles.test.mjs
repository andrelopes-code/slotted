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
    new URL('../../../../specs/components/action-bar/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./action-bar.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./action-bar.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.actionBar;
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
 * The third line of the scope paragraph, and the one rule that carries it. An
 * `auto` margin anchors the run to the bar's end edge; a `justify-content` on
 * the root would place it *relative to its neighbours*, so a message appearing
 * beside it would push it. The property is logical, so the anchor mirrors.
 */
/**
 * The root is a size container, and a size container has no intrinsic
 * inline size: as a flex item — the page footer's actions row — it shrank to
 * nothing and stacked its letters. A bar is as wide as the line it stands on.
 */
test('is as wide as the line it stands on, so a flex parent cannot shrink it', () => {
  assert.match(rule(ui), /inline-size:100%/);
  assert.match(rule(ui), /box-sizing:border-box/);
});

test('anchors the run to the bar own end edge, in a logical property', () => {
  const actions = rule(part('actions'));
  assert.match(actions, /margin-inline-start:auto/);
  assert.ok(!/margin-left|margin-right/.test(actions), 'the anchor is a physical property');
  assert.equal(contract.stability.anchor, 'margin-inline-start: auto on the actions part');
});

/**
 * The run is content-sized so that it can sit against that edge, and
 * content-sized means it does not shrink: two long translated labels were drawn
 * past the bar's own edge until the ceiling turned the run's `flex-wrap` on.
 */
test('never draws an action past the bar own edge', () => {
  assert.match(rule(part('actions')), /max-inline-size:100%/);
  assert.match(rule(part('actions')), /flex-wrap:wrap/);
});

/** Sticky, offset by what the page publishes, never fixed. */
test('stops above the page own chrome rather than covering it', () => {
  const sticky = rule(`${ui}[data-sticky]`);
  assert.match(sticky, /position:sticky/);
  assert.match(sticky, new RegExp(`inset-block-end:var\\(${contract.sticky.reads}`));
  assert.ok(!/position:fixed/.test(normalized), 'a fixed bar covers the last line of content');
});

/**
 * The breakpoint is literal because `@container (width < var(--x))` is invalid,
 * and it is stated in exactly one place: the query itself. The binding reads the
 * property the query raises rather than comparing widths of its own, so the
 * measurement and the layout cannot disagree about where the bar stacks.
 */
test('states the stacking breakpoint once, and publishes the fact', () => {
  const query = `@container ${contract.stack.container === 'root' ? 'slotted-action-bar' : ''} (width < ${contract.stack.breakpoint})`;
  assert.ok(css.includes(query), `the query does not read ${query}`);
  assert.equal(
    css.split(contract.stack.breakpoint).length - 1,
    1,
    'the breakpoint is written more than once',
  );
  assert.match(normalized, new RegExp(`${contract.stack.property}:1`));
  assert.match(css, /container-type: inline-size/);
  assert.match(css, /container-name: slotted-action-bar/);
});

/**
 * Only a bar without an overflow control stacks: one with a control keeps a
 * row and folds what has a counterpart, which is what the control is for. It
 * stacked, hid the control, and three actions stood 164 pixels tall.
 */
test('stacks only a bar that has no overflow control', () => {
  const stacked = css.slice(css.indexOf(`(width < ${contract.stack.breakpoint})`));
  const rules = stacked.slice(0, stacked.indexOf('Forced colors'));
  const selectors = [...rules.matchAll(/^ {4}(\[data-ui-action-bar\][^{]*)\{/gm)].map(([, s]) => s);
  assert.ok(selectors.length > 0);
  for (const selector of selectors) {
    assert.match(selector, /^\[data-ui-action-bar\]:not\(:has\(\[data-part-overflow\]\)\)/);
  }
  assert.match(contract.stack.overflow, /keeps one row/);
  assert.match(contract.stack.collapse, /does not run/);
});

/**
 * `docs/component-features.md` §5 asks that a destructive action does not sit
 * flush against a frequent one, and the rule is the mechanism: half a gap on
 * each side, which is wider than the gap between two controls.
 */
test('puts a rule between two runs at more than the distance between two controls', () => {
  const separator = rule(part('separator'));
  assert.match(separator, /margin-inline:calc\(var\(--_gap\) \/ 2\)/);
  assert.match(separator, /background-color:var\(--slotted-action-bar-separator-color/);
});

/**
 * A rule painted with a background disappears when the system flattens every
 * background. The mark is an `svg` stroked in `currentColor` and needs nothing.
 */
test('keeps its rule when the system takes the palette over, and paints no mark', () => {
  const forced = css.slice(css.indexOf('@media (forced-colors: active)'));
  assert.match(forced, /\[data-part-separator\][\s\S]{0,200}forced-color-adjust: none/);
  assert.ok(!declarations.includes('mask'), 'the mark is the Glyph element, not a mask');
});

/**
 * A weaker state holds itself back for a stronger one. The trigger is the one
 * control this family draws, and a `<fieldset disabled>` around the bar is what
 * takes it out of action.
 */
test('holds hover and press back for the platform own disabled', () => {
  assert.ok(normalized.includes(`${part('overflow')}:not(:disabled):hover{`));
  assert.ok(normalized.includes(`${part('overflow')}:not(:disabled):active{`));
  assert.match(rule(`${part('overflow')}:disabled`), /cursor:default/);
});

/**
 * An actions area built from a permission filter renders an empty container
 * often, and an empty bar under `raised` draws a rule across the screen with
 * nothing under it.
 */
test('takes no room when it holds nothing at all', () => {
  assert.match(normalized, /:not\(:has\(\[data-part-actions\]>\*:not\(\[hidden\]\)\)\)/);
});

/** The bar paints itself and the one control it draws, and nothing inside it. */
test('paints no control it does not own', () => {
  assert.ok(!normalized.includes('[data-ui-button]'), 'the bar reaches into another family');
  assert.equal(rule(part('action')).includes('background'), false);
});
