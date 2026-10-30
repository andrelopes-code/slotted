import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  DENSITIES,
  DIRECTIONS,
  GLOBAL_TYPES,
  INITIAL_GLOBALS,
  LOCALES,
  SCHEMES,
  THEMES,
  resolveWorkbenchGlobals,
} from './globals';

/**
 * Vite serves this module over its own protocol, so `import.meta.url` is not a
 * path on disk. The workspace root is found by walking up from the directory
 * the runner was started in instead.
 */
function packagesRoot() {
  let directory = process.cwd();

  while (!existsSync(join(directory, 'pnpm-workspace.yaml'))) {
    const parent = dirname(directory);
    if (parent === directory) throw new Error(`No workspace root above ${process.cwd()}`);
    directory = parent;
  }

  return join(directory, 'packages');
}

/**
 * `@slotted/themes` publishes one stylesheet per theme, `./<name>.css`, and
 * `slotted-build-theme` names that file after the theme module's `name`.
 */
function publishedThemeNames() {
  const manifest = JSON.parse(
    readFileSync(join(packagesRoot(), 'themes', 'package.json'), 'utf8'),
  ) as { exports: Record<string, unknown> };

  return Object.keys(manifest.exports).flatMap((subpath) => {
    const match = /^\.\/([a-z][a-z0-9-]*)\.css$/.exec(subpath);
    return match ? [match[1]] : [];
  });
}

describe('resolveWorkbenchGlobals', () => {
  it('returns safe defaults for an absent Storybook context', () => {
    expect(resolveWorkbenchGlobals(undefined)).toEqual({
      background: '#f4f6f8',
      density: 'comfortable',
      direction: 'ltr',
      locale: 'en-US',
      scheme: 'light',
      theme: 'default',
    });
  });

  it('resolves supported dark compact values', () => {
    expect(
      resolveWorkbenchGlobals({ theme: 'default', scheme: 'dark', density: 'compact' }),
    ).toEqual({
      background: '#09090b',
      density: 'compact',
      direction: 'ltr',
      locale: 'en-US',
      scheme: 'dark',
      theme: 'default',
    });
  });

  it('keeps initial globals aligned with the resolver', () => {
    expect(resolveWorkbenchGlobals(INITIAL_GLOBALS)).toMatchObject(INITIAL_GLOBALS);
  });

  it('offers every axis the theme emits', () => {
    expect(SCHEMES).toEqual(['light', 'dark', 'high-contrast']);
    expect(DENSITIES).toEqual(['comfortable', 'compact', 'dense']);
    expect(DIRECTIONS).toEqual(['ltr', 'rtl']);
    expect(GLOBAL_TYPES.theme.toolbar.items).toEqual([...THEMES]);
    expect(GLOBAL_TYPES.scheme.toolbar.items).toEqual([...SCHEMES]);
    expect(GLOBAL_TYPES.density.toolbar.items).toEqual([...DENSITIES]);
    expect(GLOBAL_TYPES.direction.toolbar.items).toEqual([...DIRECTIONS]);
    expect(LOCALES).toEqual(['en-US', 'pt-BR']);
    expect(GLOBAL_TYPES.locale.toolbar.items).toEqual([...LOCALES]);
  });

  /** Every family is read in each published language without a story of its own. */
  it('resolves the language it is handed and falls back to English', () => {
    expect(resolveWorkbenchGlobals({ locale: 'pt-BR' })).toMatchObject({ locale: 'pt-BR' });
    expect(resolveWorkbenchGlobals({ locale: 'xx' })).toMatchObject({ locale: 'en-US' });
  });

  /**
   * A theme the toolbar does not offer cannot be reviewed, and a name the
   * toolbar offers that no stylesheet carries paints nothing. The list is held
   * to the theme packages the workspace publishes so neither can happen
   * silently.
   */
  it('offers every theme the workspace publishes', () => {
    expect([...THEMES].sort()).toEqual(publishedThemeNames().sort());
  });

  /**
   * The resolver used to return the literal `default` and ignore the global it
   * was handed, so the attribute could never name anything else and the theme
   * axis could not be observed at all.
   */
  it('resolves the theme it is handed and falls back to the published default', () => {
    for (const theme of THEMES) {
      expect(resolveWorkbenchGlobals({ theme })).toMatchObject({ theme });
    }
    expect(resolveWorkbenchGlobals({ theme: 'sepia' })).toMatchObject({ theme: 'default' });
  });

  it('resolves the high-contrast scheme, the dense density and a mirrored document', () => {
    expect(
      resolveWorkbenchGlobals({ scheme: 'high-contrast', density: 'dense', direction: 'rtl' }),
    ).toEqual({
      background: '#ffffff',
      density: 'dense',
      direction: 'rtl',
      locale: 'en-US',
      scheme: 'high-contrast',
      theme: 'default',
    });
  });

  it('falls back to the safe value for an axis it does not recognize', () => {
    expect(
      resolveWorkbenchGlobals({ scheme: 'sepia', density: 'roomy', direction: 'sideways' }),
    ).toMatchObject({ scheme: 'light', density: 'comfortable', direction: 'ltr' });
  });
});
