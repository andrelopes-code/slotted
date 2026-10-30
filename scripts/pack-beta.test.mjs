import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { isPublishable, pinToRegistry, readPackageDirectories, tarballName } from './pack-beta.mjs';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));

function manifests() {
  return readPackageDirectories(join(repositoryRoot, 'packages')).map((directory) =>
    JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')),
  );
}

test('a package is published when it declares a published surface', () => {
  assert.equal(isPublishable({ files: ['dist'] }), true);
  assert.equal(isPublishable({ publishConfig: { directory: 'dist' } }), true);
  assert.equal(isPublishable({ publishConfig: { access: 'public' } }), false);
  assert.equal(isPublishable({}), false);
});

test('the tarball is named the way pnpm pack names it', () => {
  assert.equal(
    tarballName({ name: '@slotted/themes', version: '0.1.0-beta.3' }),
    'slotted-themes-0.1.0-beta.3.tgz',
  );
});

test('--pin moves registry specifiers to the packed tarball and leaves the rest', () => {
  const manifest = pinToRegistry(
    {
      dependencies: {
        '@slotted/core': 'file:../../.registry/slotted-core-0.1.0-beta.0.tgz',
        '@slotted/react': 'file:../../.registry/slotted-react-0.1.0-beta.0.tgz',
        rxjs: '~7.8.0',
      },
    },
    { '@slotted/core': { tarball: 'slotted-core-0.1.0-beta.17.tgz' } },
  );
  assert.deepEqual(manifest.dependencies, {
    '@slotted/core': 'file:../../.registry/slotted-core-0.1.0-beta.17.tgz',
    '@slotted/react': 'file:../../.registry/slotted-react-0.1.0-beta.0.tgz',
    rxjs: '~7.8.0',
  });
});

test('every consumer-facing package is published and the workbench is not', () => {
  const published = manifests()
    .filter(isPublishable)
    .map((manifest) => manifest.name)
    .sort();

  assert.deepEqual(published, [
    '@slotted/angular',
    '@slotted/core',
    '@slotted/react',
    '@slotted/styles',
    '@slotted/theme',
    '@slotted/themes',
  ]);
});

test('every published package carries the same beta version', () => {
  const versions = new Set(
    manifests()
      .filter(isPublishable)
      .map((m) => m.version),
  );
  assert.equal(versions.size, 1, `versions diverged: ${[...versions].join(', ')}`);
  assert.match([...versions][0], /^\d+\.\d+\.\d+-beta\.\d+$/);
});

/**
 * `pnpm pack` rewrites `workspace:*` only from inside a workspace project.
 * The Angular package publishes its `dist`, which is not one, so the rewrite
 * happens only when the pack is run from the source package with
 * `publishConfig.directory` naming the output.
 */
test('the Angular package publishes its ng-packagr output', () => {
  const angular = manifests().find((manifest) => manifest.name === '@slotted/angular');
  assert.equal(angular.publishConfig?.directory, 'dist');
});

/**
 * A binding imports `@slotted/core` and `@slotted/theme` and leaves both out
 * of its bundle, so the application installs one copy of each and the binding
 * names them as peers. A runtime `dependencies` entry would make the packed
 * manifest fetch them from a registry they are not published to.
 */
test('the bindings name the workspace packages they import as peers', () => {
  for (const name of ['@slotted/react', '@slotted/angular']) {
    const binding = manifests().find((manifest) => manifest.name === name);
    for (const peer of ['@slotted/core', '@slotted/theme']) {
      assert.equal(binding.peerDependencies?.[peer], 'workspace:*', `${name} › ${peer}`);
      assert.equal(binding.devDependencies?.[peer], 'workspace:*', `${name} › ${peer}`);
    }
    assert.deepEqual(
      Object.keys(binding.dependencies ?? {}).filter((dependency) =>
        dependency.startsWith('@slotted/'),
      ),
      [],
      name,
    );
  }
});

/**
 * `demo:refresh` builds and packs what the demo installs from the beta
 * channel; a peer of one of those tarballs that is neither packed nor
 * installed leaves the demo unable to resolve it.
 */
test('demo:refresh packs every tarball the demo installs, and the demo installs their peers', () => {
  const root = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8'));
  const demo = JSON.parse(
    readFileSync(join(repositoryRoot, 'demos/nexora/angular/package.json'), 'utf8'),
  );
  const packed = /--only ([\w@/,-]+)/.exec(root.scripts['demo:refresh'])[1].split(',');
  const built = [...root.scripts['demo:refresh'].matchAll(/--filter ([\w@/-]+)/g)].map(
    (match) => match[1],
  );
  const installed = Object.entries(demo.dependencies)
    .filter(([, specifier]) => specifier.startsWith('file:../../.registry/'))
    .map(([name]) => name);

  assert.deepEqual([...installed].sort(), [...packed].sort());
  assert.deepEqual([...built].sort(), [...packed].sort());
  for (const name of installed) {
    const manifest = manifests().find((candidate) => candidate.name === name);
    const peers = Object.keys(manifest.peerDependencies ?? {}).filter(
      (peer) => peer.startsWith('@slotted/') && !manifest.peerDependenciesMeta?.[peer]?.optional,
    );
    for (const peer of peers) assert.ok(installed.includes(peer), `${name} › ${peer}`);
  }
});
