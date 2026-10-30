# 0002 — Repository layout by content type

Status: accepted, 2026-09-18.

## Context

The tree grew one directory at a time. `apps/` held both Storybook workbenches
and, under `apps/demos/`, a consumer application and the simulated backend it
reads. `packages/` held a tooling package nobody publishes beside the six that
ship, and a theme one level deeper than every other package. `docs/` listed
four reading classes in its index while the files of three of them sat flat at
the root, and two product documents sat at the repository root beside the
README.

## Decision

A top-level directory holds one type of content, and a path names what it is.

| Directory   | Holds                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `packages/` | Published packages only. A theme is `packages/theme-<name>`; its manifest name matches.         |
| `tools/`    | Workspace packages that are never published: the visual harness, the Storybook workbench.       |
| `apps/`     | The two Storybook workbenches and the documentation site (`apps/docs`).                         |
| `demos/`    | Consumer applications, one directory per product: `demos/<product>/{<binding>,backend,domain}`. |
| `specs/`    | The public contract of each family and the test that verifies it.                               |
| `scripts/`  | Repository scripts, flat, named by verb (`verify-`, `pack-`, `generate-`).                      |
| `docs/`     | The law at the root; `decisions/`, `product/`, `process/` and `evals/` below it.                |

Within `docs/`, a file at the root binds every family. `process/` is edited
every session, and `evals/` receives one report per run of `pnpm eval:agent-docs`.
Session plans and design notes are local working notes in `docs/history/`, and
session checkpoints in `.claude/progress/`; git ignores both.

The beta channel tarballs live in `demos/.registry/`, beside the applications
that install them, and are ignored by git.

The repository root keeps `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `LICENSE`
and tool configuration. Product documents are `docs/product/`.

## Consequences

- `pnpm-workspace.yaml` lists `apps/*`, `demos/*/*`, `packages/*`, `tools/*`.
- `scripts/verify-package-layers.mjs` reads every workspace root, so a tooling
  package placed under `tools/` is still held to the layer rule.
- A demo installs `@slotted/*` from `../../.registry/`; `pnpm demo:refresh`
  rewrites the tarballs in place.
- `angular.json` stays at the root: the Angular CLI locates the workspace file
  by walking up from the directory an `ng` command runs in, and
  `packages/angular` is the only project it declares.
- A new theme is `packages/theme-<name>` with `@slotted/theme-<name>` as its
  manifest name; the Storybook workbench discovers it by that prefix.
- `packages/angular/<family>/` stays beside `src/` and `package.json`:
  ng-packagr names a secondary entry point by its path under the package root,
  so `packages/angular/button/` is what makes `@slotted/angular/button`
  importable. Moving the families under `src/` would put `src` in every import.
- Development skills have one source, `.claude/skills/<skill>/`.
