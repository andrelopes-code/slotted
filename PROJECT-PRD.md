# PRD — Multi-Framework UI Library for Product Web Applications

**Status:** Draft
**Version:** 0.1
**Initial scope:** React and Angular
**Category:** UI Library / Design System Infrastructure
**Primary audience:** dense, product-oriented web applications

---

## 1. Executive Summary

This project aims to build a long-lived UI library for dense, product-oriented web applications, providing visual, semantic, and behavioral consistency without preventing each application from preserving or creating its own visual identity.

The library will initially support **React** and **Angular** and should use the idiomatic, native capabilities of each framework, avoiding abstractions that attempt to artificially standardize their programming models.

The library should provide:

- high-quality components;
- reusable primitives;
- design tokens;
- semantic tokens;
- themes as first-class entities;
- density control;
- consistent accessibility patterns;
- official extension mechanisms;
- overlay infrastructure;
- proper SSR and hydration support;
- internationalization and RTL support;
- styling contracts independent of the technology used by the consuming application.

The system should provide a default appearance that is complete and polished enough to be used immediately, while remaining deeply customizable.

An application should be able either to use an official library theme or to create a significantly different visual identity without relying on fragile DOM or CSS overrides.

The library is not intended to replace React, Angular, Tailwind, Sass, CSS Modules, or equivalent solutions. It should coexist with these technologies.

---

# 2. Product Vision

Create reliable, long-lived UI infrastructure for complex web applications, enabling teams to build consistent and accessible interfaces without sacrificing:

- visual identity;
- architectural flexibility;
- framework ergonomics;
- performance;
- accessibility;
- extensibility;
- long-term maintainability.

The product should work particularly well for systems such as:

- dashboards;
- administrative systems;
- back-office systems;
- operational dashboards;
- enterprise applications;
- internal tools;
- SaaS platforms;
- applications with a persistent shell;
- information-dense interfaces;
- systems centered on tables, forms, and workflows.

The library will not primarily target landing pages or marketing experiences.

---

# 3. Problem

UI libraries frequently fail in one or more of the following ways:

1. they become excessively opinionated in their visual design;
2. they make deep customization difficult;
3. they create abstractions that hide the framework;
4. they try to artificially expose the same API across different frameworks;
5. they depend on internal DOM details for customization;
6. they make breaking changes inevitable because of poorly designed APIs;
7. they accumulate variants and properties until components become difficult to maintain;
8. they provide limited theming systems;
9. they depend heavily on a specific CSS technology;
10. they reinvent primitives already solved by the browser or ecosystem;
11. they fail to account for density, internationalization, or enterprise applications from the outset;
12. they grow without a clear strategy for dependencies, packages, versioning, and deprecation.

The project aims to avoid these problems from its foundation.

---

# 4. Goals

## 4.1 Primary Goals

### O1 — Consistency

Provide consistent behavior, semantics, naming, and appearance across components.

### O2 — Deep Customization

Allow consuming applications to significantly modify the system's appearance without relying on fragile selectors or internal implementation details.

### O3 — Idiomatic Integration with Each Framework

React should feel like React.

Angular should feel like Angular.

The library should not create a universal API that forces the frameworks to look or behave the same.

### O4 — Longevity

Architecture, naming, public contracts, and dependency decisions should prioritize long-term stability.

### O5 — Complete Design System

The library should provide a coherent default visual experience that is ready to use immediately.

### O6 — Themes as First-Class Products

Themes should be independently creatable, distributable, versionable, and replaceable.

### O7 — Accessibility by Default

Components should provide accessible behavior whenever the library has the context required to do so.

### O8 — Excellent Support for Dense Applications

Density, tables, forms, navigation, overlays, and complex workflows should be treated as core scenarios rather than exceptions.

### O9 — Compatibility with Different Styling Strategies

The library should coexist effectively with:

- CSS;
- SCSS;
- Tailwind CSS;
- CSS Modules;
- styled approaches;
- other solutions that generate platform-compatible CSS.

### O10 — Future Extensibility

The architecture may allow support for additional frameworks in the future, but React and Angular are the only frameworks within the initial scope.

---

# 5. Non-Goals

The library **is not intended to**:

