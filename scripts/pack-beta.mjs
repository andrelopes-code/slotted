import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The beta channel is a directory of tarballs, one per package, that a demo
 * installs by `file:` exactly as it would install a published version. A
 * tarball carries only what `files` or `publishConfig.directory` names, so an
 * `import` the demo can write is an `import` a consumer can write, and a file
 * that leaked out of `src` into the tarball is visible here before a registry
 * ever sees it.
 *
 * A package is published when its manifest declares a published surface —
 * `files` or `publishConfig.directory`. Tooling that declares neither, such as
 * the Storybook workbench, stays out without a list somebody has to maintain.
 *
 * `--only a,b` packs those packages and leaves the other tarballs in place:
 * the loop a demo runs after one library change, without the whole build.
 * `--pin <package.json>` points that manifest's `file:` specifiers into the
 * registry at the tarballs just packed, so the next install receives them.
 */
export const REGISTRY_DIRECTORY = 'demos/.registry';

export function isPublishable(manifest) {
  return Array.isArray(manifest.files) || typeof manifest.publishConfig?.directory === 'string';
}

export function tarballName(manifest) {
  return `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`;
}

export function readPackageDirectories(root) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
    .flatMap((entry) => {
      const directory = join(root, entry.name);
      return existsSync(join(directory, 'package.json'))
        ? [directory]
        : readPackageDirectories(directory);
    });
}

export function pinToRegistry(manifest, index) {
  for (const [name, specifier] of Object.entries(manifest.dependencies ?? {})) {
    if (specifier.includes('.registry/') && index[name]) {
      manifest.dependencies[name] = specifier.replace(/[^/]+\.tgz$/, index[name].tarball);
    }
  }
  return manifest;
}

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
  const registry = join(repositoryRoot, REGISTRY_DIRECTORY);
  const onlyIndex = process.argv.indexOf('--only');
  const only =
    onlyIndex === -1 ? null : (process.argv[onlyIndex + 1] ?? '').split(',').filter(Boolean);

  const packages = readPackageDirectories(join(repositoryRoot, 'packages'))
    .map((directory) => ({
      directory,
      manifest: JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')),
    }))
    .filter(({ manifest }) => isPublishable(manifest))
    .filter(({ manifest }) => only === null || only.includes(manifest.name));
  if (only !== null && packages.length !== only.length) {
    const found = packages.map(({ manifest }) => manifest.name);
    throw new Error(
      `--only names a package that is not published: ${only.filter((n) => !found.includes(n)).join(', ')}`,
    );
  }

  if (only === null) rmSync(registry, { recursive: true, force: true });
  mkdirSync(registry, { recursive: true });

  const indexPath = join(registry, 'index.json');
  const index =
    only === null || !existsSync(indexPath) ? {} : JSON.parse(readFileSync(indexPath, 'utf8'));
  for (const { directory, manifest } of packages) {
    run('pnpm', ['pack', '--pack-destination', registry], directory);
    index[manifest.name] = { version: manifest.version, tarball: tarballName(manifest) };
    console.log(
      `${manifest.name}@${manifest.version} → ${relative(repositoryRoot, join(registry, tarballName(manifest)))}`,
    );
  }

  writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);

  const pinIndex = process.argv.indexOf('--pin');
  if (pinIndex !== -1) {
    const manifestPath = join(repositoryRoot, process.argv[pinIndex + 1]);
    const manifest = pinToRegistry(JSON.parse(readFileSync(manifestPath, 'utf8')), index);
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}
