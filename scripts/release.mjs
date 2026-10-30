import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { currentRegistry, registryAt } from '../tools/agent-docs/src/registry.ts';
import { isPublishable, readPackageDirectories, tarballName } from './pack-beta.mjs';

/**
 * One release moves the six published packages to one shared version, in two
 * halves that never run on the same machine.
 *
 * `pnpm release [version] [--dry-run]` runs locally: it refuses anything but a
 * clean `main` equal to `origin/main` whose CI passed, writes the version into
 * every published manifest and a `CHANGELOG.md` entry from the commit subjects
 * since the last `v*` tag, commits, tags `v<version>` and pushes both.
 *
 * `node scripts/release.mjs --publish` runs only in `.github/workflows/release.yml`,
 * on that tag. npm Trusted Publishing authenticates the workflow by OIDC, so no
 * token and no one-time password exist anywhere. A version already on the
 * registry is skipped, which makes a re-run after a partial failure finish the
 * release instead of failing on the packages that went out.
 */

const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+)\.(\d+))?$/;

function parse(version) {
  const match = VERSION.exec(version);
  if (match === null) throw new Error(`${version} is not a version this release accepts`);
  const [, major, minor, patch, preid, prerelease] = match;
  return {
    core: [Number(major), Number(minor), Number(patch)],
    preid,
    prerelease: prerelease === undefined ? undefined : Number(prerelease),
  };
}

/** Negative when `a` comes before `b`; a prerelease comes before its stable version. */
function compare(a, b) {
  const left = parse(a);
  const right = parse(b);
  for (let index = 0; index < 3; index += 1) {
    if (left.core[index] !== right.core[index]) return left.core[index] - right.core[index];
  }
  if (left.preid === undefined || right.preid === undefined) {
    return (left.preid === undefined ? 1 : 0) - (right.preid === undefined ? 1 : 0);
  }
  if (left.preid !== right.preid) return left.preid < right.preid ? -1 : 1;
  return left.prerelease - right.prerelease;
}

export function nextVersion(current, requested) {
  if (requested !== undefined) {
    parse(requested);
    if (compare(requested, current) <= 0) {
      throw new Error(`${requested} is not after the current ${current}`);
    }
    return requested;
  }
  const { core, preid, prerelease } = parse(current);
  if (preid === undefined) {
    throw new Error(`${current} is stable: name the next one as an explicit version`);
  }
  return `${core.join('.')}-${preid}.${prerelease + 1}`;
}

export function distTag(version) {
  const { core, preid } = parse(version);
  return preid === undefined || core[0] === 0 ? 'latest' : preid;
}

export function publishOrder(manifests) {
  const names = new Set(manifests.map(({ name }) => name));
  const needs = new Map(
    manifests.map((manifest) => [
      manifest.name,
      Object.keys({
        ...manifest.dependencies,
        ...manifest.peerDependencies,
        ...manifest.optionalDependencies,
      }).filter((name) => names.has(name)),
    ]),
  );
  const order = [];
  const visiting = new Set();
  const visit = (name) => {
    if (order.includes(name)) return;
    if (visiting.has(name)) throw new Error(`dependency cycle through ${name}`);
    visiting.add(name);
    for (const dependency of needs.get(name)) visit(dependency);
    visiting.delete(name);
    order.push(name);
  };
  for (const name of [...names].sort()) visit(name);
  return order;
}

const BOOKKEEPING = [/^Merge /, /^docs\(progress\)/];

/** The guideline ids a release adds, retires and rewrites, read from the topics at the last tag and now. */
export function guidelineChanges(previous, current) {
  // Only a rule released as active can be retired or rewritten in a release.
  const newlyRetired = Object.keys(current)
    .filter((id) => current[id].status === 'retired' && previous[id]?.status === 'active')
    .sort();
  const retired = newlyRetired.filter((id) => current[id].replacedBy === undefined);
  const rewritten = newlyRetired.filter((id) => current[id].replacedBy !== undefined);
  const replacements = new Set(rewritten.map((id) => current[id].replacedBy));
  const added = Object.keys(current)
    .filter(
      (id) =>
        current[id].status === 'active' && previous[id] === undefined && !replacements.has(id),
    )
    .sort();
  const lines = [];
  if (added.length > 0) lines.push(`- Added: ${added.join(', ')}`);
  if (retired.length > 0) lines.push(`- Retired: ${retired.join(', ')}`);
  if (rewritten.length > 0)
    lines.push(
      `- Rewritten: ${rewritten.map((id) => `${id} → ${current[id].replacedBy}`).join(', ')}`,
    );
  return lines;
}

export function changelogEntry(version, date, subjects, guidelines = []) {
  const lines = subjects
    .filter((subject) => !BOOKKEEPING.some((pattern) => pattern.test(subject)))
    .map((subject) => `- ${subject.split(' — ')[0].trim()}`);
  const block = guidelines.length > 0 ? ['', '### Guidelines', '', ...guidelines] : [];
  return [`## ${version} — ${date}`, '', ...lines, ...block, ''].join('\n');
}

export function setManifestVersion(source, version) {
  return source.replace(/"version": "[^"]*"/, `"version": "${version}"`);
}

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));

function output(command, args, cwd = repositoryRoot) {
  return execFileSync(command, args, { cwd, encoding: 'utf8' }).trim();
}

