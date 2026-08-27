# Initial AI-Native Repository Foundation Design

## Status

Approved design for the initial repository foundation. This document defines the scope and operating model for the first implementation plan. It does not authorize implementation of the broader product described by `PROJECT-PRD.md`.

## Context

Slotted is intended to become long-lived UI infrastructure for dense, product-oriented web applications. React and Angular are the only frameworks in the initial product scope. Each framework must retain its native ergonomics; they may share conceptual specifications and contracts without sharing implementation code.

The repository is currently clean and has no established toolchain. The immediate goal is to create only an operational foundation suitable for predominantly AI-authored development. Components, visual foundations, and product APIs are intentionally deferred.

The operating model must avoid common sources of agent waste:

- monolithic runs that continue for hours without meaningful progress;
- mandatory heavyweight reviews after every small step;
- exploratory browser automation;
- Playwright snapshots used as a generic source of UI understanding;
- full-repository verification after every local change;
- duplicated or excessively detailed agent instructions;
- premature abstractions and dependencies.

## Goals

The initial foundation will provide:

- a public GitHub repository named `slotted`;
- a reproducible Node.js and pnpm environment;
- a pnpm workspace coordinated by Turborepo;
- minimal TypeScript, linting, and formatting configuration;
- proportional local verification commands;
- a minimal GitHub Actions validation workflow;
- concise repository instructions for coding agents;
- placeholder directories for future React and Angular packages;
- public-facing documentation appropriate for an experimental repository.

## Non-Goals

This foundation will not include:

- UI components or framework APIs;
- design tokens, themes, icons, or density implementation;
- shared runtime primitives;
- Storybook or another executable documentation application;
- Playwright or other browser automation;
- a unit-test runner before testable production code exists;
- npm publishing, release automation, or Changesets;
- remote Turborepo caching;
- dependency update bots;
- Git hooks, staged-file hooks, or commit-message enforcement;
- branch protection configuration;
- resolution of the open architectural questions in `PROJECT-PRD.md`.

## Repository Structure

The initial repository will use this structure:

```text
/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── decisions/
│   └── superpowers/
│       └── specs/
├── packages/
│   ├── angular/
│   └── react/
├── .editorconfig
├── .gitignore
├── .node-version
├── AGENTS.md
├── CONTRIBUTING.md
├── LICENSE
├── PROJECT-PRD.md
├── README.md
├── eslint.config.js
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── prettier.config.js
├── tsconfig.base.json
└── turbo.json
```

`packages/react` and `packages/angular` are directory anchors only. Each contains a short README explaining its intended role. They do not contain components, public APIs, or publishable package manifests. Package names and packaging strategy remain deferred until the corresponding ADR is approved.

Configuration stays at the repository root while it is small. The foundation will not create internal configuration packages.

## Toolchain

The initial toolchain is deliberately conventional:

- Node.js 24 LTS, represented by major version `24` in `.node-version` and the root package engine constraint;
- pnpm, with the exact stable version selected during implementation and pinned in the root `packageManager` field;
- Turborepo, pinned through `package.json` and `pnpm-lock.yaml`;
- TypeScript with strict defaults in `tsconfig.base.json`;
- ESLint flat configuration with `typescript-eslint`;
- Prettier for formatting only.

All dependency versions are installed as exact development dependencies and committed to the lockfile. Tools may be upgraded later through explicit maintenance work; CI must not float to unspecified versions.

Each future package will own ordinary package scripts such as `lint`, `typecheck`, `test`, and `build`. Turborepo coordinates those scripts but does not replace or hide them. A package must remain understandable and operable without knowledge of Turborepo internals.

## Root Commands

The root exposes these stable commands:

```text
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm check
pnpm check:affected
pnpm check:full
```

Their contracts are:

- `format` is the only command in this group allowed to rewrite files.
- `format:check`, `lint`, and `typecheck` are read-only verification commands.
- `check` runs the cheapest relevant repository checks and is the normal local gate.
- `check:affected` runs checks for changed task-bearing packages and their dependents. Before task-bearing packages exist, it intentionally delegates to `check`.
- `check:full` validates all task-bearing packages plus root checks. Before task-bearing packages exist, it intentionally delegates to `check`.

No check command accesses the browser or depends on network access after dependencies have been installed.

## AI Operating Contract

The root `AGENTS.md` is the single normative source for repository-specific agent behavior. It must remain concise and avoid copying general-purpose agent documentation.

The default workflow is:

1. Read only the context needed for the task.
2. State or infer a bounded, observable outcome.
3. Modify the smallest coherent set of files.
4. Select verification based on the changed surface and risk.
5. Resolve related failures and report concrete evidence.

