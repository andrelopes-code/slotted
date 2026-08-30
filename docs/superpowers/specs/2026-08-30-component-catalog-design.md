# Component Catalog Design

## Outcome

The catalog names every component Slotted intends to own, assigns each to a build tier, records what it depends on and what it unblocks, and marks the version it belongs to. It decides scope and order. It does not decide anatomy, states, keyboard model, or accessibility contract — those are written per component, in `specs/components/<family>/contract.json`, when the component enters the queue.

That split is deliberate. Order and dependency age well; API detail does not. Fixing the keyboard model of a combobox eighteen components before building it produces a document that is confidently wrong, which is the failure that stopped `@slotted/core` from being built ahead of its first caller.

## Tiers Are Not Package Layers

`L0`–`L4` in `2026-08-30-layered-architecture-design.md` are package layers, enforced by `scripts/verify-layers.mjs`. Every component in this catalog lives in `L3`, the framework packages.

`T1`–`T7` here are build tiers. They express dependency and order among components, not package boundaries. A tier is ready when the tier below it is, not because a rule forbids otherwise.

## Entry Format

Each component carries: its tier, a one-line purpose, what it depends on, and what it unblocks. Completion is governed by PRD §42, which this document does not restate.

`Core` in a dependency column names a module of `@slotted/core` that the component's own plan writes, designed against that component's real requirements. Infrastructure that is inherently shared — focus, dismissal, positioning — is written directly in core by its first caller; its signature stays malleable until a second caller confirms it.

---

## T0 — Foundations

Complete. Delivered by the layered architecture work: the token pipeline and contract, the default theme, the single authored stylesheet, the machine-checked component contract, the Storybook workbench, and the enforced layer rule.

## T1 — Primitives

No dependency beyond tokens, themes, and the stylesheet. Each is small, and several are prerequisites the later tiers assume.

| Component | Purpose | Depends on | Unblocks |
| --- | --- | --- | --- |
| Button family | Action, navigation, icon-only action, toggle, group | — | shipped |
| VisuallyHidden | Content for assistive technology only | — | Field, Dialog, Toast, Table |
| Divider | Semantic or decorative separation | — | Menu, Toolbar, Card |
| Spinner | Indeterminate progress | — | Button loading, Skeleton, async states |
| ProgressBar | Determinate progress | — | FileUpload, Stepper |
| Badge | Short status or count label | — | Tabs, NavigationMenu, Table |
| Tag | Removable or selectable label | — | TagsInput, MultiCombobox, filters |
| Avatar | Person or entity image with fallback | — | NavigationMenu, Table, Menu |
| Skeleton | Loading placeholder preserving layout | — | Table, Card, list states |
| Card | Grouped surface with header, body, footer | Divider | EmptyState, dashboards |
| Alert | Inline message carrying severity | — | Field error patterns, Banner |
| EmptyState | Absence of content, with a recovery action | Card | Table, Combobox, list views |

**Not owned by the library.** Box, Stack, Inline, Grid, Text, and Heading are layout and typography utilities. PRD §5 lists replacing Tailwind, Sass, or CSS Modules as a non-goal, and shipping them would put the library in competition with the consumer's styling solution for no accessibility or behavioural gain. Typography is a theme decision, expressed in tokens.

**Not a component.** Polymorphic rendering — `render` in React, directive-on-native-element in Angular — is a pattern the library already applies in `ButtonLink` and `slButton`. It is documented in the glossary, not shipped as `Slot` or `asChild`.

**Icon** stays a consumer decision, per the layered architecture spec.

## T2 — Form Controls

`Field` is the keystone. It owns identifier generation and the ARIA wiring that every control below reuses, so it is built first and alone.

| Component | Purpose | Depends on | Unblocks |
| --- | --- | --- | --- |
| Field family | Label, description, error, and their ARIA wiring | VisuallyHidden, Core `id` | every control below |
| Input | Single-line text entry | Field | Combobox, Autocomplete, SearchInput |
| Textarea | Multi-line text entry, optionally auto-sizing | Field | — |
| Checkbox | Binary choice, including indeterminate | Field | Table row selection, MultiCombobox |
| RadioGroup | One choice among few, with roving focus | Field, Core `focus` | SegmentedControl |
| Switch | Immediate binary setting | Field | settings surfaces |
| SegmentedControl | One choice among few, shown as a bar | RadioGroup | Toolbar, view switchers |
| NumberInput | Numeric entry with step controls | Input | Slider pairing, Table filters |
| Slider | Value or range along a track | Field, Core `focus` | filters |
| SearchInput | Text entry shaped for querying | Input, IconButton | Command, Combobox |

