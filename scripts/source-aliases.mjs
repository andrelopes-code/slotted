import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * `@slotted/core/*` resolved to the source it is built from, for anything that
 * runs against this repository rather than against a published package.
 *
 * The package's own `exports` point at `dist`, which is right for a consumer
 * and wrong for every tool here: a Storybook or a test run reading `dist` sees
 * whatever the last `pnpm build:core` wrote, so a change to `packages/core/src`
 * is invisible until somebody remembers to rebuild — and a stale `dist` looks
 * exactly like a bug in the code that just changed. Aliasing removes the build
 * from the loop instead of hiding it behind a watcher: there is no rebuild to
 * wait for and no window where the two disagree.
 *
 * The Angular Storybook already does this for `@slotted/angular/*`; this is the
 * same convention, applied to the one package both bindings depend on.
 *
 * `@slotted/styles` needs nothing of the kind — it publishes its source — and
 * `@slotted/theme/styles.css` and `@slotted/themes/default.css` cannot
 * have it: they are generated from JSON and have no source stylesheet to point
 * at. Those two are what `pnpm build:tokens` exists for.
 */
const coreRoot = fileURLToPath(new URL('../packages/core/', import.meta.url));

export function coreSourceAliases() {
  const entryPoints = readdirSync(join(coreRoot, 'src'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      find: `@slotted/core/${entry.name}`,
      replacement: join(coreRoot, 'src', entry.name, 'index.ts'),
    }));

  return [
    /* A locale catalog sits one level below its entry point: `@slotted/core/i18n/pt-BR`. */
    {
      find: /^@slotted\/core\/i18n\/([\w-]+)$/,
      replacement: join(coreRoot, 'src/i18n/locales/$1.ts'),
    },
    /* The subpaths first: a bare string `find` matches by prefix, so
       `@slotted/core` would otherwise swallow `@slotted/core/number` and
       resolve it to `src/index.ts/number`. */
    ...entryPoints,
    { find: /^@slotted\/core$/, replacement: join(coreRoot, 'src/index.ts') },
  ];
}
