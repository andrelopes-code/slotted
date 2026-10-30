# Component craft rubric

Assess every dimension in writing before the human gate. Dimensions 1 through 8 judge the quality of what exists; 9 and 10 judge whether enough exists, and they are the two a minimal component fails; 11 judges whether a consumer can find any of it. The craft bar at the end turns dimensions 2 and 4 into pass conditions read from a specimen. This rubric directs attention; it is not an exhaustive rule set. Do not turn it into regex enforcement or assume every valid decision can be enumerated ahead of time. Use behavioural evidence, rendered output, source reading, and component context.

## 1. Icons

**Meaning:** Every component-owned icon is the `Glyph` element — a real `<svg>` from `@slotted/core/glyph`, rendered by the binding inside the `icon` box (`<Icon><Glyph name="…" /></Icon>`, `<span slIcon><svg slGlyph name="…"></svg></span>`). One mechanism for every family: never a `mask-image`, a `::before`/`::after` standing in for an icon, a family hook whose fallback is a glyph token, or a character or emoji. The component supplies intrinsic icons instead of asking the consumer to supply its own semantics.

**Verify:** Read the binding and find the `Glyph` element for every icon the family draws; read the stylesheet and find none painted. `packages/styles/src/glyph-element.test.mjs` fails on a glyph token in CSS outside its `PENDING` list. Inspect each icon in light, dark and high-contrast captures. Confirm directional artwork mirrors through `directional` on the `icon` box.

**Fails when:** a stylesheet paints an icon (mask, pseudo-element, background image); `content` draws `/`, `*`, `×` or another character; an expected glyph is absent; direction-sensitive geometry points the wrong way.

## 2. Motion

**Meaning:** Motion is how a component answers a person. Every state change carries a designed transition from the motion scale: the answer to a hover and a press, and the enter and exit of anything that appears, disappears, moves or resizes — a panel opening, a control filling, a value moving, a row arriving. That feedback is information, and a family without it is unfinished. Motion is refused only when it is decorative: tied to no state change and no action, or standing between a person and the next interaction. Enter and exit are two movements, not one played backwards, and exit is not slower than enter. Movement driven by repeated keys — arrow navigation, typeahead — does not animate, and the focus indicator appears at once. Reduced motion is inherited from the theme, while infinite animation stops explicitly.

**Verify:** Exercise every animated state in a real browser, read the timing choices in context, and emulate `prefers-reduced-motion: reduce`. For every state pair the family can move between, name the transition — properties, duration token, easing token — or the reason it snaps. Read the `transition-*` values of the specimen against the craft bar.

**Fails when:** A state change snaps without a written reason; a state change the eye must follow happens instantly because animating felt risky; an element appears or disappears with a colour swap alone; enter and exit share one easing; a duration or easing is handwritten; an animation loops under reduced motion; decorative motion blocks interaction.

## 3. Responsiveness

**Meaning:** The component answers its own inline size rather than the viewport. A reflowing family declares `container-type: inline-size`, owns a `container-name`, and uses literal breakpoints because CSS forbids custom properties in container conditions.

**Verify:** Read captures at 240, 420, and 720 pixels. Resize the harness stage around each breakpoint and inspect long, translated, and stateful content.

**Fails when:** Content overflows or wraps accidentally at 240 pixels; a viewport query controls component layout; `@container` exists without a family-owned container; the transition around a breakpoint is unstable.

## 4. Refinement

**Meaning:** Alignment, spacing rhythm, type, and optical balance form a deliberate whole rather than a collection of valid declarations — at rest and in every state the component can be in.

**Verify:** Read every capture at full size in both schemes, including the state captures from step 8. Compare related edges, baselines, gaps, hit areas, glyph weight, and text centring. Then work the detail list: the focus ring's distance from the border and whether it survives on a tinted surface; whether hover is legible at a glance without shouting; whether press gives feedback; whether disabled stays readable rather than merely faded; whether a state change shifts anything by a pixel; whether an icon sits on the same optical line as its label; whether the component holds at 200% browser zoom. Inspect interactive states in the live harness. Work every row of the craft bar against the family's specimen.

