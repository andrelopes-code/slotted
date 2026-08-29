# Button Family and Storybook Workbench Design

**Status:** Approved for implementation planning  
**Date:** 2026-08-29  
**Scope:** Button family, shared theme contract, React and Angular parity, and the two internal Storybook applications

## Context

The walking skeleton proved that Slotted can ship framework-native React and Angular components from one semantic and visual contract. It also exposed the next risk: expanding the catalog before the first component, its examples, and the internal inspection environment are mature enough would multiply weak patterns.

This phase therefore pauses the existing Storybook composition and GitHub Pages work. It completes the semantic Button family and turns both Storybooks into one coherent internal workbench. Public documentation, package publication, and the next unrelated component remain later concerns.

The workbench is a deliberate internal tool, not a temporary public documentation site. It must be pleasant and dependable enough for daily product work without introducing screenshot pipelines, exploratory Playwright sessions, or an autonomous visual approval loop.

## Goals

- Expand the current Button into a coherent family: `Button`, `ButtonLink`, `IconButton`, `ToggleButton`, and `ButtonGroup`.
- Preserve native HTML semantics and native framework ergonomics.
- Keep the family open to future capabilities without turning one component into a polymorphic mega-API.
- Make themes first-class products that can change the Button family's personality, not only its colors.
- Give React and Angular the same contract, scenarios, visual hierarchy, and quality bar while retaining native implementations.
- Replace the current unattractive, repetitive Storybook experience with a dense, readable internal workbench.
- Replace artificial generated source with small, curated, framework-specific snippets that are formatted and copyable.
- Keep validation deterministic and proportional to the risk of each slice.

## Non-goals

- A public documentation website or marketing surface.
- Storybook composition, GitHub Pages, or npm publication.
- Chromatic, screenshot collection, visual-regression baselines, or Playwright exploration.
- Browser interaction tests for every story.
- Letting an agent decide by itself that a visual result is correct.
- Menu, Popover, Tooltip, or a dedicated `SplitButton` abstraction.
- A framework-neutral component runtime, Web Components layer, or dependency between the React and Angular packages.
- Starting another unrelated component.

## Design principles

### Semantic family, not prop accumulation

Each exported component owns one semantic job. Visual consistency comes from shared contracts and theme tokens, not from an `as` prop that makes every root possible.

- `Button` performs an action with a native `button`.
- `ButtonLink` navigates with a native `a` or a narrowly scoped router-link adapter.
- `IconButton` performs an action whose visible content is icon-only.
- `ToggleButton` exposes a controlled pressed state with `aria-pressed`.
- `ButtonGroup` groups related controls and supplies group layout and seam treatment.

Pressed state belongs only to `ToggleButton`. Navigation does not silently become an action, and an action does not silently become navigation.

### Shared facts, native implementations

`specs/components/button/contract.json` remains private repository coordination data. It records only facts consumed by deterministic checks: family members, shared axes, capability applicability, states, parts, required public tokens, and required scenarios.

React and Angular implement those facts independently using their native APIs. They do not import one another and do not share runtime component code. Component CSS remains in each framework package and consumes the same token contract; parity checks catch contract drift.

### Complete does not mean exhaustive now

This phase establishes extension seams for the full family while delivering a bounded initial capability set. New tones, sizes, states, content forms, and composition components can be added without breaking the semantic boundary. Unsupported future features are not represented by speculative props.

## Target family contract

### Shared axes

| Axis | Values or behavior |
| --- | --- |
| Variant | `solid`, `outline`, `ghost` |
| Tone | `neutral`, `accent`, `success`, `warning`, `danger` |
| Size | `sm`, `md`, `lg` |
| Content | Label with optional leading and trailing arbitrary content |
| Width | Intrinsic by default; `fullWidth` when requested |
| Schemes | Supplied by the active theme product |
| Density | Supplied by the active theme product, not a component prop |

These axes are vocabulary, not a promise that every Cartesian combination must be rendered in Storybook or receive a bespoke style rule. Components compose the active values through shared custom properties.

Defaults reflect each member's usual semantic weight:

