import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;

/**
 * Foundation tokens are the ones the theme owns outright. If a consumer ships
 * no theme at all, these still have to paint something, so a system colour is
 * the right last resort for them.
 */
const FOUNDATION_PREFIXES = [
  '--slotted-tone-',
  '--slotted-disabled-',
  '--slotted-focus-ring-',
  '--slotted-border-',
  '--slotted-control-',
  '--slotted-text',
  '--_',
];

const SYSTEM_COLOUR =
  /\b(ActiveText|ButtonBorder|ButtonFace|ButtonText|Canvas|CanvasText|Field|FieldText|GrayText|Highlight|HighlightText|LinkText|Mark|MarkText|VisitedText)\b/;

function stylesheets() {
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(join(source, entry.name))
        .filter((name) => name.endsWith('.css'))
        .map((name) => ({
          path: join(entry.name, name),
          css: readFileSync(join(source, entry.name, name), 'utf8'),
        })),
    );
}

test('finds every stylesheet in the package', () => {
  const found = stylesheets().map(({ path }) => path);
  assert.ok(found.length >= 4, `Expected several stylesheets, found ${found.join(', ')}`);
});

/**
 * Walks every var() call, respecting nesting. A component token may hand
 * responsibility to a foundation token, so a system colour inside a nested
 * var() belongs to that inner token, not to the outer one.
 */
function varCalls(css) {
  const calls = [];
  for (let index = css.indexOf('var('); index !== -1; index = css.indexOf('var(', index + 1)) {
    let depth = 0;
    let end = index + 3;
    for (; end < css.length; end += 1) {
      if (css[end] === '(') depth += 1;
      else if (css[end] === ')') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const body = css.slice(index + 4, end);
    const comma = body.indexOf(',');
    if (comma === -1) continue;
    calls.push({ token: body.slice(0, comma).trim(), fallback: body.slice(comma + 1).trim() });
  }
  return calls;
}

const withoutNestedVars = (fallback) => fallback.replace(/var\([^()]*(?:\([^()]*\))?[^()]*\)/g, '');

test('never lets a component token fall back to a system colour', () => {
  const violations = [];

  for (const { css, path } of stylesheets()) {
    for (const { fallback, token } of varCalls(css)) {
      const isFoundation = FOUNDATION_PREFIXES.some((prefix) => token.startsWith(prefix));
      if (isFoundation) continue;
      if (!SYSTEM_COLOUR.test(withoutNestedVars(fallback))) continue;
      violations.push(`${path}: ${token} falls back to ${fallback}`);
    }
  }

  assert.deepEqual(
    violations,
    [],
    `A component token must fall back to a foundation token, never to a system colour:\n  ${violations.join('\n  ')}`,
  );
});

test('lets a foundation token keep a system colour as its last resort', () => {
  const foundationFallbacks = stylesheets()
    .flatMap(({ css }) => varCalls(css))
    .filter(({ token }) => FOUNDATION_PREFIXES.some((prefix) => token.startsWith(prefix)))
    .filter(({ fallback }) => SYSTEM_COLOUR.test(fallback));

  assert.ok(
    foundationFallbacks.length > 0,
    'Foundation tokens should still render without a theme',
  );
});

test('never paints a decorative rule with a system colour at all', () => {
  const violations = [];

  for (const { css, path } of stylesheets()) {
    for (const match of css.matchAll(/::(?:before|after)\s*\{([\s\S]*?)\}/g)) {
      if (SYSTEM_COLOUR.test(match[1] ?? '')) {
        violations.push(`${path}: a ::before or ::after rule reaches a system colour`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Unthemed decoration should disappear rather than shout:\n  ${violations.join('\n  ')}`,
  );
});