- replace React;
- replace Angular;
- provide a complete application framework;
- create a “framework within the framework”;
- hide important framework primitives or concepts;
- replace Tailwind, Sass, CSS Modules, or other styling technologies;
- dictate application state architecture;
- provide its own routing solution;
- provide a complete data-fetching solution;
- impose a visual identity that cannot be changed;
- support every existing framework;
- maintain absolute internal implementation parity across frameworks;
- reimplement native browser primitives from scratch without a clear need;
- offer dozens of specialized variants for every component;
- guarantee indefinite stability of component-internal DOM;
- provide translations for the entire consuming application;
- solve every architectural problem in applications that use the library.

---

# 6. Core Principles

## 6.1 Share What Makes Sense to Share

> Share everything that makes sense to share, and do not share something merely because it is possible.

The project should clearly distinguish between shareable concepts and framework-specific implementation.

Examples of elements that may be shared include:

- design tokens;
- semantic tokens;
- themes;
- component concepts;
- behavioral specifications;
- accessibility requirements;
- framework-independent algorithms;
- conceptual naming;
- conceptual documentation;
- visual contracts;
- framework-agnostic behavioral tests where applicable.

There is no requirement to share implementation when doing so would harm framework ergonomics.

---

## 6.2 Framework-Native First

Each implementation should use the idiomatic patterns of its corresponding framework.

### React

The React implementation may use, as appropriate:

- components;
- hooks;
- context;
- refs;
- render props;
- compound components;
- portals;
- Suspense-compatible patterns;
- React-specific APIs.

Conceptual example:

```tsx
<Dialog>
  <Dialog.Trigger />
  <Dialog.Content>
    ...
  </Dialog.Content>
</Dialog>
```

### Angular

The Angular implementation may use, as appropriate:

- dependency injection;
- directives;
- signals;
- templates;
- content projection;
- providers;
- Angular forms;
- Angular CDK when justified;
- lifecycle APIs;
- Angular-specific APIs.

Conceptual example:

```html
<lib-dialog>
  ...
</lib-dialog>
```

There is no requirement to make Angular look like React or React look like Angular.

---

## 6.3 Do Not Hide the Framework

DevTools should remain useful.

Consumers should continue to be able to use:

- native lifecycle mechanisms;
- the native event model;
- native forms integration;
- dependency injection where applicable;
- idiomatic typing;
- native SSR capabilities;
- framework debugging tools.

---

## 6.4 Prefer the Platform over Proprietary Abstractions

Whenever platform primitives are sufficient, they should be considered before creating a custom abstraction.

The library should prioritize:

- semantic HTML;
- ARIA when necessary;
- modern CSS;
- CSS logical properties;
- Custom Properties;
- browser primitives;
- established ecosystem APIs.

An additional abstraction should exist only when it provides concrete value.

---

## 6.5 Composition over Excessive Configuration

Components should favor composition over APIs with dozens of specialized properties.

Preferred:

```tsx
<Card>
  <Card.Header>...</Card.Header>
  <Card.Body>...</Card.Body>
  <Card.Footer>...</Card.Footer>
</Card>
```

instead of progressively larger APIs such as:

```tsx
<Card
  title="..."
  subtitle="..."
  footer="..."
  icon="..."
  action="..."
  headerAlignment="..."
  footerAlignment="..."
  ...
/>
```

React and Angular may express this composition differently while maintaining an equivalent conceptual model.

---

# 7. Audience and Use Cases

## 7.1 Primary Audience

Developers and teams responsible for product web applications.

Especially:

- product engineers;
- frontend engineers;
- design system teams;
- platform teams;
- enterprise teams;
- teams responsible for multiple products.

---

## 7.2 Primary Use Cases

### Case A — Application Using the Default Design

A team installs the library and obtains a coherent interface without having to build a design system from scratch.

### Case B — Product with Its Own Identity

An application uses all of the library's components and behaviors, but replaces the themes to adopt its own visual identity.

### Case C — Organization with Multiple Themes

An organization may provide, for example:

- Corporate Horizon;
- Corporate Quartz;
- Corporate Compact;
- Partner Theme.

The names are illustrative only.

Each theme may significantly alter the appearance without changing the functional components.

### Case D — Application-Specific Components

A team may create:

```tsx
<AppButton />
<AppTable />
<AppDialog />
```

using the library components as a foundation.

### Case E — Entirely New Components