`Core id` arrives here, written by the `Field` plan. React keeps `useId`, which is already hydration-safe and is the framework primitive PRD §6.4 prefers; the shared module is expected to serve Angular. That expectation is tested when `Field` is built, not assumed now.

`Core focus` arrives with `RadioGroup`, which needs roving tabindex. Whether that same function serves `Toolbar` and `Menu` unchanged is decided by those components, and changing it then is expected.

## T3 — Overlay Infrastructure

The tier that requires the most new infrastructure and unblocks the most. `Dialog` is built first because it exercises focus trapping, restoration, dismissal, and scroll locking together, so the core modules are designed against the hardest case rather than the easiest.

| Component | Purpose | Depends on | Unblocks |
| --- | --- | --- | --- |
| Portal | Render outside the DOM position, keep the context | Core `overlay` | every overlay below |
| Dialog | Modal task requiring a decision | Portal, Core `focus`, Core `dismiss`, Core `overlay` | AlertDialog, Drawer |
| AlertDialog | Dialog for a destructive or irreversible confirmation | Dialog | — |
| Drawer | Panel anchored to a viewport edge | Dialog | navigation on small viewports |
| Popover | Non-modal panel anchored to a trigger | Portal, Core `overlay`, Core `dismiss` | Menu, Select, Combobox, DatePicker |
| Tooltip | Supplementary text for a control, on hover and focus | Popover | IconButton, Toolbar |
| Toast | Transient message outside the user's flow | Portal, Core `overlay` | async feedback |

`@floating-ui/dom` enters here as the single positioning and collision engine, wrapped by `core/overlay`. Angular CDK is not adopted. Portals, stacking, and scroll locking build on platform features where they apply.

SSR tests enter here too: this is the first tier with client-only effects, which the layered architecture spec records as the trigger.

## T4 — Menus and Selection

Depends on T3 for anchoring and dismissal, and introduces collection behaviour: active descendant, typeahead, filtering.

| Component | Purpose | Depends on | Unblocks |
| --- | --- | --- | --- |
| Menu | Actions anchored to a trigger, keyboard navigable | Popover, Core `focus`, Core `collection` | ContextMenu, Toolbar overflow |
| ContextMenu | The same menu, opened by secondary click | Menu | Table row actions |
| Listbox | Selectable option list, single or multiple | Core `focus`, Core `collection` | Select, Combobox |
| Select | One option from a known set | Popover, Listbox, Field | Table filters |
| Combobox | One option, filtered by typing, with free entry | Select, Input | Autocomplete |
| MultiCombobox | Several options, filtered by typing | Combobox, Tag | filter builders |
| Autocomplete | Suggestions for free text, without constraining it | Combobox | SearchInput |
| TagsInput | Free-form list of short values | Input, Tag | filters, recipients |
| Command | Searchable action palette | Combobox, Dialog | keyboard-first surfaces |

## T5 — Navigation and Structure

Mostly independent of T3 and T4; placed here because its value depends on there being content to navigate.

| Component | Purpose | Depends on | Unblocks |
| --- | --- | --- | --- |
| Tabs | Sibling panels, one visible, with roving focus | Core `focus` | settings, detail views |
| Accordion | Independently collapsible sections | Core `focus` | dense forms, FAQ |
| Toolbar | Grouped controls with one focus stop | Core `focus`, ButtonGroup | editors, Table headers |
| Breadcrumb | Position within a hierarchy | ButtonLink | detail views |
| Pagination | Movement across pages of results | ButtonGroup | Table |
| Stepper | Position within a sequential flow | ProgressBar | wizards |
| NavigationMenu | Application-level navigation, optionally nested | Popover, Core `focus` | shells |
| Tree | Hierarchical, expandable, selectable structure | Core `focus`, Core `collection` | file and org browsers |

