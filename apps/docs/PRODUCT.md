# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Engineers and teams evaluating whether to adopt the library. They need to see quality, breadth, and the multi-framework model on the first visit.
- Engineers who already use the library. They consult examples, API, keyboard, and tokens during daily work.
- The two audiences carry the same weight. The entry presents the library; the component pages serve lookup.
- Secondary audience (`docs/product/prd.md` §7.1): design system and platform teams that create themes for several applications.

## Product Purpose

Public site of the Slotted library: presentation home and official documentation on the same site. Content entirely in English, including the examples. Success: whoever evaluates understands the differentiator and the quality without installing anything, and whoever already uses it finds the example, API, and behavior of a family on one page.

## Positioning

- One specification per family (`specs/components/<family>/contract.json`) and one stylesheet per family, with idiomatic bindings for React and Angular. Both render the same DOM (`data-ui`, parts, ARIA).
- Each example runs in the framework selected by the reader.
- Declared focus on dense product applications: dashboards, back-office, internal tools, SaaS, systems centered on tables, forms, and flows (`docs/product/prd.md` §2). Landing pages and marketing are not a target of the library.
- Themes as a first-class product; density (`comfortable`, `compact`, `dense`) and schemes (`light`, `dark`, `high-contrast`) as theme axes.

## Operating Context

- The reader switches between framework (React, Angular), scheme, and density, and expects the same page in each combination.
- The reader copies code from the examples into their own application.
- A real product demo exists (`demos/nexora`, Angular) and consumes the library as a package.

## Capabilities and Constraints

- Stack: Astro 7 in `apps/docs`, static output; site interface built with `@slotted/react` and `@slotted/themes`.
- 121 families specified in `specs/components/`.
- The packages are not yet published on npm. Install commands and links to external playgrounds cannot promise availability.
- React and Angular today; other frameworks may come later.
- Undefined: domain, documentation versioning, date of first publication.

## Brand Commitments

- "Slotted" is a provisional name. The site does not fix a strong brand in the name: the name appears as text, at a single point in the code, replaceable.
- Quality references given by the user: reui.io, mui.com, shadcn/ui documentation.

## Evidence on Hand

- Contracts per family: `specs/components/*/contract.json`.
- Tokens per family: `packages/styles/src/<family>/<family>.tokens.json`.
- Nexora demo: `demos/nexora/angular`.
- Absent and forbidden to invent: testimonials, user companies, download numbers, stars, benchmarks, prices.

## Product Principles

1. Show, do not assert: every claim about the library points to a runnable example.
2. Visible parity: switching framework keeps the reader on the same page and the same example.
3. Density is a citizen: examples and the site's own interface work in `compact` and `dense`.
4. The site is a consumer of the library: a defect seen on the site is treated as a package defect.

## Accessibility & Inclusion

The library declares accessibility by default (`docs/product/prd.md` O7). The site follows WCAG 2.2 AA and offers the `high-contrast` scheme.