An application may use the library's primitives, tokens, and contracts to build components that do not exist in the official catalog.

---

# 8. Customization Architecture

Customization should have explicitly supported levels.

## Level 1 — Theme

Global visual customization.

Examples:

- colors;
- typography;
- radius;
- shadows;
- density;
- motion;
- spacing.

---

## Level 2 — Semantic Customization

Customization of specific semantic decisions.

Conceptual examples:

```text
button.primary.background
button.primary.foreground
table.row.hover.background
input.border.focus
dialog.surface.background
```

Consumers should be able to change specific decisions without having to modify the entire visual foundation.

---

## Level 3 — Component Extension

Applications may build their own abstractions using official components.

Example:

```tsx
<AppButton />
<AppTable />
<AppFormField />
```

This allows them to add:

- defaults;
- product rules;
- analytics;
- policies;
- additional styling;
- application-specific abstractions.

---

## Level 4 — Composition

Applications may build entirely new components using:

- primitives;
- tokens;
- semantic contracts;
- accessibility utilities;
- overlay infrastructure;
- layout primitives.

---

# 9. Token System

The token system should have an explicitly defined architecture.

One possible conceptual structure:

```text
Foundation Tokens
        ↓
Semantic Tokens
        ↓
Component Tokens
        ↓
Component Styles
```

---

## 9.1 Foundation Tokens

Represent the fundamental values of the system.

Examples:

```text
color.blue.500
color.neutral.900

spacing.1
spacing.2
spacing.3

font.size.sm
font.size.md

radius.sm
radius.md

motion.duration.fast
```

Applications should not necessarily consume these tokens directly.

---

## 9.2 Semantic Tokens

Represent meaning.

Examples:

```text
color.surface
color.surface.elevated
color.text
color.text.muted
color.border
color.interactive
color.danger
```

This layer should absorb much of the variation between themes.

---

## 9.3 Component Tokens

Represent component-specific decisions.

Conceptual examples:

```text
button.primary.background
button.primary.foreground
button.primary.hover.background

table.row.height
table.row.hover.background

input.border
input.border.focus
```

Component tokens should be added only when there is a real need, avoiding the transformation of every CSS detail into a public token.

---

# 10. Runtime Styling Contract

CSS Custom Properties should be treated as the primary runtime contract for the visual system.

Conceptual example:

```css
:root {
  --acme-color-surface: ...;
  --acme-color-text: ...;
  --acme-radius-control: ...;
}
```

The prefix above is illustrative only.

This approach enables integration with:

- SCSS;
- Tailwind;
- CSS Modules;
- plain CSS;
- CSS-in-JS;
- styled approaches;
- various build tools.

The technology used internally by the library should not require consumers to adopt the same technology.

---

# 11. Namespace and Prefixes

The library should adopt a sufficiently uncommon namespace to minimize collisions with consuming applications.

The namespace should be used consistently across public resources such as:

- CSS Custom Properties;
- public classes;
- data attributes;
- custom events, when present;
- package names;
- identifiers;
- utility names.

Conceptual example:

```css
--xyz-color-surface
--xyz-button-background
```

and, when necessary:

```css
.xyz-button
```

The final prefix should be chosen early in the project, because changing it later would constitute a significant breaking change.

The prefix should not simply be `ui`, `lib`, `ds`, `app`, or another term with a high probability of collision.

---

# 12. Themes

Themes are first-class products.

A theme should be able to significantly change:

- colors;
- typography;
- radius;
- shadows;
- spacing;
- component appearance;
- density defaults;
- motion.

The architecture should support:

```text
Official Theme A
Official Theme B
Company Theme
Product Theme
High Contrast Theme
```

without duplicating the functional components.

Themes should potentially be able to be:

- distributed separately;
- versioned;
- tested;
- documented;
- combined with additional customizations.

---

# 13. Density

Density should be a systemic dimension of the design, not merely an isolated component property.

Avoid broadly relying on patterns such as:

```tsx
<Button density="compact" />
<Input density="compact" />
<Select density="compact" />
```

The architecture should support contextual control.

Conceptual example:

```tsx
<DensityProvider value="compact">
  <Dashboard />
</DensityProvider>
```

Possible values:

```text
comfortable
default
compact
```

The Angular implementation may use an equivalent API that is idiomatic to the framework.

