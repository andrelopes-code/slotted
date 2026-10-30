import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { resolveTokens } from '@slotted/theme';

const theme = JSON.parse(
  await readFile(new URL('../src/default/values.json', import.meta.url), 'utf8'),
);

/**
 * What every one of these tokens resolved to before the scales existed.
 * A scale step is only allowed to replace a literal if it holds the same
 * value, so this table is what makes "the foundation changed no pixel"
 * a fact rather than a claim. Entries are added, never edited.
 *
 * A row leaves with the token itself, or with a change to the rendered value
 * that was taken deliberately and written into the **Current boundary** section
 * of `docs/token-foundation.md`. Button's four base tokens left the first way
 * when the family was rebuilt: it reads `--slotted-control-gap-*` for its gap
 * and `--slotted-control-radius` for its corners, so there is no longer a value
 * for this table to pin. `--slotted-control-shadow` left the second way: a
 * framed control gained a shadow, so `none` is no longer what it resolves to.
 */
const UNCHANGED = {
  '--slotted-control-font-family': "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
  '--slotted-control-font-weight': '600',
  '--slotted-control-line-height': '1',
  '--slotted-control-letter-spacing': '0',
  '--slotted-control-border-width': '1px',
  '--slotted-control-radius': '4px',
  '--slotted-control-transition-duration': '120ms',
  '--slotted-control-transition-easing': 'cubic-bezier(0.2, 0, 0, 1)',
  '--slotted-focus-ring-width': '2px',
  '--slotted-focus-ring-offset': '2px',
  '--slotted-font-family-heading': "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
};

test('expands a reference to another token in the same map', () => {
  assert.deepEqual(resolveTokens({ '--a': 'var(--b)', '--b': '4px' }), {
    '--a': '4px',
    '--b': '4px',
  });
});

test('expands repeated references to the same token', () => {
  assert.equal(resolveTokens({ '--a': 'var(--b) var(--b)', '--b': '1px' })['--a'], '1px 1px');
});

test('expands more than one hundred sibling references', () => {
  const count = 101;
  const references = Array(count).fill('var(--b)').join(' ');

  assert.equal(
    resolveTokens({ '--a': references, '--b': 'x' })['--a'],
    Array(count).fill('x').join(' '),
  );
});

test('expands a chain of references', () => {
  assert.equal(resolveTokens({ '--a': 'var(--b)', '--b': 'var(--c)', '--c': '2px' })['--a'], '2px');
});

test('keeps the surrounding text of a reference', () => {
  assert.equal(
    resolveTokens({ '--a': 'calc(-1 * var(--b))', '--b': '1px' })['--a'],
    'calc(-1 * 1px)',
  );
});

test('takes the fallback when the name is absent', () => {
  assert.equal(resolveTokens({ '--a': 'var(--missing, 8px)' })['--a'], '8px');
});

test('refuses a reference that cannot be resolved', () => {
  assert.throws(() => resolveTokens({ '--a': 'var(--missing)' }), /--missing/);
});

test('refuses a cycle rather than looping', () => {
  assert.throws(() => resolveTokens({ '--a': 'var(--b)', '--b': 'var(--a)' }), /cycle/i);
});

test('resolves frozen authored maps without mutating them', () => {
  const base = Object.freeze({ ...theme.base });
  const density = Object.freeze({ ...theme.densities.comfortable });
  const baseSnapshot = structuredClone(base);
  const densitySnapshot = structuredClone(density);

  assert.equal(resolveTokens(base)['--slotted-control-font-weight'], '600');
  assert.equal(resolveTokens(density)['--slotted-control-height-md'], '34px');
  assert.deepEqual(base, baseSnapshot);
  assert.deepEqual(density, densitySnapshot);
});

test('every token that predates the scales still resolves to its old value', () => {
  const resolved = resolveTokens(theme.base);
  for (const [name, expected] of Object.entries(UNCHANGED)) {
    assert.equal(resolved[name], expected, `${name} changed value`);
  }
});

const DENSITY_UNCHANGED = {
  comfortable: {
    '--slotted-control-height-sm': '30px',
    '--slotted-control-height-md': '34px',
    '--slotted-control-height-lg': '38px',
    '--slotted-control-padding-inline-sm': '10px',
    '--slotted-control-padding-inline-md': '13px',
    '--slotted-control-padding-inline-lg': '16px',
    '--slotted-control-font-size-sm': '12px',
    '--slotted-control-font-size-md': '13px',
    '--slotted-control-font-size-lg': '14px',
    '--slotted-control-icon-size-sm': '14px',
    '--slotted-control-icon-size-md': '16px',
    '--slotted-control-icon-size-lg': '18px',
  },
  compact: {
    '--slotted-control-height-sm': '26px',
    '--slotted-control-height-md': '28px',
    '--slotted-control-height-lg': '32px',
    '--slotted-control-padding-inline-sm': '8px',
    '--slotted-control-padding-inline-md': '10px',
    '--slotted-control-padding-inline-lg': '12px',
    '--slotted-control-font-size-sm': '12px',
    '--slotted-control-font-size-md': '12px',
    '--slotted-control-font-size-lg': '13px',
    '--slotted-control-icon-size-sm': '13px',
    '--slotted-control-icon-size-md': '14px',
    '--slotted-control-icon-size-lg': '16px',
  },
};

/**
 * These are the pixels every control in the library is built from, and they are
 * the numbers Button rendered before the foundation existed. They were pinned
 * through Button's density aliases until the family was rebuilt; the aliases
 * are gone and the pinning moved onto the tokens that survived them, so the
 * same values are still held by the same count of assertions.
 */
test('every control geometry token still resolves to its old value', () => {
  for (const [density, expected] of Object.entries(DENSITY_UNCHANGED)) {
    const resolved = resolveTokens(theme.densities[density]);
    for (const [name, value] of Object.entries(expected)) {
      assert.equal(resolved[name], value, `${name} changed in ${density}`);
    }
  }
});
