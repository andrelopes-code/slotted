# Feature guide for a multi-framework UI library

Framework-agnostic reference for React and Angular libraries, focused on SaaS products and enterprise applications. Sirius UI is the baseline of operational depth; the decisions also reflect current patterns of headless libraries, design systems and advanced suites analyzed in August 2026.

This is not an inventory of existing components nor a proposal of a literal API. It is a product contract: what each family must deliver, regardless of JSX, Angular templates, hooks, signals, directives or styling mechanism.

## 1. Scope and levels

- **Core:** required for a usable, coherent product library.
- **Extended:** recurring in SaaS/enterprise, but can ship after the core.
- **Specialized:** valuable in specific domains; must be modular and optional.

The names `Root`, `Trigger`, `Content`, `Item`, `Label` and similar stand for **semantic parts**, not a framework syntax. Each binding chooses the idiomatic construct of its ecosystem.

## 2. Global contract

### 2.1 Architecture

Separate three layers:

1. **Behavior:** state, keyboard, focus, ARIA, collections, positioning and interaction rules.
2. **Binding:** idiomatic adaptation to React or Angular, without changing the public semantics.
3. **Visual:** tokens, recipes, variants, density, motion and styled parts.

An implementation may use state machines, hooks, signals or Web Components internally. None of them may leak into the common contract.

### 2.2 State and events

Every relevant mutable state must admit:

- controlled mode: current state supplied by the consumer and the corresponding change request;
- uncontrolled mode: initial value consumed once and state kept by the component;
- initial value only in uncontrolled mode; later changes to it do not silently sync the state;
- normalized request with new value, enumerated `reason` and opaque/optional origin event;
- imperative methods only for unavoidable actions, such as `focus()`, `open()` and `scrollToKey()`.

Typical reasons: `pointer`, `keyboard`, `clear`, `remove`, `select`, `dismiss`, `escape`, `outsidePress`, `blur`, `submit` and `programmatic`. Avoid ambiguous booleans or different events for the same transition.

Change requests can be canceled before the commit. In uncontrolled mode, the component changes the state only after the request is accepted; in controlled mode, it only notifies and waits for the new state from the consumer. The origin event serves inspection/cancellation in the binding and has no common type across frameworks.

| Common concept                  | React binding, by convention | Angular binding, by convention                   |
| ------------------------------- | ---------------------------- | ------------------------------------------------ |
| current state + request         | `value` + `onValueChange`    | `[value]` + `(valueChange)` or forms integration |
| uncontrolled initial value      | `defaultValue`               | initial value input + internal state             |
| accessible name and description | ARIA props/label             | host attributes, label and ID relations          |
| origin event                    | optional DOM/SyntheticEvent  | optional DOM Event on the output                 |

The names in the last two columns belong to the bindings; they are not requirements of the behavior layer.

### 2.3 Anatomy and composition

- Named, stable parts: `Root`, `Label`, `Description`, `Control`, `Trigger`, `Content`, `Item`, `Indicator`, `Close` and `Footer` when applicable.
- Content, icons and actions can be replaced without reimplementing behavior.
- Attributes, listeners and the host element reference must be forwarded safely.
- The consumer can swap the semantic element of a part only when keyboard, focus and ARIA are preserved.
- Expose `data-ui`, `data-part` and semantic states for styling and testing; internal classes and DOM structure are not contract.

### 2.4 Common input vocabulary

Use consistent concepts, without forcing every component to accept all of them:

- identity and form: stable identifier, submission name and form association;
- content: label, description, placeholder and empty/loading messages;
- state: disabled, readonly, required, invalid, loading and busy;
- appearance: size, density, variant, tone, orientation and width;
- accessibility: accessible name, ID references and announced text;
- collection: items, item key, disabled/selected/expanded keys and selection mode;
- overlay: open state, placement, alignment, offset, modality, dismissal policy and portal root;
- localization: locale, direction, timezone, calendar, formatters and messages.

Prefer `start`/`end` over `left`/`right`. Do not accept an arbitrary color, a CSS-in-JS object, a date adapter or a framework class as part of the agnostic contract.

### 2.5 Visual states

States are required per capability, without inventing semantics the component does not have:

| Capability            | Expected states                                                     |
| --------------------- | ------------------------------------------------------------------- |
| universal interaction | `default`, `hover` when available, `focus-visible`, `disabled`      |
| momentary action      | `active/pressed`; `loading/busy` only if the action is asynchronous |
| value/form            | `readonly`, `required`, `invalid` when semantically supported       |
| selection             | `selected`, `checked`, `unchecked`, `indeterminate` per the model   |
| disclosure/overlay    | `open/closed`, `expanded/collapsed`                                 |
| drag-and-drop         | `dragging`, `drop-target`, `drop-invalid`                           |

- `focus-visible` does not depend on color alone and stays perceptible in light, dark and high-contrast themes.
- `disabled` does not respond to hover, does not fire an action and preserves legibility; prefer native disabled controls when possible.
- `readonly` stays focusable and copyable; it must not look the same as `disabled`.
- `loading` preserves width, blocks a duplicate action and keeps the accessible name.
- `invalid` uses a message associated with the control; color and icon alone are not enough.
- Simultaneous states have documented precedence: for example, `disabled` beats `hover`; `invalid` does not erase `focus-visible`.

### 2.6 Tokens and visual

Use three layers: **primitives** → **semantic tokens** → **component tokens**.

- Primitives: color, typography, space, size, radius, border, shadow, opacity, duration, easing, breakpoint and z-index.
- Semantic: `surface`, `text`, `border`, `focus`, `interactive`, `selected`, `disabled`, `danger`, `warning`, `success` and `info`.
- Component: only the adjustments needed, such as control height, button padding or panel width.

Visual requirements:

- light, dark, high-contrast and multiple-brand themes without recompiling components;
- `comfortable`, `compact` and `dense` densities, keeping the same semantics;
- coherent sizes across controls; touch target of approximately 44 px in touch contexts and never below the WCAG minimum of 24 × 24 CSS px without compensating spacing;
- normal text with minimum contrast 4.5:1; large text, functional icons, essential borders and focus with 3:1;
- layout by logical properties and RTL support;
- motion by tokens, respecting `prefers-reduced-motion`; animation is never required to understand a state.

### 2.7 Responsiveness

Responsiveness changes **composition and priority**, not only size:

- toolbar moves secondary actions to overflow;
- extensive filters can become a drawer;
- master–detail can swap a side-by-side panel for navigation or an overlay;
- table preserves essential columns and offers scroll, row detail or a list view;
- overlay chooses popover on desktop and sheet/action sheet on a narrow viewport when the task requires it;
- use container queries when the component depends on the available space, with documented fallback.

Size class: the container width band that decides the composition of a page surface.

| Class    | Container width     |
| -------- | ------------------- |
| compact  | `< 600px`           |
| medium   | `600px` to `1023px` |
| expanded | `>= 1024px`         |

- The page surface families (`app-shell`, `detail-panel`, `page`, `page-header`) use only the `600px` and `1024px` thresholds in their width `@container` rules. The script reads the same values in `COMPACT_BELOW` and `EXPANDED_FROM` of `@slotted/core/measure`.
- `packages/styles/src/size-classes.test.mjs` rejects any other width threshold in those four families.
- The content reflow of a component (`card`, `list-item`, `alert`) keeps its own literal thresholds, because it responds to the component's content and not to the page composition. In `top-navigation`, the `low` (1024px) and `high` (480px) steps respond to its items; the `medium` step is the `app-shell` overlay step, 600px.