---

## 13.1 Density Tokens

Components may derive properties from density-related tokens such as:

```text
control.height
control.padding.inline
control.padding.block
table.row.height
icon.size
field.gap
```

An application should be able, for example, to use compact density only within a specific area.

---

# 14. Public DOM Contract

By default:

> A component's internal DOM structure is not part of the public API unless explicitly documented as such.

Consumers should not depend on structures such as:

```css
.component > span:nth-child(2)
```

or:

```css
.button > .button__label
```

when those structures are not explicitly documented.

The library should provide official customization mechanisms.

Depending on the framework and component, these may include:

- CSS Custom Properties;
- slots;
- component composition;
- templates;
- directives;
- render props;
- documented state attributes;
- documented classes;
- callbacks;
- primitives.

A change to internal DOM should not be considered a breaking change when that DOM is not part of the documented contract.

---

# 15. Component States

Equivalent states should use equivalent concepts and naming throughout the library.

Examples:

```text
disabled
selected
expanded
pressed
checked
invalid
required
loading
readOnly
```

Before introducing a new concept, the project should evaluate whether an equivalent term already exists in the glossary or web specifications.

---

# 16. Glossary

An official glossary should be created early in the project.

The glossary should define terms used by the library, including examples such as:

- active;
- selected;
- current;
- pressed;
- checked;
- disabled;
- read-only;
- invalid;
- surface;
- overlay;
- trigger;
- anchor;
- content;
- panel;
- density;
- appearance;
- variant;
- tone;
- size.

Equivalent concepts should use consistent naming across components.

The glossary should be treated as part of the API design process.

---

# 17. Accessibility

The library should provide accessible behavior by default using:

- web standards;
- semantic HTML;
- WAI-ARIA specifications when necessary;
- established interaction patterns;
- expected keyboard behavior;
- proper focus management.

The library should not reinvent mechanisms when existing primitives are sufficient.

---

## 17.1 Library Responsibility

When the library has sufficient context, it should automatically provide the correct behavior.

Examples:

- keyboard navigation;
- focus management;
- appropriate roles;
- derived ARIA states;
- focus trapping when necessary;
- focus restoration;
- known structural associations.

---

## 17.2 Application Responsibility

Information that depends on the application's semantic context remains the consumer's responsibility.

Example:

```tsx
<Button aria-label="Delete user">
  <TrashIcon />
</Button>
```

If only the application knows the meaning of the action, the library cannot infer it reliably.

---

# 18. Internationalization

Internationalization should be considered from the earliest architectural decisions.

The library should account for:

- RTL;
- locale;
- number formatting;
- dates;
- pluralization;
- text expansion;
- writing direction;
- bidirectional layout.

The library does not need to provide translations for application content.

---

## 18.1 Logical Properties

Whenever possible, directional concepts should use:

```text
start
end
inline
block
```

instead of:

```text
left
right
```

CSS examples:

```css
padding-inline-start
margin-inline-end
inset-inline-start
```

This should make RTL support a natural property of the system.

---

# 19. Motion

Motion should be part of the token system.

Examples:

```text
motion.duration.fast
motion.duration.normal
motion.duration.slow

motion.easing.standard
motion.easing.enter
motion.easing.exit
```

Components should respect preferences such as:

```css
prefers-reduced-motion
```

when applicable.

Animation should not be required to understand or operate the interface.

---

# 20. Layers and Overlays

Dense applications will inevitably require consistent overlay infrastructure.

The project should define a shared strategy for concepts such as:

- dialogs;
- popovers;
- tooltips;
- menus;
- dropdowns;
- drawers;
- toasts;
- contextual overlays.

---

## 20.1 Overlay Requirements

The architecture should account for:

- stacking;
- z-index;
- portals;
- overlay containers;
- nested overlays;
- focus trapping;
- focus restoration;
- click outside;
- Escape handling;
- positioning;
- collision detection;
- scroll locking;
- SSR;
- viewport boundaries.

Established specialized dependencies such as **Floating UI** may be used when they provide substantial value and reduce the risk of an in-house implementation.

---

# 21. Responsiveness

Responsiveness should not be limited to the global viewport.

Components should consider container queries where appropriate.

A component may be used simultaneously in:

```text
Sidebar: 320px
Main content: 1200px
```

