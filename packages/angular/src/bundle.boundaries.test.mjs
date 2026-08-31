import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const packageRoot = new URL('..', import.meta.url);

/**
 * One entry point may depend on another — Input injects the Field. It must do
 * so by the published path, `@slotted/angular/field`, and never by a relative
 * path into the other entry point's source.
 *
 * ng-packagr refuses the relative form outright, and the refusal is the useful
 * kind: were it to succeed, each entry point would compile its own copy of the
 * class, and two copies of a class are two injection tokens. `inject(SlField)`
 * would find nothing, in a build reporting no error. This test states the
 * property that failure would break, against the artefacts rather than the
 * source.
 */
function entryPoints() {
  return readdirSync(new URL('.', packageRoot), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !['dist', 'node_modules', 'src'].includes(entry.name))
    .filter((entry) => existsSync(new URL(`${entry.name}/ng-package.json`, packageRoot)))
    .map((entry) => ({
      name: entry.name,
      source: readFileSync(
        new URL(`dist/fesm2022/slotted-angular-${entry.name}.mjs`, packageRoot),
        'utf8',
      ),
    }));
}

const exportedClasses = (source) =>
  [...source.matchAll(/^export \{([^}]*)\};?$/gm)]
    .flatMap(([, names]) => names.split(','))
    .map((name) =>
      name
        .trim()
        .split(/\s+as\s+/)
        .pop(),
    )
    .filter((name) => /^Sl[A-Z]/.test(name ?? ''));

const declaredClasses = (source) =>
  [...source.matchAll(/^class (Sl[A-Za-z0-9_]*)/gm)].map(([, name]) => name);

test('finds every published entry point', () => {
  assert.ok(entryPoints().length >= 4);
});

test('never compiles a second copy of another entry point’s class', () => {
  const points = entryPoints();
  const owner = new Map();
  for (const { name, source } of points) {
    for (const exported of exportedClasses(source)) owner.set(exported, name);
  }

  const violations = [];
  for (const { name, source } of points) {
    for (const declared of declaredClasses(source)) {
      const home = owner.get(declared);
      if (home !== undefined && home !== name) {
        violations.push(`${name} declares ${declared}, which belongs to ${home}`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Two copies of a class are two injection tokens:\n  ${violations.join('\n  ')}`,
  );
});

test('reaches another entry point by its published path', () => {
  const crossing = entryPoints().filter(({ source }) => source.includes("from '@slotted/angular/"));
  assert.ok(
    crossing.length > 0,
    'Input injects the Field; if nothing crosses an entry point any more, delete this test',
  );

  for (const { name, source } of entryPoints()) {
    assert.ok(
      !/from '\.\.\/[^']*\/src\//.test(source),
      `${name} reaches into another entry point's source`,
    );
  }
});