No important behavior may depend on hover. The responsive mode must be testable deterministically.

### 2.8 Accessibility

- Prefer native HTML; use the WAI-ARIA APG patterns when no native element is sufficient.
- Every control has an accessible name; label, description, error and counter use stable ID relations.
- Define a keyboard matrix per family, including arrows, `Home`, `End`, `PageUp`, `PageDown`, `Enter`, `Space`, `Escape` and typeahead when applicable.
- Focus follows the task: it enters a modal, stays contained while modal, returns to the trigger and is never lost after an item is removed.
- Multiple selection, drag-and-drop and resize have a keyboard alternative.
- Asynchronous messages use an appropriate live region without duplicate announcements.
- Support for 400% zoom, reflow, high contrast/forced colors, reduced motion and screen readers is part of acceptance.
- Tests validate behavior and ARIA relations, not markup snapshots.

### 2.9 Internationalization

- `locale` uses BCP 47; direction, timezone and calendar are explicit when relevant.
- Every text the family writes on its own (chrome text) comes from the catalog in `@slotted/core/i18n` (`docs/decisions/0003-internationalization.md`): `messages/<family>.ts` declares the keys and the English, each published locale translates all of them.
- The text surface of a family is a single `messages` prop/input, layered over the catalog key by key. A text prop with a library default value does not exist; content without a default value, `ReactNode` slot and native `aria-label` remain.
- A message is a string in the ICU grammar (`{slot}`, `plural` with `#` and exact branches, `select`) or a function `(slots, locale) => string`. A count is always `plural`.
- The locale comes from `SlottedProvider`/`provideSlotted`; switching it takes effect without reloading and without recreating components; a subtree can have its own locale.
- Number, currency, date and time are domain values, not formatted strings.
- Search, sorting and typeahead use locale-sensitive comparison.
- Directional layout and icons mirror in RTL; icons without direction stay the same.

### 2.10 Performance and distribution

- SSR and hydration must not generate divergent IDs or DOM.
- Virtualization, lazy loading and pagination are optional capabilities of collections, not parallel components.
- Components are tree-shakeable; heavy engines, exporters, editors and charts live in optional packages.
- Do not load portal, positioning, the full locale or whole icon sets when unused.
- Expose version and stability per package, without turning the commercial license of an external reference into a core requirement.

## 3. Invisible infrastructure

These capabilities underpin public components and must have their own tests.

### Theme and configuration `[Core]`

- **Contract:** theme, brand, density, locale, direction, timezone, reduced motion, portal root and z-index range.
- **Behavior:** inheritance by subtree, override by scope and switching at runtime without remounting the application.
- **Visual:** emits semantic tokens; validates contrast combinations and does not couple a component to the raw palette.

### Presence `[Core]`

- Keeps content mounted during the exit animation, syncs `open/closed` state and removes it without losing events or focus.
- Offers a `forceMount` mode for measurement, SSR and integrations; respects reduced motion.

### Focus scope and roving focus `[Core]`

- Contains, restores and moves focus in overlays and collections.
- Roving focus keeps a single item in the tab order and supports orientation, RTL, disabled items and a configurable loop.

### Dismissable layer and portal `[Core]`

- Coordinates Escape, outside click/press, scroll lock, inert content, overlay stack and focus restoration.
- Does not close an ancestor layer when interacting with a descendant overlay; z-index follows a single stack.

### Positioner `[Core]`

- Positions by anchor, placement, alignment, offset, collision and viewport; updates on resize, scroll and content change.
- The contract does not expose Floating UI, Popper or another engine. It makes the anchor width and the transform origin available as style tokens.

### Collection engine `[Core]`

- Common model for static/dynamic items, sections, stable keys, disabled items, selection, typeahead and focus.
- Supports incremental loading, empty/error state and optional virtualization without changing IDs or selection.

### Drag-and-drop `[Extended]`

- Pointer, touch and keyboard; preview, handles, valid zones, auto-scroll, cancellation and accessible announcement.
- Events carry items, source, destination, position and allowed operation; they do not depend on DOM geometry as a data model.

### Visually hidden and live announcer `[Core]`

- Visually hidden content stays accessible without changing layout.
- The announcer manages priority, deduplication and clearing of messages; it does not become a toast API.

## 4. Layout and structure

### Stack, Inline and Grid `[Core]`

- **Purpose:** predictable layout composition without creating a full CSS DSL.
- **Contract:** `gap`, `align`, `justify`, `wrap`, `columns/minItemWidth` and breakpoints limited by tokens.
- **Visual:** logical properties, inherited density and no implicit margins. Grid supports auto-fit; Stack/Inline can switch direction responsively.

### Container `[Core]`

- Centers content with a maximum width, responsive gutters and reading, form and wide-screen variants.
- Allows fluid width and nesting; does not inject background, card or vertical page padding.
- Five steps: `measure`, `content`, `wide`, `full` and `bleed`. `full` is the frame space up to the `--slotted-container-full` ceiling (120rem); `bleed` is the absence of a maximum. **Contract break since 0.1.0-beta.1:** `full` no longer removes the maximum. Whoever relied on that — data grid, board, canvas — now writes `bleed`; whoever wrote `full` without thinking gets the capped step, which is the point.

### Divider / Separator `[Core]`

- **Contract:** orientation, decorative or semantic, inset, variant and optional label.
- Uses `separator` only when it communicates a division; decorative leaves the accessibility tree. A label interrupts the line without reducing contrast.

### Scroll Area `[Extended]`

- Preserves native scroll, keyboard, touch, momentum, focus and printing; the custom scrollbar is progressively enhanced.
- **Contract:** axis, maximum size, overflow shadows, reach event and a reference for `scrollTo`.
- Does not hide the scrollbar in contexts that depend on discovery nor create nested scroll without need.

### Resizable Panels / Splitter `[Extended]`

- **Contract:** orientation, panels with `id`, initial/minimum/maximum size, collapsible, persistence and a completed-resize event.
- The handle is keyboard operable, has an accessible separator and offers reset; double-click can fit or restore.
- Responsively it can become a stack, tabs or master–detail, preserving state.

### Aspect Ratio `[Extended]`

- Reserves the proportion before media loads and avoids layout shift.
- Accepts a numeric ratio and replaceable content; does not force crop — that belongs to the image component.

### Page and Section `[Core]`

- **Page:** width, gutters, header/body/footer regions and the loading state of the surface.
- **Section:** associated heading, description, actions and content; heading levels derive from the context without jumps.
- They do not turn every section into a card; separation can come from space, divider or surface.

### Page Header `[Core]`

- **Anatomy:** breadcrumbs/back, optional eyebrow, title, description, metadata, primary/secondary actions and optional tabs.
- **Behavior:** actions go to overflow by priority; sticky/compact mode preserves the accessible title.
- Does not duplicate navigation nor create two `h1`; loading uses a skeleton with stable dimensions.

### Card `[Core]`

