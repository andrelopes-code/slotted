/**
 * CP-05 of `tools/agent-docs/content/guidelines/composition.md`: an element a screen
 * writes for itself paints with the theme's tokens, and with nothing else.
 *
 * The check lives here rather than in the demo's own suite because it reads
 * source text instead of running a component, and because the rule holds for
 * every consumer written in this repository, not only for the screens that
 * exist today.
 *
 * It is a rule with a door in it: a value the theme has no token for — a
 * measure, a query's step, an optical nudge, the geometry of a shape a screen
 * draws — is written with `literal: <reason>` beside it, and the check passes.
 * What it catches is the literal nobody decided.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const consumers = ['demos/nexora/angular/src'];

/** What a screen may still write as a literal, and why. */
const ALLOWED_PX = new Set([
  '0px', // the absence of a length
  '1px', // a hairline, which the library writes as a literal too
  '0.5px', // half of one, where a painted edge is met by the next colour stop
]);
/** A container or media query's own step is a literal in the library as well. */
const QUERY = /@(container|media)[^{]*\{/g;
/** The door: a value with a stated reason is a decision, not an oversight. */
const REASONED = /literal:\s*\S/;

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    if (!entry.isFile() || !entry.name.endsWith('.ts')) return [];
    if (entry.name.endsWith('.spec.ts')) return [];
    return [path];
  });
}

/** Every `styles: \`…\`` block of a component, with its queries removed. */
function styleBlocks(source) {
  const blocks = [];
  const marker = 'styles: `';
  let index = source.indexOf(marker);
  while (index >= 0) {
    const start = index + marker.length;
    const end = source.indexOf('`,', start);
    if (end < 0) break;
    blocks.push(source.slice(start, end).replace(QUERY, ''));
    index = source.indexOf(marker, end);
  }
  return blocks;
}

function offencesIn(path) {
  const source = readFileSync(path, 'utf8');
  const found = [];
  for (const block of styleBlocks(source)) {
    const lines = block.split('\n');
    for (const [index, line] of lines.entries()) {
      const text = line.trim();
      if (text.length === 0 || text.startsWith('/*') || text.startsWith('*')) continue;
      const above = (lines[index - 1] ?? '') + (lines[index - 2] ?? '');
      if (REASONED.test(text) || REASONED.test(above)) continue;
      if (/#[0-9a-fA-F]{3,8}\b/.test(text) || /\b(rgba?|hsla?)\(/.test(text))
        found.push(`${path}: a colour of its own — ${text}`);
      if (/font-size\s*:/.test(text) && !text.includes('var(--slotted-'))
        found.push(`${path}: a type size of its own — ${text}`);
      // `none` takes a shadow away and paints nothing, as `0px` is the absence of a length.
      if (
        /box-shadow\s*:/.test(text) &&
        !text.includes('var(--slotted-') &&
        !/box-shadow\s*:\s*none\s*;/.test(text)
      )
        found.push(`${path}: a shadow of its own — ${text}`);
      for (const [, value] of text.matchAll(/(\d+(?:\.\d+)?px)/g))
        if (!ALLOWED_PX.has(value)) found.push(`${path}: a length in pixels — ${text}`);
    }
  }
  return found;
}

test('no screen paints with a literal a token covers', () => {
  const offences = consumers
    .flatMap((directory) => files(join(root, directory)))
    .flatMap((path) => offencesIn(path.slice(root.length)).map((line) => line));
  assert.deepEqual(offences, [], `\n  ${offences.join('\n  ')}\n`);
});
