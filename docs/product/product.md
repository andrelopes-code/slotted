# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Engineers and product teams building dense web applications with React or Angular, including organizations that need one coherent UI foundation across products without losing each product's visual identity.

## Product Purpose

Slotted is a long-lived, multi-framework UI library for product applications. It provides complete, accessible components, primitives, tokens, and extension contracts with idiomatic implementations for each supported framework.

Success means React and Angular consumers receive equivalent semantics and visual capabilities, can adopt a polished default immediately, and can evolve the library or replace its visual identity without fragile overrides.

## Positioning

Slotted shares framework-neutral facts while keeping runtime components native to their framework. Themes are independently evolvable products rather than color presets, and component APIs preserve extension paths instead of encoding one fixed visual treatment.

## Core Capabilities

- Framework-native React and Angular component packages with machine-checked parity.
- Foundation, semantic, and component tokens with complete theme products.
- Dense and comfortable application modes, light and dark schemes, and deep customization beyond color.
- Stable public DOM, styling, accessibility, composition, and extension contracts.
- Internal Storybook workbenches for curated visual inspection and implementation reference.

## Constraints

- Prefer native platform and framework behavior over proprietary cross-framework abstractions.
- Framework packages must not depend on one another or on private documentation tooling.
- Initial implementation may be small, but architecture must not prevent richer future components, themes, composition, SSR, internationalization, RTL, or overlays.
- Storybook is an internal workbench at this stage, not the public documentation product.
- Visual acceptance remains a human decision; browser automation and AI visual judgment are not release gates for this phase.

## Accessibility & Inclusion

Native semantics, keyboard behavior, accessible names, visible focus, reduced motion, logical properties, and framework-appropriate ARIA behavior are defaults. The library owns component-level accessibility guarantees while applications retain responsibility for contextual labeling and content.
