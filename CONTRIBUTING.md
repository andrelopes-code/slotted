# Contributing to Slotted

Slotted is experimental. Architectural and public API decisions should remain small, explicit, and reversible until stabilized through a dedicated decision record.

## Prerequisites

- Node.js 24
- pnpm 11.24.0

Enable the pinned package manager and install dependencies:

```bash
corepack enable
corepack install --global pnpm@11.24.0
pnpm install --frozen-lockfile
```

## Running It

- `pnpm dev`: builds whatever the servers need, then starts both Storybooks —
  React on 6006 and Angular on 6007. `pnpm dev:react` and `pnpm dev:angular`
  start one.
- `pnpm build`: every generated artifact, in dependency order. Turbo caches it,
  so a second run with nothing changed finishes in well under a second. When in
  doubt, run it.

### What is generated, and when a change needs a build

Component work needs no build at all: both Storybooks read `packages/styles`,
`packages/react/src`, `packages/angular/*/src` and `packages/core/src` straight
from source, and a saved file is on the page before the editor loses focus.

There is no watch mode and there should not be one. A watcher would still leave
a process to run, a lag between saving and the artifact appearing, and a window
in which a reader sees neither the old value nor the new one. Resolving to
source removes the artifact from the loop instead of racing it —
`scripts/source-aliases.mjs` does that for `@slotted/core`, and the Angular
Storybook already did it for `@slotted/angular/*`. Only what cannot be resolved
to source is left to a build, and that is the table below.

Each input below reaches what reads it through the step beside it, and a change
to it is invisible until that step runs:

| Changed                                                | Build                                        | Because                                                                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/theme/src/contract.json`                     | `pnpm build:tokens`                          | the token stylesheet and the layer order are emitted from the contract                                                                                       |
| `packages/themes/src/default/theme.mjs`, `values.json` | `pnpm build:tokens`                          | the glyphs are drawn into `values.json` from `glyphs.json`, and `slotted-build-theme` emits the theme stylesheet from `theme.mjs`, which reads `values.json` |
| `packages/theme/src/generated/*`                       | `pnpm --filter @slotted/theme generate`      | the contract and the public hooks are generated from a family's `tokens.json`                                                                                |
| `packages/theme/src/recipes/standard.ts`               | `node scripts/calibrate-standard-recipe.mjs` | generated from `reference.json`; run after `pnpm --filter @slotted/theme build`                                                                              |
| `packages/core/src/**`                                 | none for Storybook or tests                  | aliased to source by `scripts/source-aliases.mjs`; build only before publishing                                                                              |
| `packages/react/src/**`, `packages/angular/*/src/**`   | none for Storybook                           | `pnpm build` before publishing or before reading `dist`; the servers use source                                                                              |

`pnpm build` covers all of them and is the answer whenever the table is more
trouble than the wait.

### A stale `dist` must never reach a dev server

`apps/storybook-react/.storybook/preview.tsx` used to import
`@slotted/react/styles.css`, which resolves to `packages/react/dist` — a bundle
of every family's CSS from the last build. The stories render from source and
each component imports its own sheet, so the bundle was a second, older copy of
every rule, loaded later and winning the cascade. A stylesheet fixed in source
stayed broken on the page until somebody rebuilt a package the dev server does
not need. That import is gone; the Angular preview never had one. Do not add a
`dist` stylesheet to a preview: the layer order comes from
`@slotted/theme/styles.css`, which is imported first.

## Repository layout

```
apps/       docs (the documentation site), storybook-react, storybook-angular
demos/      nexora/{angular,backend,domain.md}, its own pnpm workspace; .registry/ (beta tarballs, ignored)
packages/   core, react, angular, styles, theme, themes — the published set
tools/      harness, storybook-workbench — workspace packages, never published
specs/      one contract.json and its test per family
scripts/    repository scripts, flat, named by verb
docs/       the law at the root; decisions/, product/, process/, history/, archive/
```

`docs/decisions/0002-repository-layout.md` records the rule; `docs/README.md`
indexes every document.

## The beta channel

`demos/` holds applications that consume the library as a published
package: a separate pnpm installation each, no workspace link, every
`@slotted/*` installed from a tarball in `demos/.registry/`.
`demos/nexora` is its own pnpm workspace (`angular`, `backend`) with its own
lockfile, outside the repository's workspace, so a clean clone installs and
checks the library without any tarball; `pnpm --dir demos/nexora install`
installs the demo once the tarballs exist. `demos/.registry/` is not committed;
it is written by:

- `pnpm pack:beta`: builds every package and packs the ones that declare a
  published surface (`files` or `publishConfig.directory`) at their current
  version.

- `pnpm demo:refresh`: the loop after one library change — builds
  `@slotted/angular`, `@slotted/core`, `@slotted/theme` and `@slotted/themes`,
  repacks only those four at the current version, points
  `demos/nexora/angular/package.json` at those tarballs
  (`pack-beta.mjs --pin`), reinstalls `demos/nexora` and deletes
  `demos/nexora/angular/.angular/cache`, so `demos/nexora/angular` sees the
  change on its next `pnpm start` (a running dev server is restarted). The
  dev server pre-bundles the packages into that cache and would otherwise
  keep serving the copy it bundled before the refresh.
- `pnpm demo:nexora`: `demo:refresh` followed by `ng serve` of
  `demos/nexora/angular`, from the repository root.

A demo names the version it consumes in its own `package.json`; `pnpm
demo:refresh` is the deliberate step that moves Nexora to the current one. `pnpm test:release` checks
that the published set and the shared version stay what this section says.

## Publishing to npm

The six packages under `packages/` are released together, at one shared
version. A release is one command on a clean `main` and a workflow:

1. `pnpm release --dry-run` prints the next version, its dist-tag and the
   `CHANGELOG.md` entry. `pnpm release` without an argument moves a beta to the
   next beta (`0.1.0-beta.0` → `0.1.0-beta.1`); `pnpm release 0.2.0-beta.0`
   names the version.
2. `pnpm release` refuses a branch other than `main`, a dirty tree, a `main`
   behind or ahead of `origin/main`, and a commit whose CI has not passed. It
   writes the version into the six manifests and the entry into
   `CHANGELOG.md`, commits `chore(release): v<version>`, tags `v<version>` and
   pushes both.
3. The tag starts `.github/workflows/release.yml`, which builds and runs
   `node scripts/release.mjs --publish`. It does not validate again: the commit
   it releases passed CI, and the release commit changes only the versions and
   `CHANGELOG.md`, which is also why CI does not run on it. The step
   publishes in dependency order and skips a version already on the registry,
   so re-running a failed workflow finishes the release.

The workflow authenticates by npm Trusted Publishing (OIDC): no npm token and no
one-time password exist. Each package lists `andrelopes-code/slotted` and
`release.yml` as its trusted publisher on npmjs.com. npm configures a trusted
publisher only on a package that exists, so a package added to `packages/`
publishes its first version by hand from an interactive terminal, and is
configured before the next release, from a terminal logged in with
`npm login --auth-type=web` (a token that bypasses two-factor authentication is
refused):

```sh
npx -y npm@11.21.1 trust github @slotted/<package> --file release.yml --repo andrelopes-code/slotted --allow-publish -y
```

npm older than 11.21 sends no `--allow-publish` permission and the registry
answers `400 permissions is required`; `npm trust list @slotted/<package>`
shows the configuration. Every version of the `0.x` line goes to
`latest`; after `1.0.0`, a prerelease goes to its own tag (`beta`, `rc`).

A version appears on the registry up to two minutes after the workflow ends;
`npm view @slotted/<package> dist-tags` confirms it.

## Adding a locale

The catalogs live in `packages/core/src/i18n` (`docs/decisions/0003-internationalization.md`). A locale `<tag>` is:

1. `packages/core/src/i18n/locales/<tag>/<family>.ts` for every file in `messages/`, each exporting a constant typed by that family's `<Pascal>Messages` interface, with the slot names of the English message.
2. `packages/core/src/i18n/locales/<tag>.ts`, exporting `<TAG>: SlottedMessages` assembled from those files (`pt-BR.ts` is the model).
3. An entry `'i18n/<tag>'` in `packages/core/vite.config.ts` and an export `./i18n/<tag>` in `packages/core/package.json`.

`SlottedMessages` refuses a locale that misses a family or a key, and `pnpm test:i18n` refuses one whose slots or grammar differ from `en-US`. An application then passes it to `SlottedProvider` or `provideSlotted` under `catalogs`.

## Validation Commands

- `pnpm check`: normal fast repository gate.
- `pnpm check:affected`: changed task-bearing packages and their dependents.
- `pnpm check:full`: all task-bearing packages and root checks.
- `pnpm test:i18n`: no family writes words outside the catalog; every locale matches `en-US`.
- `pnpm format`: explicitly rewrite supported files with Prettier.

`pnpm typecheck`, and every command above that runs it, reads the packages' declarations from `dist`: a clean clone runs `pnpm build` once first.

The Angular specs run with `isolate: true` (`angular.json`). The builder's default shares one module state across the spec files of a worker, and 24 of 3178 tests then failed only in the full run, never alone.

Choose the smallest command that covers the changed surface. Pull requests that alter toolchain or cross-package contracts should use `pnpm check:full`.

## Product Direction

Read [`docs/product/prd.md`](docs/product/prd.md) for product context. Its phases and open questions are not an automatic implementation checklist.
