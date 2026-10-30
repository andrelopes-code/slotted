import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { deltaE, flattenTheme, parseSeed } from '@slotted/theme';

import theme from '../src/default/theme.mjs';

/**
 * The recipe replaced 61 literal colours per scheme. Each one is held to the
 * value it had (`reference.json`) within 0.02 in OKLab, except the ones listed
 * here, each taken deliberately and written into the Current boundary section
 * of `docs/token-foundation.md`.
 */
const DEVIATIONS = new Set([
  'light --slotted-tone-success-text',
  'dark --slotted-tone-accent-border',
  'dark --slotted-tone-accent-text',
  'dark --slotted-focus-ring-color',
  'dark --slotted-surface',
  'dark --slotted-surface-sunken',
  'dark --slotted-border-subtle',
  'dark --slotted-control-border-color',
]);

const reference = JSON.parse(
  await readFile(new URL('../src/default/reference.json', import.meta.url), 'utf8'),
);
const flat = flattenTheme(theme);

/**
 * A token the recipe aliases (`--slotted-focus-ring-color` is
 * `var(--slotted-tone-accent-border)`) is compared through the value its
 * alias resolves to in the same scheme.
 */
function resolved(scheme, value, seen = new Set()) {
  const alias = /^var\((--[a-z0-9-]+)\)$/.exec(value);
  if (!alias) return value;
  assert.ok(!seen.has(alias[1]), `${scheme} ${alias[1]} aliases itself`);
  seen.add(alias[1]);
  return resolved(scheme, flat.schemes[scheme][alias[1]], seen);
}

test('reproduces every colour the recipe replaced', () => {
  const moved = [];
  for (const [scheme, tokens] of Object.entries(reference)) {
    for (const [token, before] of Object.entries(tokens)) {
      if (before.startsWith('var(')) continue;
      const now = resolved(scheme, flat.schemes[scheme][token]);
      const distance = deltaE(parseSeed(now), parseSeed(before));
      if (distance > 0.02) moved.push(`${scheme} ${token}`);
    }
  }
  assert.deepEqual(new Set(moved), DEVIATIONS);
});
