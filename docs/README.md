# docs

The root of `docs/` holds only the law: what applies to every family and is loaded
by the `/component` skill. Each subdirectory has its own reading class.

| Directory    | Class       | Reading rule                                           |
| ------------ | ----------- | ------------------------------------------------------ |
| `docs/*.md`  | law         | Applies to every family. Changes by recorded decision. |
| `decisions/` | law         | ADRs. One file per decision, numbered.                 |
| `product/`   | context     | PRD and positioning. Not a backlog.                    |
| `process/`   | operational | States what to build next. Edited every session.       |
| `evals/`     | record      | One report per `pnpm eval:agent-docs` run.             |

## Law

| File                    | Content                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `build-briefing.md`     | What does not change between families: environment, Storybook, the two gates, constraints, decisions taken. |
| `component-features.md` | Feature guide per family, with Core / Extended / Specialized level. Origin of all scope.                    |
| `token-foundation.md`   | Token contract and default theme values, per group.                                                         |
| `state-and-events.md`   | State modes, request with reason, bindings and DOM identity.                                                |
| `styling.md`            | The `slotted` cascade layer and the published order of the sublayers.                                       |
| `decisions/0001`        | A single top-level cascade layer.                                                                           |
| `decisions/0002`        | Repository layout by content type.                                                                          |
| `decisions/0003`        | Internationalization: single catalog, ICU grammar, provider per binding.                                    |
| `decisions/0004`        | Theming architecture: theme as module, seeds, recipe, scope and theme rules.                                |

## Product

| File                 | Content                                                |
| -------------------- | ------------------------------------------------------ |
| `product/prd.md`     | PRD: principles, non-goals, versioning, accessibility. |
| `product/product.md` | Platform, users, purpose, product positioning.         |

## Operational

| File                          | Content                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `process/build-order.md`      | Families delivered, promised reopenings and the next waves with scope per family.     |
| `process/i18n-inventory.json` | Inventory of text keys per binding and family, emitted by `scripts/extract-i18n.mjs`. |

## Outside `docs/`

| Location                   | Content                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `specs/components/<f>/`    | Public contract of each family (`contract.json`) and the test that verifies it.                   |
| `apps/docs/`               | Documentation site: component pages, React and Angular examples.                                  |
| `packages/*/README.md`     | Installation and use of each package, published on npm with the package.                          |
| `CHANGELOG.md`             | One entry per published version, written by `pnpm release` (CONTRIBUTING.md › Publishing to npm). |
| `demos/nexora/domain.md`   | Domain and product specification of the Nexora demo. Normative for the backend.                   |
| `demos/*/LIBRARY-FEEDBACK` | Ledger of package defects and gaps observed from a demo.                                          |