- **Contract:** surface, padding, orientation, header/media/body/footer and selected/disabled state when interactive.
- The whole card is clickable only when it represents a single destination/action; inner actions cannot be nested in the same link/button.
- Visual uses hierarchy and space; border and shadow are not required simultaneously.

### Master–Detail `[Extended]`

- Coordinates the main list/grid and the detail, selection by URL/ID, empty state and focus return.
- Desktop can use panels; mobile uses navigation or an overlay with a predictable back. The detail preserves the context and position of the list.

### Dashboard Grid `[Extended]`

- Responsive widget layout with minimum sizes, optional reordering/resizing, persistence and an explicit edit mode.
- Widgets keep a heading, empty/error/loading state and a detail action; drag-and-drop has a keyboard alternative.

## 5. Actions and commands

### Button `[Core]`

- **Purpose:** momentary action. Use Link for navigation and Toggle for persistent state.
- **Contract:** `type`, `variant`, `tone`, `size`, `fullWidth`, `disabled`, `loading`, start/end icons and a unified `press` event for pointer/keyboard.
- **Visual:** primary, secondary, outline/ghost and danger variants; one primary action per region. Loading keeps the label or accessible name and the width.
- **Accessibility:** native element, `Space`/`Enter`, visible focus; a decorative icon does not repeat the label.

### Icon Button `[Core]`

- Same behavior as Button, but requires an explicit accessible name and a tooltip when the meaning is not universal.
- The visual area and the interactive target can have different sizes; loading/pressed state does not shift the icon.

### Link `[Core]`

- **Contract:** destination, internal/external navigation, download, exceptional disabled state and external icon.
- Visually recognizable without depending on color alone; supports visited when useful. A new window is communicated.
- Does not emulate a button; actions without a URL use Button.

### Button Group / Toolbar `[Core]`

- Groups related actions and defines spacing, orientation and overflow; does not change the individual semantics of the buttons.
- Toolbar uses roving focus when it forms a composite control; group labels and shortcuts are announceable.
- The primary action stays visible; destructive actions are not placed against frequent actions without separation.

### Toggle and Toggle Group `[Extended]`

- Controlled/uncontrolled `pressed` state, single or multiple, orientation and optional required selection.
- `aria-pressed` or radio pattern per semantics; arrows navigate the group. Do not use as a visual substitute for Checkbox in forms.

### Segmented Control `[Extended]`

- Exclusive selection among a few mutually exclusive options; value, options, size, full width and change event.
- Implements radio group or tabs depending on whether it switches a setting or a view. Labels stay short; overflow becomes Select/scrollable Tabs.

### Split Button `[Extended]`

- Independent default action and a menu of alternatives; the `PrimaryAction` and `MenuTrigger` parts have distinct accessible names.
- Choosing in the menu can update the default action only when that is predictable and persistent.

### Floating Action Button `[Specialized]`

- A dominant creation action on mobile surfaces; optional expanded label and position respecting safe areas.
- Does not cover content, does not compete with bottom navigation and does not appear just by visual convention.

### Command Palette `[Extended]`

- Quick search of commands and destinations with groups, shortcuts, history, asynchronous actions and subcommands.
- **Contract:** items with ID, label, keywords, group, disabled and handler/destination; controllable query and loading/empty.
- Accessible dialog with combobox/listbox; keeps focus, announces results and does not execute a disabled item. Ranking is a replaceable adapter.

### Keyboard Shortcut / Kbd `[Extended]`

- Displays the combination localized per platform and provides an accessible name; does not register shortcuts on its own.
- Global shortcuts avoid browser/screen reader conflicts and do not fire inside editable fields without explicit intent.

## 6. Forms and input

### Field and Field Group `[Core]`

- **Anatomy:** Header, Label, Mark, Help, Indicator, Action, Counter, Control, Description and Error; Group adds a legend and a common description.
- **Contract:** `required`, `invalid`, `disabled`, `readonly`, `necessity` (`mark`, `optional`, `words`, `none`), label position and messages; IDs and relations are generated stably, and indicator, help, description, counter and error enter `aria-describedby` in that order.
- The label row (`header`) puts the help, the indicator, the action and the counter beside the `label`, never inside it. The help opens a tooltip on hover, focus or press, and the same text describes the control through a hidden node.
- The required mark is presentation, it does not install validation. The error appears after interaction/submit per the form policy and is announced once.

### Text Field `[Core]`

- **Contract:** value, default, placeholder, autocomplete, inputMode, min/max length, pattern, prefix/suffix, clearable and `input`, `change`, `blur` events.
- Semantic variants: text, email, URL, phone, search and password; formatting/mask is an adapter, not a magic string.
- Clear and reveal password are focusable buttons with labels; prefixes do not enter the value. A counter does not replace validation.

### Textarea `[Core]`

- Value, rows/minRows/maxRows, resize, auto-grow, limits and counter.
- Auto-grow avoids excessive jumps and respects the maximum height; Enter creates a line, never submits implicitly without explicit configuration.

### Number Field `[Core]`

- Numeric or empty value, min/max, step, precision, locale, format/unit, optional clamp and increment/decrement buttons.
- Parsing accepts intermediate editing without corrupting the value; formatting happens at a predictable moment. Arrows and PageUp/PageDown adjust; the wheel does not change the value accidentally.
- Currency and percentage are formatting, not distinct numeric types.

### Checkbox `[Core]`

- Checked, unchecked and indeterminate states; controlled/default value, disabled, readonly and invalid.
- The whole label enlarges the target; `Space` toggles. Indeterminate is an explicit visual/semantic state, not a third submitted value without a contract.

### Radio Group `[Core]`

- Exclusive selection, orientation, required, disabledKeys, per-item description and controlled/default value.
- Arrows move focus and selection per APG; only one item enters the tab order. Do not allow unchecking the only value with a click.

### Switch `[Core]`

- Binary state with immediate effect; the label describes the setting, not “yes/no”.
- Uses switch semantics, `Space` toggles and the on/off state is perceptible beyond color/position. For confirmation on submit, prefer Checkbox.

### Slider and Range Slider `[Extended]`

- Single value or range, min/max/step, orientation, marks, value tooltip, scale/formatter and minimum values between thumbs.
- Keyboard includes arrows, Home/End and PageUp/PageDown; each thumb has a label and does not become unreachable when crossing.
- An alternative numeric input is recommended when precision matters.

### Select `[Core]`

- Choice among known options; single/multiple, clearable, placeholder, groups, disabledKeys, loading and empty.
- The trigger opens a listbox, shows the selection and keeps the accessible name. Typeahead searches labels; multiple selection defines a summary/chips and removal by keyboard.
- Optional search inside the popup: a field at the top of the surface, filtering by adapter, a mark on the matched span and an announced count. The popup becomes `dialog` and the listbox moves one element down, as the Combobox pattern requires of a popup that is not a listbox.
- Does not include free text entry: the control never receives text, and the query is transient — it filters, is emptied on choosing and never becomes the value. Typed text as a value is Combobox.

### Combobox / Autocomplete `[Core]`

- Text input + filtered collection; the text value and the selected key are distinct contracts.
- **Contract:** controlled/default query, items, selectedKey, allowsCustomValue, debounce, async loading, load more and commit policy.
- Arrows navigate without improperly moving the text cursor; Escape closes/reverts per state; screen readers receive the count and the active item.
- Filtering, ranking and remote search are adapters; the component assumes neither `contains` nor English normalization.