and behave appropriately in each context even when both are within the same viewport.

Prefer platform-based solutions when available.

---

# 22. SSR and Hydration

The architecture should be compatible with server-side rendering and hydration in the supported frameworks.

This means components should avoid, whenever possible:

- unconditional access to `window`;
- unconditional access to `document`;
- non-deterministic markup generation;
- unstable IDs;
- effects that cause hydration mismatches.

Features that must be client-only should:

1. degrade gracefully during SSR;
2. activate after hydration;
3. avoid incompatible markup between server and client.

Each integration should respect the native mechanisms of its respective framework.

---

# 23. Performance

Performance should have explicit requirements.

## 23.1 Principles

The library should be:

- tree-shakeable;
- modular;
- lazy-loadable where appropriate;
- careful about side effects;
- runtime-efficient;
- mindful of bundle size.

Importing:

```text
@library/react/button
```

should not load unrelated components such as:

```text
datepicker
data-grid
editor
charts
```

---

## 23.2 CSS

The architecture should avoid:

- uncontrolled CSS growth;
- excessive duplication;
- unnecessary runtime styling;
- per-component style generation when static CSS is sufficient.

---

## 23.3 Rendering

Implementations should avoid:

- avoidable rerenders;
- unnecessary observers;
- redundant global listeners;
- repeated forced layouts;
- expensive computations in render paths.

---

## 23.4 Large Data Volumes

Components intended for large collections should consider strategies such as:

- virtualization;
- incremental rendering;
- lazy rendering.

Whether these strategies are included should be decided according to each component's responsibilities.

---

# 24. External Dependencies

External dependencies should be added only when:

> the value they provide significantly exceeds their maintenance cost and longevity risk.

Before adding a dependency, the following should be evaluated:

- maturity;
- stability;
- maintenance;
- size;
- frequency of breaking changes;
- community;
- quality;
- accessibility;
- SSR support;
- framework compatibility;
- license;
- future replaceability.

Established dependencies that solve complex, well-defined problems—such as overlay positioning—are preferable to fragile in-house implementations.

At the same time, dependencies for trivial functionality should be avoided.

---

# 25. Package Boundaries

The distribution strategy should be defined before the catalog grows significantly.

One possible structure, not yet normative:

```text
@library/core
@library/tokens
@library/themes
@library/icons

@library/react
@library/angular

@library/testing
```

Another possibility:

```text
@library/react/button
@library/react/dialog

@library/angular/button
@library/angular/dialog
```

Or a hybrid model using package exports.

The decision should consider:

- tree shaking;
- bundle size;
- build time;
- versioning;
- ergonomics;
- documentation;
- dependency graph;
- peer dependencies;
- publishing;
- discoverability.

The final structure should be determined by a dedicated ADR.

---

# 26. Multi-Framework Architecture

The frameworks should share conceptual specifications, not necessarily code.

Example:

```text
Dialog Specification
        │
        ├── React implementation
        │
        └── Angular implementation
```

The shared specification may define:

- purpose;
- states;
- accessibility contract;
- keyboard behavior;
- visual tokens;
- conceptual anatomy;
- interactions;
- edge cases.

The implementation should remain free to use idiomatic framework mechanisms.

---

# 27. Parity Between Frameworks

The library will pursue **conceptual parity**, not absolute internal parity.

For example, React and Angular should ideally offer the same Dialog concept.

However:

- the APIs may differ;
- lifecycle behavior may differ;
- composition may differ;
- dependency injection may exist only where it makes sense;
- forms integration may be framework-specific;
- the internal implementation may be completely different.

Differences should exist when they improve framework integration, not arbitrarily.

---

# 28. Component API Design

Each component should go through an explicit design phase before implementation.

The specification should consider:

1. component responsibility;
2. anatomy;
3. states;
4. interactions;
5. accessibility;
6. keyboard model;
7. composition;
8. controlled/uncontrolled state where applicable;
9. event naming;
10. extensibility;
11. styling contract;
12. semantic tokens;
13. SSR;
14. RTL;
15. density;
16. responsive behavior;
17. edge cases;
18. performance;
19. testing strategy.

Naming should be treated as part of the architecture, not as an implementation detail.

---

# 29. Naming Review

New public names should undergo review.

This includes:

- components;
- properties;
- directives;
- hooks;
- events;
- tokens;
- CSS variables;
- states;
- themes;
- utility APIs.

The review should answer:

- does an equivalent concept already exist?
- does the name follow the glossary?
- does the name have an established meaning on the platform?
- does it work in both frameworks?
- could it create future conflicts?
- is it too specific?
- is it too generic?
- will it need to be renamed as the component evolves?

Public names should be treated as long-term contracts.

---

# 30. CSS Class Strategy

Internal classes should not automatically constitute public API.

There should be a distinction between:

```text
internal implementation classes
```

and:

```text
documented styling hooks
```

When a class is documented as public API, its removal or modification should follow the versioning rules.

Stable states may be exposed through documented mechanisms such as:

```html
data-state="open"
data-disabled
data-selected
```

where appropriate.

The decision should consider semantics, stability, and the actual need for customization.

---

# 31. Icons

The icon architecture should be decoupled from components as much as possible.

Components should not unnecessarily assume a specific icon library.

When an icon is an intrinsic part of a component, there should be a consistent strategy for:

- sizing;
- color inheritance;
- accessibility;
- RTL;
- replacement;
- theme integration.

---

# 32. Testing

Components should have tests that validate behavior, not only snapshots.

The strategy should include, as applicable:

### Unit Tests

- state;
- event handling;
- utilities.

### Interaction Tests

- keyboard;
- pointer;
- focus;
- composition.

### Accessibility Tests

- automated checks;
- semantic validation;
- manual testing for complex components.

### Visual Regression

Validate:

- themes;
- density;
- states;
- different viewports;
- high contrast where supported.

### SSR Tests

Validate:

- rendering;
- hydration;
- absence of mismatches.

### Cross-Browser Tests

Test officially supported browsers.

---

# 33. Browser Support

The supported-browser matrix should be explicitly documented.

The policy should prioritize modern browsers and allow the use of recent platform primitives when their adoption is compatible with the target audience.

Support should not indefinitely prevent the use of modern capabilities because of obsolete browsers.

---

# 34. Versioning

The library should use **Semantic Versioning**.

However, SemVer only works when there is a clear definition of the public API.

---

## 34.1 Breaking Changes

The following are candidates for breaking changes:

- removal of a public property;
- renaming of a public property;
- an incompatible change to TypeScript types;
- removal of a public directive;
- removal of a hook;
- renaming of a public token;
- removal of a public CSS Custom Property;
- modification of a class documented as public;
- a significant change to keyboard behavior;
- a change to semantics/accessibility contract;
- an incompatible change to a minimum peer dependency;
- raising the minimum supported React version;
- raising the minimum supported Angular version;
- an incompatible change to an event contract.

---

## 34.2 Changes That Are Not Necessarily Breaking

Provided they are not part of the public contract:

- changes to internal DOM;
- changes to internal classes;
- refactors;
- changes to internal implementation;
- replacement of an internal dependency with a compatible alternative.

---

## 34.3 Visual Changes

Visual changes should receive an explicit classification.

Small fixes may be considered patch changes.

Substantial changes to the default appearance may require a minor or major release depending on their impact and the guarantees defined by the visual compatibility policy.

This policy should be documented separately.

---

# 35. Deprecation Policy

Public APIs should not disappear unexpectedly.

The library should establish a predictable deprecation window.

Conceptual model:

```text
Release N
New API introduced.

Release N+1
Old API marked as deprecated.
Migration path documented.

Subsequent major release
Old API may be removed.
```

Whenever possible, the library should provide:

- warnings;
- migration guides;
- codemods;
- automated migrations;
- before/after examples.

Angular and React may use different migration tools.

---

# 36. Framework Version Compatibility

The library should have an explicit policy for supported React and Angular versions.

The goal is not to support old versions indefinitely.

The policy should balance:

- adoption of modern capabilities;
- stability;
- maintenance cost;
- ecosystem considerations;
- framework release cycles.

Raising the minimum supported version should follow the project's breaking-change policy.

---

# 37. Documentation

Documentation is part of the product.

Each component should have documentation containing, as applicable:

- purpose;
- when to use it;
- when not to use it;
- anatomy;
- API;
- examples;
- states;
- accessibility;
- keyboard behavior;
- theming;
- tokens;
- density;
- SSR considerations;
- RTL considerations;
- composition;
- extension patterns;
- anti-patterns.

