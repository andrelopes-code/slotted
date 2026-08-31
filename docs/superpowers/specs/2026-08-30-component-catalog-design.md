# Component Catalog Design

## Outcome

The catalog names every component of the v1 library, orders them by dependency, and records what each unblocks. Everything listed here is v1: the tiers are build order, not release phases.

It decides scope and order. It does not decide anatomy, states, keyboard model, or accessibility contract — those are written per component in `specs/components/<family>/contract.json` when the component enters the queue. Order and dependency age well; API detail does not. Fixing a combobox keyboard model eighteen components before building it produces a document that is confidently wrong, which is the failure that stopped `@slotted/core` from being written ahead of its first caller.

## Tiers Are Not Package Layers

`L0`–`L4` in `2026-08-30-layered-architecture-design.md` are package layers, enforced by `scripts/verify-layers.mjs`. Every component here lives in `L3`, the framework packages.

`T1`–`T7` are build tiers, derived from one rule:

> A component's tier is one greater than the highest tier among its dependencies. A component with no dependency on another catalog component is `T1`.

The rule admits no thematic exception. Components in the same tier have no dependency on each other and can be built in parallel. A consequence worth stating: a tier mixes concerns. `T4` holds `NumberInput` beside `Dialog` because both sit at the same depth, not because they are alike.

## What Belongs to `@slotted/core`

Portal, focus trap, focus restoration, roving tabindex, typeahead, dismissal, positioning, collision detection, scroll locking, and virtualization math are infrastructure, not components. They live in `@slotted/core` and never appear in this catalog.

Each module is written by the plan of the first component that needs it, designed against that component's real requirements, and its signature stays malleable until a second caller confirms it. The table below records where each arrives.

| Core module | First caller | Tier |
| --- | --- | --- |
| `core/focus` — roving tabindex, typeahead | Tabs | T2 |
| `core/collection` — virtualization math | VirtualList | T2 |
| `core/files` — accept matching | FileUpload | T2 |
| `core/collection` — filtering, comparison | Listbox | T3 |
| `core/collection` — date arithmetic | Calendar | T3 |
| `core/overlay` — portal, positioning, collision, scroll lock | Dialog | T4 |
| `core/focus` — trap, restoration | Dialog | T4 |
| `core/dismiss` | Dialog | T4 |

Identifier generation is absent from this table on purpose. React 19 ships a hydration-safe `useId`, and Angular 22.1.4 ships no equivalent, so the generator is Angular-local until a second consumer needs it. `2026-08-31-field-primitive-design.md` records the evidence.

`Dialog` is deliberately the first overlay: it exercises trapping, restoration, dismissal, and scroll locking together, so the modules are designed against the hardest case rather than the easiest. Signatures that satisfy a dialog are usable by a popover; the reverse does not hold.

---

## T1 — No Dependency

| Component | Purpose | Unblocks |
| --- | --- | --- |
| Button family | Action, navigation, icon-only action, toggle, group | shipped; Tag, Alert, Pagination, Toolbar, Collapsible |
| Link | Inline text navigation carrying link semantics | Breadcrumb, Sidebar, EmptyState |
| VisuallyHidden | Content exposed only to assistive technology | Field, Dialog, Toast, Table family |
| Divider | Semantic or decorative separation | Card, Menu, Toolbar |
| Spinner | Indeterminate progress | Button loading, async surfaces |
| ProgressBar | Determinate progress | Stepper, LoadingBar, FileUpload |
| Badge | Short status or count label | Tabs, Menu, Table family |
| Avatar | Person or entity image with fallback | Menu, Sidebar |
| Skeleton | Loading placeholder that preserves layout | Card, list surfaces |
| Kbd | Keyboard key presentation | Command, Tooltip, Menu |
| DescriptionList | Semantic key and value pairs | detail surfaces |
| Splitter | Resizable adjacent regions, pointer and keyboard | application shells |

## T2 — Depends on T1

| Component | Purpose | Depends on | Unblocks |
| --- | --- | --- | --- |
| Field family | Label, description, error, and their ARIA wiring | VisuallyHidden | every form control |
| Card | Grouped surface with header, body, footer | Divider | EmptyState |
| Tag | Removable or selectable short value | IconButton | TagsInput, MultiCombobox |
| Alert | Inline message carrying severity | IconButton | — |
| Collapsible | Single disclosure of a region | Button | Accordion, Sidebar |
| Breadcrumb | Position within a hierarchy | Link | — |
| Pagination | Movement across pages of results | ButtonGroup | Table family |
| Stepper | Position within a sequential flow | ProgressBar | wizards |
| LoadingBar | Page-level indeterminate or determinate progress | ProgressBar | — |
| Tabs | Sibling panels, one visible, roving focus | `core/focus` | settings and detail surfaces |
| Toolbar | Grouped controls sharing one focus stop | ButtonGroup, `core/focus` | editors, Table headers |
| VirtualList | Windowed rendering of a long list | `core/collection` | Table family, Listbox |
| FileUpload | File selection with progress and validation | ProgressBar, Button | — |