function step(command, args, cwd = repositoryRoot) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function publishedPackages() {
  return readPackageDirectories(join(repositoryRoot, 'packages'))
    .map((directory) => {
      const path = join(directory, 'package.json');
      return { directory, path, manifest: JSON.parse(readFileSync(path, 'utf8')) };
    })
    .filter(({ manifest }) => isPublishable(manifest));
}

function sharedVersion(packages) {
  const versions = new Set(packages.map(({ manifest }) => manifest.version));
  if (versions.size !== 1) {
    throw new Error(
      `the published packages disagree on their version: ${[...versions].join(', ')}`,
    );
  }
  return [...versions][0];
}

function refuse(message) {
  console.error(`release: ${message}`);
  process.exit(1);
}

function prepare(requested, dryRun) {
  if (output('git', ['rev-parse', '--abbrev-ref', 'HEAD']) !== 'main') refuse('run it on main');
  if (output('git', ['status', '--porcelain']) !== '') refuse('the working tree is not clean');
  step('git', ['fetch', '--quiet', '--tags', 'origin', 'main']);
  const head = output('git', ['rev-parse', 'HEAD']);
  if (head !== output('git', ['rev-parse', 'origin/main'])) refuse('main is not origin/main');

  const runs = JSON.parse(
    output('gh', [
      'run',
      'list',
      '--commit',
      head,
      '--workflow',
      'ci.yml',
      '--json',
      'status,conclusion',
    ]),
  );
  if (!runs.some(({ status, conclusion }) => status === 'completed' && conclusion === 'success')) {
    refuse(`CI has not passed on ${head.slice(0, 8)}; wait for it or fix it first`);
  }

  const packages = publishedPackages();
  const version = nextVersion(sharedVersion(packages), requested);
  const tag = `v${version}`;
  if (spawnSync('git', ['rev-parse', '--quiet', '--verify', `refs/tags/${tag}`]).status === 0) {
    refuse(`${tag} already exists`);
  }
  const previous = output('git', ['describe', '--tags', '--abbrev=0', '--match', 'v*']);
  const subjects = output('git', ['log', `${previous}..HEAD`, '--format=%s'])
    .split('\n')
    .filter(Boolean);
  const guidelines = guidelineChanges(
    registryAt(repositoryRoot, previous) ?? {},
    currentRegistry(repositoryRoot),
  );
  const entry = changelogEntry(
    version,
    new Date().toISOString().slice(0, 10),
    subjects,
    guidelines,
  );

  console.log(`${previous} → ${tag}, dist-tag ${distTag(version)}\n\n${entry}`);
  if (dryRun) return;

  for (const { path } of packages) {
    writeFileSync(path, setManifestVersion(readFileSync(path, 'utf8'), version));
  }
  const changelogPath = join(repositoryRoot, 'CHANGELOG.md');
  const changelog = readFileSync(changelogPath, 'utf8');
  const heading = changelog.indexOf('\n## ');
  writeFileSync(
    changelogPath,
    heading === -1
      ? `${changelog.trimEnd()}\n\n${entry}`
      : `${changelog.slice(0, heading + 1)}${entry}\n${changelog.slice(heading + 1)}`,
  );
  step('pnpm', ['exec', 'prettier', '--write', '--log-level', 'warn', 'CHANGELOG.md']);
  step('git', ['add', 'CHANGELOG.md', ...packages.map(({ path }) => path)]);
  step('git', ['commit', '--quiet', '--message', `chore(release): ${tag}`]);
  step('git', ['tag', '--annotate', tag, '--message', tag]);
  step('git', ['push', '--atomic', 'origin', 'main', tag]);
  console.log(`\n${tag} pushed. The Release workflow publishes it: gh run watch`);
}

function publish() {
  if (process.env.GITHUB_ACTIONS !== 'true') {
    refuse('--publish runs only in the Release workflow, which npm trusts by OIDC');
  }
  const tag = process.env.GITHUB_REF_NAME ?? '';
  if (!tag.startsWith('v')) refuse(`${tag || 'no ref'} is not a release tag`);
  const version = tag.slice(1);
  const packages = publishedPackages();
  if (sharedVersion(packages) !== version) {
    refuse(`${tag} does not name the version in the manifests, ${sharedVersion(packages)}`);
  }
  step('git', ['fetch', '--quiet', 'origin', 'main']);
  if (spawnSync('git', ['merge-base', '--is-ancestor', 'HEAD', 'origin/main']).status !== 0) {
    refuse(`${tag} points at a commit that is not on main`);
  }

  const destination = mkdtempSync(join(tmpdir(), 'slotted-release-'));
  const byName = new Map(packages.map((entry) => [entry.manifest.name, entry]));
  for (const name of publishOrder(packages.map(({ manifest }) => manifest))) {
    const { directory, manifest } = byName.get(name);
    const existing = spawnSync('npm', ['view', `${name}@${version}`, 'version'], {
      encoding: 'utf8',
    });
    if (existing.status === 0 && existing.stdout.trim() === version) {
      console.log(`${name}@${version} is already on the registry; skipped`);
      continue;
    }
    step('pnpm', ['pack', '--pack-destination', destination], directory);
    step('npm', [
      'publish',
      join(destination, tarballName(manifest)),
      '--access',
      'public',
      '--tag',
      distTag(version),
      '--provenance',
    ]);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--publish')) publish();
  else {
    prepare(
      args.find((arg) => !arg.startsWith('--')),
      args.includes('--dry-run'),
    );
  }
}
