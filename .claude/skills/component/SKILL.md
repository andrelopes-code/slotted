---
name: component
description: Use when explicitly invoked as /component <family> in the Slotted repository to build or rebuild one component family, or a tightly related pair; do not infer it from a request to change component code.
---

# Component craft

> Execution quality: obsession with craft. Pixel-perfect, extreme refinement,
> exclusive microinteractions, premium animations, carefully designed
> hovers/actives/focus, and zero template or AI-slop look. Every pixel
> must be intentional.

That motto is the bar of every step. `references/rubric.md` › Craft bar states it
as pass conditions, read from numbers rather than from impressions.

Build or rebuild one family, or a tightly related pair, without hiding framework-native APIs. The same bar applies whether the family exists or not.

Three steps are the reason this skill exists, and they fail in different directions.

Step 8 answers _is the picture right_. The library already had a rigorous checklist; it passed while the components looked poor. Do not leave the visual loop because the code is finished. Leave it because the picture is right.

Step 3 answers _is there enough component here_. Every other step in this skill can be satisfied by a box with one attribute, and the rubric will score it well: fourteen of the library's families shipped with exactly one capability, `toolbar` shipped with one part and no keyboard, and one family in thirty-four declares a state model. A lawful, beautiful, empty component is the failure this step exists to catch. Do not leave the capability inventory because the scope paragraph is covered. Leave it because a team building a real product would not have to reach past the family.

Step 9 answers _is this worth building on_. Four fifths of a family is written after the picture is right and before anyone has seen it, so the gate that catches a wrong anatomy belongs there, not at the end.

The target is a family a team would choose over the best headless library plus their own CSS. The anti-goal is a styled `div` with one prop — an unstyled Bootstrap, with neither the features nor the looks — and its twin, a family whose every value is a framework default: the look of a template.

## Permission

Read only what is needed for an auditable implementation. The quality bar is not
negotiable:

- Start with `references/quick-law.md` in every session.
- In a first pass for a family, or whenever changes touch contract, states,
  tokens, accessibility, or either framework binding, read the full-law docs before editing.
- In follow-up cycles, read full-law docs only for unresolved decision points.

Repeatedly re-reading the same source is discouraged; skipping required reads is not.

Execution constraints:

- Execute the sequence in this document directly; do not route it through a brainstorming flow.
- Do not offer to explain work in a browser, to draw mockups or diagrams in chat, or to open a local URL for visuals. Report the project artifacts and test results the steps require.
- Treat each invocation as one-family scope; finish Step 15 for that family and then reset for the next family.
- If multiple `/component` tasks are running, queue them unless the request is explicitly independent and file-disjoint.
- Do not spawn subagents without the user's approval (`AGENTS.md` › Restraint).

Ship the capability the inventory justifies, including one nobody asked for. Adding a well-argued capability is not scope creep, and it is not a question for the reviewer: it is a decision, recorded like every other decision, and a decision to include needs no more justification than a decision to exclude.

Composition over configuration is a rule about the **shape** of an API, not about how much a family does. It says: expose parts a consumer arranges, not thirty props on one element. A family with eight parts, a full keyboard model and a state model for every mutable value obeys it. A family with one part and one prop is not obeying it — it is empty. The same holds for the platform-first and no-DOM-promises rules: all three constrain how a capability is expressed, never whether it exists. Using any of them as a reason to ship less is a misreading, and it is the misreading that produced the families listed above.

## Execution discipline (to avoid unnecessary loops)

The goal is fast progress with full quality, not a longer loop. Use this sequence:

1. Define a concrete acceptance list before editing (2–6 explicit checks).
2. Make one focused code pass that targets all items in that list.
3. Run the minimal verification for this pass, then stop.
4. Fix all root-cause issues from the failure report in one consolidated edit.
5. Re-run verification once.

Do not rerun broad edits in search of improvement. If one issue persists after two full fix attempts, escalate:

- state the repeated failure,
- list 1–2 concrete hypotheses,
- and ask for an explicit unblock decision before continuing.

There are exactly two human gates, at Step 9 and Step 14, and no others. Do not invent one for process control: between steps, record the decision in an artifact and carry on.

When reading source, prefer the narrowest useful set. Read the next source only when a dependency or decision point requires it; do not broaden scope merely because it is faster to "have all context first."

## Process

Follow these steps in order. Replace `<family>` with the invoked family name. When the invocation names a tightly related pair, apply every step and every gate to both.

