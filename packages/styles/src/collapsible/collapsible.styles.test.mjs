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
    new URL('../../../../specs/components/collapsible/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./collapsible.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./collapsible.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.collapsible;

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
 * A collapsible inside another collapsible's panel is the ordinary case — a
 * nested accordion is two of these — and a descendant rule would open the inner
 * panel because the outer one is open. Every rule the family owns therefore
 * reaches its parts with a child combinator.
 */
test('reaches its own parts with a child combinator, never a descendant one', () => {
  const owned = ['header', 'actions', 'panel'];
  for (const part of owned) {
    const descendant = new RegExp(`\\[data-ui-collapsible\\][^{>]*?] \\[data-part-${part}\\]`);
    assert.ok(
      !descendant.test(normalized),
      `a descendant rule reaches ${part}, so a nested collapsible would inherit it`,
    );
  }
  assert.match(fragment, /data-part="content"[\s\S]*data-ui="collapsible"/);
});

/**
 * The mark is the `Glyph` element the binding draws, so the stylesheet paints
 * none: it sizes the `icon` box through the slot and leaves the drawing alone.
 */
test('draws the indicator with the Glyph element rather than a mask or a character', () => {
  const indicator = rule(`${ui}>[data-part-header]>[data-part-trigger]>[data-part-indicator]`);
  assert.match(indicator, /--slotted-icon-size:var\(--_icon-size\)/);
  assert.ok(!/content:/.test(indicator), 'the mark is drawn with content rather than geometry');
  assert.ok(!/mask/.test(normalized), 'the stylesheet still paints a mark with a mask');
  assert.match(
    fragment,
    /data-part="indicator"[^>]*>\s*<span data-ui="icon"[^>]*><svg data-part="glyph" data-glyph="chevron-down">/,
  );
  assert.match(fragment, /data-glyph="plus"/);
  assert.match(fragment, /data-glyph="minus"/);
});

/**
 * CL1, and R5's rule for a mark beside a line of words. Spanning both rows and
 * centred, the chevron sat 9.25 to 10.25px under the line it annotates wherever
 * a description was written and 32px under it where the title wrapped to three
 * lines — 87 findings across `collapsible` and `accordion`, which draws no
 * indicator of its own and inherits this one.
 *
 * `1lh` resolves against the element's own line box, so the mark has to inherit
 * the trigger's font and line-height for the margin to be half of *the title's*
 * line; it states neither, which is what makes the arithmetic hold.
 */
test('sits the mark on the first line of the title, not on the middle of the trigger', () => {
  const indicator = rule(`${ui}>[data-part-header]>[data-part-trigger]>[data-part-indicator]`);
  assert.match(indicator, /align-self:start/);
  assert.match(indicator, /grid-row:1(?!\s*\/)/);
  assert.match(indicator, /margin-block-start:calc\(\(1lh - var\(--_icon-size\)\) \/ 2\)/);
  assert.ok(!/font-size:/.test(indicator), 'the mark sets a type size the line does not have');
  assert.ok(!/line-height:/.test(indicator), 'the mark sets a line the title does not set');
});

/**
 * The mark turns rather than pointing along the inline axis, so a right-to-left
 * document needs no mirrored artwork at all.
 */
test('turns the mark instead of mirroring it', () => {
  assert.match(
    normalized,
    /\[data-open\][^{]*\[data-part-indicator\]>\[data-ui-icon\]\{rotate:180deg;\}/,
  );
  assert.ok(!/scale\(-1/.test(normalized), 'the mark is mirrored somewhere');
});

/** The differentiator: the panel opens to its own height with nothing measured. */
test('opens the panel with a grid track rather than a measured height', () => {
  const panel = rule(`${ui}>[data-part-panel]`);
  assert.match(panel, /grid-template-rows:0fr/);
  assert.match(panel, /transition:grid-template-rows/);
  assert.match(normalized, /\[data-open\]>\[data-part-panel\]\{grid-template-rows:1fr;\}/);
  assert.ok(
    !/--slotted-collapsible-(content|panel)-(height|width)/.test(css),
    'the family writes a measured size into a custom property',
  );
});

/**
 * Closed content is out of the accessibility tree, out of the tab sequence and
 * out of the browser's page search, and it stays visible for the length of the
 * closing transition rather than vanishing at the first frame.
 */
test('takes closed content out of the tree without taking it out of the transition', () => {
  const content = rule(`${ui}>[data-part-panel]>[data-part-content]`);
  assert.match(content, /content-visibility:hidden/);
  assert.match(content, /transition:content-visibility var\(--slotted-duration-medium\)/);
  assert.match(content, /allow-discrete/);
  assert.match(fragment, /inert/, 'the harness never shows the attribute the binding writes');
});

test('holds hover and press back for a control the browser has disabled', () => {
  for (const state of [':hover', ':active']) {
    const selectors = [...normalized.matchAll(/([^{}]+)\{/g)]
      .map(([, selector]) => selector)
      /* `@media (forced-colors:active)` is a prelude, not a selector, and the
       * word it ends on is the same one this test looks for. */
      .filter((selector) => !selector.trimStart().startsWith('@'))
      .filter((selector) => selector.includes(state));
    assert.ok(selectors.length > 0, `nothing paints ${state}`);
    for (const selector of selectors) {
      assert.ok(
        selector.includes(':not([data-disabled])') && selector.includes(':enabled'),
        `${selector} paints ${state} with no guard`,
      );
    }
  }
});

test('answers its own inline size rather than the viewport', () => {
  assert.match(normalized, /container-type:inline-size/);
  assert.match(normalized, /container-name:slotted-collapsible/);
  assert.match(css, /@container slotted-collapsible \(max-inline-size: 22rem\)/);
  assert.ok(!/@media \(m(in|ax)-width/.test(css), 'a viewport query controls the layout');
});

/** Every declared state has to be photographable, which means it has to exist. */
test('renders every declared state in at least one scene', () => {
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.match(fragment, new RegExp(attribute), `${state} appears in no scene`);
  }
  assert.match(fragment, /aria-disabled="true"/);
  assert.match(fragment, /aria-busy="true"/);
});

test('writes the wiring the pattern asks for in every scene', () => {
  assert.match(fragment, /aria-expanded="true"/);
  assert.match(fragment, /aria-expanded="false"/);
  assert.match(fragment, /aria-controls="/);
  assert.match(fragment, /aria-labelledby="/);
  assert.match(fragment, /<h3 data-part="header">/);
});