### MultiSelect / Tags Input `[Extended]`

- Collection of selected values with optional search/creation, limit, duplicates, reorder and pasting of multiple values.
- Removable chips have labels; Backspace removes only with an empty input and a predictable rule. Overflow summarizes the selection without hiding access to the full set.

### Hierarchical Picker `[Extended]`

- Selects in a tree/cascade without exposing an incoherent combination of Tree + Select.
- Nodes with ID, parent/children, lazy loading, leaf or ancestor selection, visible path and search.
- On a narrow viewport it can use navigation by levels. TreeSelect and Cascader are recipes of the same core, not separate engines.

### Date Field and Date Picker `[Core]`

- Date value without timezone, locale/calendar, min/max, unavailable dates, readonly/required and granularity.
- A segmented field accepts typing, arrows and paste; a button opens the calendar. Implicit local parsing does not silently change the value.
- The calendar has an accessible grid, navigation by month/year, roving focus, today highlighted separately from selected and localized names.

### Date Range Picker `[Extended]`

- `start`/`end`, duration limit, unavailable dates, predefined ranges and visible months.
- Start, end and interval states are distinguishable; hover preview is not necessary for touch/keyboard. Prevents an invalid range or explains the adjustment.

### Time and DateTime Picker `[Core]`

- Normalized temporal value, granularity, step, 12/24 h format and limits.
- A segmented field works without opening a panel; the time panel complements, does not block typing. DST and nonexistent/ambiguous times have a documented policy.
- It was `[Extended]` until 2026-09-10. It became `[Core]` because a form that can say _when_ needs the time: a library that delivers the date field and not the time field leaves the consumer to write theirs against the segment engine the library itself published, and none of the surveyed libraries separates the two into different levels. The cost of deferring was the Extended argument — "can ship after the core" — and the cost here is a wider union and three lines in `fieldRange`, which does not sustain the line. `Date Range Picker` stays `[Extended]`: it is a specialized composition of a value the Core already has, not a value the Core cannot say.
- The explicit timezone left this contract: what the library stores is the wall-clock value the reader wrote, and converting it to an instant is up to the application, against the zone it knows. The reason is in _Decisions already taken_ in `docs/build-briefing.md`.

### PIN / OTP Input `[Extended]`

- A single value distributed visually, length, numeric/alphanumeric type, full paste, one-time-code autocomplete and optional masking.
- The implementation does not create six unnecessary focus stops; errors and screen reader reading describe a single field.

### Color Picker `[Specialized]`

- Explicit supported models, alpha, presets, optional eyedropper, numeric fields and a preview with contrast.
- Never communicates the choice by color alone; preserves a defined output format and does not convert gamut silently.

### Rating `[Specialized]`

- Value, maximum, step, readonly and a label for each point; full keyboard and touch.
- Use only for an understandable ordinal rating; a critical form must offer a text option or N/A.

### Form `[Core]`

- Coordinates submit, reset, validation, touched/dirty, global messages and focus on the first error without owning each framework's state.
- Supports cancelable sync/async and server validation; server errors persist until the field changes or a new submission.
- Does not generate forms from a schema as the only path. Manual composition remains the main path for complex flows.

## 7. Navigation and orientation

### Breadcrumbs `[Core]`

- Hierarchical list of links with the current page, decorative separator and responsive collapse.
- First/last items stay discernible; hidden items go into an accessible menu. Does not replace back in a linear flow.

### Tabs `[Core]`

- Controlled/default active value, orientation, automatic/manual activation mode, disabledKeys and lazy/keepAlive.
- Arrows/Home/End move focus; tab and panel are associated. Overflow uses scroll/buttons/menu without compressing labels to illegibility.
- Use for peer views in the same context, not for the steps of a process.

### Pagination `[Core]`

- Page or cursor, pageSize, known/unknown total, limits, labels and change event.
- Preserves position/focus predictably; mobile prioritizes previous/next and the current state. Does not invent a total when the server does not know it.

### Stepper / Wizard Navigation `[Extended]`

- Current step, pending/current/complete/error/disabled states, allowed navigation and orientation.
- The indicator is not the whole wizard: content, validation, persistence and actions live in the Wizard pattern.
- Labels stay visible or accessible; progress does not depend on color alone.

### Side Navigation `[Extended]`

- Nested items and groups, expanded/selected state, optional icons, badges and compact mode.
- Selection derives from the route; expansion can be independent. Mobile becomes a drawer and returns focus to the trigger.
- Icons without labels are accepted only in compact mode with a tooltip and clear discovery.

### Top Navigation / App Bar `[Extended]`

- Regions for brand, navigation, search, context, help, notifications and account; priorities define the collapse.
- Uses landmarks and a skip link; does not turn every header into a toolbar with excessive tab stops.

### Navigation Menu `[Extended]`

- Site sections inline or in a column, each a Disclosure button with a panel of links, groups and footer; direct links beside them. Controllable open item, hover with delay and click.
- Does not use `menu`/`menubar`; Escape returns focus to the trigger; the panel follows the trigger in Tab order.

### Navigation Rail / Bottom Navigation `[Specialized]`

- Three to five primary destinations with a persistent label and safe areas; selection follows the route.
- Rail serves intermediate widths; bottom navigation is mobile. Does not accommodate contextual actions or dozens of destinations.

### Table of Contents / Anchor Nav `[Extended]`

- Links to headings, active state by intersection, scroll offset and optional URL update.
- Respects reduced motion, focus after navigation and the heading hierarchy; mobile can collapse into Select/Popover.

### Tour / Coach Marks `[Extended]`

- Steps with anchor, title, content, placement, progress, next/back/skip and an availability condition.
- Moves focus only when appropriate, keeps an alternative without spotlight and recovers from a missing anchor.
- Persistence/versioning belong to the product; a tour does not replace comprehensible UX.

## 8. Disclosure, menus and overlays

### Collapsible and Accordion `[Core]`

- Collapsible controls one region; Accordion organizes multiple sections with single/multiple selection and allowed collapse.
- The trigger is a heading/button, `aria-expanded` and a relation with the panel; arrows/Home/End navigate between headers.
- Animates height without continuous measuring and respects reduced motion; closed content defines a mount policy.

### Tooltip `[Core]`

- Short, non-interactive, supplementary information; opens on hover and focus with configurable delays and closes on Escape.
- Contains no actions nor essential information. Stays available to the keyboard, does not block the target and uses the tooltip role.

### Preview Card / Hover Card `[Extended]`

- Rich preview of a link/entity with optional navigable content; the trigger remains a link or focusable element.
- Delay with a grace area avoids accidental closing; touch uses an explicit press/click. Does not replace Dialog for a task.

### Popover `[Core]`

- Anchored non-modal interactive content; Trigger, Anchor, Content, Arrow, Close and optional Title/Description parts.
- Placement, collision, initial focus and return are configurable. Escape, outside press and Close emit requests with a reason; the policy accepts or cancels each one. Does not capture global focus when non-modal.

### Menu and Menubar `[Core]`

- Actions, checkbox/radio items, groups, separators, submenus and shortcuts; items have ID, label, disabled and handler.
- Roving focus, typeahead, arrows and Escape follow APG. Submenu has intent/grace area; an action closes by default.
- Menu is not generic navigation nor Select; items represent commands.

