# Suggested Roadmap for a Multi-Framework UI Library

> This document is a **planning reference**, not an implementation rule.
>
> The order, groupings, and dependencies below should be treated as **architectural hypotheses**. The AI or person responsible for structuring the library should have the freedom to review, combine, split, anticipate, or postpone phases as the actual architecture evolves.

## Goal

Build a UI library that is:

- multi-framework;
- highly customizable;
- fully themeable;
- extensible;
- accessible;
- consistent;
- durable;
- built around stable APIs;
- loosely coupled;
- and prepared to evolve without requiring frequent rewrites.

The goal should not be simply to “have many components,” but to create a foundation capable of supporting different frameworks, products, themes, and future requirements.

---

## Planning Principle

The sequence suggested below prioritizes components and systems that tend to unlock other components.

It **should not be interpreted as a mandatory dependency graph**.

Before starting each batch, it is worth reassessing:

- which dependencies already exist;
- which abstractions are actually mature;
- which primitives can be shared;
- what should remain framework-agnostic;
- which components justify their own abstractions;
- whether some phases can or should happen in parallel;
- whether actual product needs should change the priority.

The architecture should guide the roadmap, not the other way around.

---

# Phase 0 — Foundations

Shared foundations for the entire library.

Possible items:

- design tokens;
- colors;
- themes;
- dark/light mode;
- typography;
- spacing;
- radius;
- shadows;
- breakpoints;
- motion;
- icon system;
- CSS reset / normalize;
- focus ring;
- accessibility conventions;
- layering / z-index strategy;
- portal strategy.

### Intent

Create a visual and technical language that can be consumed by all frameworks.

Whenever it makes sense, this layer should remain independent from React, Vue, Svelte, or any other adapter.

---

# Phase 1 — Primitives

Basic building blocks used to compose other components.

Examples:

- Box;
- Stack;
- Inline / Flex;
- Grid;
- Divider;
- Text;
- Heading;
- Link;
- Icon;
- Avatar;
- Surface;
- Card;
- ScrollArea;
- VisuallyHidden.

### Intent

Define composition patterns and stabilize recurring concepts such as:

- `size`;
- `variant`;
- `color`;
- `disabled`;
- polymorphism / `as`;
- slots;
- styling hooks;
- tokens;
- state attributes.

Not all of these primitives necessarily need to exist as public components. Some may remain internal utilities.

---

# Phase 2 — Basic Controls

The first set of controls that is genuinely useful for building applications.

Examples:

- Button;
- IconButton;
- ButtonGroup;
- Input;
- TextArea;
- Checkbox;
- Radio;
- Switch;
- Label;
- Field;
- FieldMessage;
- FormGroup;
- Badge;
- Tag / Chip;
- Spinner;
- Skeleton.

### Intent

Validate in practice:

- variant APIs;
- theming;
- states;
- disabled/read-only behavior;
- focus;
- validation;
- accessibility;
- composition;
- ergonomics across frameworks.

---

# Phase 3 — Overlay & Interaction Infrastructure

Behavioral infrastructure that tends to unlock many later components.

Possible internal primitives or systems:

- Portal;
- Positioner / Floating;
- FocusTrap;
- DismissableLayer;
- outside interaction handling;
- Escape handling;
- focus restoration;
- layering;
- keyboard navigation.

Components that may emerge from this foundation:

- Tooltip;
- Popover;
- Dropdown;
- Menu;
- ContextMenu;
- Dialog / Modal;
- Drawer;
- ConfirmDialog;
- Toggletip.

### Intent

Avoid reimplementing focus, positioning, dismissal, and accessibility logic independently in every complex component.

This phase may begin before or after part of the Basic Controls phase, depending on the chosen architecture.

---

# Phase 4 — Advanced Inputs & Selection

Form components that usually depend on earlier primitives and overlay infrastructure.

Examples:

- Select;
- Combobox;
- MultiCombobox;
- Autocomplete;
- Command / CommandPalette;
- SegmentedControl;
- Slider;
- RangeSlider;
- NumberInput;
- TagsInput;
- SearchInput;
- FileUpload;
- FileDropzone;
- ColorPicker.

### Intent

Consolidate abstractions around:

- listbox behavior;
- selection;
- active item state;
- keyboard navigation;
- filtering;
- controlled/uncontrolled state;
- form integration;
- overlay composition.

A headless architecture or an approach based on behaviors/state machines may be especially useful here, but it should not be adopted purely by convention.

---

# Phase 5 — Feedback & Navigation

## Feedback

Examples:

- Alert;
- Toast;
- EmptyState;
- Progress;
- LoadingBar;
- StatusIndicator.

## Navigation

Examples:

- Tabs;
- Breadcrumb;
- Pagination;
- Toolbar;
- Sidebar;
- Accordion;
- Collapsible.

### Intent

Expand the library from isolated controls into complete application patterns.

Depending on actual needs, Feedback and Navigation may be split into separate batches.

---

# Phase 6 — Data & Pickers

Families of more complex components with larger API surfaces.

Possible families:

## Data

- Table;
- DataTable;
- VirtualList;
- Tree;
- sorting;
- filtering;
- column resize;
- column visibility;
- row selection;
- virtualization.

## Date & Time

