import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { STATE_PRECEDENCE } from '../../../specs/contract.schema.mjs';

const source = new URL('.', import.meta.url).pathname;
const ledger = JSON.parse(
  readFileSync(new URL('../../../specs/legacy-families.json', import.meta.url), 'utf8'),
).families;

/**
 * A weaker state must hold itself back for every stronger one. The library
 * learned this from a defect rather than from a rule: several controls painted
 * a hover fill on a control the browser had already disabled, so the control
 * looked operable and answered nothing. `STATE_PRECEDENCE` names the order, and
 * this test is what makes it binding for a stylesheet.
 */
const GUARDS = [
  ':not([data-disabled])',
  ':not([data-loading])',
  ':not(:disabled)',
  ':enabled',
  ':disabled',
  '[data-disabled]',
];

function currentFamilies() {
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !ledger.includes(entry.name))
    .map((entry) => ({
      name: entry.name,
      stylesheets: readdirSync(join(source, entry.name))
        .filter((file) => file.endsWith('.css'))
        .map((file) => ({ file, css: readFileSync(join(source, entry.name, file), 'utf8') })),
    }));
}

/**
 * A selector list is separated by top-level commas only. Splitting on every
 * comma tore `:is(:checked, :indeterminate)` in half and handed this test the
 * fragment `:indeterminate)) ):hover`, which carries no guard because it is not
 * a selector — so a correctly guarded rule was reported as an unguarded one.
 * `:is()`, `:not()`, `:where()` and `:has()` all take lists, and all four are
 * how a rule states the precedence this test exists to check.
 */
export function splitSelectorList(list) {
  const parts = [];
  let depth = 0;
  let current = '';

  for (const character of list) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += character;
  }
  parts.push(current);

  return parts;
}

/**
 * Comments, gone before anything is read as a selector.
 *
 * What sits between one rule's `}` and the next rule's `{` is the next rule's
 * selector *and every comment above it*, and this file's own comments explain
 * the rules they stand over — so they name the pseudo-classes the rules use.
 * A comment reading "a `:hover` selector outweighs a plain `[data-selected]`,
 * so the chosen row turned grey" split on its own comma into a fragment
 * carrying `:hover` and no guard, and a correctly guarded stylesheet was
 * reported as an unguarded one.
 *
 * The sibling defect is already recorded above `splitSelectorList`: both are
 * this test reading something that is not a selector as one.
 */
export function withoutComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/** Every selector list in the sheet, one entry per selector. */
function selectors(css) {
  return [...withoutComments(css).matchAll(/(^|\})([^{}]+)\{/g)]
    .map(([, , selector]) => selector.trim())
    .filter((selector) => selector.length > 0 && !selector.startsWith('@'))
    .flatMap(splitSelectorList)
    .map((selector) => selector.trim());
}

test('holds a weaker state back for the stronger ones it can meet', () => {
  for (const { name, stylesheets } of currentFamilies()) {
    for (const { file, css } of stylesheets) {
      for (const selector of selectors(css)) {
        if (!/:hover|:active(?![-\w])/.test(selector)) continue;
        assert.ok(
          GUARDS.some((guard) => selector.includes(guard)),
          `${name}/${file}: "${selector}" paints a weak state without holding it back for disabled`,
        );
      }
    }
  }
});

test('reads the precedence from the shared vocabulary rather than restating it', () => {
  assert.ok(STATE_PRECEDENCE.indexOf('disabled') < STATE_PRECEDENCE.indexOf('hover'));
  assert.ok(STATE_PRECEDENCE.indexOf('loading') < STATE_PRECEDENCE.indexOf('active'));
});

test('splits a selector list at its own commas and not inside a functional one', () => {
  assert.deepEqual(splitSelectorList('a:is(b, c):hover, d'), ['a:is(b, c):hover', ' d']);
  assert.deepEqual(splitSelectorList('a:has(b:is(c, d)):active'), ['a:has(b:is(c, d)):active']);
  assert.deepEqual(splitSelectorList('a, b'), ['a', ' b']);
});

/**
 * A comment is not a selector, and this file's own comments name the
 * pseudo-classes of the rules they stand over.
 */
test("reads a rule's selector and not the prose above it", () => {
  const css = `
    a { color: red }
    /* A :hover selector outweighs a plain [data-selected], so the row turned grey. */
    b:hover:not([data-disabled]) { color: blue }
  `;
  assert.deepEqual(
    [...withoutComments(css).matchAll(/(^|\})([^{}]+)\{/g)].map(([, , selector]) =>
      selector.trim(),
    ),
    ['a', 'b:hover:not([data-disabled])'],
  );
});