| Member | Defaults |
| --- | --- |
| Button | `solid`, `accent`, `md` |
| ButtonLink | `solid`, `accent`, `md` |
| IconButton | `ghost`, `neutral`, `md` |
| ToggleButton | `outline`, `neutral`, `md`, not pressed |
| ButtonGroup | horizontal |

Boolean capabilities default to false. Defaults are contract facts and remain identical across frameworks.

### Capability applicability

| Capability | Button | ButtonLink | IconButton | ToggleButton | ButtonGroup |
| --- | :---: | :---: | :---: | :---: | :---: |
| Variant, tone, size | yes | yes | yes | yes | no |
| Leading and trailing content | yes | yes | no | yes | no |
| Full width | yes | yes | yes | yes | container-driven |
| Disabled | native | link behavior | native | native | no |
| Loading | yes | no | yes | no | no |
| Pressed | no | no | no | controlled | no |
| Orientation | no | no | no | no | horizontal or vertical |

This is the target of the current phase, not a permanent ceiling. A later capability must earn its place through a concrete use case and preserve the same semantic boundaries.

### States

All interactive family members expose visual treatment for:

- default;
- hover;
- active;
- focus-visible;
- disabled where applicable.

`Button` and `IconButton` additionally expose loading. `ToggleButton` additionally exposes pressed and pressed-plus-disabled. State styling must remain legible in every variant, tone, scheme, and supported theme density.

State precedence is deterministic:

1. disabled;
2. loading;
3. pressed for `ToggleButton`;
4. active;
5. focus-visible;
6. hover;
7. default.

Focus indication is never removed merely because another state is active. The precedence describes component styling and behavior, not permission to suppress an accessibility indicator.

### Stable parts and data attributes

The family retains stable internal parts for styling and inspection:

- root;
- leading;
- label;
- trailing;
- icon;
- loading indicator;
- group.

Interactive roots expose `data-variant`, `data-tone`, `data-size`, and `data-state`. Boolean facts use presence attributes such as `data-full-width`, `data-loading`, and `data-pressed`. `ButtonGroup` exposes `data-orientation`.

These attributes support implementation parity, authored styles, and inspection. They are not a substitute for native attributes or ARIA.

## Component behavior

### Button

`Button` renders a native `button` and defaults `type` to `button`. It forwards native attributes, events, class names, and refs. Existing `variant`, `tone`, `size`, `leading`, and `trailing` APIs remain source-compatible while the additional tones, `fullWidth`, and loading behavior are added.

`type="submit"` and `type="reset"` remain available through the native API. Disabled state uses the native `disabled` attribute.

### ButtonLink

The default `ButtonLink` renders a native anchor and requires a destination supplied by `href`, the React adapter, or an Angular router directive. It forwards anchor attributes and refs. It does not accept button-only attributes such as `type`, and it never renders a button merely because a destination is absent.

React has two mutually exclusive root modes:

1. native mode requires `href` and forbids the adapter;
2. adapter mode accepts a `render` callback that receives the complete root props and returns one router-owned link element.

The adapter exists only on `ButtonLink`; it is not a universal polymorphic escape hatch. It must preserve the supplied class, data attributes, accessibility attributes, event behavior, children, and ref contract. Implementation tests cover a representative router-like adapter without adding a router dependency.

Angular uses `a[slButtonLink]`. Angular Router's `routerLink` directive can own navigation on that same native anchor, so no parallel adapter abstraction is introduced.

A disabled `ButtonLink` uses `aria-disabled="true"`, suppresses pointer and keyboard activation before consumer handlers run, and is removed from sequential focus by default. An explicitly supplied `tabindex` can opt back into discovery. It never emits or follows navigation while disabled. This behavior is documented because anchors have no native `disabled` attribute.

### IconButton

`IconButton` renders a native button and owns the same action, tone, variant, size, disabled, and loading semantics as `Button`. Its visible default content is the icon; it does not accept leading or trailing regions.

An accessible name is mandatory through `aria-label` or `aria-labelledby`. React expresses this as a type union where possible. Both frameworks also produce a clear development-only error when an icon-only control has no accessible name. Production behavior remains native and does not invent a label.

Tooltip behavior is outside this component because it requires the future overlay foundation. A consumer may compose a tooltip later without changing `IconButton` semantics.

