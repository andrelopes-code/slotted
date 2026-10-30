import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import config from '../vite.config';

const packageRoot = join(import.meta.dirname, '..');

/** Every folder of `src` with an `index.ts` is one family entry point. */
const families = readdirSync(join(packageRoot, 'src'), { withFileTypes: true })
  .filter(
    (entry) => entry.isDirectory() && existsSync(join(packageRoot, 'src', entry.name, 'index.ts')),
  )
  .map((entry) => entry.name)
  .sort();

const exportsField = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
  .exports as Record<string, unknown>;

/**
 * The build entries and `exports` were two lists kept by hand, and they drifted:
 * `@slotted/react/checkbox`, `/text-field`, `/radio-group` and seventeen more
 * could not be imported at all, and `/spinner`, `/input` and five more pointed at
 * files no build wrote. A consumer who imports one family should not need the
 * root barrel, which carries every family's stylesheet with it.
 */
describe('entry points', () => {
  it('builds one entry per family, and the root', () => {
    const entry =
      config.build?.lib && typeof config.build.lib === 'object' ? config.build.lib.entry : {};
    expect(Object.keys(entry as Record<string, string>).sort()).toEqual(
      ['index', ...families].sort(),
    );
  });

  it('publishes every family, and nothing the build does not write', () => {
    const published = Object.keys(exportsField)
      .filter((key) => key !== '.' && key !== './styles.css' && key !== './*/styles.css')
      .map((key) => key.slice(2))
      .sort();
    expect(published).toEqual(families);
    /* One stylesheet per family, written by `css.build.mjs` into `dist/styles`. */
    expect(exportsField['./*/styles.css']).toBe('./dist/styles/*.css');
    for (const family of families) {
      expect(exportsField[`./${family}`]).toEqual({
        types: `./dist/types/${family}/index.d.ts`,
        import: `./dist/${family}.js`,
      });
    }
  });
});