### Context Menu `[Extended]`

- Same core as Menu, opened by secondary click or the context key/Shift+F10 on the target.
- Essential actions are also available by another path; positioning by point does not eliminate focus return.

### Dialog `[Core]`

- **Anatomy:** Overlay, Content, Title, Description, Body, Footer, Close.
- **Contract:** current/initial open state, size, initialFocus, result and a cancelable policy for the `closeButton`, `escape`, `outsidePress` and `programmatic` requests.
- Modal makes the background inert, blocks scroll, contains and restores focus. On mobile it can take the whole screen; long content scrolls in the body, the footer is not lost.

### Alert Dialog `[Core]`

- Confirms a destructive action or an irreversible decision; title and description are required and initial focus avoids accidental confirmation.
- Outside press does not request closing; Escape is accepted only when canceling is safe. Labels describe concrete actions, not “Yes/No”.

### Drawer / Sheet `[Core]`

- Side/bottom overlay for a secondary task, detail or filters; modal or persistent per viewport.
- Side uses `start/end`, extent with limits, optional resize, header/body/footer and the same cancelable close/focus policy as Dialog.
- Bottom sheet supports snap points only when they add value and remain keyboard operable.

### Action Sheet `[Extended]`

- Mobile variant of a menu with short actions, explicit cancel and safe area; can be modal.
- Does not duplicate Dialog with a form nor hide a frequent primary action.

### Floating Window `[Specialized]`

- Modeless window with move, resize, optional minimize/maximize, z-order, viewport limits and persistence.
- Needs keyboard operation, a heading and predictable focus; use only in desktop-like applications that really require multitasking.

### Fullscreen `[Extended]`

- Requests/exits native fullscreen, exposes state/error and restores context; label and icon follow the state.
- Offers an “expand in layout” fallback when the API does not exist and never blocks the browser Escape.

## 9. Feedback and states

### Alert / Callout / Banner `[Core]`

- One family with recipes by scope: contextual Alert, editorial Callout, and page/system Banner.
- **Contract:** tone, title, description, icon, actions, dismissible, optional persistence, and live behavior.
- `error`, `warning`, `success`, `info`, and `neutral` use text/icon in addition to color. An Alert already present at mount usually needs no live region; an asynchronous update may need one.
- Dismiss is a real action, with a label; a critical banner does not disappear automatically.

### Toast / Notification `[Core]`

- Transient feedback for a completed operation or non-blocking event; does not replace an error next to the field or a critical confirmation.
- **Contract:** id, tone, title, description, actions, duration, dismissible, placement, and deduplication/limit policy.
- Pauses on hover, focus, and inactive document; order and timing are predictable. An action stays focusable and the toast does not vanish while it is in use.
- The imperative service is a convenience facade; a declarative host and an observable model must also exist.

### Inline Message `[Core]`

- Message tied to a field, section, or action: help, error, warning, success, or progress.
- Has a stable ID and an announcement policy; does not cause severe layout shift and does not use a tooltip for a required error.

### Progress Indicator `[Core]`

- One behavioral family with linear, circular, and spinner recipes.
- **Contract:** determinate (`value`, min/max) or indeterminate, label, valueText, size, and delay before appearing.
- Determinate announces progress sparingly; indeterminate communicates a task in progress. A standalone spinner requires an accessible name or is hidden when the neighboring text already names it.
- Do not use a spinner for content with a known structure: prefer Skeleton.

### Skeleton `[Core]`

- Reserves the approximate geometry of the content, with text, avatar, block, and composition recipes.
- Hidden from the accessibility tree; the region announces loading once. Motion respects reduced motion and does not imitate real content in excessive detail.

### Empty / Error / Result State `[Core]`

- One visual family with distinct semantics: no data, no filter results, recoverable failure, permission denied, offline, and completion.
- **Anatomy:** optional icon/illustration, title, description, primary and secondary action.
- Text explains the context and the next step; "no results" offers clearing filters. Error preserves valid data and offers retry when possible.
- Illustration does not dominate dense operational screens; a compact state exists for card, panel, and cell.

### Loading Overlay `[Extended]`

- Temporarily blocks a region while keeping its geometry; scope, label, progress, and optional cancellation.
- Use only when partial interaction would be unsafe. Does not make the whole page inaccessible for a local operation.

### Status Indicator `[Core]`

- Dot, icon, or short label for an operational state; always has accessible text and a non-color alternative.
- Presence/pulse animates only for a relevant live change and respects reduced motion.

## 10. Identity, metadata, and content

### Typography `[Core]`

- **Text:** semantic element, size, weight, tone, align, transform, wrap, truncate/line-clamp, and tabular numbers; truncation always allows access to the full content when it matters.
- **Heading:** semantic level separate from visual style, optional balance, and ID/anchor; context may suggest a level but never silently skips the hierarchy.
- **Prose:** recipe for editorial/generated content with rhythm for headings, lists, links, tables, quotes, and code; does not sanitize content on its own.

### Icon `[Core]`

- Tree-shakeable registry, size, stroke/fill, tone, and RTL mirroring only for directional icons.
- Decorative is hidden; meaningful requires a label or adjacent text. Does not accept unsanitized HTML/SVG from a remote source.

### Avatar and Avatar Group `[Core]`

- **Contract:** source, alt/name, initials, fallback icon, size, shape, deterministic tone, and optional status/badge.
- Fallback order: valid image → initials → icon; an image failure does not expose a broken icon. A decorative image uses empty alt when the adjacent name already identifies it.
- Group controls overlap, limit, and the "+N" summary; members remain identifiable through a tooltip/accessible list.

### Badge `[Core]`

- Count, status, or short non-editable metadata; solid/soft/outline variants, tone, size, dot, and max count.
- An updated count defines the announcement policy; zero may hide or appear depending on meaning. Do not use Badge as a button without explicit semantics.

### Tag / Chip `[Core]`

- Represents an entity, filter, or compact value; can be static, selectable, removable, or navigable — never several implicit behaviors at the same time.
- **Contract:** label, tone, selected, disabled, removeLabel, avatar/icon, and separate press/remove events.
- Removal is keyboard operable and returns focus to the next logical item; tag input follows its own collection rules.

### Description List `[Core]`

- Term–description pairs in one or more columns; supports groups, actions, and empty states without losing `<dl>/<dt>/<dd>` or a semantic equivalent.
- Labels and values align for reading, not as a rigid visual table; mobile stacks. Long values can be copied/revealed, not truncated without access.

### List and List Item `[Core]`

- Static or interactive list with leading visual, content, metadata, trailing action, and selected/disabled/loading states.
- An item with one action can be actionable as a whole; multiple actions require independent targets and clear focus. An interactive collection uses Listbox/Grid according to its semantics, not `role=list` with invented keyboard behavior.

### Timeline / Activity Feed `[Extended]`

- Ordered events with timestamp, actor, title, description, icon/status, and expandable content.
- **Contract:** orientation, grouping by period, incremental loading, and current marker.
- Temporal order and timezone are explicit; the visual line does not replace a semantic list/heading. Activity feed offers new items, filters, and actions only when needed.

### Highlight / Search Match `[Extended]`

