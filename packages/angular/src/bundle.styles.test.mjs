import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const packageRoot = new URL('..', import.meta.url);

/**
 * Every directory holding an ng-package.json is a published entry point, so
 * the list grows with the library rather than with this file. The earlier
 * version of this test named `button` and therefore proved nothing about the
 * three families added after it.
 */
function entryPoints() {
  return readdirSync(new URL('.', packageRoot), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !['dist', 'node_modules', 'src'].includes(entry.name))
    .filter((entry) => existsSync(new URL(`${entry.name}/ng-package.json`, packageRoot)))
    .map((entry) => ({
      name: entry.name,
      bundle: new URL(`dist/fesm2022/slotted-angular-${entry.name}.mjs`, packageRoot),
    }));
}

test('finds every published entry point', () => {
  const found = entryPoints().map(({ name }) => name);
  assert.ok(found.length >= 4, `Expected several entry points, found ${found.join(', ')}`);
});

test('ships class-selector styles with encapsulation disabled', () => {
  for (const { bundle, name } of entryPoints()) {
    const source = readFileSync(bundle, 'utf8');
    assert.match(source, /encapsulation: i0\.ViewEncapsulation\.None/, name);
    assert.doesNotMatch(source, /styles: \["@layer slotted\.components\{:host/, name);
    assert.match(source, /styles: \["@layer slotted\.components\{\.slotted-/, name);
  }
});

test('carries the family stylesheet into its own bundle', () => {
  for (const { bundle, name } of entryPoints()) {
    const source = readFileSync(bundle, 'utf8');
    assert.ok(
      source.includes(`.slotted-${name}`),
      `${name} bundle carries no .slotted-${name} rule`,
    );
  }
});
