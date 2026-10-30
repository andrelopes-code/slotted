import { globSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import config from './main';

const repositoryRoot = resolve(process.cwd(), '../..');
const specsRoot = resolve(repositoryRoot, 'specs/components');
const reactSource = resolve(repositoryRoot, 'packages/react/src');
const storybookRoot = resolve(repositoryRoot, 'apps/storybook-react/.storybook');

/**
 * A Storybook build succeeds whether or not it found every story, so building
 * proves nothing about coverage. The Angular configuration hard-coded one
 * entry point and silently omitted two families; this guards the same class of
 * mistake here.
 */
describe('React Storybook coverage', () => {
  const families = readdirSync(specsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  it('names no single family in its story glob', () => {
    for (const pattern of config.stories as readonly string[]) {
      for (const family of families) {
        expect(pattern).not.toContain(`/${family}/`);
      }
    }
  });

  it('reaches every family that ships React stories', () => {
    const reached = new Set(
      (config.stories as readonly string[]).flatMap((pattern) =>
        globSync(pattern, { cwd: storybookRoot }).map((match) => resolve(storybookRoot, match)),
      ),
    );

    const shipped = readdirSync(reactSource, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) =>
        readdirSync(resolve(reactSource, entry.name))
          .filter((file) => file.endsWith('.stories.tsx') || file.endsWith('.stories.ts'))
          .map((file) => ({ family: entry.name, path: resolve(reactSource, entry.name, file) })),
      );

    expect(shipped.length).toBeGreaterThan(1);
    for (const { family, path } of shipped) {
      expect(reached.has(path), `${family} stories are outside the Storybook glob`).toBe(true);
    }
  });

  it('ships React stories for every family the contract declares', () => {
    for (const family of families) {
      const source = resolve(reactSource, family);
      const entries = readdirSync(source).filter((file) => file.includes('.stories.'));
      expect(entries.length, `${family} has a contract but no React stories`).toBeGreaterThan(0);
    }
  });
});
