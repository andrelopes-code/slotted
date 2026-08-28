# Multi-Framework Button Walking Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first complete vertical slice of Slotted: token contract, first-class default theme, native React and Angular Buttons, composed Storybook, CI artifacts, and GitHub Pages publication.

**Architecture:** The implementation is split into four ordered plans so no run owns the whole phase. React and Angular share only the private component contract and CSS token contract; each framework implementation and Storybook remains native.

**Tech Stack:** Node.js 24, pnpm 11, Turborepo 2, TypeScript 6, React 19, Angular 22, Vite 8, Vitest 4, Storybook 10, GitHub Actions, GitHub Pages.

---

## Required Design

Read before execution:

- `docs/superpowers/specs/2026-08-28-multi-framework-button-walking-skeleton-design.md`
- `AGENTS.md`

`PROJECT-PRD.md` remains context, not an automatic backlog.

## Why This Is a Plan Set

The approved design crosses four boundaries with real dependency edges. Putting them in one implementation run would recreate the long-run failure mode the repository is designed to avoid. Execute these plans in order, and stop at any plan boundary without leaving an incoherent package state:

1. [Contract, Tokens, and Default Theme](./2026-08-28-button-01-contract-tokens-theme.md)
2. [React Button and React Storybook](./2026-08-28-button-02-react-storybook.md)
3. [Angular Button and Angular Storybook](./2026-08-28-button-03-angular-storybook.md)
4. [Composition, CI, and GitHub Pages](./2026-08-28-button-04-composition-pages.md)

Each plan ends in independently verifiable software and its own commits. Do not begin the next plan while the current plan's verification is failing.

## Dependency Baseline

Use exact versions when the dependency is first added and let `pnpm-lock.yaml` record the complete graph:

| Dependency | Version |
| --- | --- |
| `react`, `react-dom` | `19.2.8` |
| `@types/react` | `19.2.18` |
| `@types/react-dom` | `19.2.5` |
| `vite` | `8.2.2` |
| `@vitejs/plugin-react` | `6.1.1` |
| `vitest` | `4.1.11` |
| `jsdom` | `30.0.1` |
| `@testing-library/react` | `16.3.3` |
| `@testing-library/jest-dom` | `7.0.1` |
| `@types/node` | `24.13.3` |
| `@angular/core`, `@angular/common`, `@angular/compiler`, `@angular/compiler-cli`, `@angular/platform-browser` | `22.1.4` |
| `@angular/cli`, `@angular/build` | `22.1.6` |
| `ng-packagr` | `22.1.1` |
| `storybook`, `@storybook/react-vite`, `@storybook/angular-vite`, `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/blocks` | `10.5.10` |
| `@compodoc/compodoc` | `2.0.0` |
| `rxjs` | `7.8.2` |

Do not use caret ranges for root development tooling. Framework `peerDependencies` describe the baseline major without claiming a tested public support matrix.

## Final File Map

```text
specs/components/button/
├── contract.json
└── README.md

packages/tokens/
├── package.json
├── scripts/build.mjs
├── src/contract.json
├── src/validate-theme.mjs
└── test/validate-theme.test.mjs

packages/themes/default/
├── package.json
├── scripts/build-theme.mjs
├── src/theme.json
└── test/build-theme.test.mjs

packages/react/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── vite.config.ts
└── src/button/*

packages/angular/
├── package.json
├── ng-package.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── src/public-api.ts
└── button/*

apps/storybook-react/.storybook/*
apps/storybook-angular/.storybook/*
scripts/assemble-storybook.mjs
.github/workflows/ci.yml
angular.json
```

## Cross-Plan Rules

- Use TDD for executable behavior: observe a targeted test fail before implementing it.
- Keep `pnpm check` free of Storybook static builds.
- Run package-filtered verification while inside Plans 1–3.
- Run `pnpm check:full` and `pnpm storybook:build` only in Plan 4 or for cross-cutting failures.
- Do not install Playwright, a Vitest browser provider, Chromatic, or screenshot tooling.
- Do not publish npm packages or add release automation.
- Do not add another theme or another component to make an abstraction look reusable.
- Request the single human visual review only after the composed catalog is deployed.

## Final Evidence

The complete plan set is finished only with fresh evidence from:

```bash
pnpm install --frozen-lockfile
pnpm check:full
pnpm storybook:build
git status --short
```

Expected:

- all three verification commands exit `0`;
- the composed site contains React and Angular `index.json` files;
- `git status --short` is empty after the final commit;
- the GitHub Actions run succeeds;
- GitHub Pages serves the composed catalog;
- the user, not the agent, performs the visual approval.