### ToggleButton

`ToggleButton` renders a native button with controlled `pressed` state and `aria-pressed`. React emits the requested next state through `onPressedChange`; Angular emits `pressedChange` and supports two-way binding. Native click events remain available.

The component does not silently mutate its own state in this phase. The internal structure leaves room for a later `defaultPressed` convenience without altering controlled usage.

### ButtonGroup

`ButtonGroup` renders a semantic group, requires its children to retain their own action or navigation semantics, and supports horizontal and vertical orientation. An accessible group name may be supplied by native `aria-label` or `aria-labelledby` attributes when surrounding context does not already name the group.

The group controls layout, shared focus-ring clearance, adjacency, and edge treatment through tokens. It does not clone children to inject appearance props in React and does not mutate projected children in Angular. Themes may make the group feel joined or lightly separated by changing group tokens without changing component markup.

A split action is demonstrated as composition: one primary `Button` plus one menu-trigger `IconButton` inside `ButtonGroup`. The example stops at the trigger boundary. Menu state, popup ownership, keyboard navigation, and positioning wait for Menu and Popover; the Button family does not couple to placeholders for them.

## Loading behavior

Loading is controlled through a boolean prop or input. The component never detects Promises and never manages request lifecycle.

While loading, `Button` and `IconButton`:

- set `aria-busy="true"`;
- expose `data-loading` and `data-state="loading"`;
- prevent pointer, keyboard, and form activation before consumer handlers run;
- use `aria-disabled="true"` to communicate temporary unavailability;
- do not set native `disabled` unless the consumer also supplied `disabled`, preserving focus during an in-flight action;
- preserve the control's dimensions and, by default, its accessible name;
- render a themeable default indicator that is hidden from the accessibility tree.

React accepts a replacement indicator node and optional loading text. Angular accepts a projected loading-indicator slot and optional loading text input. Loading text is an explicit opt-in to replace the visible and accessible label; absent that option, the original label remains. `IconButton` keeps its required accessible name while the icon is replaced or overlaid by the indicator.

## Framework APIs

The following sketches define shape and semantics, not exact implementation syntax for internal helpers.

### React

```tsx
<Button
  variant="solid"
  tone="accent"
  size="md"
  leading={<SaveIcon />}
  loading={saving}
  loadingText="Saving"
  fullWidth
>
  Save
</Button>

<ButtonLink href="/settings" trailing={<ArrowIcon />}>
  Settings
</ButtonLink>

<ButtonLink render={(rootProps) => <RouterLink to="/settings" {...rootProps} />}>
  Settings
</ButtonLink>

<IconButton aria-label="Close" variant="ghost">
  <CloseIcon />
</IconButton>

<ToggleButton pressed={selected} onPressedChange={setSelected}>
  Pin
</ToggleButton>

<ButtonGroup aria-label="Editing actions" orientation="horizontal">
  <Button>Save</Button>
  <IconButton aria-label="More save options">…</IconButton>
</ButtonGroup>
```

### Angular

```html
<button
  slButton
  variant="solid"
  tone="accent"
  size="md"
  [loading]="saving"
  loadingText="Saving"
  fullWidth
>
  <app-save-icon slButtonLeading />
  Save
</button>

<a slButtonLink routerLink="/settings">
  Settings
  <app-arrow-icon slButtonTrailing />
</a>

<button slIconButton aria-label="Close" variant="ghost">
  <app-close-icon />
</button>

<button slToggleButton [(pressed)]="selected">Pin</button>

<div slButtonGroup aria-label="Editing actions" orientation="horizontal">
  <button slButton>Save</button>
  <button slIconButton aria-label="More save options">…</button>
</div>
```

Angular selectors stay on native elements: `button[slButton]`, `a[slButtonLink]`, `button[slIconButton]`, `button[slToggleButton]`, and a group directive or component whose host has group semantics. Content markers such as `[slButtonLeading]`, `[slButtonTrailing]`, and `[slButtonLoadingIndicator]` are shared across compatible labeled members.

## Invalid combinations and failure behavior

