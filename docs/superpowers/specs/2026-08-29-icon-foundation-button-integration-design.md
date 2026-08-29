# Icon Foundation and Button Integration Design

## Outcome

Slotted uses Lucide as its initial visual icon language without making Lucide part of the public runtime contract of `Button`, `IconButton`, or the framework packages. The Storybooks and examples use maintained upstream icon assets instead of repository-authored SVG paths or CSS masks.

## Responsibilities

- Lucide owns the glyphs, geometry, names, and upstream maintenance.
- Slotted owns icon placement, sizing, color inheritance, accessibility guidance, and component integration.
- Applications remain free to use Lucide, `ng-icons`, another icon library, or their own SVG components.
- Buttons never resolve icons by string name and never import an icon catalog.

## Framework Integrations

### React

Storybook examples import named icons from `lucide-react`. Icons are passed through the existing `leading`, `trailing`, or `children` composition points. `lucide-react` is a development dependency of the React workspace package, not a runtime dependency or peer dependency of `@slotted/react`.

### Angular

Storybook examples use `NgIcon` from `@ng-icons/core`, register only named constants from `@ng-icons/lucide`, and project them through the existing `slButtonLeading`, `slButtonTrailing`, or icon-button content slots. Both packages are development dependencies of the Angular workspace package, not runtime dependencies or peer dependencies of `@slotted/angular`.

The Angular choice is deliberately not `@lucide/angular`. A production Angular 22 fixture confirmed that both integrations remove unused icons, while the first selected icon added approximately 31.9 KB of raw JavaScript with `@lucide/angular` and 18.1 KB with `@ng-icons/core` plus `@ng-icons/lucide`. This benchmark is directional rather than a permanent bundle budget, but it establishes the lower-overhead integration for the current toolchain.

## Button Contract

- `Button` accepts arbitrary renderable content in leading and trailing positions.
- `IconButton` accepts arbitrary renderable icon content and continues to require an explicit accessible name.
- Icon slots define layout and expose their effective size through inherited `font-size` and the existing icon-size tokens.
- Direct SVG children fill the slot; component-based icons that use `1em` inherit the same dimensions.
- Icons inherit `currentColor`; buttons do not impose fill or stroke geometry.
- The component API does not add `iconName`, an icon registry, Lucide-specific types, or semantic icon aliases.

## Accessibility

- Icons accompanying visible button text are decorative and receive `aria-hidden="true"`.
- Icons inside an `IconButton` are decorative because the button's `aria-label` or `aria-labelledby` supplies the accessible name.
- Informative standalone icons are outside this Button slice and must not automatically be hidden by a global icon rule.
- Decorative SVGs are not keyboard-focusable.

## Storybook and Source Policy

- Remove the `.slotted-demo-icon` CSS-mask catalog and its embedded SVG path data.
- Use the same Lucide glyphs for equivalent React and Angular demonstrations.
- Prefer static named imports and explicit Angular `provideIcons` registration.
- Do not use wildcard catalog imports, runtime lookup across the complete catalog, copied SVG paths, icon fonts, or network-loaded icons.
- The Storybook may use a small local adapter solely to apply consistent decorative/accessibility props, but it must not recreate glyph data.

## Verification

- Source tests reject the old hand-authored demo icon catalog.
- Story tests verify that all icon-only button demonstrations contain real icon content and retain accessible names.
- React and Angular package checks cover type safety, rendering, and builds.
- Static Storybook builds verify that each framework integration resolves in its actual documentation pipeline.
- A production Angular fixture is used as evidence for tree-shaking when the Angular icon integration or its major version changes.

## Deferred Scope

A published Slotted icon package is intentionally deferred. It becomes justified only when Slotted owns original glyphs, requires stable semantic aliases across multiple upstream families, or needs a framework-neutral asset format for consumers. Until then, reexporting Lucide would add versioning and maintenance without improving the Button contract.