**Fails when:** An edge sits on a half-pixel without intent; a gap breaks the foundation rhythm; text is optically off-centre; focus changes layout; a state is styled but was never looked at; the component looks unfinished despite passing automated checks.

**Not finished when:** you cannot name the detail you would change with another hour. Name it, then change it.

## 5. Tokens

**Meaning:** Every visual decision that a theme may retune is a correctly scoped, honestly named token. Family tokens reach foundation tokens instead of encoding a second scale.

**Verify:** Read `docs/token-foundation.md`, inspect `packages/styles/src/<family>/<family>.tokens.json`, and trace each fallback to the appropriate foundation layer. Record any intentional literal or departure with its reason instead of assuming a source pattern is always defective.

**Fails when:** A family token falls back to a literal outside the documented exemptions; a token name hides its actual purpose; density, scheme, or base concerns live in the wrong layer; the stylesheet invents a parallel scale.

## 6. Patterns

**Meaning:** The implementation follows the applicable APG pattern item by item, prefers native platform semantics, and exposes composition instead of accumulating configuration.

**Verify:** Follow `patterns.md`. Record the source URL, keyboard table, roles, properties, states, labelling, and focus rules, then check each item against the contract and both frameworks.

**Fails when:** The report only says “checked against APG”; required keyboard behaviour or state is absent; ARIA duplicates or contradicts native semantics; a deliberate departure has no written cost.

## 7. Accessibility

**Meaning:** Name, role, state, keyboard, focus, forced colors, reduced motion, reading order, and target behaviour are complete for every supported state.

**Verify:** Exercise keyboard interaction and visible focus in the live harness. Inspect the accessibility tree where needed. Test forced colors and reduced motion. Confirm disabled, invalid, required, expanded, selected, or current state only when applicable.

**Fails when:** A control lacks an accessible name; role and state disagree; keyboard behaviour diverges from the sourced pattern; focus is hidden or trapped; color alone communicates state; forced-colors or reduced-motion behaviour is missing.

## 8. Native API

**Meaning:** Each framework uses its modern idioms and preserves capabilities the underlying element already gives consumers. Shared concepts do not require identical framework APIs.

**Verify:** Read both implementations against `frameworks.md`. Confirm native attributes, events, refs or instances, forms behaviour, and explicit consumer values reach the correct element.

**Fails when:** React imitates Angular or Angular imitates React; native props or events are swallowed; internal DOM becomes an undocumented API; derived state overrides an explicit consumer value; one framework loses a supported capability.

## 9. Capability

**Meaning:** The family holds what a team building a real product needs from it, and every absence is a decision someone can read. Measured against the inventory from step 3, not against the scope paragraph.

**Verify:** Put the inventory beside the shipped contract. Every table-stakes row is `adopt`, `adapt`, or a `decline` that names the family owning the capability instead or the composition that replaces it. Check that each mutable value has a controlled and uncontrolled pair, a request carrying a reason, and a row in the state matrix. Check the keyboard table against the sourced pattern, key by key, including the focus destination.

**Fails when:** A capability two surveyed implementations ship is absent with no written reason; a mutable value has no state model; the differentiators or gaps section is empty without the sentence saying why; the contract was narrowed to satisfy a shared test, schema, or workbench map; the family is a box with one attribute and the other eight dimensions score well.

## 10. Ecosystem integration

**Meaning:** Each binding reaches the real integration points of its ecosystem, not only its syntax. React idiom is not the same as React integration, and passing the idiom list while failing this one is how a family ends up usable in a demo and not in an application.

**Verify:** Read both integration tables in `frameworks.md` against the implementation. Every line answered, with the file that answers it or the sentence that says why the family does not need it. Confirm the Angular control belongs in a Reactive Form where a form is where it belongs, that an application can set family defaults once in both bindings, and that a consumer's own event handler still runs.

**Fails when:** A line is unanswered; the two bindings were levelled down to the smaller shape so they would look alike; a control that belongs in a form has no `ControlValueAccessor`; defaults can only be set per instance; the family's handler replaces the consumer's instead of composing with it; state a consumer must style is not in the DOM.

