# Multi-Framework Button Walking Skeleton Design

## Status

Awaiting review of the written specification. The design has been approved in conversation, but implementation remains unauthorized until this document is reviewed and an implementation plan is approved.

## Context

Slotted has an operational monorepo foundation but no product implementation. The next phase must prove that the repository can produce a real component for React and Angular without introducing the long, browser-heavy agent loops the foundation explicitly avoids.

The phase is a walking skeleton, not a miniature final product. It must establish durable extension paths for a complete component library while implementing only enough surface to validate them. The governing rule is:

> Deliver incrementally; design for completeness.

React and Angular share contracts and visual foundations, not component runtime code. Visual correctness remains a human decision supported by a public Storybook catalog.

## Goals

This phase will:

- establish private workspace packages named `@slotted/tokens`, `@slotted/theme-default`, `@slotted/react`, and `@slotted/angular`;
- implement the first Button slice in idiomatic React and Angular;
- prove a structured but lightweight component-contract workflow for AI-authored changes;
- prove first-class themes that can change the full visual language rather than only colors;
- provide separate React and Angular Storybooks joined through Storybook composition;
- provide Autodocs, theme controls, and useful human accessibility inspection;
- build deterministic package and Storybook artifacts in CI;
- publish the composed catalog from `main` to GitHub Pages;
- preserve fast, proportional local feedback without browser automation.

## Current-Phase Non-Goals

These capabilities are deferred, not rejected as permanent product capabilities:

- publishing packages to npm;
- release automation, public SemVer commitments, or deprecation policy automation;
- a public React, Angular, or browser compatibility matrix;
- multiple production theme packages beyond the default theme;
- the complete Button family or every planned Button capability;
- icons, overlays, or application-level providers;
- public pull-request preview deployments;
- Playwright, screenshot collection, Chromatic, or visual-regression infrastructure;
- browser tests for every story;
- autonomous visual approval by an AI agent.

## Architecture

The phase introduces the following boundaries:

```text
specs/
└── components/
    └── button/
        ├── contract.json
        └── README.md

packages/
├── tokens/                 @slotted/tokens
├── themes/
│   └── default/            @slotted/theme-default
├── react/                  @slotted/react
└── angular/                @slotted/angular

apps/
├── storybook-react/        primary catalog and composition host
└── storybook-angular/      composed Angular catalog
```

All four `@slotted/*` packages remain private during this phase. Their names and output shapes prepare the repository for later distribution without implying that their APIs are ready to publish.

The dependency direction is:

```text
component contract ───────────────┐
                                  ├──> React implementation
token contract ──> default theme ─┼──> Angular implementation
                                  └──> Storybook catalogs
```

React and Angular never depend on one another. Neither framework package depends on the default theme. No `core` package, Web Component runtime, or shared framework abstraction is introduced.

## Multi-Framework Component Model

Slotted will use a shared structured contract with framework-native implementations.

The shared contract may define:

- semantics and purpose;
- conceptual anatomy;
- supported variants, tones, sizes, and states;
- accessibility invariants;
- theme-token requirements;
- required Storybook scenarios;
- the currently implemented capability set.

It does not define framework lifecycle, component runtime, framework-specific types, or implementation structure.

React uses a native `<button>` rendered by a React component. Angular uses a standalone component with the attribute selector `button[slButton]`. The Angular form preserves native button semantics while permitting an internal template and stable composition points; a template-less directive would be too restrictive for the planned Button anatomy.

## Incremental Delivery and Complete Capability Horizon

The first implementation is not the permanent limit of Button. Each component README distinguishes:

1. permanent invariants;
2. capabilities implemented now;
3. a non-normative capability horizon;
4. known extension seams.

The Button-family horizon includes:

- async loading and progress;
- leading and trailing visuals;
- icon-only actions;
- responsive and full-width layout;
- complete native form participation;
- additional sizes, densities, themes, tones, variants, and states;
- forced-colors and high-contrast behavior;
- right-to-left layout;
- `IconButton`;
- `LinkButton`;
- `ToggleButton`;
- `ButtonGroup`;
- `SplitButton`;
- menu-trigger and composed-action integrations;
- SSR and multiple interaction modes.

Completeness is achieved through a complete semantic family, not by accumulating unrelated booleans on one Button. Navigation, pressed state, grouping, and split actions may therefore become separate components that share visual contracts.

Before accepting an initial implementation decision, the implementer must check whether it makes an anticipated capability impossible or unnecessarily breaking. This check does not require implementing the capability early.