- Calendar;
- DatePicker;
- DateRangePicker;
- TimePicker;
- DateTimePicker;
- TimeZonePicker.

### Intent

Treat these components as small subsystems rather than isolated components.

`Table`, for example, may eventually become a family composed of primitives, state management, and visual adapters.

---

# Phase 7 — Advanced / Specialized

Higher-maintenance components or components with significant external dependencies.

Examples:

- CodeEditor;
- InlineCodeEditor;
- JSON Editor;
- Rich Text;
- SplitPane;
- Resizable;
- Drag & Drop;
- Cascader;
- TreeSelect;
- Query Builder;
- chart primitives;
- visualization containers.

### Intent

Add specialized components only when the library foundation has demonstrated enough stability.

This phase should be strongly driven by actual demand.

---

# Summary View

```text
Foundations
    ↓
Primitives
    ↓
Basic Controls
    ↓
Interaction / Overlay Infrastructure
    ↓
Advanced Inputs
    ↓
Feedback + Navigation
    ↓
Data + Pickers
    ↓
Advanced / Specialized
```

This flow represents a tendency in dependencies, not a mandatory sequence.

In practice, development may take shapes such as:

```text
Foundations
 ├─ Primitives
 │   ├─ Basic Controls
 │   └─ Navigation
 │
 ├─ Overlay Infrastructure
 │   ├─ Tooltip
 │   ├─ Menu
 │   ├─ Select
 │   └─ Dialog
 │
 └─ Behavior Core
     ├─ Combobox
     ├─ DatePicker
     ├─ DataTable
     └─ Advanced Components
```

---

# Possible Package Architecture

One possible structure for a multi-framework library:

```text
@lib/tokens
@lib/icons
@lib/core
@lib/styles

@lib/react
@lib/vue
@lib/svelte
@lib/web-components
```

Conceptually:

```text
Tokens
  ↓
Core / behaviors
  ↓
Primitives
  ↓
Components
  ↓
Composite Components
```

This separation is also only a reference.

Depending on architectural decisions, it may make more sense to separate packages such as:

```text
@lib/theme
@lib/a11y
@lib/positioning
@lib/collection
@lib/forms
@lib/overlay
@lib/virtualization
```

or to keep some of these concerns internal until there is a real reason to expose them as public packages.

---

# Guidelines for the AI Responsible for the Architecture

The AI should not interpret this roadmap as a rigid specification.

Before creating or changing phases, it should critically evaluate:

1. Does this component actually depend on the previous items?
2. Is there a truly reusable abstraction, or are we generalizing too early?
3. Does this abstraction belong in the core or in a framework adapter?
4. Can the behavior exist independently from the visual layer?
5. Does the component need to be public, or can it remain internal?
6. Can the proposed API survive multiple themes?
7. Does the implementation allow customization without requiring forks?
8. Is there coupling between styling, behavior, and framework that could be removed?
9. Will the abstraction remain useful when new frameworks are added?
10. Is there a real reason to build this now?

The AI should have the freedom to:

- reorder phases;
- create sub-phases;
- execute batches in parallel;
- merge components;
- split components;
- postpone premature primitives;
- introduce new primitives;
- remove abstractions that no longer justify themselves;
- change package organization;
- propose alternative architectures.

Whenever the roadmap changes significantly, the decision should be justified based on dependencies, reuse, API stability, accessibility, theming, extensibility, and maintenance cost.

---

# Long-Term Principles

## Customization

Components should not assume there is only one visual identity.

The library should allow customization at multiple levels, for example:

- global;
- theme;
- component;
- variant;
- instance.

The exact strategy may vary, as long as it does not make the APIs fragile or unnecessarily complex.

---

## Theming

Themes should be treated as part of the architecture, not as a layer added later.

Ideally, components should not depend directly on hardcoded visual values.

---

## Composition

Whenever possible, prefer composable components over monolithic ones.

At the same time, avoid turning every simple component into an excessively fragmented tree of subcomponents.

---

## Framework Independence

Behaviors, state rules, tokens, and conceptual contracts should remain framework-independent whenever doing so provides real value.

Absolute independence is not necessary if it worsens the API or significantly increases complexity.

---

## Accessibility

Accessibility should be part of the component definition from the beginning.

It should not be treated as a later correction phase.

---

## Durability

Prioritize small, predictable, extensible APIs.

Avoid exposing internal implementation details simply because they are convenient for the current implementation.

---

## Dependencies

Keep dependency flow as predictable as possible.

A useful principle is:

```text
complex components may depend on primitives;
primitives should not know about complex components.
```

Example:

```text
Combobox
 ├─ Input
 ├─ Popover
 ├─ Listbox
 └─ Collection behavior
```

while:

```text
Popover → Combobox
```

would probably indicate an inverted abstraction or unnecessary coupling.

This should not be treated as an absolute law either: exceptions may exist, as long as they are intentional and justified.

---

# Primary Criterion

The roadmap should remain subordinate to the architecture.

The central question is not:

> “What is the next component on the list?”

But rather:

> “What is the next set of abstractions and components that increases the library’s capabilities without compromising its future flexibility?”

The goal is to build a foundation that remains healthy after dozens or hundreds of components, multiple frameworks, multiple themes, and several years of evolution.
