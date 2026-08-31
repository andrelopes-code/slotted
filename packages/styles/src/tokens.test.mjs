import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * Whitespace after `var(` is legal CSS and Prettier introduces it whenever a
 * declaration is long enough to wrap. A pattern anchored directly to the
 * token name therefore misses exactly the tokens in the longest declarations,
 * which is how two families came to document one custom property fewer than
 * they read.
 */
const TOKEN = /var\(\s*(--slotted-[a-z0-9-]+)/g;

function referencedTokens(css) {
  return [...new Set([...css.matchAll(TOKEN)].map(([, token]) => token))].sort();
}

function families() {
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const files = readdirSync(join(source, entry.name));
      return {
        name: entry.name,
        declared: files.find((file) => file.endsWith('.tokens.json')),
        stylesheets: files.filter((file) => file.endsWith('.css')),
      };
    })
    .filter((family) => family.stylesheets.length > 0);
}

test('gives every family exactly one declared token list', () => {
  for (const { declared, name } of families()) {
    assert.ok(declared !== undefined, `${name} ships a stylesheet and no tokens.json`);
  }
});

test('documents exactly the custom properties each family reads', () => {
  for (const { declared, name, stylesheets } of families()) {
    const css = stylesheets
      .map((file) => readFileSync(join(source, name, file), 'utf8'))
      .join('\n');
    const expected = referencedTokens(css);
    const actual = JSON.parse(readFileSync(join(source, name, declared), 'utf8'));
    assert.deepEqual(actual, expected, `${name} tokens.json disagrees with its stylesheets`);
  }
});