When React and Angular have different APIs, the documentation should make those differences explicit rather than attempting to hide them.

---

# 38. Primitives vs. Components

The library should distinguish concepts such as:

### Primitive

A low-level building block intended primarily for composition.

### Component

A UI unit with a recognizable purpose and relatively complete behavior.

### Pattern

A recommended composition of multiple components that solves a recurring problem.

### Theme

A set of visual decisions.

This taxonomy should be documented in the glossary.

---

# 39. Criteria for Creating a New Component

A component should enter the official catalog when it:

1. represents a recurring problem;
2. has sufficiently generalizable behavior;
3. justifies centralized maintenance;
4. has a clear contract;
5. can provide better accessibility than repeated application-level implementations;
6. is not merely an extremely product-specific composition.

Not every composition used by two applications needs to become an official component.

---

# 40. Criteria for Dependency vs. In-House Implementation

Before incorporating an external dependency, an explicit evaluation should take place.

### Prefer a Dependency When:

- the problem has significant complexity;
- there are meaningful edge cases;
- an established implementation exists;
- the dependency is well maintained;
- replicating it internally would increase risk.

### Prefer an In-House Implementation When:

- the problem is small;
- the platform already provides most of the solution;
- the dependency would introduce disproportionate weight;
- the required contract is significantly smaller than what the package provides.

---

# 41. Default Quality Standard

All official components should provide:

- a good default appearance;
- consistent behavior;
- complete states;
- appropriate accessibility;
- documentation;
- tests;
- theming;
- density support where relevant;
- RTL support where relevant;
- SSR where applicable;
- reviewed APIs.

A component should not be considered complete merely because it works on the happy path.

---

# 42. Component Completion Criteria

A component may reach **Stable** status only when it has:

- a reviewed API;
- reviewed naming;
- React documentation;
- Angular documentation;
- an accessibility review;
- tested keyboard interactions;
- defined tokens;
- a default theme;
- validated density where applicable;
- validated RTL support;
- validated SSR/hydration;
- automated tests;
- visual regression tests;
- a performance review;
- a dependency review;
- a documented extension/customization story.

---

# 43. API Governance

Public APIs should be deliberate.

A proposal for a new API should answer at least:

```text
Problem
↓
Use Cases
↓
Alternatives
↓
Proposed API
↓
Framework-Specific Design
↓
Accessibility Implications
↓
Styling Implications
↓
Backward Compatibility
↓
Decision
```

Public APIs should not emerge simply as an accidental consequence of implementation.

---

# 44. ADRs

Relevant architectural decisions should be recorded through Architecture Decision Records.

Initial examples:

```text
ADR-001 — CSS Custom Properties as the runtime styling contract
ADR-002 — Namespace strategy
ADR-003 — Token architecture
ADR-004 — Package boundaries
ADR-005 — React support policy
ADR-006 — Angular support policy
ADR-007 — Overlay strategy
ADR-008 — Dependency policy
ADR-009 — Public DOM contract
ADR-010 — Versioning and deprecation
```

This will make it possible in the future to understand not only **which** decision was made, but **why** it was made.

---

# 45. Success Metrics

The project will be considered successful when consuming applications can achieve the following:

### Consistency

Build extensive interfaces without significant divergence between equivalent components.

### Customization

Create a significantly different visual identity without library forks or DOM hacks.

### Ergonomics

Use the library without losing the idiomatic patterns of React or Angular.

### Maintenance

Upgrade library versions through predictable migrations.

### Performance

Import specific components without loading unrelated parts of the system.

### Accessibility

Build accessible interfaces with minimal additional effort for aspects that can be controlled by the library.

### Themes

Switch or create themes without changing the functional implementation of components.

---

# 46. Risks

## 46.1 Excessive Multi-Framework Abstraction

**Risk:** creating a generic layer that harms React and Angular.

**Mitigation:** share specifications and infrastructure only when there is a clear benefit.

---

## 46.2 Token Explosion

**Risk:** turning every CSS property into a token.

**Mitigation:** separate foundation, semantic, and component tokens, adding public contracts only when real customization use cases exist.

---

## 46.3 API Explosion

**Risk:** components accumulating dozens of properties.

**Mitigation:** use composition as the default principle and require API review.

