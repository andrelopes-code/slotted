import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = new URL('..', import.meta.url).pathname;

/**
 * A preset says how TypeScript judges code. A project says which code, and
 * where the state of checking it lives. `tsconfig.base.json` was both, and the
 * repository paid for it in every session for weeks.
 *
 * Eight configs extend the base, and a relative path in an extended config
 * resolves against the config that declared it — so one `tsBuildInfoFile` line
 * gave nine different programs one incremental file. A build left it describing
 * a package's program; the first root typecheck after it read that state,
 * reported 814 circular errors across every `*.stories.tsx`, rewrote the file,
 * and the second run passed with nothing changed. Whoever hit it learned to run
 * the typecheck twice, which is how a broken guard becomes a habit (G6).
 *
 * These tests are the rule rather than the repair: the option is gone, and so
 * is the shape of file that could hold the next one.
 */

/** Everything a config may say about *which* files, or about state. */
const PROJECT_OPTIONS = [
  'tsBuildInfoFile',
  'incremental',
  'composite',
  'outDir',
  'outFile',
  'rootDir',
  'declarationDir',
  'tsBuildInfoFile',
];

const PROJECT_KEYS = ['include', 'exclude', 'files', 'references'];

/**
 * A tsconfig is JSON with comments, and TypeScript's own parser is what reads
 * it. Stripping the comments with a regular expression is what a first draft of
 * this file did, and the `paths` entry for the Angular entry points was enough
 * to defeat it: its glob opens and closes a block comment all by itself, so the
 * file came back mangled.
 */
function readConfig(path) {
  const { config, error } = ts.readConfigFile(path, (file) => readFileSync(file, 'utf8'));
  assert.equal(error, undefined, `${path} does not parse`);
  return config;
}

function configsExtending(name) {
  const found = [];
  const walk = (directory) => {
    /* The entries answer what they are themselves, rather than being stat'd by
       path. `statSync` follows a symlink, and a headless Chrome that dies
       mid-capture leaves its profile behind under `tools/harness/out` with a
       `SingletonCookie` pointing at a socket that is gone — a dangling link
       this walk then threw ENOENT on. A `Dirent` for a symlink is not a
       directory and does not name a tsconfig, so it is simply passed over. */
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const { name: entryName } = entry;
      if (entryName === 'node_modules' || entryName === 'dist' || entryName.startsWith('.'))
        continue;
      const path = join(directory, entryName);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!entry.isFile() || !entryName.startsWith('tsconfig') || !entryName.endsWith('.json'))
        continue;
      const config = readConfig(path);
      if (typeof config.extends === 'string' && config.extends.includes(name)) found.push(path);
    }
  };
  walk(root);
  return found;
}

test('the base is a preset, and says nothing about which files it applies to', () => {
  const base = readConfig(join(root, 'tsconfig.base.json'));
  const stated = PROJECT_KEYS.filter((key) => key in base);
  assert.deepEqual(
    stated,
    [],
    `tsconfig.base.json states ${stated.join(', ')}, which belongs to a project`,
  );
});

/**
 * The one that actually bit. An option naming a path is inherited by every
 * config that extends the base, resolved against the base — so eight packages
 * would share one file again.
 */
test('the base names no output and no incremental state', () => {
  const base = readConfig(join(root, 'tsconfig.base.json'));
  const stated = PROJECT_OPTIONS.filter((option) => option in (base.compilerOptions ?? {}));
  assert.deepEqual(
    stated,
    [],
    `tsconfig.base.json states ${stated.join(', ')}; every config extending it would share the one path`,
  );
});

test('the whole-repository project is a file of its own, and extends the preset', () => {
  const project = readConfig(join(root, 'tsconfig.json'));
  assert.equal(project.extends, './tsconfig.base.json');
  assert.ok(Array.isArray(project.exclude), 'the project names no exclusions');
});

/**
 * A build writes declarations beside the sources they came from. Taking them as
 * source put the same type in the program twice — 432 files of it — once from
 * the file that declares it and once from the file the build emitted.
 */
test('the project takes no build output as source', () => {
  const project = readConfig(join(root, 'tsconfig.json'));
  for (const output of ['**/dist/**', '**/node_modules/**']) {
    assert.ok(
      project.exclude.includes(output),
      `tsconfig.json compiles ${output} as if a build output were source`,
    );
  }
});

/**
 * Whatever a package needs of its own it states for itself. This is the check
 * that would have caught the original defect from the other end: a package
 * config that names no state of its own is one relying on the base to name it.
 */
test('no config that extends the base inherits a path from it', () => {
  const extending = configsExtending('tsconfig.base.json');
  assert.ok(extending.length >= 6, `expected the preset to be extended, found ${extending.length}`);

  const base = readConfig(join(root, 'tsconfig.base.json'));
  for (const option of PROJECT_OPTIONS) {
    const value = base.compilerOptions?.[option];
    assert.equal(
      value,
      undefined,
      `${extending.length} configs extend the base and would all resolve ${option} to ${value}`,
    );
  }
});
