import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import angular from '@analogjs/vite-plugin-angular';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

import { coreSourceAliases } from '../../scripts/source-aliases.mjs';

/**
 * `@slotted/react` resolved to its source, for the reason
 * `scripts/source-aliases.mjs` gives for core: the package publishes `dist`,
 * and a page that renders a stale build documents code that no longer exists.
 */
const reactRoot = fileURLToPath(new URL('../../packages/react/src/', import.meta.url));

const reactSourceAliases = () => [
  ...readdirSync(reactRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(reactRoot, entry.name, 'index.ts')))
    .map((entry) => ({
      find: `@slotted/react/${entry.name}`,
      replacement: join(reactRoot, entry.name, 'index.ts'),
    })),
  { find: /^@slotted\/react$/, replacement: join(reactRoot, 'index.ts') },
];

/**
 * `@slotted/angular/<entry>` resolved to the source the entry point publishes,
 * as the Angular Storybook does. The Analog plugin compiles that source inside
 * the program `tsconfig.angular.json` declares, so no partial-compiled `dist`
 * has to be linked at run time.
 */
const angularRoot = fileURLToPath(new URL('../../packages/angular/', import.meta.url));

const angularSourceAliases = () =>
  readdirSync(angularRoot, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && existsSync(join(angularRoot, entry.name, 'src/public-api.ts')),
    )
    .map((entry) => ({
      find: `@slotted/angular/${entry.name}`,
      replacement: join(angularRoot, entry.name, 'src/public-api.ts'),
    }));

/**
 * The files the Angular compiler emits; every other `.ts` file stays with
 * Vite's transform. A family's `*.docs.ts` is reference data the pages read at
 * build time, not part of the Angular program.
 */
const ANGULAR_SOURCE =
  /\/(apps\/docs\/examples\/angular|packages\/angular)\/(?!.+\.docs\.ts$).+\.ts$/;

/**
 * A family's `*.docs.ts` imports `defineSnippet` from the Storybook
 * workbench. The pages need that one function, not the workbench's Storybook
 * dependencies, so the specifier resolves to the module that defines it.
 */
const workbenchSnippets = fileURLToPath(
  new URL('../../tools/storybook-workbench/src/snippets.tsx', import.meta.url),
);

export default defineConfig({
  integrations: [mdx(), react()],
  /* The development host the Nexora demo also allows (`demos/nexora/angular/angular.json`). */
  server: { allowedHosts: ['devserver.local'] },
  devToolbar: { enabled: false },
  vite: {
    /* Analog switches Vite's TypeScript transform off when the config names
       none; the React islands and the site's own `.ts` files still need it. */
    oxc: { exclude: [ANGULAR_SOURCE] },
    plugins: [
      /* Analog's `optimizeDeps.include` makes every Vite instance optimize,
         `astro build` included, and its configuration differs by mode. One
         cache per mode keeps a build from replacing the dependencies a
         running `astro dev` serves. */
      {
        name: 'slotted-docs:cache-per-mode',
        config: (_config, { mode }) => ({ cacheDir: `node_modules/.vite/${mode}` }),
      },
      angular({
        tsconfig: fileURLToPath(new URL('./tsconfig.angular.json', import.meta.url)),
        transformFilter: (_code, id) => ANGULAR_SOURCE.test(id.replace(/\?.*$/, '')),
      }),
      /* An example added, changed or removed — a new family's folder above
         all — did not always reach the page the server renders: the module
         runner kept the evaluated registry and module. Both are invalidated
         in every environment and the page reloads. */
      {
        name: 'slotted-docs:example-registry',
        apply: 'serve',
        configureServer(server) {
          const registries = ['react.ts', 'angular.ts', 'sources.ts'].map((file) =>
            fileURLToPath(new URL(`./src/runtime/${file}`, import.meta.url)),
          );
          const examples = fileURLToPath(new URL('./examples/', import.meta.url));
          const refresh = (file) => {
            /* Angular package source as well: Analog's own program kept the
               old compilation of a directive edited while the server ran. */
            if (!file.startsWith(examples) && !file.startsWith(angularRoot)) return;
            for (const environment of Object.values(server.environments)) {
              /* The example itself too: an editor or a script that replaces
                 the file rather than writing into it left the old module
                 evaluated in the server's runner. */
              for (const module of environment.moduleGraph.getModulesByFile(file) ?? []) {
                environment.moduleGraph.invalidateModule(module);
              }
              for (const registry of registries) {
                for (const module of environment.moduleGraph.getModulesByFile(registry) ?? []) {
                  environment.moduleGraph.invalidateModule(module);
                }
              }
            }
            server.ws.send({ type: 'full-reload' });
          };
          server.watcher.on('add', refresh);
          server.watcher.on('change', refresh);
          server.watcher.on('unlink', refresh);
        },
      },
      /* Analog's production build defines `ngServerMode` once, from the
         config's `build.ssr`, for every environment. Astro builds the client
         and the server from one config, so the browser bundle came out with
         `ngServerMode` true and `createApplication` asked for a server
         platform (NG0401). The value is stated per environment instead. */
      {
        name: 'slotted-docs:ng-server-mode',
        enforce: 'post',
        config(config) {
          if (config.define) delete config.define.ngServerMode;
          if (config.oxc && typeof config.oxc === 'object' && config.oxc.define) {
            delete config.oxc.define.ngServerMode;
          }
        },
        configEnvironment: (name, _options, { mode }) =>
          mode === 'production'
            ? { define: { ngServerMode: name === 'client' ? 'false' : 'true' } }
            : {},
      },
    ],
    resolve: {
      alias: [
        ...reactSourceAliases(),
        ...angularSourceAliases(),
        ...coreSourceAliases(),
        { find: /^@slotted\/storybook-workbench$/, replacement: workbenchSnippets },
      ],
    },
  },
});
