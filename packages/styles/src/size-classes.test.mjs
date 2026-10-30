import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * The size-class contract — a page surface composes by the width of its own
 * container, and that width falls in one of three classes: compact below
 * 600 pixels, medium from 600 to 1023, expanded from 1024. The two limits are
 * `COMPACT_BELOW` and `EXPANDED_FROM` in `@slotted/core/measure`; a stylesheet
 * cannot read a custom property in a container condition, so each family
 * writes them as literals, and this test holds the literals to the two values.
 *
 * Only the page-surface families are held. A component that reflows its own
 * content (`card`, `list-item`, `alert`, …) keeps a threshold of its own, since
 * it answers to its content and not to the page.
 */
const FAMILIES = ['app-shell', 'detail-panel', 'page', 'page-header'];

/** The two limits of the three classes, as a container condition writes them. */
const LIMITS = new Set(['600px', '1024px']);

/** A width feature, in either the range or the min-/max- form. */
const WIDTH = /\b(?:min-|max-)?(?:inline-size|width)\b/;

/** Every length a condition compares a width against. */
const LENGTH = /(\d+(?:\.\d+)?)([a-z]+)/g;

function sheet(family) {
  return readFileSync(`${source}${family}/${family}.css`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
}

/** The width conditions of every `@container` prelude in the sheet. */
function widthConditions(css) {
  const conditions = [];
  for (const [, prelude] of css.matchAll(/@container\b([^{]*)\{/g)) {
    for (const [condition] of prelude.matchAll(/\([^()]*\)/g)) {
      if (WIDTH.test(condition)) conditions.push(condition.replace(/\s+/g, ' '));
    }
  }
  return conditions;
}

test('queries the width of a page surface only at the two size-class limits', () => {
  for (const family of FAMILIES) {
    for (const condition of widthConditions(sheet(family))) {
      for (const [length] of condition.matchAll(LENGTH)) {
        assert.ok(
          LIMITS.has(length),
          `${family} queries its width at ${length} in ${condition}; the limits are 600px and 1024px`,
        );
      }
    }
  }
});

/** A reader that found no condition would pass the test above on any sheet. */
test('finds the width conditions the families write', () => {
  const found = FAMILIES.flatMap((family) => widthConditions(sheet(family)));
  assert.ok(found.length > 0, 'no width condition read in any page-surface family');
  assert.deepEqual(widthConditions('@container x (600px <= inline-size < 1024px) {'), [
    '(600px <= inline-size < 1024px)',
  ]);
});