1. **Load the law before component code.** Read `docs/build-briefing.md`, then `references/quick-law.md`, and follow its reading order: the minimum scope documents always, the full-law list on a first pass and in the cases it names. Whatever the pass, read `references/capability.md` before step 3, `references/rubric.md` before step 4, `references/frameworks.md` before step 5, `references/polish-lenses.md` before step 7, `references/harness.md` before step 8 and `references/stories.md` before step 11.

   Do not inspect the family implementation first.

2. **Detect the mode. Both modes reach the same bar.** If `specs/components/<family>/` exists, rebuild the family; otherwise, create it. A family listed in `specs/legacy-families.json` moves to the current contract schema and leaves that list in the same commit.

   Rebuild is not touch-up. What shipped is evidence of a past decision, not a constraint on this one: the contract, the parts, the props, the element, the state model and the stylesheet are all open. Change the public API when the inventory shows the shape is wrong — a renamed prop, a prop that becomes a part, a part that becomes a family, a boolean that becomes a state model. An existing API is never a reason to ship less than the inventory justifies.

   The cost of a break is written, not avoided: record what changed and how a consumer moves, as `docs/component-features.md` section 18 requires of a contract break. That note is the price of the change, and it is cheaper than carrying a shape the family has outgrown.

3. **Survey the field, then inventory the capabilities.** Follow `references/capability.md`. Produce the inventory before any design or code, in four named sections, in this order: **Surveyed**, **Table stakes**, **Differentiators**, **Gaps**. Read `docs/product/prd.md` and weigh every item the invocation named inside the same inventory.

   The inventory is produced in both modes, from the field rather than from the family. In rebuild mode, produce it before reading the current implementation, then put the two side by side and name the delta: what shipped, what the field ships, and what this family will ship. A capability the family already has is not automatically kept — it is inventoried like every other, and dropped if the field and this library's own context say it was wrong.

   The scope paragraph in `docs/process/build-order.md` is a floor, not a ceiling. A capability two or more surveyed implementations ship is adopted or adapted; declining one requires naming the family that owns it instead, or the two or three lines of consumer code that compose it. "Not needed yet" is not a reason, and neither is a shared tool that cannot express it.

   Present the inventory before writing code.

4. **Source the pattern.** Follow `references/patterns.md`. Look up the applicable WAI-ARIA Authoring Practices pattern; never rely on recall. In rebuild mode, read `packages/styles/src/<family>/<family>.css` against `references/rubric.md`, then write the current defects, open questions, and context-dependent decisions. The rubric guides inspection; it is not a closed rule set or a substitute for judgement.

5. **Design the family, and both bindings' ergonomics, before either is written.** Answer both integration tables in `references/frameworks.md` in writing — every line gets the place that answers it, or one sentence naming why this family does not need it. A blank line is an unanswered question, not a no.

   When responsibility, anatomy, state ownership, composition, cross-framework behavior, or a public API break needs a decision, write a design in `docs/history/designs/` and proceed after recording the decision and rationale. A rebuild that changes any of those needs the document as much as a new family does; only a change that alters no decision skips it, and the integration tables are answered either way.

   Write the shortest document that records the decision and what it costs. The reader is the family that inherits the decision, not a reviewer being persuaded: a decision that outlives this family is worth a page, and one that does not is worth a paragraph in the contract or the stylesheet beside the rule it explains.

6. **Change the contract and its test first.** Create or update `specs/components/<family>/contract.json` and its contract test. The contract declares `ui`, the parts, the states from the shared vocabulary, and a `stateModel` for every mutable capability. Run the focused test, watch it fail for the intended missing behavior, implement the smallest contract change, and run it again:

   ```bash
   node --test specs/components/<family>/*.test.mjs
   ```

   Never weaken a test to make an implementation pass, and never narrow the contract to fit a shared tool. A schema, a workbench map or a story check that cannot express the right contract is a defect in that tool, fixed first, in its own commit, as `docs/build-briefing.md` requires.

7. **Write the stylesheet against the foundation.** Work in `packages/styles/src/<family>/<family>.css` and its token file. Read each visual decision against `docs/token-foundation.md`, but evaluate it in the component's context. Document intentional departures and their cost. Do not create or run a regex-based policy gate over CSS; open-ended design rules cannot be made complete that way. Progress using behavioral tests, rendered evidence, and explicit review.