- Type systems exclude invalid combinations where the framework can express them.
- React's native and adapter `ButtonLink` modes are mutually exclusive.
- Button-only native attributes do not leak into `ButtonLink` types.
- `pressed` exists only on `ToggleButton`; loading exists only on `Button` and `IconButton` in this phase.
- `IconButton` is the only case that produces a development-only accessibility error because a missing name makes the component intrinsically inaccessible.
- Other accessibility guidance is documented and tested without runtime policing of application context.
- Components never silently coerce an invalid semantic element into a different one.
- Unknown theme tokens and missing required tokens fail deterministic theme validation with the exact token path.

## Themes as first-class products

The theme contract has foundation, semantic, and component layers. Button implementations own only layout and accessibility invariants that must not vary. The active theme owns the visual personality.

The public component-token surface covers at least:

- typography family, size, weight, line height, and letter spacing;
- control height, inline padding, content gap, and icon size per size and density;
- background, foreground, border, and state treatment per variant and tone;
- border width, radius, shadow, and focus-ring geometry;
- disabled and loading opacity or color treatment;
- indicator size, stroke, placement, and motion;
- group gap, seam, edge radius, and orientation spacing;
- transition duration and easing, with reduced-motion behavior.

Theme values are emitted as stable `--slotted-*` custom properties and inherit through subtrees. A theme can therefore make the same UI compact and technical, soft and rounded, or high-contrast and solid without component props such as `rounded` or `shadow` freezing those choices into the API.

The default theme provides complete light and dark schemes and supported densities. In its solid danger treatment, the surface is deliberately strong and the text is white with verified contrast.

Every required token has a safe component fallback for accessibility-critical behavior. An incomplete theme still fails validation; fallbacks prevent an accidentally absent stylesheet from making a control invisible or unusable.

## Storybook workbench architecture

### Two renderers, one workbench

React and Angular keep separate Storybook applications because each needs its own renderer and native story examples. Their chrome, information architecture, docs layouts, scenario vocabulary, and interaction model are shared.

A new private workspace package, `@slotted/storybook-workbench`, owns presentation-only resources:

- manager theme and brand configuration;
- preview and Docs CSS;
- framework-neutral scenario metadata;
- Docs layout primitives;
- dense matrix, API table, framework badge, and code-drawer primitives;
- snippet definition, formatting, and validation utilities.

The package is marked private and is never imported by a published component package at runtime. React-based Docs primitives are acceptable because Storybook Docs itself uses that rendering layer; Angular component examples inside canvases remain Angular-native. Framework-specific story render functions and snippets stay beside their component implementation.

The component contract is the source of truth for axis values, defaults, capability applicability, and required scenario identifiers. Workbench metadata adds only presentation order, labels, and explanatory copy. A deterministic test compares the two so the workbench cannot establish a second behavioral contract. Framework-specific API metadata is likewise checked against the shared defaults and applicability facts.

This split prevents two copied Storybook designs without pretending the component renderers are interchangeable.

### Information architecture

Both applications expose the same navigation:

```text
Components
└── Button family
    ├── Overview
    ├── Button
    ├── ButtonLink
    ├── IconButton
    ├── ToggleButton
    └── ButtonGroup
```

The framework is shown as a discreet `React` or `Angular` badge in page chrome and examples, not repeated in every title. Story and section order is deterministic across both applications.

Each family member has:

- a curated overview or examples story;
- one playground where Controls are useful;
- focused state or composition stories only when they teach distinct behavior;
- a custom Docs reference sheet.

Controls do not dominate overview pages and are not presented for values that produce invalid semantics.

### Visual language

The workbench should feel like a precise internal product tool rather than generated documentation:

- restrained graphite manager chrome and a calm neutral content canvas;
- locally bundled Inter Variable for the compact interface hierarchy and JetBrains Mono Variable for code, with no remote font request;
- consistent spacing rhythm, crisp one-pixel dividers, and moderate radii;
- dense information with visible grouping and breathing room between sections;
- minimal decorative effects and no marketing-style hero, gradients, or oversized headings;
- stable workbench chrome while the component canvas changes theme product, scheme, and density;
- clear focus, hover, selected, copy-success, and expanded states for workbench controls.

The top of a page answers what the component is and when to use it in a few lines. The component matrix is the visual center of gravity, not a large introduction.