## T3 — Depends on T2

| Component | Purpose | Depends on | Unblocks |
| --- | --- | --- | --- |
| Input | Single-line text entry | Field | NumberInput, SearchInput, Combobox |
| Textarea | Multi-line text entry, optionally auto-sizing | Field | — |
| Checkbox | Binary choice, including indeterminate | Field | Table family selection |
| RadioGroup | One choice among few, roving focus | Field, `core/focus` | SegmentedControl |
| Switch | Immediate binary setting | Field | — |
| Slider | Single value along a track | Field, `core/focus` | RangeSlider, ColorPicker |
| Fieldset | Grouping of related fields with a legend | Field | forms |
| Accordion | Group of independently collapsible sections | Collapsible | — |
| EmptyState | Absence of content, with a recovery action | Card, Link | Table family, Combobox |
| Sidebar | Collapsible application navigation region | Collapsible, Link | shells |
| Listbox | Selectable option list, single or multiple | `core/focus`, `core/collection` | Select, Combobox |
| Tree | Hierarchical, expandable, selectable structure | `core/focus`, `core/collection` | TreeSelect |
| Calendar | Month grid with keyboard navigation | `core/focus`, `core/collection` | DatePicker |

## T4 — Depends on T3

| Component | Purpose | Depends on | Unblocks |
| --- | --- | --- | --- |
| Dialog | Modal task requiring a decision | `core/overlay`, `core/focus`, `core/dismiss`, VisuallyHidden | AlertDialog, Drawer, Command |
| Popover | Non-modal panel anchored to a trigger | `core/overlay`, `core/dismiss` | Tooltip, Menu, Select, DatePicker |
| Toast | Transient message outside the user's flow | `core/overlay` | — |
| NumberInput | Numeric entry with step controls | Input | — |
| SearchInput | Text entry shaped for querying | Input, IconButton | Command |
| SegmentedControl | One choice among few, presented as a bar | RadioGroup | — |
| RangeSlider | Two values along one track | Slider | filters |
| TagsInput | Free-form list of short values | Input, Tag | — |

## T5 — Depends on T4

| Component | Purpose | Depends on | Unblocks |
| --- | --- | --- | --- |
| AlertDialog | Confirmation of a destructive or irreversible action | Dialog | — |
| Drawer | Panel anchored to a viewport edge | Dialog | small-viewport navigation |
| Tooltip | Supplementary text for a control, on hover and focus | Popover | IconButton, Toolbar |
| HoverCard | Rich preview on hover, non-essential content | Popover | — |
| Menu | Actions anchored to a trigger, keyboard navigable | Popover, `core/focus` | ContextMenu, Menubar |
| Select | One option from a known set | Popover, Listbox, Field | Combobox |
| NavigationMenu | Application navigation, optionally nested | Popover, `core/focus` | — |
| TreeSelect | Hierarchical selection inside a panel | Popover, Tree | — |
| Cascader | Sequential selection across dependent levels | Popover, Listbox | — |
| DatePicker | Date entry, typed or picked | Popover, Calendar, Input, Field | DateRangePicker |
| TimePicker | Time entry, typed or picked | Popover, Input, Field | DateTimePicker |
| ColorPicker | Colour selection | Popover, Slider, Input | — |

## T6 — Depends on T5

| Component | Purpose | Depends on | Unblocks |
| --- | --- | --- | --- |
| ContextMenu | The same menu, opened by secondary click | Menu | Table family row actions |
| Menubar | Application menu bar with horizontal traversal | Menu | — |
| Combobox | One option, filtered by typing, with free entry | Select, Input | Autocomplete, MultiCombobox |
| DateRangePicker | Start and end date in one control | DatePicker | — |
| DateTimePicker | Date and time in one control | DatePicker, TimePicker | — |
| Table family | Semantic table, then sorting, selection, column resizing, sticky regions and virtualization on one DOM | Checkbox, Menu, Pagination, VirtualList | dense application surfaces |