## Lightweight Component Contracts

`specs/components/button/contract.json` contains only facts that are read by deterministic validation. It is private repository coordination data, not a runtime or published API.

`specs/components/button/README.md` contains rationale, semantic guidance, accessibility behavior, examples, and the non-normative capability horizon.

Guardrails prevent the contract from becoming a parallel product:

- framework types remain owned by their framework packages;
- implementations are not generated from the contract;
- a contract change may ship in the same task as its implementation;
- no universal schema is imposed on every kind of component;
- planned capabilities stay in prose instead of becoming an obligatory machine backlog;
- duplicated lists must acquire one source of truth or a deterministic comparison;
- after three components, the repository reviews whether structured JSON is reducing real drift;
- if the JSON is not consumed by at least two useful checks, it is removed before becoming convention.

The initial Button contract should be intentionally small. It records only the current axes, required theme tokens, required story scenarios, and framework parity facts needed by validation.

For the first slice, the JSON is consumed by separate React and Angular parity checks and by story-scenario validation. If those checks cannot consume a field meaningfully, that field does not belong in the JSON.

## Initial Button Surface

The initial conceptual API contains:

- `variant`: `solid`, `outline`, or `ghost`;
- `tone`: `accent`, `neutral`, or `danger`;
- `size`: `sm`, `md`, or `lg`;
- inherited `comfortable` or `compact` density;
- inherited `light` or `dark` color scheme;
- default, hover, active, focus-visible, and disabled states;
- logical leading and trailing composition points;
- native content and accessible-name mechanisms.

The defaults are `variant="solid"`, `tone="accent"`, and `size="md"`. A solid danger action is therefore expressed by combining `variant="solid"` with `tone="danger"`; other legitimate variant-and-tone combinations remain available.

Equivalent usage will look like:

```tsx
<Button variant="solid" tone="accent" size="md">
  Save
</Button>
```

```html
<button slButton variant="solid" tone="accent" size="md">
  Save
</button>
```

Framework-specific composition remains idiomatic:

```tsx
<Button leading={<SaveIcon />} trailing={<ShortcutHint />}>
  Save
</Button>
```

```html
<button slButton>
  <app-save-icon slButtonLeading />
  Save
  <app-shortcut-hint slButtonTrailing />
</button>
```

The default native type is `button` to avoid accidental form submission. Consumers can explicitly request `submit` or `reset`. React forwards appropriate native attributes and a ref. Angular preserves native attributes, events, and form behavior on the host button.

Leading and trailing composition use logical rather than left/right naming so that the anatomy remains compatible with right-to-left layouts. The exact framework syntax may be idiomatic, but the conceptual slots and rendered state hooks remain equivalent.

The first slice defers loading, polymorphic links, toggle state, groups, split actions, full-width layout, and an icon package. These are deferred capabilities with named extension paths, not permanent exclusions.

## Tokens and First-Class Themes

Themes are full visual products. A theme may control:

- colors and contrast;
- typography and font weight;
- radii, borders, and shape;
- spacing and control dimensions;
- elevation and shadows;
- motion duration and easing;
- focus presentation;
- icon metrics;
- component-specific state values.

The same component API and semantic anatomy must support materially different visual languages without forking React or Angular implementations.

Three independent axes are exposed:

- **theme**: the complete visual language;
- **color scheme**: initially `light` and `dark`, with high contrast possible later;
- **density**: initially `comfortable` and `compact`.

The public scoping attributes are:

- `data-slotted-theme`;
- `data-slotted-scheme`;
- `data-slotted-density`.

They use CSS inheritance so an application can theme or compact a subtree without adding framework runtime providers.

### Token Contract

`@slotted/tokens` owns token identifiers, categories, expected value kinds, cascade-layer order, and the data needed to validate a theme. It does not own one specific visual appearance.

The token layers are:

1. foundation tokens;
2. semantic tokens;
3. component tokens.

The initial authoring format is a small JSON contract. The default theme supplies JSON values for schemes and densities. A repository-owned Node build script validates required keys and emits CSS custom properties. This avoids adding a general token-platform dependency before the contract has proven its needs.

The CSS emitted by a theme build uses a documented cascade-layer order and stable `--slotted-*` custom properties. Component styles keep layout and accessibility invariants in their framework package, then consume themeable decisions through custom properties.

Component custom properties such as `--slotted-button-*` are the primary customization surface. Stable `data-part` and `data-state` hooks are introduced only when custom properties cannot express a legitimate theme requirement. Incidental classes and undocumented DOM structure are private.