### Dense matrix

The primary Examples view is full-width and combines the strengths of a dense comparison table with small explanatory sections. It is curated, not the full Cartesian product.

The matrix shows:

- variants across tones;
- sizes in a compact row;
- representative default, disabled, loading, and pressed states where applicable;
- leading, trailing, icon-only, and full-width content patterns;
- horizontal and vertical groups;
- the visual split-action composition inside `ButtonGroup`.

Repeated labels and headers stay aligned so scanning is easier than reading isolated cards. On narrower viewports, related cells wrap as a unit; a labeled horizontal scroller is the fallback for a comparison that would otherwise become illegible. Controls remain touchable, text does not clip, and the page does not force the entire viewport to scroll horizontally.

### Docs reference sheet

Docs pages are custom compact reference sheets built with Storybook-native blocks and shared workbench primitives. Their vertical order is:

1. purpose and semantic choice;
2. essential usage;
3. curated visual matrix;
4. public API and defaults;
5. accessibility and keyboard behavior;
6. public component tokens;
7. framework-specific code drawers.

API tables privilege decision-relevant fields: name, type, default, applicability, and semantic notes. Token tables distinguish public theme decisions from private implementation variables.

The pages do not imitate a future public documentation site. Search, tutorials, migration guides, versioning, and broad conceptual content wait for the documentation product near V1.

### Curated code and copy behavior

Storybook's automatically inferred source is hidden whenever wrappers or framework serialization make it artificial. Each meaningful scenario supplies a minimal curated snippet in the current framework.

Snippets:

- include only the code necessary to understand the scenario;
- omit imports by default, with imports shown separately only when they add information;
- are formatted by the repository's Prettier version;
- are syntax-checked and validated in tests so malformed or unformatted source cannot ship;
- use the public package API, never story-only helpers;
- are copied exactly as displayed.

Every snippet is paired with the native story or fixture that exercises the same public API; it is not accepted merely because Prettier can parse it. Code is closed by default in an accessible full-width drawer associated with its example. Copy feedback is visible, announced without stealing focus, and resets predictably. React and Angular snippets teach their native idioms rather than attempting line-for-line textual parity.

### Global controls and remote access

The toolbar exposes only high-value global context: theme product, light or dark scheme, and supported density. These values apply through data attributes and CSS custom properties in the preview root.

Both development servers continue binding to all interfaces and accepting the configured remote host so they remain reachable through `devserver.local`. This requirement is covered by configuration tests, not by launching a browser.

## Quality requirements

### Accessibility

- Native elements and keyboard behavior are the baseline.
- Focus-visible treatment meets contrast and remains visible in every representative state.
- Accessible names, `aria-pressed`, `aria-busy`, `aria-disabled`, and group labeling behave as specified.
- Loading prevents repeat activation without unexpectedly discarding focus.
- Workbench drawers, copy buttons, tables, and horizontal scrollers are keyboard accessible and labeled.
- Reduced-motion preferences disable nonessential indicator and transition motion.
- Automated DOM assertions support review; the Storybook accessibility addon remains a manual aid, not an autonomous visual oracle.

### Responsive behavior

- The reference sheet remains readable from a narrow laptop split view through a wide desktop.
- Dense comparison groups wrap coherently or scroll locally with an obvious boundary.
- Full-width examples respect their container and do not introduce page-level overflow.
- Long labels, translated text, and zoom do not collapse the control's layout.

### Performance

- Storybook pages render a curated scenario set rather than every possible combination.
- Workbench code avoids large client-side dependencies for disclosure, copy, or tables.
- Expensive syntax or source processing happens at build time where practical.
- Component runtime code has no Storybook dependencies and adds no router, icon, overlay, or Promise-management dependency.

### Theming

- Representative stories run against every shipped theme product, scheme, and density.
- Components contain no hard-coded visual personality that belongs in public tokens.
- New tokens are validated, documented, and supplied by every shipped theme before component code consumes them.
- Default-theme contrast is checked deterministically for representative foreground and background pairs where tooling can evaluate literal colors.

### Implementation integrity

