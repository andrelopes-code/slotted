import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/pagination/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./pagination.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('styles every part the contract declares', () => {
  for (const part of contract.members.pagination.parts) {
    const selector =
      part === 'root' ? '[data-ui-pagination]{' : `[data-part-${part.toLowerCase()}]`;
    assert.ok(normalized.includes(selector), `Missing part ${part}`);
  }
});

test('reacts to every state the contract declares', () => {
  assert.ok(normalized.includes(':hover'));
  assert.ok(normalized.includes(':active'));
  assert.ok(normalized.includes(':focus-visible'));
  assert.ok(normalized.includes('[data-disabled]'));
  assert.ok(normalized.includes('[data-loading]'));
});

/**
 * A page change already in flight must not answer the pointer, which is what
 * stops a reader pressing Next four times while one request is outstanding.
 * Both stronger states guard every weaker one.
 */
test('holds hover and press back for loading as well as for disabled', () => {
  for (const state of ['hover', 'active']) {
    const rules = [...normalized.matchAll(new RegExp(`([^{}]*):${state}\\{`, 'g'))].map(
      ([, selector]) => selector,
    );
    assert.ok(rules.length > 0, `no ${state} rule`);
    for (const selector of rules) {
      /**
       * The page size is a native `select`, so the stronger state it answers is
       * the platform's own: a paginator waiting for a page disables it, and
       * `:disabled` is what that leaves in the DOM.
       */
      const guard = selector.includes('[data-part-page-size]')
        ? ':not(:disabled)'
        : '[data-disabled],[data-loading]';
      assert.ok(
        selector.includes(guard),
        `${state} is painted without holding back for the stronger states: ${selector}`,
      );
    }
  }
});

/**
 * The current page keeps its fill under the pointer. It is where the reader
 * already is, and a fill that lightens would read as a different page.
 */
test('leaves the current page alone under the pointer', () => {
  assert.ok(
    normalized.includes("[aria-current]:not([aria-current='false'])):hover"),
    'hover reaches the page the reader is already on',
  );
});

/**
 * `disabled` and `loading` both outrank `current` in `STATE_PRECEDENCE`. The
 * chip keeps its shape, because the reader still needs to know which page they
 * are on, and loses its accent, because a saturated chip inside a grey row
 * reads as the one thing still operable.
 */
test('mutes the current chip while the row is inert, and keeps its shape', () => {
  assert.ok(
    normalized.includes(
      "[data-part-page][aria-current]:not([aria-current='false']):is([data-disabled],[data-loading]){background-color:var(--slotted-disabled-background",
    ),
  );
});

test('paints the current page from the platform attribute, without a mirror', () => {
  assert.ok(normalized.includes("[data-part-page][aria-current]:not([aria-current='false'])"));
  assert.ok(!normalized.includes('data-current'), 'the family declares no current mirror');
});

/**
 * Page 9 and page 8 942 are the same target, and the row does not move as the
 * reader walks through it.
 */
test('keeps the row still as the digits grow', () => {
  assert.ok(normalized.includes('font-variant-numeric:tabular-nums'));
  assert.ok(normalized.includes('min-inline-size:var(--_target)'));
});

test("keeps the air around the two sentences, and resets only the paragraph's block margin", () => {
  /* `status` is a `<p>`: resetting its whole margin after the text-gap rule
     took the inline air away, and "1–8 of 50" stood against the trigger. */
  const reset = css.slice(
    css.indexOf('[data-ui-pagination] :is([data-part-status], [data-part-summary]) {'),
  );
  assert.match(reset.slice(0, reset.indexOf('}')), /margin-block: 0;/);
  assert.doesNotMatch(reset.slice(0, reset.indexOf('}')), /\n\s*margin: 0;/);
});

/**
 * The chevrons are Glyph elements the bindings render; the sheet sizes the box
 * they sit in and paints none of them.
 */
test('paints no chevron of its own', () => {
  assert.ok(!declarations.includes('mask'), 'a chevron is an svg, not a mask');
  assert.ok(!declarations.includes('::before') && !declarations.includes('::after'));
  assert.ok(normalized.includes('[data-part-last]){--slotted-icon-size:var(--_glyph);}'));
});

/**
 * Two facts, two answers: a chevron points along the reading direction, which
 * the icon box's `directional` mirror answers in a right-to-left document, and
 * `previous` and `first` point against it, which a flip of the box answers.
 */
test('mirrors each trigger with the direction that applies to it', () => {
  assert.ok(
    normalized.includes('[data-part-first],[data-part-previous])>[data-ui-icon]{rotate:0.5turn;'),
  );
  assert.ok(
    !/\[dir=/.test(declarations),
    'an ancestor attribute is not the element directionality',
  );
});

/**
 * Responsiveness that changes composition rather than size, measured against
 * the family's own inline size. The breakpoint is a literal because
 * `@container (min-width: var(--x))` is invalid CSS.
 */
test('compacts from its own container', () => {
  assert.ok(normalized.includes('container-type:inline-size'));
  assert.ok(normalized.includes('container-name:slotted-pagination'));
  assert.ok(normalized.includes('@containerslotted-pagination(max-width:22rem)'));
  assert.equal(contract.compaction.breakpoint, '22rem');
});

/**
 * A paginator over a collection whose total the server does not know has no
 * summary to replace its range with, and hiding the range left two chevrons
 * and no sentence at all.
 */
test('hides the range only where a summary exists to replace it', () => {
  assert.ok(
    normalized.includes(
      '[data-ui-pagination]:has([data-part-summary])[data-part-status]{display:none',
    ),
  );
});

/**
 * The mark keeps its paint through `forced-color-adjust` on the mark alone
 * rather than through a repaint: it inherits the colour the system has already
 * forced onto the button, including the grey a disabled trigger takes.
 */
test('keeps the chevrons through forced colours without naming a system colour', () => {
  assert.ok(normalized.includes('@media(forced-colors:active)'));
  assert.ok(normalized.includes('forced-color-adjust:none'));

  for (const [, block] of declarations.matchAll(/::(?:before|after)[^{]*\{([\s\S]*?)\}/g)) {
    assert.ok(
      !/\b(ButtonText|CanvasText|GrayText|Highlight|HighlightText|Canvas)\b/.test(block),
      'a pseudo-element must not name a system colour',
    );
  }
});