8. **Render, capture, look, and correct.** Follow `references/harness.md`. Build the page and capture at least these combinations:

   ```bash
   node tools/harness/build.mjs <family>
   node tools/harness/shoot.mjs <family> --scheme light --width 420
   node tools/harness/shoot.mjs <family> --scheme dark --width 420
   node tools/harness/shoot.mjs <family> --scheme high-contrast --width 420
   node tools/harness/shoot.mjs <family> --scheme light --width 240
   node tools/harness/shoot.mjs <family> --scheme light --density dense
   node tools/harness/shoot.mjs <family> --scheme light --dir rtl
   ```

   Then photograph the states. A family that paints a state and never captures it has not been looked at:

   ```bash
   node tools/harness/shoot.mjs <family> --scheme light --focus '<selector>'
   node tools/harness/shoot.mjs <family> --scheme dark --focus '<selector>'
   ```

   Capture every state the contract declares — hover, focus-visible, active, disabled, loading, checked, selected, open, invalid — in the scene that shows it, and in both light and dark. A state that only exists live is exercised in the browser at the gate and named in the assessment.

   Read every image. Judge alignment, spacing rhythm, type, optical balance, scheme
   contrast, whether density changes size without changing meaning, whether the
   mirrored layout is the same component, and whether the narrow container holds.
   Then judge the states against each other: does the focus ring sit at the right
   distance from the border, does hover read at a glance without shouting, does
   press give feedback, does disabled stay legible, does the transition between
   two states help the eye or merely happen.

   Correct the component and recapture only the affected scenes when the visual change is
   clearly localized to one or two scenes.

   If the change alters any of the following, rerun the full baseline set from this
   step before closing visual review:

   - shared geometry or wrapper behavior,
   - token mapping, token names, or token file wiring,
   - layout primitives or spacing system, or
   - any state transition logic shared across states.

   Then read the numbers. Take the family's specimen (`references/harness.md` › Specimen) in light, dark and high-contrast, with `--states` on each interactive part, plus `--motion reduce`, `--forced-colors active`, `--density dense` and `--dir rtl`. Work every row of `references/rubric.md` › Craft bar against it, read the stylesheet through `references/polish-lenses.md`, and compare each state delta with the reference specimen from step 3, value by value: a reference value that is better is adopted onto a token, and a family value that is better is kept and named.

   Code completion is not the exit condition, and neither is a correct picture. The exit condition is a picture with nothing left to fix — and the way to find what is left is to name, in writing, the one detail you would change if you had another hour, then change it.

9. **Stop at the visual gate.** The picture is settled and nothing has been bound to a framework yet. Hand over the harness page path and the captures read, the step 3 capability inventory with its four sections, the anatomy the contract declares — parts, states, state model — and every decision taken so far. Ask the reviewer to open the harness and exercise hover, focus, keyboard and resizing there. Wait, and incorporate the answer before step 10.

   This gate exists because the five steps after it produce four fifths of the family: bindings, behavioral tests and the two reference pages were 84% of the lines the Button family cost, and every one of them is written on top of the anatomy and the picture confirmed here. An anatomy corrected at this gate costs the stylesheet. The same correction after step 13 costs the family.

   Say what a wrong answer would cost, so the reviewer knows what is cheap to change now and expensive later.

10. **Implement both frameworks.** Follow `references/frameworks.md`. Keep the conceptual contract shared, React idiomatic to React, and Angular idiomatic to Angular. Preserve native props, events, and explicit consumer values.

    Every word the family writes on its own lives in the catalog (`docs/decisions/0003-internationalization.md`), never in the family: declare the interface, the American English and the definition in `packages/core/src/i18n/messages/<family>.ts`, translate it in `packages/core/src/i18n/locales/pt-BR/<family>.ts`, and add the family to `catalog.ts` and `locales/pt-BR.ts`. A count is a `plural` message. The component reads its words with `useMessages(<camel>Messages, messages)` or `injectMessages(<camel>Messages, this.messages)` and exposes one `messages` prop or input; it takes no `labels` and no string prop whose default the library supplies. The contract lists the keys under `messages`. `pnpm test:i18n` refuses a family that writes a word of its own.

