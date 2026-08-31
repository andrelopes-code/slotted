import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * A right-to-left document must work without a second stylesheet, which holds
 * only while every rule is written in logical properties. The physical form of
 * each one below has a logical counterpart that means the same thing in a
 * left-to-right document and the right thing in every other.
 */
const PHYSICAL = [
  { pattern: /(?:^|[;{}\s])(?:min-|max-)?width\s*:/, logical: 'inline-size' },
  { pattern: /(?:^|[;{}\s])(?:min-|max-)?height\s*:/, logical: 'block-size' },
  { pattern: /(?:^|[;{}\s])(?:top|right|bottom|left)\s*:/, logical: 'inset-block or inset-inline' },
  {
    pattern: /(?:^|[;{}\s])(?:margin|padding|border)-(?:top|right|bottom|left)\b/,
    logical: 'the -block- or -inline- form',
  },
  {
    pattern: /(?:^|[;{}\s])(?:float|clear)\s*:\s*(?:left|right)\b/,
    logical: 'inline-start or inline-end',
  },
];

function stylesheets() {
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(join(source, entry.name))
        .filter((name) => name.endsWith('.css'))
        .map((name) => ({
          path: join(entry.name, name),
          css: readFileSync(join(source, entry.name, name), 'utf8').replace(
            /\/\*[\s\S]*?\*\//g,
            '',
          ),
        })),
    );
}

test('finds every stylesheet in the package', () => {
  assert.ok(stylesheets().length >= 4);
});

test('writes every rule in logical properties', () => {
  const violations = [];

  for (const { css, path } of stylesheets()) {
    for (const line of css.split('\n')) {
      for (const { logical, pattern } of PHYSICAL) {
        if (pattern.test(line)) violations.push(`${path}: ${line.trim()} — use ${logical}`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Physical properties break a right-to-left document:
  ${violations.join('\n  ')}`,
  );
});
