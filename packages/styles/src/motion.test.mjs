import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = new URL('.', import.meta.url).pathname;
const ledger = JSON.parse(
  readFileSync(new URL('../../../specs/legacy-families.json', import.meta.url), 'utf8'),
).families;

/**
 * Reduced motion is honored by reaching for a duration token, because the
 * theme collapses those tokens in one query. A literal duration — including
 * one hidden in a `var()` fallback — is outside that query and keeps animating
 * for a reader who asked the operating system for stillness.
 *
 * The rule binds every family the rebuild has reached. A family still on the
 * ledger predates the foundation and is exempt until it is rebuilt, which is
 * the only reason the list exists.
 */
const TIME_LITERAL = /(?<![\w-])\d+(?:\.\d+)?m?s(?![\w-])/g;

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
 * A duration inside an inline SVG image is the image's own animation, which
 * no custom property reaches; the sheet that carries one swaps the image
 * under reduced motion instead.
 */
/**
 * A delay that never elapses is no motion: it holds back the ground a browser
 * paints over an autofilled input lying over a family's own paint, which no
 * inset shadow can cover without covering the paint under it. Named one at a
 * time, with the rule it is in.
 */
const HELD_BACK = new Map([['otp-input', 'background-color 0s 600000s']]);

test('takes every duration from the motion scale', () => {
  for (const { name, stylesheets } of currentFamilies()) {
    for (const { file, css } of stylesheets) {
      const held = HELD_BACK.get(name);
      const outsideImages = css
        .replace(/url\("data:[^"]*"\)/g, '')
        .replace(held === undefined ? /$^/ : `transition: ${held};`, '');
      const literals = [...outsideImages.matchAll(TIME_LITERAL)].map(([literal]) => literal);
      assert.deepEqual(
        literals,
        [],
        `${name}/${file} states ${literals.join(', ')} instead of a duration token`,
      );
    }
  }
});

test('stops an endless animation under reduced motion rather than shortening it', () => {
  for (const { name, stylesheets } of currentFamilies()) {
    for (const { file, css } of stylesheets) {
      if (!/\binfinite\b/.test(css)) continue;
      const query = css.slice(css.indexOf('prefers-reduced-motion'));
      assert.ok(
        css.includes('prefers-reduced-motion') &&
          /animation(-play-state)?\s*:\s*(none|paused)/.test(query),
        `${name}/${file} loops forever and never stops under reduced motion`,
      );
    }
  }
});