### Why the table is one family, built late

A plain semantic table has no dependency and would sit in `T1` by the tier rule. It is placed here anyway, and this is the catalog's only deliberate departure from that rule.

The DOM a feature-bearing table needs is not the DOM a naive one would have. Virtualization rules out rendering every row inside `tbody`; sticky headers change the structure; column resizing needs `colgroup` or a fixed table layout; row selection changes the ARIA semantics. A parts contract fixed early, without those in view, is one the feature-bearing member either breaks or works around — and working around it means two implementations of the same component.

This is the same argument that puts `Dialog` first among the overlays: design against the hardest case, because a contract that satisfies it also satisfies the simple one. Here the simple member, `Table`, falls out of the family's design at no extra cost. Building it first and reshaping it later would cost the design twice.

## T7 — Depends on T6

| Component | Purpose | Depends on |
| --- | --- | --- |
| MultiCombobox | Several options, filtered by typing | Combobox, Tag |
| Autocomplete | Suggestions for free text without constraining it | Combobox |
| Command | Searchable action palette | Combobox, Dialog, Kbd |
| QueryBuilder | Composed filter expressions | Combobox, Select, Input |

---

## Not Owned by the Library

Each exclusion below is a decision with a reason, not an omission. Any of them can be reversed, and reversing one adds it to `T1` unless noted.

**Box, Stack, Inline, Grid, Text, Heading, Surface.** Layout and typography utilities. PRD §5 lists replacing Tailwind, Sass, or CSS Modules as a non-goal, and these add no accessibility or behavioural value over the consumer's own styling solution. Typography is a theme decision expressed in tokens.

**Icon.** Consumers use any source. The library owns the slot's sizing contract, and the glyphs it renders itself come from `core/glyphs`.

**Polymorphic rendering.** `render` in React and directive-on-native-element in Angular are a pattern the library already applies in `ButtonLink` and `slButton`. It belongs in the glossary, not in a shipped `Slot` component.

**ScrollArea.** Custom scrollbar presentation. Native scrollbars are accessible, respect user settings, and cost nothing; a replacement needs a concrete case that native cannot serve.

## Requires a Case Before Entering

These appear in earlier planning notes and are neither accepted nor rejected here. Each needs an argument against PRD §39 and §40 — whether it is a recurring, generalizable problem the library should centrally maintain, and whether it is better served by an existing dependency.

| Candidate | The question |
| --- | --- |
| RichTextEditor | Almost certainly a wrapper over an existing editor rather than an in-house implementation. Which one, and does wrapping it belong in a UI library? |
| CodeEditor, JSON editor | Same question, with a larger dependency and a narrower audience. |
| Charts | PRD §23.1 names charts as an example of what importing a button must never pull in. Likely a separate package if owned at all. |
| Carousel, Rating, Timeline, Statistic | Common in component libraries, uncommon in dense applications. Each needs a real requirement before entering. |

## Per-Component Process

Each component follows the process proven on the button family:

1. A contract in `specs/components/<family>/contract.json`, with its test.
2. A design through the brainstorming skill when the component raises architectural questions, skipped when it does not.
3. An implementation plan, executed task by task with tests written first.
4. Both frameworks in the same plan whenever a public contract changes, so no commit leaves the library inconsistent.
5. Storybook coverage driven by the contract's scenarios, verified by the existing coverage check.

Completion is governed by PRD §42, which this document does not restate.

## Open Questions

Recorded so they are not rediscovered. Each is decided by the component that raises it, not now.

1. Whether `Listbox` is public or an internal building block for `Select` and `Combobox`. Decided when `Select` is designed.
2. Whether `Toolbar` and `ButtonGroup` are one concept. `ButtonGroup` joins seams; `Toolbar` adds a single focus stop. Decided when `Toolbar` is designed.
3. Whether `Drawer` is a `Dialog` variant or its own component. Decided when `Drawer` is designed.
4. Whether `Menu`, `Menubar`, and `NavigationMenu` share one implementation. Decided when `Menubar` is designed.
5. Whether `Fieldset` is a component or a documented composition of `Field`. Decided when `Fieldset` is designed.
6. Whether `Tabs` and `Toolbar` handle overflow with scroll affordances or with an overflow menu. Both sit in `T2` and `Menu` sits in `T5`, so the menu route would invert the tier rule. Scroll affordances keep them at `T2`; an overflow menu is additive to their parts contract rather than structural, so it can arrive later without breaking it. Decided when each is designed, with that constraint stated up front.
