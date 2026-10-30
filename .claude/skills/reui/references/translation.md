# Reading ReUI in Slotted terms

## Where each ReUI kind lives

| Kind         | Name pattern                         | Live preview route                    | Readable source                                                                            |
| ------------ | ------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| Primitive    | `badge`, `data-grid`, `filters`      | None; seen through its `c-*` examples | `https://reui.io/r/<name>.json` (MIT) and `https://reui.io/docs/components/base/<name>.md` |
| Free example | `c-<category>-<n>`, e.g. `c-badge-4` | `/preview/<base>/example/<name>`      | `https://reui.io/r/<name>.json` (MIT)                                                      |
| Pro block    | `<category>-<n>`, e.g. `app-shell-3` | `/preview/<base>/<name>`              | None: the registry answers 401. Rendered DOM and specimen only.                            |

`<base>` is `base` (Base UI) or `radix`. Every route answers at `https://reui.io`
and takes `?embed=1&style=<style>&theme=light|dark`. ReUI has eight styles
(`nova`, `vega`, `lyra`, `maia`, `mira`, `luma`, `rhea`, `sera`); `nova` is the
default.

Static thumbnails for triage: `https://reui.io/thumbnails/components/<name>-light.webp`
and `-dark.webp`.

The catalog is `https://reui.io/llms-full.txt`: one line per Pro block and free
example, with the block's description and the primitives it composes. Step 2 of `SKILL.md` caches it; search the cached copy.
A block line names the primitives it uses ("ReUI Frame, Badge, shadcn Sidebar"),
which is how a family is found inside blocks whose title does not name it.

## Anatomy

| ReUI signal                                                                                                                         | Slotted reading                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `data-slot="<part>"`                                                                                                                | A candidate `data-part` in `specs/components/<family>/contract.json`.               |
| Base UI `data-open`, `data-closed`, `data-highlighted`, `data-disabled`, `data-checked`, `data-starting-style`, `data-ending-style` | A state from the shared vocabulary in `docs/state-and-events.md`.                   |
| Radix `data-state="open\|closed\|checked"`, `data-highlighted`                                                                      | Same as the Base UI row.                                                            |
| `.style-<style> .cn-<part>`, `.cn-<part>-variant-<v>`, `.cn-<part>-size-<s>`                                                        | The style-specific rule set; the rule to read for a state condition.                |
| `@media (hover: hover)` around a hover rule                                                                                         | Hover exists only for a fine pointer; Slotted decides the same question explicitly. |

Class names locate a rule and its state condition. They are never the source of
a measurement.

## Values

Every value in a dossier comes from a specimen JSON written by
`tools/harness/specimen.mjs`. The table below maps a computed value to the Slotted
scale in `docs/token-foundation.md`.

| Computed value (px)                                                | Slotted token                                                                                              |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| length 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64                  | `--slotted-space-1` … `--slotted-space-12`, in order                                                       |
| length 10, 14, 28                                                  | No step. The dossier records the nearest step and the resulting difference.                                |
| font-size 12, 13, 14, 16, 18, 20, 24, 32                           | `--slotted-font-size-xs` … `--slotted-font-size-4xl`, in order                                             |
| radius 0, 2, 4, 6, 8, ≥ 9999                                       | `--slotted-radius-none`, `-xs`, `-sm`, `-md`, `-lg`, `-full`                                               |
| radius 10, 12, 14                                                  | No step. Same rule as the length row without a step.                                                       |
| transition 150ms `cubic-bezier(0.4, 0, 0.2, 1)` (Tailwind default) | `--slotted-duration-short` (120ms) or `--slotted-duration-medium` (200ms) with `--slotted-easing-standard` |
| `oklch(...)` or `oklab(... / α)` colour                            | The semantic colour token with the same role (§ Semantic colour). Never a literal.                         |
| `box-shadow: 0 0 0 Npx <ring>`                                     | The focus ring of `docs/token-foundation.md`, checked by `packages/styles/src/focus-ring.test.mjs`.        |
| drop shadow                                                        | `--slotted-shadow-*` or `--slotted-control-shadow` (§ Shadow).                                             |
| `opacity: 0.5` on disabled                                         | The Slotted disabled treatment, which keeps the label legible.                                             |

A literal duration in a family stylesheet fails `packages/styles/src/motion.test.mjs`.

## What crosses into the packages

Measurements, anatomy, state choreography, motion timing and capabilities cross,
each rewritten against Slotted tokens and contracts. Tailwind class strings,
`cva` variant tables, React source, demo data and ReUI copy do not cross.