## 11. Documentation

**Meaning:** The family's two reference pages let a consumer build with it without reading its source. What to import, what it is made of, one captioned demonstration per declared scenario with the code that produced it, every input, every output, the composition surface, and the accessibility decisions.

**Verify:** Follow `stories.md`. Open both pages rendered — `iframe.html?viewMode=docs&id=components-<family>--reference` — at 1280 and 720 pixels, in light and in dark. Read them as a consumer who has never seen the family: try to write the first three lines of usage from the page alone. Check each demonstration against its snippet and each declared default against the API table.

**Fails when:** The page shows the component and never shows how it is written; a scenario the contract declares has no demonstration; a caption repeats the title; a demonstration sits in a mostly empty canvas; two examples touch because the story laid itself out; a table is clipped; an output is undocumented while the contract declares a state model; a story paints its own ground with an inline style.

**Not finished when:** you have read the story files instead of the rendered pages. The defects this dimension exists to catch — the empty canvas, the collision, the clipped table — are invisible in the source and obvious in the picture.

## Craft bar

The rows below are the motto at the head of `SKILL.md` as pass conditions. Each is read from a specimen
of the harness page (`harness.md` › Specimen), in the schemes and axes the row
names, and the self-assessment records the number that decides it.

| Criterion       | Pass condition                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pixel grid      | The block size of every framed part (a part that paints a border, a background or a ring) is a whole pixel at 1×, comfortable density. Inline size of content-sized parts and text parts are exempt.                                                                                                                                                                            |
| Hover           | Every interactive part has a non-empty hover delta; a surface step is ≥ 0.02 OKLab L on each surface (`packages/theme/conformance/theme-conformance.mjs`).                                                                                                                                                                                                                      |
| Press           | The active delta differs from the hover delta.                                                                                                                                                                                                                                                                                                                                  |
| Focus           | On every `focusable` part: indicator ≥ 2px, ≥ 3:1 between the indicator colour and the part's `ground`, in light, dark and high-contrast (WCAG 2.4.13); offset clears the part's border.                                                                                                                                                                                        |
| Transition      | Every property in a hover or active delta that paints is listed in `transition-property`; no declared `all` with a non-zero duration; durations and easings are motion tokens. A property paints unless its box draws nothing with it (a border colour on a zero-width border, an outline colour with `outline-style: none`). The focus indicator is governed by the Focus row. |
| Motion          | A part that appears, disappears, moves or resizes has an enter and an exit transition on motion tokens; enter uses `--slotted-easing-enter`, exit `--slotted-easing-exit`, and the exit duration is not longer than the enter duration. A colour-only swap does not satisfy it. Movement driven by repeated keys does not animate.                                              |
| Reduced motion  | Under `--motion reduce`, motion-scale durations collapse and infinite animations stop.                                                                                                                                                                                                                                                                                          |
| Disabled        | Label contrast holds the token-foundation value; no bare `opacity: 0.5`.                                                                                                                                                                                                                                                                                                        |
| Schemes         | High-contrast and `--forced-colors active` specimens read as the same component.                                                                                                                                                                                                                                                                                                |
| Density and RTL | Dense and rtl specimens keep the anatomy; lengths scale, meaning does not change.                                                                                                                                                                                                                                                                                               |
| Target size     | Interactive parts meet § Target size of `docs/token-foundation.md`.                                                                                                                                                                                                                                                                                                             |
| Intent          | Every value in the family stylesheet is a token or a literal whose reason is written beside the rule or in the family's design document. A value with neither is removed or given its reason.                                                                                                                                                                                   |

A row the family fails is a defect of dimension 2 or 4, fixed before the gate.
When the failing value belongs to a composed family, the self-assessment names
that family's files and the defect goes to `docs/process/build-order.md` ›
_Reopenings promised in writing_.

## Scoring

A dimension that merely passes is not finished. For each of the eleven, name the one change that would most improve it, then say whether it was made and why. A self-assessment with eleven passes and no named improvements has not been written; it has been asserted.
