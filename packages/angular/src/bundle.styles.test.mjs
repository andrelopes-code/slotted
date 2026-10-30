import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const packageRoot = new URL('..', import.meta.url);
const ledger = JSON.parse(
  readFileSync(new URL('../../../specs/legacy-families.json', import.meta.url), 'utf8'),
).families;

/**
 * Every directory holding an ng-package.json is a published entry point, so
 * the list grows with the library rather than with this file. The earlier
 * version of this test named `button` and therefore proved nothing about the
 * three families added after it. An entry point is a family when
 * `specs/components` holds its contract; `i18n` is a provider with no
 * stylesheet and no element of its own.
 */
function entryPoints() {
  return readdirSync(new URL('.', packageRoot), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !['dist', 'node_modules', 'src'].includes(entry.name))
    .filter((entry) => existsSync(new URL(`${entry.name}/ng-package.json`, packageRoot)))
    .filter((entry) =>
      existsSync(new URL(`../../specs/components/${entry.name}/contract.json`, packageRoot)),
    )
    .map((entry) => ({
      name: entry.name,
      legacy: ledger.includes(entry.name),
      bundle: new URL(`dist/fesm2022/slotted-angular-${entry.name}.mjs`, packageRoot),
    }));
}

/**
 * A rebuilt family is selected in public by `data-ui`; a family still on the
 * ledger is selected by its class until it is rebuilt. Either way the bundle
 * has to carry the selector the stylesheet was authored with, because the
 * component that lost its styles still renders and still passes every other
 * test.
 */
function identity({ legacy, name }) {
  return legacy
    ? { pattern: new RegExp(`\\.slotted-${name}\\b`), described: `.slotted-${name}` }
    : {
        pattern: new RegExp(`\\[data-ui-${name}\\]`),
        described: `[data-ui-${name}]`,
      };
}

test('finds every published entry point', () => {
  const found = entryPoints().map(({ name }) => name);
  assert.ok(found.length >= 4, `Expected several entry points, found ${found.join(', ')}`);
});

/**
 * The rule is that the bundle carries the family's layered stylesheet and that
 * the compiler scoped none of it — not that the layer is the first byte of the
 * file. `@property` cannot take effect inside `@layer`, so a family that
 * registers one has to write it before the layer, and `skeleton` does: the
 * assertion anchored to the start of the string called that a violation and
 * reported a family whose stylesheet was entirely correct.
 */
test('ships the family styles with encapsulation disabled', () => {
  for (const { bundle, name } of entryPoints()) {
    const source = readFileSync(bundle, 'utf8');
    assert.match(source, /encapsulation: i0\.ViewEncapsulation\.None/, name);
    assert.doesNotMatch(source, /@layer slotted\.components\{:host/, name);
    assert.match(source, /styles: \["[^\]]*?@layer slotted\.components\{/, name);
  }
});

test('carries the family stylesheet into its own bundle', () => {
  for (const point of entryPoints()) {
    const source = readFileSync(point.bundle, 'utf8');
    const { described, pattern } = identity(point);
    assert.ok(pattern.test(source), `${point.name} bundle carries no ${described} rule`);
  }
});

/**
 * A family whose root is its host writes the identifier as a host attribute,
 * which the partial compiler emits as `"data-ui": "name"`. An overlay family
 * renders its root inside its template, behind `@if (mounted())`, and the
 * partial compiler keeps that template as a string — a template literal
 * verbatim, a folded constant with its quotes escaped. A family that builds
 * its layer by hand writes the attribute with `setAttribute`. A directive that
 * yields to an identifier the host already carries binds `[attr.data-ui]` to
 * `writtenUi ?? 'name'`, so its own name is the fallback. Each spelling is
 * the family selecting itself; a bundle carrying none renders nothing the
 * stylesheet can find.
 */
test('writes the identifier a rebuilt family is selected by', () => {
  const rebuilt = entryPoints().filter(({ legacy }) => !legacy);
  if (rebuilt.length === 0) return;

  for (const { bundle, name } of rebuilt) {
    const source = readFileSync(bundle, 'utf8');
    assert.match(
      source,
      new RegExp(
        `"data-ui": "${name}"|data-ui=\\\\?"${name}\\\\?"|setAttribute\\('data-ui', '${name}'\\)|SelectorKey\\([^,]+, 'ui', '${name}'\\)|\\?\\? '${name}'\\)?;`,
      ),
      `${name} renders no element carrying its own identifier`,
    );
  }
});
