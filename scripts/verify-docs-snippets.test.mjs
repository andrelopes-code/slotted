import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;

/**
 * Each framework's reference pages are written by copying the other's and
 * editing them, which is how the two Storybooks stay scenario for scenario.
 * The one thing that copy cannot be trusted to change is the snippet language:
 * a `tsx` snippet in an Angular page still formats, still renders, and shows
 * the reader React code under an Angular badge.
 */
const FRAMEWORKS = [
  { language: 'tsx', name: 'React', roots: [join(ROOT, 'packages/react/src')] },
  {
    language: 'angular',
    name: 'Angular',
    roots: readdirSync(join(ROOT, 'packages/angular'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !['dist', 'node_modules'].includes(entry.name))
      .map((entry) => join(ROOT, 'packages/angular', entry.name, 'src')),
  },
];

function docsFiles(roots) {
  return roots.flatMap((root) => {
    let entries;
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch {
      return [];
    }
    return entries.flatMap((entry) => {
      const path = join(root, entry.name);
      if (entry.isDirectory()) return docsFiles([path]);
      return entry.name.endsWith('.docs.ts') ? [path] : [];
    });
  });
}

test('finds the reference pages of both frameworks', () => {
  for (const { name, roots } of FRAMEWORKS) {
    assert.ok(docsFiles(roots).length >= 5, `Found too few ${name} reference pages`);
  }
});

test('writes every snippet in the language of the page it is on', () => {
  const violations = [];

  for (const { language, roots } of FRAMEWORKS) {
    for (const path of docsFiles(roots)) {
      const source = readFileSync(path, 'utf8');
      for (const [, found] of source.matchAll(/language:\s*'([a-z]+)'/g)) {
        if (found !== language) {
          violations.push(`${path.slice(ROOT.length)}: a ${found} snippet on a ${language} page`);
        }
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `A reference page must show code in its own framework:\n  ${violations.join('\n  ')}`,
  );
});

test('gives every snippet an id naming the framework it belongs to', () => {
  const violations = [];

  for (const { language, roots } of FRAMEWORKS) {
    const marker = language === 'tsx' ? 'react' : 'angular';
    for (const path of docsFiles(roots)) {
      const source = readFileSync(path, 'utf8');
      for (const [, id] of source.matchAll(/id:\s*'([a-z0-9-]+)'/g)) {
        if (!id.includes(marker)) {
          violations.push(`${path.slice(ROOT.length)}: snippet ${id} does not name ${marker}`);
        }
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `A snippet id carries its framework, so a copied page cannot collide:\n  ${violations.join('\n  ')}`,
  );
});