## T6 — Data

The heaviest tier. `Table` and `DataTable` are separated deliberately: the first is semantic markup with a styling contract and no behaviour, useful immediately; the second adds sorting, selection, resizing, and virtualization, and is where the cost concentrates.

| Component | Purpose | Depends on | Unblocks |
| --- | --- | --- | --- |
| Table | Semantic tabular markup with a styling contract | Divider | DataTable |
| DataTable | Sorting, selection, resizing, sticky regions, virtualization | Table, Checkbox, Menu, Pagination, Core `collection` | dense application surfaces |
| Calendar | Month grid with keyboard navigation | Core `focus`, Core `collection` | DatePicker |
| DatePicker | Date or range entry, typed or picked | Calendar, Popover, Input, Field | filters, scheduling |
| TimePicker | Time entry, typed or picked | Popover, Input, Field | scheduling |

## T7 — Specialized

Each needs its own justification against PRD §39 before entering the catalog proper. None is assumed.

| Component | Purpose | Note |
| --- | --- | --- |
| FileUpload | File selection with progress and validation | Depends on ProgressBar; drag-and-drop accessibility is the hard part |
| ScrollArea | Custom scrollbar presentation | Questionable value against native scrollbars; needs a concrete case |
| ColorPicker | Colour selection | Large surface, narrow demand |
| RichTextEditor | Formatted text authoring | Almost certainly a wrapper over an existing editor, not an in-house implementation |
| Charts | Data visualisation | Out of scope for a UI library; PRD §23.1 names charts as an example of what a button import must not pull in |

## Versions

| Version | Contents | Rationale |
| --- | --- | --- |
| v1 | T1, T2, T3, and from T4 Menu, ContextMenu, Listbox, Select | The smallest set that builds a real application: actions, forms, overlays, and choice from a known set |
| v1.1 | Remaining T4, and from T5 Tabs, Accordion, Breadcrumb, Pagination, Toolbar | Filtering and navigation, once the overlay infrastructure has been exercised by real use |
| v1.2 | Table, Calendar, DatePicker, TimePicker, remaining T5 | Dense application surfaces, once collection behaviour is proven by T4 |
| v2 | DataTable | Large enough to deserve its own PRD; virtualization and column state are the cost |
| Unscheduled | T7 | Each enters only with a case against PRD §39 |

The v1 boundary excludes `Tabs` and `Table`, which are commonly expected. That is a deliberate ordering choice, not an omission: both are cheap to add once T3 exists, and pulling them earlier would delay the overlay infrastructure that far more components depend on.

## Order of Work

```
T1 primitives          ──┐
                         ├─> T2 Field ──> T2 controls ──┐
                         │                              │
                         └─> T3 Dialog ──> T3 overlays ─┼─> T4 selection ──> T6 data
                                                        │
                                                        └─> T5 navigation
```

Two constraints, both from dependency rather than preference:

1. `Field` precedes every other form control, because it owns the ARIA wiring they all reuse.
2. `Dialog` precedes every other overlay, because it exercises focus trapping, restoration, dismissal, and scroll locking together, and designing the core modules against it produces signatures the simpler overlays can use.

## Per-Component Process

Each component follows the process already proven on the button family:

1. A contract in `specs/components/<family>/contract.json`, with its test.
2. A design brought through the brainstorming skill when the component raises genuine architectural questions, and skipped when it does not.
3. An implementation plan, executed task by task with tests written first.
4. Both frameworks in the same plan whenever a public contract changes, so no commit leaves the library inconsistent.
5. Storybook coverage driven by the contract's scenarios, verified by the existing coverage check.

## Open Questions

These belong to the components that raise them and are recorded so they are not rediscovered:

1. Whether `Listbox` is a public component or an internal building block for `Select` and `Combobox`. Decided when `Select` is designed.
2. Whether `Toolbar` and `ButtonGroup` are one concept. `ButtonGroup` exists and joins seams; `Toolbar` adds a single focus stop. Decided when `Toolbar` is designed.
3. Whether `Drawer` is a `Dialog` variant or its own component. Decided when `Drawer` is designed.
4. Whether `RichTextEditor` and `Charts` belong to the library at all. Both currently read as out of scope.