- Highlights found fragments while preserving the original text, diacritics, and screen reader reading.
- Receives ranges or a replaceable matcher; does not inject HTML and renders no markup when the query is empty.

### Markdown Renderer `[Extended]`

- Safe rendering with an element/URL allowlist, headings with stable IDs, external links, tables, code, and empty/error content.
- Sanitization is mandatory; plugins are opt-in. Typographic style is scoped, and printing/copying keep working.

### Code Block `[Extended]`

- Language, highlighting, optional line numbers, wrap, copy, filename, and highlighted lines.
- Code remains copyable text; scroll contrast and focus are adequate. The highlight engine is an optional package.

## 11. Collections and selection

### Listbox `[Core]`

- Selection primitive for Select, Combobox, and pickers; items/sections, selectionMode, selectedKeys, disabledKeys, and typeahead.
- Roving focus or `aria-activedescendant`, Home/End, keyboard selection, and virtualized focus are coherent. Not presented in isolation without a label/context.

### Tree `[Extended]`

- Nodes with `id`, children or `hasChildren`, label, icon, disabled, and metadata; independent expanded/selected/check states.
- Arrow keys navigate the hierarchy; Home/End and typeahead work; lazy loading keeps focus and announces progress.
- Single/multiple selection and check cascade define parent/child rules explicitly. Drag, editing, and virtualization are optional capabilities.

### Transfer / Dual List `[Extended]`

- Moves items between available and selected, with search, counts, bulk selection, disabled, and optional ordering.
- **Contract:** sourceItems, targetKeys, selectedKeys per pane, and a move event with direction/reason.
- Do not use for a few choices — Checkbox/MultiSelect is simpler. Mobile can become two steps; actions have labels in addition to arrows.

### Entity Picker `[Extended]`

- Combobox oriented to remote entities, with search, rich result, filters, optional creation, recent/favorites, and single/multiple selection.
- The public value is an ID/normalized object; query, pagination, and ID resolution are adapters. The result shows enough identifiers to disambiguate people, customers, or resources.

### Selection Toolbar / Bulk Action Bar `[Extended]`

- Appears when a selection exists, shows the count, select-all for the filtered set, clear, and the allowed actions.
- Distinguishes "items on this page" from "all results"; destructive actions confirm the scope. Focus and layout do not jump unexpectedly.

## 12. Tables and dense data

### Table `[Core]`

- Semantic table for moderate tabular data; caption/label, columns, rows, header/footer, alignment by type, and empty/loading state.
- Simple sorting, selection, and row action can be capabilities, but they do not justify turning every Table into a Data Grid.
- Header uses `scope`; sorting announces direction. Truncated content stays accessible and numbers align with tabular figures when available.
- Responsive: scroll with affordance, priority columns, or the Data List recipe; never converts cells into cards without labels.

### Data Grid `[Extended]`

- Subsystem for large volume and rich interaction; behavior must be modular.
- **Data:** `rowId`, rows/dataSource, columns, known/unknown totalCount, controlled query state, and incremental update.
- **Columns:** id, label, type, align, width/min/max, sortable, filterable, editable, hidden, pinned, renderer/editor, and value accessor/formatter.
- **Query:** multi-column sorting, typed filters, search, page/cursor pagination, and grouping; server and client use the same serializable model.
- **Interaction:** single/multiple/range selection, filtered select-all, row activation separate from selection, keyboard on cells/rows, resize, reorder, show/hide, pin, and autofit.
- **Editing:** cell/row mode, sync/async validation, commit/cancel, conflict, and optimistic update; an error does not discard the typed value.
- **Scale:** optional row/column virtualization, overscan, variable height with limits, and incremental loading; focus and IDs survive recycling.
- **Visual:** density, sticky header, column manager, row detail, and aggregate footer. Hover actions also appear on focus.
- **Accessibility:** explicit choice between the table and grid pattern; arrows, Home/End/Page, operable headers, `aria-sort`, and announced counts and selection.
- Export, charts, pivot, and Excel live in adapters/packages; they do not weigh on the core.

### Tree Grid `[Specialized]`

- Combines hierarchy and columns; nodes, parent/children, expansion, lazy loading, and selection follow Tree, while columns follow Data Grid.
- The first column identifies the level/expander; the keyboard integrates horizontal arrows for expansion and vertical arrows for navigation.

### Data List `[Extended]`

- Responsive recipe for small tabular sets when a table does not fit; each item shows priority labels and values.
- Keeps the sorting/filters/selection of the data model, but does not pretend to offer grid navigation.

### Column Manager `[Extended]`

- Searchable list of columns, visibility, order, pin, and reset; prevents hiding required columns.
- Changes can apply live or on confirmation, but the policy is consistent; preferences are serializable and versioned.

### Filter Builder `[Extended]`

- Rules typed per field: operator, value, AND/OR groups, presets, validation, and serialization.
- Operators depend on the type; values use appropriate controls. A readable text expression summarizes the filter and allows removing rules by keyboard.

### Pivot Grid `[Specialized]`

- Dimensions, measures, aggregations, rows/columns, drill-down, totals, reorder, and serializable state.
- Requires specific virtualization and accessibility; a simplified version must not be called pivot. Export and chart are optional integrations.

### Spreadsheet `[Specialized]`

- Editable grid with selection/range, formulas, fill, clipboard, undo/redo, formats, sheets, and import/export.
- A product of its own, not a Data Grid variant. Requires a calculation model, protection against malicious formulas, and documented keyboard and screen reader alternatives.

## 13. Data visualization

### Chart System `[Extended]`

- **Common contract:** data, series, dimensions, measures, encodings, scales, axes, legend, tooltip, annotations, locale, and events.
- Empty/loading/error/no-data states are native. Colors come from a semantic scale and stay distinguishable with color vision deficiency.
- Resize is responsive; labels do not collide silently. Every chart offers a summary and an accessible tabular alternative.
- Tooltip appears on pointer and keyboard; selection/zoom/brush have reset and announcement. The graphics engine is an optional adapter.

Choose the type by the question:

| Type           | Use for                                  | Avoid when                                      |
| -------------- | ---------------------------------------- | ----------------------------------------------- |
| Line/area      | trend and time series                    | untreated irregular time axis                   |
| Bars/columns   | comparison and ranking                   | dozens of categories without scroll/aggregation |
| Stacked bars   | composition and total                    | precisely comparing intermediate segments       |
| Scatter/bubble | relationship, distribution, and outliers | size/color have no clear legend                 |
| Heatmap        | matrix, intensity, and seasonality       | cells are few and a textual reading is better   |
| Pie/donut      | few parts of a total                     | many slices, negatives, or precise comparison   |
| Treemap        | hierarchy and proportion                 | close values need to be compared                |
| Funnel         | real sequential reduction                | stages do not form the same flow/cohort         |

### Sparkline `[Extended]`

- Compact trend inside a stat/table; data, line/bar type, reference, trend tone, and text description.
- Has no interactive axes and does not replace a full chart. Must communicate the last value/trend outside the visual shape.

### Stat / KPI Card `[Extended]`

- Label, value, unit, delta, period, trend, comparison, sparkline, status, and detail action.
- Distinguishes an increase from "good": tone derives from the metric's semantics, not from the mathematical sign. Loading/error preserve the layout.

### Gauge / Bullet `[Specialized]`