11. **Write both reference pages, then read them rendered.** Follow `references/stories.md`. The pages are where a consumer meets the family's API, and they are held to a contract of their own: the import, the anatomy, one captioned demonstration per declared scenario with the code that produced it, the inputs, the outputs, the composition surface, and the accessibility decisions. Two demonstrations and no source is the shape this step used to produce, and `specs/reference-pages.test.mjs` now refuses it.

    Lay every demonstration out with the workbench primitives; the stage owns the gap between examples, and a story that reaches for an inline style is refused. Then read both reference pages rendered, at 1280 and 720 pixels, in light and in dark — the page, not the story file:

    ```
    http://localhost:6006/iframe.html?viewMode=docs&id=components-<family>--reference
    http://localhost:6007/iframe.html?viewMode=docs&id=components-<family>--reference
    ```

    Use a Storybook server that is already answering on 6006 (React) or 6007 (Angular). When one is not, start that one in the background — `pnpm --filter @slotted/storybook-react dev` or `pnpm --filter @slotted/storybook-angular dev` — and never a second instance on a port that already answers. Stop only the servers this run started, after the release gate is answered.

    Read every story the family declares in `viewMode=story` as well, and read the page in dense as well as comfortable. The docs page and the story view lay the same scene out under different rules, and a scene that holds inside one can escape its stage in the other: a matrix was drawn out of an 88-pixel box and over the two scenes below it in the story view alone. Open every code drawer before judging the page — a closed `<details>` is a snippet nobody looked at, and the one inside it was set in a proportional face for as long as the drawers stayed shut.

    A demonstration in a mostly empty canvas, two examples with no distance between them, a caption that repeats the title, a clipped table, a snippet that no longer matches the demonstration above it, a snippet whose columns do not line up, or anything drawn outside the box that owns it — each is a defect of this step, and each was found by looking rather than by a test.

    Then measure the page rather than only looking at it, at 1280 and at 620 pixels:

    ```bash
    node tools/harness/audit.mjs "http://localhost:6006/iframe.html?viewMode=docs&id=components-<family>--reference"
    node tools/harness/audit.mjs "http://localhost:6007/iframe.html?viewMode=docs&id=components-<family>--reference"
    ```

    It exits non-zero on an element collapsed to a sliver inside a wide stage, or on content overflowing the box that owns it — the two defects a screenshot can show and no offline test can see. `pagination` shipped with its root at zero pixels inside a 676-pixel stage and 171 pixels of spill, on a page that passed every test. A finding is a defect of this step.

    A defect in the workbench is fixed in the workbench, with a test in `tools/storybook-workbench`, before the family's own work continues — as step 6 requires of every shared tool.

12. **Run the automatic gates.** Format every changed file, then require:

    ```bash
    pnpm check:affected
    pnpm test:i18n
    ```

    If this is a shared-tool change (schema, harness, core utilities, or tests that affect every family), or if `pnpm check:affected` is not available, run `pnpm check` instead.

    Do not pipe a verification command into `head`, `tail`, or `grep`; preserve its exit status. Run only the minimum verification for the current cycle and do not add extra verification passes to chase a lower command count.

13. **Write the self-assessment.** Assess all eleven dimensions in `references/rubric.md`: Icons, Motion, Responsiveness, Refinement, Tokens, Patterns, Accessibility, Native API, Capability, Ecosystem integration, and Documentation. Follow its Scoring rule: for each dimension name the one change that would most improve it, and say whether it was made. Record every row of the Craft bar with the specimen number that decides it. Then state, against `docs/component-features.md` section 18, the family's anatomy, its controlled and uncontrolled contract with reasons, its state matrix, its density and direction behavior, and its loading, empty, error and extreme-content cases. Cite capture paths, behavioral tests, the APG checklist, relevant code, and the reasoning behind context-dependent choices. Fix anything below the bar before continuing.

14. **Stop at the release gate.** The picture was approved at step 9; this gate is about everything built on top of it. Decide every open question first, as `docs/build-briefing.md` requires: the gate carries decisions already taken, not questions for the reviewer. Hand over the absolute harness path, the reference-page URLs with the widths and schemes they were read at, the step 3 capability inventory with its four sections, the eleven-dimension self-assessment, and the decisions taken. Ask the person to open the harness and both reference pages, on the servers step 11 left answering, and exercise hover, focus, keyboard, and resizing.

15. **Commit after the release gate.** Make one commit per step of substance, name every staged file explicitly, and include only this family's work. Do not stage a directory.

    A decision that binds another family goes to the briefing's _Decisions already taken_; a pending item goes to `docs/process/build-order.md` — the family's scope when it is not built yet, _Reopenings promised in writing_ when it is; a convention goes to the comment of the test that enforces it. Write in the log only what a later family must know and none of those three places can hold — a defect with a lesson, or a debt nobody else owns.
