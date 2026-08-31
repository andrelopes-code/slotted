import { globSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import config from './main';

const repositoryRoot = resolve(process.cwd(), '../..');
const specsRoot = resolve(repositoryRoot, 'specs/components');
const angularRoot = resolve(repositoryRoot, 'packages/angular');

/**
 * A Storybook build succeeds whether or not it found every story, so building
 * proves nothing about coverage. This asserts that the glob actually reaches
 * every family, which a hard-coded entry point path silently failed to do.
 */
describe('Angular Storybook coverage', () => {
  const families = readdirSync(specsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  it('knows about more than one family', () => {
    expect(families.length).toBeGreaterThan(1);
  });

  it('names no single entry point in its story glob', () => {
    for (const pattern of config.stories as readonly string[]) {
      for (const family of families) {
        expect(pattern).not.toContain(`/${family}/src/`);
      }
    }
  });

  it('reaches every family that ships Angular stories', () => {
    const storybookRoot = resolve(repositoryRoot, 'apps/storybook-angular/.storybook');
    const reached = new Set(
      (config.stories as readonly string[]).flatMap((pattern) =>
        globSync(pattern, { cwd: storybookRoot }).map((match) => resolve(storybookRoot, match)),
      ),
    );

    const shipped = readdirSync(angularRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !['dist', 'node_modules'].includes(entry.name))
      .flatMap((entry) => {
        const source = resolve(angularRoot, entry.name, 'src');
        try {
          return readdirSync(source)
            .filter((file) => file.endsWith('.stories.ts'))
            .map((file) => ({ family: entry.name, path: resolve(source, file) }));
        } catch {
          return [];
        }
      });

    expect(shipped.length).toBeGreaterThan(1);
    for (const { family, path } of shipped) {
      expect(reached.has(path), `${family} stories are outside the Storybook glob`).toBe(true);
    }
  });

  it('documents every family the contract declares', () => {
    const titles = families.map((family) => {
      const entries = readdirSync(resolve(angularRoot, family, 'src')).filter((file) =>
        file.endsWith('.stories.ts'),
      );
      return { family, hasStories: entries.length > 0 };
    });

    for (const { family, hasStories } of titles) {
      expect(hasStories, `${family} has a contract but no Angular stories`).toBe(true);
    }
  });
});

it('keeps the manifest scripts intact', () => {
  const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
  expect(manifest.scripts['build:storybook']).toContain('storybook build');
});