- Gauge shows position against a range when the context justifies the space; Bullet compares value, target, and ranges more efficiently.
- Min/max/target/unit are explicit and a text value exists. Do not use a decorative speedometer for a simple KPI.

### Map `[Specialized]`

- Viewport, layers, markers, clusters, selection, search, legend, controls, and feature event; the map provider is an adapter.
- Keyboard, alternative list, attribution, contrast, and reduced motion are mandatory. Does not load a heavy map until the region is needed.

### Diagram / Flow Editor `[Specialized]`

- Nodes, ports, edges, groups, viewport, selection, pan/zoom, connect, validation, minimap, and undo/redo.
- Operations have a keyboard alternative and a serializable model independent of the renderer. Auto-layout is a plugin; invalid connections explain the reason.

## 14. Files, media, and editing

### Image `[Extended]`

- Source/srcset, alt, aspect ratio, fit, position, loading, fallback, and error state.
- Reserves space, uses lazy loading when appropriate, and does not repeat the caption in the alt. Zoom/preview is a separate capability.

### Carousel `[Specialized]`

- Slides, active index, loop, optional autoplay, controls, indicators, orientation, and drag.
- Pauses on interaction/hover/focus, respects reduced motion, and offers previous/next by keyboard. Autoplay is never the default in an operational product.
- Essential content is not reachable only by swipe.

### Upload `[Core]`

- One family replaces the duplicated File Input, Dropzone, and Upload Manager.
- **Parts:** Trigger/Input, Dropzone, FileList, FileItem, Preview, Progress, Retry, Remove, and ValidationMessage.
- **Contract:** controlled/default files, accept, multiple, min/max count, max size, optional directory, disabled, validation, and upload adapter.
- **Flow:** selection, validation, queued, uploading, paused, success, error, canceled; retry/cancel/remove are distinct events.
- Drag-and-drop has a button alternative; errors are per file; preview cleans up object URLs. Chunking, resumable, and virus scan are adapter capabilities.

### Rich Text Editor `[Specialized]`

- Structured document, toolbar, headings, lists, links, media, optional tables, history, sanitized paste, and readonly mode.
- The value uses a schema/AST or explicitly versioned sanitized HTML; plugins declare commands and nodes.
- Keyboard, headings, toolbar labels, and state announcement are complete. Do not use raw contenteditable as a contract.

### Code Editor `[Specialized]`

- Value, language, theme, readonly, diagnostics, completion, formatting, diff, and model URI; the engine is loaded on demand.
- Offers an accessible textarea/fallback, documented shortcuts, and an option to escape tab trapping.

### Document / PDF Viewer `[Specialized]`

- Source, page, zoom, fit, search, thumbnails, outline, rotate, download/print, and text selection.
- Loading/error/password are explicit states; keyboard navigation and alternative text/OCR depend on the document and are communicated.

### Audio / Video Player `[Specialized]`

- Source/tracks, captions, transcript, controls, volume, speed, picture-in-picture/fullscreen, and network state.
- Keyboard, labels, contrast, and captions are mandatory; autoplay with sound is forbidden. The native player is the fallback.

### Barcode / QR Code `[Specialized]`

- Value, format, correction, size, quiet zone, foreground/background, and alternative text label/value.
- Validates format capacity and contrast; does not treat QR as a clickable control nor hide essential data only in the image.

## 15. Composite patterns for SaaS and enterprise

Patterns use the components above; they must not create a second implementation of behavior.

### App Shell `[Core]`

- Skip link, header, side nav/rail, main, breadcrumbs/context, and overlay/toast regions.
- Supports responsive navigation, session, tenant/workspace, and permissions without coupling authentication to the design system.
- Sidebar and density persistence is a product preference; landmarks and focus order stay correct.

### Action Bar `[Core]`

- Actions of a page/panel with primary, secondary, danger, and overflow by priority.
- Can be sticky without covering content; dirty state, loading, and permissions do not shift the main actions.

### Filter Bar `[Extended]`

- Search, quick filters, advanced filters, active chips, count, apply/clear, presets, and state serializable in the URL.
- Desktop expands priority fields; mobile uses a drawer. Clear distinguishes the current filter from a required default.

### Data Entry Form `[Core]`

- Sections with headings, responsive grid, contextual help, validation, dirty state, optional autosave, actions, and error summary.
- Conditional fields derive validity from the model, not from visibility. When hiding, the keep/reset value policy is explicit.
- Duplicate submit is blocked; leaving with changes asks for confirmation only when there is real loss.

### Wizard `[Extended]`

- Steps, accumulated data, per-step validation, back/next/submit, save draft, resume, and global error.
- Direct navigation depends on completed steps; state lives outside the Stepper. URL/reload and recovery are explicit policies for long flows.

### CRUD List `[Core]`

- Page Header + Filter Bar + Table/Data Grid + Pagination + Bulk Actions + Empty/Error + create/edit/detail.
- Query state is single and serializable; returning from detail preserves filters, page, selection, and scroll.

### Detail / Inspect Panel `[Extended]`

- Summary, metadata, status, tabs/sections, actions, and history; opens in a page, drawer, or master–detail depending on depth.
- URL and focus make opening shareable and reversible; a shallow panel does not try to host a long editing flow.

### Notification Center `[Extended]`

- Persistent list of notifications with unread/read, groups, filters, mark all, actions, and incremental pagination.
- Badge, popover, and full page share the same model; live updates do not steal focus or reorder while the user reads.

### Audit Log `[Extended]`

- Immutable event with actor, action, target, timestamp/timezone, origin, and accessible diff.
- Search/filter/export are adapters; sensitive data and technical IDs follow the permission policy. Diff has a textual version and does not depend only on red/green.

### Permission Matrix `[Specialized]`

- Resources × roles/actions, allow/deny/inherited/indeterminate states, search, groups, and pending changes.
- Bulk edit makes the scope explicit, confirms broad effects, and offers review before saving. An accessible table and a text summary are mandatory.

### Workflow / Process Tracker `[Extended]`

- Current/completed/blocked steps, owners, deadlines, transitions, and history.
- Distinguishes a progress view from a workflow editor; invalid actions explain the preconditions. Timeline/Stepper are possible visual recipes.

### Import / Export Job Center `[Extended]`

- Jobs with type, file, progress, status, per-row errors, cancel/retry, and result download.
- The operation continues outside the page; the toast only points to the job. File expiration and permissions are communicated.

### Search Results `[Extended]`

- Query, scope, filters, sorting, facets, suggestions, results, highlight, pagination/infinite load, and no-results/error states.
- Keeps URL and focus, announces the count without verbosity, and offers query correction without silently replacing it.

## 16. Specialized components

### Event Calendar / Agenda `[Extended]`

- Month/week/day/list views, timezone, events, all-day, recurrence, time navigation, filters, and opening detail.
- Date/range selection is optional; overlapping events and DST have an explicit policy. Does not derive from Date Picker, whose purpose is value entry.
- On narrow screens prioritizes agenda/list; each event is accessible without depending on position or color.

### Resource Scheduler `[Specialized]`

- Adds resources, availability, create/edit, drag/resize, conflicts, advanced recurrence, virtualization, and timeline views.
- Every pointer action has a dialog/keyboard alternative; optimistic update and conflict preserve the user's edit.
- The resource model, work calendar, and conflict rules belong to the package, not to the plain Event Calendar.

