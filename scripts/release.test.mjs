import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  changelogEntry,
  distTag,
  guidelineChanges,
  nextVersion,
  publishOrder,
  setManifestVersion,
} from './release.mjs';

test('moves a beta to the next beta, and takes an explicit version as given', () => {
  assert.equal(nextVersion('0.1.0-beta.0'), '0.1.0-beta.1');
  assert.equal(nextVersion('0.1.0-beta.9'), '0.1.0-beta.10');
  assert.equal(nextVersion('0.1.0-beta.3', '0.2.0-beta.0'), '0.2.0-beta.0');
  assert.equal(nextVersion('0.9.0-beta.4', '1.0.0'), '1.0.0');
});

test('refuses a version it cannot derive or that does not move forward', () => {
  assert.throws(() => nextVersion('1.0.0'), /explicit version/);
  assert.throws(() => nextVersion('0.1.0-beta.2', '0.1.0-beta.2'), /not after/);
  assert.throws(() => nextVersion('0.1.0-beta.2', '0.1.0-beta.1'), /not after/);
  assert.throws(() => nextVersion('0.1.0-beta.2', '0.1.0-beta.2.1'), /not a version/);
  assert.throws(() => nextVersion('0.1.0-beta.2', 'v0.2.0'), /not a version/);
});

/**
 * The 0.x line has no stable version to protect, and a plain `npm install`
 * reads `latest`: a beta that went to another tag would leave it on the first
 * beta for good. A prerelease after 1.0 keeps off `latest`.
 */
test('publishes the 0.x line and every stable version to latest', () => {
  assert.equal(distTag('0.1.0-beta.4'), 'latest');
  assert.equal(distTag('1.0.0'), 'latest');
  assert.equal(distTag('1.2.0-beta.1'), 'beta');
  assert.equal(distTag('2.0.0-rc.0'), 'rc');
});

test('publishes a package after every @slotted package it depends on', () => {
  const order = publishOrder([
    {
      name: '@slotted/react',
      peerDependencies: { '@slotted/core': '*', '@slotted/theme': '*', react: '*' },
    },
    { name: '@slotted/themes', peerDependencies: { '@slotted/theme': '*' } },
    { name: '@slotted/core' },
    { name: '@slotted/theme', dependencies: { lightningcss: '1' } },
    { name: '@slotted/styles' },
  ]);
  const at = (name) => order.indexOf(name);
  assert.equal(order.length, 5);
  assert.ok(at('@slotted/core') < at('@slotted/react'));
  assert.ok(at('@slotted/theme') < at('@slotted/react'));
  assert.ok(at('@slotted/theme') < at('@slotted/themes'));
});

test('refuses a dependency cycle between packages', () => {
  assert.throws(
    () =>
      publishOrder([
        { name: '@slotted/a', dependencies: { '@slotted/b': '*' } },
        { name: '@slotted/b', peerDependencies: { '@slotted/a': '*' } },
      ]),
    /cycle/,
  );
});

test('writes one changelog entry from the subjects, without their detail or the bookkeeping', () => {
  const entry = changelogEntry('0.1.0-beta.1', '2026-10-20', [
    'fix(table): the range filter writes ISO — detail that stays out',
    'docs(progress): session checkpoint',
    'Merge pull request #2 from andrelopes-code/x',
    'feat(drawer): bottom sheet',
  ]);
  assert.equal(
    entry,
    [
      '## 0.1.0-beta.1 — 2026-10-20',
      '',
      '- fix(table): the range filter writes ISO',
      '- feat(drawer): bottom sheet',
      '',
    ].join('\n'),
  );
});

test('changes only the version field of a manifest, keeping its formatting', () => {
  const source = readFileSync(new URL('../packages/themes/package.json', import.meta.url), 'utf8');
  const changed = setManifestVersion(source, '9.9.9-beta.9');
  assert.equal(JSON.parse(changed).version, '9.9.9-beta.9');
  assert.equal(
    changed.replace('"version": "9.9.9-beta.9"', ''),
    source.replace(`"version": "${JSON.parse(source).version}"`, ''),
  );
});
test('lists the guideline ids a release adds, retires and rewrites', () => {
  const previous = {
    'AF-01': { level: 'MUST', status: 'active' },
    'LP-07': { level: 'SHOULD', status: 'active' },
    'PM-03': { level: 'MUST', status: 'active' },
  };
  const current = {
    'AF-01': { level: 'MUST', status: 'active' },
    'AF-08': { level: 'SHOULD', status: 'active' },
    'LP-07': { level: 'SHOULD', status: 'retired', replacedBy: 'LP-12' },
    'LP-12': { level: 'SHOULD', status: 'active' },
    'PM-03': { level: 'MUST', status: 'retired' },
  };
  assert.deepEqual(guidelineChanges(previous, current), [
    '- Added: AF-08',
    '- Retired: PM-03',
    '- Rewritten: LP-07 → LP-12',
  ]);
  assert.deepEqual(guidelineChanges(current, current), []);
});

test('the first release with guidelines lists its active rules as added, and no retired one', () => {
  const current = {
    'AF-01': { level: 'MUST', status: 'active' },
    'LP-07': { level: 'SHOULD', status: 'retired', replacedBy: 'LP-12' },
    'LP-12': { level: 'SHOULD', status: 'active' },
  };
  assert.deepEqual(guidelineChanges({}, current), ['- Added: AF-01, LP-12']);
});

test('an entry carries the guideline block when there is one', () => {
  assert.equal(
    changelogEntry('0.1.0-beta.2', '2026-10-20', ['feat(x): y'], ['- Added: AF-08']),
    [
      '## 0.1.0-beta.2 — 2026-10-20',
      '',
      '- feat(x): y',
      '',
      '### Guidelines',
      '',
      '- Added: AF-08',
      '',
    ].join('\n'),
  );
});