- React and Angular exports, axes, defaults, states, and scenarios satisfy the same machine-readable contract.
- Native attributes and refs continue to work.
- Framework packages do not depend on one another or on the private workbench.
- Public APIs have tests at semantic boundaries, not snapshots of implementation markup.
- Storybook presentation helpers do not leak into npm package entry points.

## Verification strategy

Verification is layered by risk and run at the smallest relevant scope:

1. contract and theme validation for shared fact changes;
2. focused unit and DOM tests for the framework being edited;
3. focused story metadata, Docs primitive, and snippet-format tests for workbench changes;
4. package typecheck and build for the affected package;
5. static Storybook build for the affected renderer at integration boundaries;
6. repository `pnpm check`, both static Storybook builds, and `git diff --check` before the phase is declared complete.

No Playwright, screenshot capture, Chromatic baseline, or per-story browser suite is introduced in this phase. Human visual inspection remains available through the running Storybooks and is concentrated at coherent integration boundaries rather than repeated after every small edit.

Fast local feedback is a service-level goal, not a rigid correctness rule. Focused checks should normally complete within a few minutes. Tasks are split by coherent behavior and dependency boundaries when evidence shows the working set is too large; they are not failed solely because an arbitrary wall-clock threshold elapsed. Full builds are not repeated after edits that cannot affect them.

## Migration from the walking skeleton

- Keep the current `Button` semantic root and existing public axes.
- Add `success` and `warning`; preserve the approved strong solid-danger treatment.
- Extend the contract from one component to an applicability-aware family contract.
- Refactor duplicated family internals inside each framework without creating cross-framework runtime code.
- Add family exports incrementally so each slice remains buildable and testable.
- Replace current Button stories with the shared hierarchy and curated scenarios only after the corresponding public APIs exist.
- Introduce the private workbench and adopt it in React first, then Angular, using the same primitives and acceptance checks.
- Keep the existing composition and Pages plan deferred rather than partially implementing it around a changing workbench.

The current `Button` remains usable throughout. No flag day is required.

## Delivery slices

The implementation plan will break the phase into these independently verifiable slices:

1. **Contract and themes:** extend family facts, token contract, default-theme values, and deterministic validation.
2. **React family:** implement shared React-local foundations and the five public family members with focused tests.
3. **Angular family:** implement the equivalent native Angular APIs and parity tests.
4. **Workbench foundation and React adoption:** add the private presentation package, manager theme, reference sheet, matrix, drawers, snippets, and React stories.
5. **Angular workbench adoption:** reuse the presentation layer with Angular-native stories and snippets, then close scenario parity gaps.
6. **Integration:** run both static builds and repository checks, perform one coherent human visual review, and update current internal documentation.

The sequence expresses dependency order, not a requirement for heavy review after every step. A slice may be divided further when its tests reveal independent behavioral units.

## Acceptance criteria

The phase is complete when:

- all five family members exist in React and Angular with the approved semantic boundaries;
- existing Button usage remains source-compatible except for a separately documented, justified correction;
- shared axes, applicability, defaults, states, parts, and stories pass deterministic parity validation;
- loading, disabled links, pressed state, accessible icon-only names, refs, and native attributes have focused tests;
- every required Button-family token is public, documented, validated, and implemented by the default theme;
- the default solid danger treatment uses a strong surface and white text with acceptable contrast;
- both Storybooks share one visual identity, hierarchy, matrix language, Docs reference sheet, and code-drawer behavior;
- React and Angular examples remain framework-native and snippets are minimal, Prettier-formatted, validated, and copied exactly;
- dense pages remain usable in narrow and wide layouts without page-level horizontal overflow;
- both Storybooks remain remotely reachable through their configured all-host binding;
- no Storybook dependency leaks into published component runtime or entry points;
- focused checks, both static Storybook builds, the repository check, and diff validation pass;
- visual review is performed by a human at the completed integration boundary;
- Storybook composition, GitHub Pages, npm publication, public docs, browser automation, and the next component remain out of scope.

## Deferred follow-up

After this phase is accepted, the project can re-evaluate Storybook composition and GitHub Pages using the mature workbench rather than the walking skeleton. Public documentation remains a separate product decision closer to V1. The next component receives its own design only after the Button family and internal workbench have proven the conventions defined here.