---

## 46.4 Abandoned Dependencies

**Risk:** critical dependencies becoming unmaintained.

**Mitigation:** dependency review, dependency isolation, and preference for established projects.

---

## 46.5 Frequent Breaking Changes

**Risk:** premature naming or architectural decisions requiring constant migrations.

**Mitigation:** glossary, ADRs, API review, and an experimental period before stabilization.

---

## 46.6 DOM-Dependent Styling

**Risk:** consumers becoming dependent on internal implementation details.

**Mitigation:** official customization contracts and clear documentation stating that internal DOM is not public API.

---

## 46.7 Rigid Visual Identity

**Risk:** the library becoming useful only for applications that visually resemble the default theme.

**Mitigation:** first-class themes, CSS Custom Properties, and semantic/component tokens.

---

# 47. API Maturity Strategy

New APIs may progress through states such as:

```text
Experimental
↓
Preview
↓
Stable
↓
Deprecated
↓
Removed
```

### Experimental

No complete compatibility guarantee.

### Preview

An API approaching stabilization and available for real-world feedback.

### Stable

Protected by compatibility policies.

### Deprecated

Remains functional during the migration window.

### Removed

Removal is permitted only in a major release consistent with the deprecation policy.

This process reduces the risk of turning premature decisions into permanent contracts.

---

# 48. Proposed Initial Phases

## Phase 0 — Foundations

Define the following before developing an extensive catalog:

- principles;
- glossary;
- naming conventions;
- browser support;
- framework support;
- namespace;
- token architecture;
- theming architecture;
- density architecture;
- CSS strategy;
- package strategy;
- dependency policy;
- testing strategy;
- versioning;
- deprecation;
- accessibility principles;
- SSR principles.

---

## Phase 1 — Infrastructure

Implement:

- token pipeline;
- theme infrastructure;
- density infrastructure;
- shared CSS contracts;
- React foundation;
- Angular foundation;
- testing infrastructure;
- documentation infrastructure;
- overlay foundation;
- essential accessibility utilities.

---

## Phase 2 — Foundational Components

Select a small set of foundational components with a high degree of reusability.

The objective of this phase should be to validate:

- API design;
- React ergonomics;
- Angular ergonomics;
- token model;
- theme model;
- accessibility;
- SSR;
- density;
- composition;
- release pipeline.

Do not maximize component count.

---

## Phase 3 — Dense Application Foundation

Expand to cover the core needs of dense, administrative, and enterprise applications.

The exact component selection should be defined through dedicated PRDs or RFCs.

---

## Phase 4 — Ecosystem

Evaluate:

- additional theme packs;
- testing helpers;
- migration tooling;
- codemods;
- schematics;
- generators;
- additional framework integrations.

New frameworks should not be added until the React/Angular architecture has demonstrated stability.

---

# 49. Open Architectural Questions

The following decisions should be resolved through ADRs or RFCs before stabilization:

1. What will the final namespace/prefix be?
2. What will the final package-boundary strategy be?
3. Will tokens also be published in formats other than CSS?
4. What level of granularity will component tokens have?
5. Will themes be independent packages?
6. What will the official icon strategy be?
7. What exact infrastructure will be used for overlays?
8. Will Floating UI be officially adopted?
9. Will Angular CDK be used? Under what conditions?
10. What will the React version support policy be?
11. What will the Angular version support policy be?
12. What will the browser support matrix be?
13. Which classes or data attributes may be considered public?
14. What will the specific SemVer policy for visual changes be?
15. What will the minimum deprecation window be?
16. Will React and Angular share a release train?
17. Will framework packages use the same version?
18. Which primitives will exist as a reusable layer?
19. How will third-party themes be validated?
20. What will the contract be for custom component themes?

---

# 50. Final Principle

The library should be built with the assumption that consuming applications will continue to exist and evolve for many years.

Decisions should optimize not only for:

> “How can we implement this component today?”

but also for:

> “What contract do we want to still be maintaining five or ten years from now?”

The library should provide a consistent foundation without taking control of the application.

It should use the framework without hiding it, use the platform without reinventing it, and share infrastructure without making sharing an objective in itself.

The expected result is a UI system that can simultaneously be:

**complete by default, deeply customizable, framework-idiomatic, and sustainable over the long term.**