Verification is proportional:

| Change surface | Default verification |
| --- | --- |
| Isolated documentation or configuration | Specific checker for that artifact |
| One task-bearing package | Filtered package checks |
| Shared contract or dependency edge | Affected packages and dependents |
| Toolchain, release, or cross-cutting change | Full repository checks |
| Visual behavior | A previously defined deterministic visual test |
| Security-sensitive or otherwise high-risk behavior | Deterministic checks plus an independent review |

The repository does not impose hard task timeouts. Time is a signal for a progress checkpoint, not a failure condition. When work becomes long or changes phase, the agent reports:

- the result already obtained;
- available evidence;
- the current problem;
- the next materially different attempt.

If attempts repeat without new evidence, the agent must reassess or split the task. Continued progress permits continued execution.

The default workflow does not require subagents, independent reviewers, extensive plans, full test suites, or browser automation. Those mechanisms are introduced only when task risk or scope justifies them.

Playwright must not be used for exploratory browsing, generic UI inspection, broad screenshot collection, or open-ended visual review. It may be introduced later only for named, deterministic scenarios with explicit assertions and clear failure semantics.

## Continuous Integration

The initial GitHub Actions workflow runs on pull requests and pushes to `main`. It performs:

1. repository checkout;
2. Node.js 24 setup using `.node-version`;
3. pnpm setup using the version pinned in `package.json`;
4. dependency installation with a frozen lockfile;
5. `pnpm check:full`.

Runs for superseded commits on the same branch are cancelled through a workflow concurrency group.

The workflow has read-only repository permissions unless GitHub requires an additional permission for a specific validation step. It does not format files, commit changes, publish packages, create releases, open pull requests, or retry failing checks automatically.

The initial workflow has one operating-system and Node.js configuration. Compatibility matrices are deferred until the project publishes packages with an explicit support policy. Turborepo remote caching is also deferred. The package-manager store cache provided by the GitHub setup action may be used because it does not alter task semantics.

## Failure Behavior

Local and CI checks must:

- exit non-zero on relevant failures;
- identify the failing tool or package;
- avoid automatically mutating source files;
- avoid hiding failures behind unconditional retries;
- keep normal output concise while preserving a way to request detailed diagnostics;
- avoid turning an unavailable affected-range comparison into silent success.

CI is a validation authority, not a self-healing agent. Corrections occur in a new local change and are verified again.

## GitHub Repository

Implementation will create a public repository using GitHub CLI from the authenticated account:

```text
gh repo create slotted --public --source=. --remote=origin
```

The repository uses `main` as its default branch and the MIT license. The initial push occurs only after the foundation has been verified locally and committed. Repository publishing does not include npm publication, a GitHub release, branch protection, or additional external services.

## Documentation

`README.md` explains:

- the project purpose;
- its experimental status;
- the React and Angular scope;
- the distinction between shared specifications and framework-native implementations;
- environment setup;
- the stable root commands;
- links to `PROJECT-PRD.md` and `CONTRIBUTING.md`.

`CONTRIBUTING.md` documents the same commands from a contributor perspective without duplicating the agent operating contract. Architectural decisions will be added to `docs/decisions` only when a real decision must be stabilized.

`PROJECT-PRD.md` remains product context. Its phases and open questions do not become automatic implementation tasks.

## Acceptance Criteria

The initial foundation is complete when:

- the repository contains the agreed structure without product implementation;
- Node.js and pnpm versions are reproducible and documented;
- a clean `pnpm install --frozen-lockfile` succeeds;
- every documented root verification command succeeds;
- verification commands are read-only except for `pnpm format`;
- `packages/react` and `packages/angular` contain no component or public API decisions;
- `AGENTS.md` expresses the approved proportional-verification and progress-checkpoint model;
- the GitHub Actions workflow is syntactically valid and passes on the initial push;
- the public GitHub repository is connected as `origin`;
- no deferred tool or product capability has been added.

## Deferred Decisions

The following remain explicitly undecided:

- npm namespace and final package names;
- package-boundary and export strategy;
- React and Angular build pipelines;
- supported framework and browser version matrices;
- shared runtime primitives;
- tokens, themes, icons, and CSS architecture;
- test runners and browser-test infrastructure;
- Storybook or alternative documentation tooling;
- component APIs and component catalog;
- release trains, SemVer details, and deprecation windows;
- remote caching and distributed CI;
- dependency update automation.

These decisions require dedicated ADRs or component-level specifications when their corresponding work enters scope.