### Default Theme

`@slotted/theme-default` implements the first theme using the approved A+B hybrid:

- the restrained legibility and neutral accent of the precise direction;
- firmer geometry, borders, and real compactness from the utility direction;
- restrained or absent decorative shadow;
- a solid danger treatment with white foreground;
- complete light and dark schemes;
- comfortable and compact density values.

No third-party font or visual asset is required in this phase.

### Theme Validation

The theme build fails with a targeted message when:

- a required token is missing;
- an unknown token is supplied accidentally;
- a required scheme or density map is absent;
- generated CSS cannot be produced deterministically.

Components retain native semantics if theme CSS is absent. Visual use without a complete theme is unsupported, but accessibility-critical CSS properties use safe platform fallbacks rather than making controls invisible or unusable.

## Package Boundaries and Build Formats

Each framework is one package with explicit component entrypoints:

```ts
import { Button } from "@slotted/react/button";
import { SlButton } from "@slotted/angular/button";
```

A root barrel may exist for ergonomics, but component subpaths are the documented import path. The repository does not create one npm package per component.

React distribution requirements are:

- ESM only;
- explicit `exports` entries;
- type declarations;
- React and React DOM kept external and declared as peers when publication becomes relevant;
- CSS assets represented accurately in `sideEffects` metadata;
- no CommonJS or UMD output.

The React build uses Vite library mode for JavaScript and CSS artifacts plus TypeScript declaration emit. Published React dependencies remain external.

Angular distribution requirements are:

- Angular Package Format;
- partial compilation;
- standalone public artifacts;
- secondary entrypoints for components;
- `@angular/*` dependencies treated as peers when publication becomes relevant;
- production builds produced through Angular CLI and `ng-packagr`.

The development baseline is React 19.2 and Angular 22. Exact compatible versions are pinned in the lockfile. These versions are build baselines, not a public compatibility promise.

Before npm publication is considered, separate consumer fixtures must test built artifacts and the project must approve explicit React, Angular, browser, versioning, and release policies.

## Storybook Architecture

Storybook is first-class development and documentation infrastructure in this phase.

`apps/storybook-react`:

- uses the React renderer;
- loads colocated React stories;
- owns shared conceptual documentation pages;
- serves as the composition host;
- references the Angular Storybook through Storybook `refs`.

`apps/storybook-angular`:

- uses the Angular renderer;
- loads colocated Angular stories;
- is independently runnable and buildable;
- is published as a child static catalog under `/angular`.

A third nominally neutral Storybook is not added. Every Storybook still requires a renderer, so using the React catalog as host gives composition with two builds rather than three.

Stories are colocated with components and use equivalent taxonomy and scenario names across frameworks. Each Storybook remains free to express usage idiomatically.

The initial Button story matrix covers axes separately rather than generating their Cartesian product:

- overview and recommended usage;
- variants;
- tones, including solid danger;
- sizes;
- disabled and interactive states;
- leading and trailing content;
- comfortable and compact density;
- light and dark schemes;
- a focused accessibility example.

Storybook globals expose separate toolbar controls for theme, scheme, and density. Decorators apply the corresponding public data attributes. Autodocs documents the actual public API of each framework.

The accessibility addon is available as a human inspection aid. Its browser analysis is not a repository-wide merge gate in this phase.

## Local Development and Verification

Local checks remain proportional:

- `pnpm check` stays the normal fast gate and does not build Storybook;
- package-filtered commands validate one framework or theme package;
- `pnpm check:affected` validates changed task-bearing packages and dependents;
- `pnpm check:full` validates all task-bearing packages and package builds when the change is cross-cutting;
- a separate explicit command builds both Storybooks and assembles the composed static catalog.

No repository command gains a hard wall-clock timeout. Duration is a signal to report progress, reassess, or split work when attempts stop producing new evidence.

### Deterministic Checks

The phase adds only checks with clear failure semantics:

- unit tests for native element semantics, attributes, events, refs or host behavior, states, and public API;
- token-contract and default-theme validation;
- parity validation for the machine-readable Button facts;
- React package build;
- Angular package build;
- React Storybook static build;
- Angular Storybook static build;
- composed-artifact validation that confirms both catalogs and their `index.json` files are present.

Unit tests use framework-native test infrastructure and a simulated DOM where required. They do not launch Playwright or collect visual evidence.

## Continuous Integration and GitHub Pages

Pull requests run:

- root and affected checks;
- framework and theme builds;
- both static Storybook builds;
- composed-catalog assembly;
- upload of the static catalog as a CI artifact.

Pull requests do not receive a public preview deployment in this phase.

Updates to `main` run the same deterministic build and deploy the composed artifact to GitHub Pages. The workflow uses the official GitHub Pages actions for configuration, artifact upload, and deployment. It does not introduce a community Storybook deployment wrapper.

The published layout is:

```text
/<repository-base>/             React host and shared docs
/<repository-base>/angular/     Angular child Storybook
```

The composition URL is environment-driven so local development can reference a local Angular port while the static build references the GitHub Pages subpath.

The Pages workflow has only the permissions needed to read contents, write Pages, and request an identity token. Deployment is serialized through a Pages concurrency group.

## Visual Validation Policy

Human visual validation happens once after the coherent Button slice is available in the composed Storybook. The AI agent may confirm that required scenarios exist and deterministic builds pass; it does not decide that the visual result is correct.

This phase explicitly excludes:

- exploratory Playwright;
- accessibility-tree scraping as a generic visual understanding method;
- automatic screenshot harvesting;
- Chromatic or another visual-regression service;
- pixel-diff gates;
- browser tests for every story;
- autonomous AI visual approval.

Named browser tests may be proposed later only for behavior that cannot be tested reliably below the browser layer and has explicit assertions and failure semantics.

## Error Handling and Failure Boundaries

Failures should identify the owning boundary:

- contract failures name the component fact and framework that diverged;
- theme failures name the missing or unknown token and mode;
- package failures remain attributable to React or Angular;
- Storybook failures identify the renderer build that failed;
- composition assembly failures identify the missing catalog artifact or index;
- Pages deployment failures do not rewrite or regenerate product artifacts.

Agents should fix the narrow failing boundary first. They should not respond to a Storybook failure by launching exploratory browser automation or rerunning unrelated full-repository checks repeatedly.

## AI Execution Model

A normal component slice follows this order:

1. update the smallest necessary contract surface;
2. add or extend token and theme values;
3. implement framework-native React and Angular surfaces;
4. add equivalent colocated stories;
5. run filtered deterministic checks;
6. integrate and build the composed Storybook;
7. request one human visual review.

The order describes dependencies, not mandatory review checkpoints. React and Angular work may proceed independently after the contract is stable. Independent reviewers, subagents, browser automation, and full-repository checks are introduced only when risk or the dependency graph justifies them.

Complex components keep one conceptual contract but may be delivered as multiple coherent capability slices. A long run is not automatically a failure; repeated attempts without new evidence require reassessment or decomposition.

The implementation plan must split this phase into bounded tasks with package-level verification. No implementation task should own the entire phase from token infrastructure through Pages deployment.

## Acceptance Criteria

The phase is complete when:

- the private `@slotted/*` workspace packages and agreed app boundaries exist;
- the token contract and default theme build deterministically;
- the default theme implements light and dark schemes plus comfortable and compact density;
- the approved A+B visual direction and solid danger treatment are represented;
- React Button builds and exposes the documented component entrypoint;
- Angular Button builds in Angular Package Format and exposes its secondary entrypoint;
- the two implementations satisfy the initial shared contract;
- equivalent Button stories and Autodocs exist for both frameworks;
- theme, scheme, and density can be changed in Storybook;
- both Storybooks build statically and the React host composes the Angular catalog;
- CI succeeds without Playwright, screenshots, or visual-regression tooling;
- the composed catalog deploys from `main` to GitHub Pages;
- all documented verification commands succeed with their declared mutation behavior;
- a human completes the final visual review;
- no npm package, release workflow, or public compatibility promise is created.

## Deferred Follow-Up

After the walking skeleton is accepted, the next recommended component slice is Dialog because it exercises overlays, focus management, keyboard behavior, layering, SSR boundaries, and substantially more complex framework parity. Dialog requires its own design and must not be pulled into this implementation plan.

Before the fourth component begins, the project reviews whether the structured JSON contract has demonstrated enough value to retain.

## References

- [Storybook composition](https://storybook.js.org/docs/sharing/storybook-composition)
- [Publishing a static Storybook](https://storybook.js.org/docs/sharing/publish-storybook)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Angular Package Format](https://angular.dev/tools/libraries/angular-package-format)
- [Creating Angular libraries](https://angular.dev/tools/libraries/creating-libraries)
- [Angular version compatibility](https://angular.dev/reference/versions)
- [React versions](https://react.dev/versions)
