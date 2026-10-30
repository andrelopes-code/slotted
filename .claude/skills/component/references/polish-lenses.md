# Polish lenses

Two installed skills sharpen steps 7 and 8. They are lenses on the stylesheet
and the specimen, read once per run before step 7, never a second process. When
a file below is absent, the step continues without it; the craft bar in
`rubric.md` stays the bar.

## What to read

| Source                            | Path                                                   | Read                                                                                                                                                                               | Skip                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Emil Kowalski, design engineering | `~/.claude/skills/emil-design-eng/SKILL.md`            | The Animation Decision Framework, Component Building Principles, `transform-origin`, Performance Rules, Accessibility, The Sonner Principles, Stagger Animations, Review Checklist | Initial Response, Spring Animations, Framer Motion, Debugging; Gesture and Drag unless the family drags                                      |
| Impeccable, quality floor         | `~/.claude/skills/impeccable/reference/craft-floor.md` | Verify: Contrast, Depth, Motion, States, Browser surfaces. Refuse: Surface habits                                                                                                  | Page scaffolds, Type measure and display sizes: they judge pages, and apply to `demos/*` and the reference pages, not to a family stylesheet |
| Impeccable, motion                | `~/.claude/skills/impeccable/reference/animate.md`     | Find the job, for the Operate mode                                                                                                                                                 | Persuade and Experience modes, native platforms                                                                                              |

Nothing else from Impeccable runs: not `impeccable context`, not
`impeccable detect`, not the `critique`, `polish`, `live`, `shape`, `craft`,
`overdrive` or `hooks` commands, not its reviewer, documenter or asset agents,
and not the `/impeccable` routing, which asks for `PRODUCT.md` and `DESIGN.md`
this repository does not keep. `impeccable detect` was measured on the badge
harness page: 162 findings, all `cramped-padding` on badges whose padding is the
design.

## Precedence

`docs/token-foundation.md` and `rubric.md` › Craft bar, then Emil, then
Impeccable. A lens never introduces a literal: a curve or a duration the
foundation lacks is a proposal to the foundation, recorded in the self-assessment,
not a value in the family stylesheet.

| Topic          | Lens says                                                                  | This library does                                                                                                                                       |
| -------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exit easing    | Emil: enter and exit both ease-out; never ease-in on UI                    | Exit uses `--slotted-easing-exit`, an accelerating curve. The conflict is undecided; the token stays until `docs/token-foundation.md` › Motion changes. |
| Custom curves  | Emil: `cubic-bezier(0.23, 1, 0.32, 1)` and similar literals                | Motion tokens only; `motion.test.mjs` rejects literal durations.                                                                                        |
| What animates  | Emil: transform and opacity. Impeccable: blur, clip-path, mask, shadow too | Hover and press feedback moves transform, opacity and color. Enter and exit may add clip-path or blur when the specimen shows it smooth.                |
| Hover on touch | Emil: gate hover motion on `@media (hover: hover) and (pointer: fine)`     | Open decision for the whole library; one family gates today. Record the family's choice.                                                                |

## What to apply

- **Press.** An interactive control answers `:active` with a transform (Emil's
  `scale(0.97)` on buttons) or the family's recorded alternative.
- **Enter and exit.** Nothing appears from `scale(0)`; start from `scale(0.95)`
  with `opacity: 0`, entering through `@starting-style`. Exit is not slower
  than enter.
- **Origin.** A popover scales from its trigger; a modal stays centerd.
- **Interruptibility.** State changes a person can retrigger quickly use
  transitions, not keyframes.
- **Keyboard repetition.** Movement driven by repeated keys — arrow
  navigation, typeahead — does not animate.
- **Browser surfaces.** Selection, caret, scrollbar, focus ring, underline
  offset and tabular numerals inside the family are themed from tokens, not left
  to browser defaults.
- **Surface habits.** No colored `border-inline-start` above 1px on alerts,
  callouts or list items, no gradient text, no glass as decoration, no
  zero-blur offset shadow — unless the family's design document records why.

## How findings are written

Step 8 and the self-assessment write lens findings as one table, Emil's review
format:

| Before | After | Why |
| ------ | ----- | --- |

One row per finding, `Before` and `After` as CSS or specimen values, `Why` in
one clause. A finding with no `After` is an open decision and says so.
