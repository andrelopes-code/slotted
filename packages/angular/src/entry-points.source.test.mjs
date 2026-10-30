import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const packageRoot = new URL('..', import.meta.url).pathname;

/**
 * A component's `styleUrl` has to be written as a string literal in the
 * decorator. ng-packagr folds a constant and inlines the sheet anyway, so the
 * published bundle looks correct; Storybook's compiler does not, and leaves
 * the decorator holding an identifier it never resolves. The component then
 * renders with no styles at all, in a build that reported no error — headings
 * keep the user agent's margins and every type size collapses to one.
 *
 * The defect is invisible to every test that reads `dist`, which is why this
 * one reads the source.
 */
function componentSources() {
  return readdirSync(packageRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !['dist', 'node_modules', 'src'].includes(entry.name))
    .filter((entry) => existsSync(join(packageRoot, entry.name, 'ng-package.json')))
    .flatMap((entry) => {
      const source = join(packageRoot, entry.name, 'src');
      return readdirSync(source)
        .filter(
          (file) => file.endsWith('.ts') && !file.includes('.spec.') && !file.includes('.stories.'),
        )
        .map((file) => ({
          path: `${entry.name}/src/${file}`,
          code: readFileSync(join(source, file), 'utf8'),
        }));
    });
}

test('finds the source of every published entry point', () => {
  assert.ok(componentSources().length >= 10);
});

test('names every stylesheet with a literal a compiler can resolve', () => {
  const violations = [];

  for (const { code, path } of componentSources()) {
    for (const [, value] of code.matchAll(/styleUrl\s*:\s*([^,\n]+)/g)) {
      if (!/^'[^']+'$/.test(value.trim())) violations.push(`${path}: styleUrl: ${value.trim()}`);
    }
    for (const [, value] of code.matchAll(/styleUrls\s*:\s*(\[[\s\S]*?\]|[^,\n]+)/g)) {
      const list = value.match(/^\[([\s\S]*)\]$/);
      if (!list) {
        violations.push(`${path}: styleUrls: ${value.trim()}`);
        continue;
      }
      for (const entry of list[1].split(',')) {
        if (entry.trim().length === 0) continue;
        if (!/^'[^']+'$/.test(entry.trim()))
          violations.push(`${path}: styleUrls entry ${entry.trim()}`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `A stylesheet named by an identifier is dropped by the Storybook compiler:\n  ${violations.join('\n  ')}`,
  );
});

/**
 * A family folder is an entry point only through its `ng-package.json`.
 * `switch` lost the file in a sweep that removed several and restored the
 * others, and the package then shipped without `@slotted/angular/switch`:
 * the documentation site, which compiles from source, still worked, and every
 * consumer's import failed.
 */
test('publishes every family folder as an entry point', () => {
  const missing = readdirSync(packageRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !['dist', 'node_modules', 'src'].includes(entry.name))
    .filter((entry) => existsSync(join(packageRoot, entry.name, 'src', 'public-api.ts')))
    .filter((entry) => !existsSync(join(packageRoot, entry.name, 'ng-package.json')))
    .map((entry) => entry.name);
  assert.deepEqual(missing, []);
});

/**
 * A consumer's template binds an input from outside the directive, so a
 * `protected` input fails the consumer's strict template check (TS2445). The
 * library's own specs compile without that check and pass anyway.
 */
test('declares every input, model and output public', () => {
  const hidden = componentSources().flatMap(({ path, code }) =>
    [
      ...code.matchAll(
        /^\s*(?:protected|private)\s+readonly\s+(\w+)\s*=\s*(?:input|model|output)\b/gm,
      ),
    ].map((match) => `${path} › ${match[1]}`),
  );
  assert.deepEqual(hidden, []);
});