### Kanban `[Specialized]`

- Columns, cards, swimlanes, WIP limits, selection, filter, drag/reorder, and incremental loading.
- Moves via keyboard/alternative menu, announces source/destination, and handles optimistic update/conflict. Virtualization preserves logical order.

### Gantt `[Specialized]`

- Hierarchical tasks, duration, dependencies, milestones, baseline, resources, critical path, zoom, and work calendar.
- Grid and timeline share selection/focus; editing and dependencies have a non-graphical alternative. A package of its own, not a generic Chart.

### Organizational Chart `[Specialized]`

- Hierarchy, expansion, search, zoom/pan, selection, and detail; large layouts use virtualization or progressive disclosure.
- Offers an alternative Tree/List and does not convey the reporting line through geometry alone.

### AI Conversation `[Specialized]`

- **Parts:** Conversation, Message, Prompt Composer, Attachments, Tool/Reasoning Status, Sources, Actions, and Scroll Anchor.
- **Contract:** messages with IDs/roles/content parts, streaming, status, stop, retry, edit/resubmit, feedback, citations, and errors.
- Preserves partial content on error, announces streaming without reading token by token, and keeps scroll control when the user scrolls up.
- Tool calls and reasoning show useful state without exposing sensitive data; sources are navigable. The model/provider stays outside the component.

### Prompt Composer `[Specialized]`

- Multiline input, submit/stop, attachments, mentions/commands, optional voice, token/size limits, and availability status.
- Enter/Shift+Enter are configurable and visible; submit does not occur during IME composition. Upload and validation reuse existing components.

### Speech Input `[Specialized]`

- Start/stop, permission, listening, partial/final transcript, locale, error, and manual fallback.
- Clear recording and privacy indicator; never starts without an explicit action. The transcript can be reviewed before sending.

## 17. Decisions on the Sirius UI baseline

### Keep and generalize

- **Runtime CSS tokens, density, surfaces, brands, and contrast:** good base; rename to neutral roles of the new library.
- **Field shell and separation between required mark and validation:** keep as the global Field contract.
- **Overlay stack, focus, dismissal, and dialog/drawer/toast services:** keep behavior; offer a declarative API and an imperative facade.
- **Depth of Table, Date/Time, Upload, Filter Bar, and Action Bar:** preserve capabilities, redistributing responsibilities.
- **Stories oriented to states, edge cases, context, and theming:** use as the minimum documentation and acceptance format.

### Consolidate

- `dropzone`, `file-input`, and `upload` become parts/recipes of the **Upload** family.
- `loader`, `spinner`, and `progress` become recipes of **Progress Indicator**; **Skeleton** stays separate because it represents structure.
- `empty-state` and `error-state` share the visual **Result State** family, keeping distinct semantics and messages.
- `select`, `combobox`, `listbox`, `tree select`, and transfer reuse the **Collection Engine**, without forcing the same UX.
- `badge` and `tag` share tokens but remain different components: Badge communicates metadata/status; Tag represents a value/entity.

### Split

- Sirius's `table` must become **Table**, **Data Grid**, and filter/export/column manager plugins; a single bundle must not carry everything.
- `chart` must be a contract + engine adapters; Sparkline and Stat remain lightweight recipes.
- CPF, CNPJ, CEP, phone, and currency fields belong to a Brazilian locale/domain package built on Field and format/validation adapters, not to the global core.
- `page`, `page-header`, `page-info`, `section`, and `actionbar` form composition patterns; they do not need to share a visual base class.

### Do not perpetuate

- Angular public APIs such as signals, injection tokens, or content projection in the common contract. `ControlValueAccessor` is also not part of that contract, but the Angular binding must implement it for Reactive Forms/ngModel when applicable.
- Imperative services as the only way to open overlays.
- Fixed pt-BR strings inside components; every message comes from the locale layer.
- `mask` as a mini-language coupled to Text Field; use typed parse/format/validate adapters.
- XLSX/PDF exporters and the ECharts engine inside the main bundle.
- Breakpoint and responsiveness defined in isolation per component without a common contract.
- Global references to PrimeNG/Nebular or third-party styles inside the design system.
- `console.*`, behavior TODOs, and implicit ARIA states as an acceptable part of a published component.

## 18. Definition of done per component

A component is complete only when it has:

1. purpose, use cases, and anti-use;
2. anatomy and stable public parts;
3. controlled/uncontrolled contract and events with a reason;
4. state matrix and combinations;
5. keyboard, focus, ARIA, touch, and screen reader documented/tested;
6. size/density/variant/tone recipes via tokens;
7. responsive behavior, RTL, locale, and reduced motion;
8. loading, empty, error, disabled, and extreme content when applicable;
9. SSR/hydration, performance, and virtualization assessed;
10. basic examples, real composition, edge cases, theming, and use in context;
11. behavior tests shared between React and Angular bindings;
12. changelog, stability, and migration strategy for a contract break.

## 19. Sources analyzed

### Local baseline

- `libs/sirius-ui/src/components/` — implementation, stories, and contracts of Sirius UI.
- `libs/sirius-ui/src/styles/sirius/` — tokens, density, surfaces, brands, and contrast.
- `libs/sirius-ui/src/public-api.ts` — current public surface.

### Behavior, composition, and accessibility

- [Base UI](https://base-ui.com/react/overview/accessibility)
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html)
- [React Aria Collections](https://react-spectrum.adobe.com/react-aria/collections.html)
- [Ark UI](https://ark-ui.com/docs/overview/about)
- [Bits UI](https://bits-ui.com/docs/state-management)
- [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Chakra UI v3](https://chakra-ui.com/docs/theming/overview)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [HeroUI](https://www.heroui.com/docs/react/components/table)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/)

### Standards

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — contrast, reflow, focus, minimum target size of 24 × 24 CSS px, and enhanced criterion of 44 × 44 CSS px.
- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) and [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) — roles, states, properties, and keyboard patterns.
- [W3C Internationalization: text direction](https://www.w3.org/International/questions/qa-html-dir) — `dir`, bidi, and RTL content.
- [CSS Logical Properties](https://www.w3.org/TR/css-logical-1/) and [CSS Color Adjustment](https://www.w3.org/TR/css-color-adjust-1/) — logical layout and forced colors.

### Design systems and product suites

- [React Spectrum](https://react-spectrum.adobe.com/react-spectrum/getting-started.html)
- [Mantine](https://mantine.dev/x/extensions/)
- [MUI Core](https://mui.com/material-ui/getting-started/supported-components/)
- [MUI X](https://mui.com/x/introduction/)
- [Ant Design](https://ant.design/components/overview/)
- [Fluent UI](https://fluent2.microsoft.design/components/web/react/)
- [Carbon Design System](https://carbondesignsystem.com/components/data-table/usage/)
- [Vaadin Components](https://vaadin.com/docs/latest/components)
- [UI5 Web Components](https://ui5.github.io/webcomponents/)
- [PatternFly](https://www.patternfly.org/components/all-components)
- [Kendo UI](https://www.telerik.com/kendo-angular-ui/components)

The sources were used to compare capabilities and patterns. Names, APIs, commercial models, and framework-specific details were not copied as a contract. Consulted on August 31, 2026.
