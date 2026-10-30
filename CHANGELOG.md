# Changelog

Every release of the six `@slotted/*` packages, newest first, at one shared version. `pnpm release` writes each entry from the commit subjects since the previous `v*` tag. The `0.x` line changes its public API between beta releases without deprecation.

## 0.1.0-beta.30 — 2026-10-30

- test(agent-docs): use a prop no spelling turns into an HTML attribute
- refactor!: use American English spelling in code, docs and public API

## 0.1.0-beta.29 — 2026-10-30

- fix(media-viewer): download and retry keep the same height; the zoom gesture has no deadline
- feat(media-viewer): React and Angular reference pages, self-assessment
- feat(media-viewer): close at the end of the bar, drawn text and JSON, empty states
- docs(media-viewer): scope in Specialized, upload reopening and design index
- feat(media-viewer): Angular binding
- feat(media-viewer): React binding
- feat(core): media-viewer, the view arithmetic and the stage controller
- feat(media-viewer): stylesheet and harness
- feat(media-viewer): inventory, drawing and contract
- feat(tag): --slotted-tag-inset-inline sets the distance from the edge to the text
- fix(field-group): the question stays with its choices, at a field label's distance
- docs(guidelines): FM-25, a dialog's form fills the body
- fix(dialog): in full screen the viewport row is the layer height
- fix(description-list): the row folds at the term width plus the minimum value
- fix(date-picker,time-picker,datetime-picker): the inner field grows to the field width
- fix(message,message-scroller): part rules stop at a nested family
- feat(glyph): download and rotate-cw, for the media-viewer
- feat(theme): recipe variants chosen by the reader under data-slotted-variant-<axis>
- fix(attachment): pressing outside the name activates the trigger
- fix(dialog): title and description carry their typography outside DialogHeader
- feat(date,time pickers): grip at the top of the sheet, and pulling down closes
- feat(entity-picker,command-palette): the group label stays on top while the group is in view
- fix(drawer): sticky sheet header and resizer without a second surface layer at rest
- fix(theme): applyTheme adopts a constructed CSSStyleSheet, accepted under style-src without 'unsafe-inline'
- feat(stat-card): attention warning|danger paints the value and the border, independent of the delta tone

### Guidelines

- Added: FM-25

## 0.1.0-beta.28 — 2026-10-29

- fix(field,field-group): space before the requirement word; kind="section" on the group

## 0.1.0-beta.27 — 2026-10-29

- fix(tooltip): the arrow fades with the content on open and close
- feat(dialog): one measure token per size; wider sm, md and lg
- feat(select,combobox,multi-select,menu): group label stays at the top while the group is in view
- fix(drawer): bottom sheet scrim and footer follow the programmatic travel
- feat(tokens): own surfaces for the chart table view
- fix(styles): drawer, popover and card header without a trailing part keeps no empty column

## 0.1.0-beta.26 — 2026-10-29

- fix(dismissable-layer): CloseWatcher answers back; history release waits one task
- fix(select): SelectTrigger className and style go to the frame

## 0.1.0-beta.25 — 2026-10-29

- fix(form): tokens.json stops listing --slotted-page-sticky-top, a value written at runtime
- fix(select): a closed control names the option whose value is the empty string
- docs(guidelines): forms.md covers form layout (FM-18 to FM-24)
- feat(form, field): measured field column, aside, step between sections and field width
- fix(menu): the label names the described item; parts written as children stay on the grid

### Guidelines

- Added: FM-18, FM-19, FM-20, FM-21, FM-22, FM-23, FM-24

## 0.1.0-beta.24 — 2026-10-29

- test(angular): a file waits for the history traversal of a closed layer before teardown
- fix(overlays): an item's radius is concentric with the panel at every corner scale
- fix(table): the layer under a sticky column reads --slotted-table-sticky-surface
- feat(data-grid): a run of selected rows is one block

## 0.1.0-beta.23 — 2026-10-28

- feat(alert): AlertActions gives the buttons the alert's tone and size sm
- fix(drawer): the bottom sheet entry starts from rest

## 0.1.0-beta.22 — 2026-10-28

- test(data-grid): entering and leaving a refresh restyles the root and the veil, not the rows
- fix(drawer): the bottom sheet entry travels from the edge, or from where the exit stopped, to the stop
- feat(stat-card): emphasis="whole" draws the symbol, decimals and suffix of the value in the unit part
- feat(glyph): pencil, for an edit action
- test(icon): the calendar body centers on the label cap height at the three button sizes
- feat(markdown): parseMarkdown reads GFM tables
- fix(page): the footer enters and leaves by translate only, and the presence exit survives a ref that detaches and reattaches
- feat(tokens): backdrop-filter for the chart overlays and the drawer footer
- docs(agents): CLAUDE.md imports AGENTS.md, so a Claude Code session reads the repository instructions

## 0.1.0-beta.21 — 2026-10-28

- docs(agents): findings arrive as issues with the finding label and the .github/ISSUE_TEMPLATE form; the fixing commit closes the issue with Fixes #n
- feat(drawer): the programmatic travel of the bottom sheet
- fix(chart): the chart Angular snippet in a section passes in the format the workbench verifies
- feat(theme): the theme root declares the md step font-size and line-height, and text no family draws inherits 14px instead of the browser's 16px
- feat(tag): dashed variant
- test(alert): in a page banner whose message wraps, action and dismiss stay on the first line
- fix(field): field control roots declare flex-basis: content
- fix(chart): in Angular, without title, the plot is named by the aria-label written on the figure, as in React; docs and example of a chart the section already names

## 0.1.0-beta.20 — 2026-10-28

- docs(chart): without title, the plot is named by the Chart aria-label; example of a chart the section already names
- feat(button): IconButtonLink
- fix(date-picker): the date-picker and select roots stop declaring inline-size: 100%, which in a flex row made the whole row the basis of each item and cut the date
- chore(theme): regenerate hooks.json with the alert data-actions-placement
- feat(alert): actionsPlacement puts the actions at the end of the message line from 40rem; default end for reach page and below for the other reaches
- fix(portal): a layer's seeds are read on the element that declares them, not on the opener; opening a menu 24 levels deep in jsdom no longer takes 160 s

## 0.1.0-beta.19 — 2026-10-28

- docs(agent-docs): the React snippet says a router link only appears in a family's render; record-link evaluation case
- fix(app-shell): the aside-resizer of a column pane sits at the gutter center in inset and floating and at the seam center in flush and panel; the pane stops scrolling and only the aside-body scrolls
- fix(page-header): a back placed directly in the title area gets the nav back style
- fix(collapsible): a trigger without description centers the label and the indicator when the control height exceeds the content (align-content: center)

## 0.1.0-beta.18 — 2026-10-27

- test(agent-docs): the inline-message test handles the missing family capture
- chore(theme): regenerate hooks.json after --slotted-app-shell-resizer-color is removed
- test(app-shell): the resizer mark test finds the rule by the end of the selector, which Prettier keeps on one line
- docs(inline-message): a region's message is an alert
- feat(description-list): minColumnWidth sm | md chooses where the column count folds
- feat(app-shell): the aside-resizer draws the splitter mark at rest
- chore(demo): demo:refresh pins Nexora to the current version (pack-beta --pin); Nexora moves to 0.1.0-beta.17
- fix(angular): the currency-field and menubar inputs become public; a source test refuses protected input, model or output

### Guidelines

- Added: CP-11

## 0.1.0-beta.17 — 2026-10-27

- docs(agent-docs): OV-07 and OV-08 take the overview to dashboard-grid and forbid a frame inside a frame; LA-06 limits sticky by the scroller height; compose-screen routes an own sticky to LA-06
- feat(page): the page publishes --slotted-page-scrollport-block-size, the scroller height, as the ceiling of a sticky element under an inset canvas
- feat(dashboard-grid): rows=auto draws the content height in sub-rows (DASHBOARD_SUBROWS); a widget inside a component or fragment declares itself to the grid; fix(dashboard-grid): Reset asks for the defaultLayout and persisted layouts return theirs; a widget's chart fills the body at every size
- feat(stat-card): the trend follows the figure height in inline and bleeds to the card edges in stacked; the line is smoothed and has an area by default
- feat(chart): Chart and SlChart generic over the row; data accepts rows typed by interface and series, x and recordKey only name row keys

### Guidelines

- Added: OV-07, OV-08

## 0.1.0-beta.16 — 2026-10-26

- docs(list-item): the anatomy states each part's parent and the anatomy scene shows a row read with two actions and when to use end or actions; feat(list-item): in development, body, label and description outside the box, and the box inside a body, warn once per part (items 21, 22)
- fix(calendar): a marked day's name reads '12, 2 items' in Angular too (Prettier-protected template)
- feat(calendar): marks marks the days with items (mark part, tone, count in the accessible name); fix(attachment): the thumbnail loads with loading=lazy and decoding=async; item 20 recorded as usage
- feat(dashboard-grid): renderDetail (React) and slDashboardWidgetDetail (Angular) put the router link in the widget corner; feat(link): size axis, and the stat-card, section and chart actions fix sm for links; fix(table): the pinned cell paints the row background over the page surface
- feat(dashboard-grid): expandedFrom moves the expanded class threshold (the root writes data-size-class and the CSS follows it); rows="auto" draws the widget with the rows the content measures, without storing them; headingLevel defaults to 'auto', one level below the outline
- feat(prompt-composer): PromptComposerDictate dictates through the platform SpeechRecognition (@slotted/core/dictation, mic glyph, dictation reason); fix(prompt-composer): the ring glow is the blur ink over the composer box, without a mask and without overflow on the container
- feat(markdown): source reads a CommonMark subset through parseMarkdown in @slotted/core/markdown, only the syntax of the types in allow; fix(message): a bubble with Markdown measures the text (prose stops being a size container inside it); fix(dialog): the body and footer fix their rows, and a full-screen dialog without a body seats the footer at the bottom
- feat(drawer): --slotted-drawer-slide-duration and --slotted-drawer-slide-exit-duration govern the slide per transition (the drag sheet keeps the platform smooth scroll); under drag=panel every region inside the panel passes vertical overscroll to the sheet; fix(message-scroller): content without items does not stay pending
- feat(drawer): DrawerActions puts actions beside the title, on its line; a size="full" bottom sheet with drag=panel seats the footer at the screen bottom; an overlay sheet only draws the side borders when it is narrower than the viewport, and size="full" draws none

## 0.1.0-beta.15 — 2026-10-24

- chore(theme): hooks.json regenerated with the drawer data-sheet-ready attribute
- fix(drawer): opening the sheet does not force layout
- feat(drawer): the bottom sheet moves through the platform scroll

## 0.1.0-beta.14 — 2026-10-23

- fix(drawer): closing by dragging is fluid and does not shrink the next opening

## 0.1.0-beta.13 — 2026-10-23

- fix(drawer): the bottom sheet follows the finger in fast gestures without jumps
- feat(alert, toast, dialog): tone marks from the status-* set, the same map as inline-message (danger is a circle with !, warning is the diamond); the alert and toast icon box is the mark size, because the glyph fills the box edge to edge; status marks plan checkpoint
- feat(status-indicator): the mark stays on the first line, centered on the capitals, and the label is an inline-block with baseline-source: first, so it wraps with a hanging indent and aligns the table row by the first line; td/th root keeps its own display; new detail part (detail prop in React, slStatusIndicatorDetail in Angular); status-* glyphs for the six statuses; the pulse becomes a pseudo-element of the mark
- feat(inline-message): the mark is an inline box on the first line, centered on the capitals (0.5cap, rounded to the device pixel), and the following lines hang under the text; mark of round(1em, 2px), line height rounded up to 2px and box trimmed to the capitals and the baseline (text-box); status-* glyphs; R5 gains the inline anchor form
- feat(glyph): status marks drawn by hand on grids of 12, 14 and 16, each cut at a whole unit of its own grid; the warning is a diamond, symmetric on both axes; the React and Angular Glyph draw the three grids and icon.css shows the one for the box size by container query (12 below 1dppx); the harness draws the same; the "No triangle glyph" rule of the briefing points to status-*
- fix(styles): the popup layer only moves and the fade passes to the content, so the content backdrop-filter blurs on every frame of entry and exit
- feat(react): useRovingFocus, the menu keyboard model for a custom list
- perf(drawer): the bottom sheet drag, by the body and by the separator, sizes the panel once and moves it only by translate; the release animates from the live position with the hand velocity and the fling leaves in one continuous motion in the time the layer declares; extent requested once, on arrival
- feat(theme): data-slotted-corners axis (square, soft, standard, round) compiled from the theme corners map; each entry is a partial radius scale and the theme tokens that read it are declared again in the scope; ThemeScope gains corners in React and Angular, the portal carries the attribute and the default theme brings the four scales
- fix(dismissable-layer): closing the layer to navigate keeps the destination: the step back of the entry is not taken when the location is no longer the one the entry was pushed at
- fix(theme): a rule that starts at the scheme and continues to a public hook is now refused with the form &[data-slotted-scheme] …, because the scheme element is the @scope root and never its own descendant; contract.ts regenerated with the new tokens; theme-app shows the form that matches
- fix(docs): splitter, scroll-area and action-sheet exported the docs outside the member key and came out with an empty api; data-grid used dataGrid instead of data-grid; the check compares the keys with the contract members; the splitter says it has no accessible name by default
- feat(styles): --slotted-<family>-backdrop-filter on menu, popover, tooltip, drawer, action-bar, select, combobox, entity-picker and date-picker; none under prefers-reduced-transparency and forced-colors
- feat(table-of-contents,chart,kbd): the sticky column of the table of contents sits --slotted-table-of-contents-sticky-inset away from the header; Chart actions and toolbar share the margin that centers them on the title row; kbd gains --slotted-kbd-surface, --slotted-kbd-border-color and --slotted-kbd-color
- feat(section): the stuck header writes data-stuck and reads --slotted-section-header-background; the ground=surface divider runs edge to edge; the anatomy gains the Parent column and a description outside the title warns in development

## 0.1.0-beta.12 — 2026-10-22

- perf(data-grid): the resizer drag moves only the guide and applies the width on release, always

## 0.1.0-beta.11 — 2026-10-22

- test(agent-docs): index access in the axis table test
- test(agent-docs): --slotted-material-backdrop is a scheme token and not a color; the design system export drops it
- test(styles): resize-guide in the data-grid fragment and the tabs marker as a named R7 exception
- perf(tabs): the marker slides by translate and scale from the box where it was (FLIP in createIndicator), on the compositor
- docs(compose-screen): Done measures on the production build at 375 px (Event Timing ≤ 200 ms, mounted rows limited to the window or the requested pages); Compose says which data-grid props to keep stable
- docs(guidelines): LP-12 and LP-14 without contradiction
- docs(guidelines): LA-03 for every title and LA-07 (footer action-bar on one row on the phone); review-screen and compose-screen verify both at 360 px
- feat(theme): themeConformance accepts thresholds.layerStep (0.04 by default) and the failure names the option
- fix(toolbar, action-bar): the overflow control name comes from the toolbar and actionBar families of the catalog, with ICU plural in en-US and pt-BR; React and Angular
- fix(action-bar): below 24rem only the bar without overflow stacks; with overflow it keeps one row and folds the actions that have a counterpart
- fix(button): label on one line at its width, without breaking inside the word; ellipsis only when the container holds the control narrower than the label
- fix(app-shell): the parts and root render receives the ref, which is also how the shell registers the part (AppShellFooter with render stopped registering)
- fix(detail-panel): the stacked section count goes to SectionTags, outside the heading and its accessible name, on the optical axis of the capitals (React and Angular)
- feat(drawer): data-expanded on the bottom sheet that fills the layer (or size=full)
- perf(drawer): the bottom sheet drag writes the position to the layer without per-move state
- docs(drawer): size default per side (content at top and bottom, md at start and end) in the contract and in both tables; the axis table writes a default that depends on another axis as a sentence
- feat(data-grid): resizeMode="deferred"
- fix(data-grid): load more by IntersectionObserver without root over the last loadMoreThreshold rows
- fix(data-grid): the resizer of the last column is the one of the last column header, not the last child of the row
- docs(data-grid): rule for props compared by identity (columns, disabledKeys, function rowKey) and for those read at render time; examples without those props inline, with verification
- perf(data-grid): tree renderers and callbacks read at render time, rows respond only to presence; useMessages compares texts by value and calls functions through the latest version
- fix(spinner): inline SVG ring stroked by CSS, without data: images (appears under img-src 'self'); the spin is a rotate on the compositor and continues with the main thread busy; spinner-busy scenario
- docs(section, detail-panel): region with its own ground republishes --slotted-page-ground; sticky row, token and panel example with scroll="self"
- feat(page-header): under the narrow step, a toolbar that folds sits on its own row below a rich title (visual, marks, subheading); LA-03 and contract with the same split
- feat(page-header): root and title-area ground with background-color transition (--slotted-page-header-ground-duration and -easing)
- feat(theme): --slotted-material-backdrop becomes a scheme token; default theme with 6 px blur in light, 20 px in dark and none in high contrast
- fix(dialog): plain panel stays opaque and the children do the fade, so the backdrop-filter of an inner material shows from the first frame; --slotted-dialog-backdrop-filter token
- feat(page, detail-panel): footers as material
- feat(toast): --slotted-toast-backdrop-filter token on the raised item, off under reduced transparency and forced colors
- feat(command-palette): --slotted-command-palette-backdrop-filter token on the root, off under reduced transparency and forced colors
- feat(page-header): material

### Guidelines

- Added: LA-07

## 0.1.0-beta.10 — 2026-10-22

- build: Prettier and ESLint split by core with stable per-slice cache (full formatting 7 s warm, lint 6 s); performance tests outside verify, with the machine idle
- build: pnpm check in ~25 s
- fix: Angular progress bar restarts per parity branch (no NG0956); long list test with 150 records to fit the suite time
- build(turbo): agent-docs verify after core, theme and themes
- fix: info seed mirrored in the portals; React modules without CSS import, explicit per-family sheets
- chore(theme): regenerate contract, hooks and proof snapshot
- test(theme): info seed in the recipe.test fixture
- chore(react): format the tsconfig
- feat(react): per-family CSS imported by its own chunk and per-family sheets; recipe in theme-app
- feat: prompt-composer emphasis ring; AF-07, AF-03 and waiting-states with the page-header bar for the page refresh
- feat: entity-picker option parts, option window in long lists, space between form fields
- feat: dialog and drawer mounted open enter animated and signal the end (onOpenChangeComplete), actions in inline-message, slot and tone per slice in the pie
- fix: autofill paints the whole control, loaded avatar without tone background and surface prop, optical glyph offsets with declared body
- feat: info tone in theme and families, ink per data slot (--slotted-data-N-on), field ring offset (--slotted-control-focus-ring-offset); recipe is generated by the calibrator again
- feat(theme): dark accent border and text on the seed hue, visible dark surface ladder, data ladder derived from the accent and safe for color blindness
- feat: indeterminate bar on the compositor, data-grid keeps the empty state when reloading (loading initial/refresh), sparkline only animates a data change and has a minimum width
- fix: data-grid/data-list busy by veil, page-header progress on the closing line in any order, progress sweep restarts on every paint
- fix: render props of the link families without undefined members (DefinedProps, definedProps), prompt-composer ring without text color transition
- fix: native light-dark() in the React styles.css, dialog focus regression covered, entity-picker without spellcheck by default
- fix(spinner): the ring is now drawn as a vector, without jaggies, blur or clipping
- feat(section): title as label, tags part on the baseline and space between sections of the component itself
- test(react): performance tests run one file at a time
- perf(data-grid): a scroll step no longer redoes the layout and style of the whole grid

### Guidelines

- Added: FM-17

## 0.1.0-beta.9 — 2026-10-21

- test(react): the cost of selector keys is measured against the same selectors by value, not in runner milliseconds
- test(angular): the bundle names the family by the selector key or by hostSelectorKey
- fix(build): package verifiers and theme hooks in the keyed form; directional glyphs from the theme font
- perf: selector key per part and family; dialog, data-grid, roving focus and page without repeated work
- docs(guidelines): LP-15 to LP-17, OV-06, AF-08 and CP-10; compose-screen names the domain values before choosing the family
- fix: docs in English, data-grid selectRow and synchronous commit, currency-field unit, tags-input suggestions, dialog as form

### Guidelines

- Added: AF-08, LP-15, LP-16, LP-17, OV-06
- Rewritten: CP-07 → CP-10

## 0.1.0-beta.8 — 2026-10-21

- fix(drawer): opening a sheet does not force layout
- feat(dialog): a full-screen dialog retreats for the virtual keyboard
- fix(command-palette): focus stays on the input while the palette is open, and a touch that scrolls the list does not move the highlight
- test(react): tests in Chromium
- fix(date-field, time-field, datetime-field): each segment has the unit name, from the catalog of the language in force
- fix(calendar): the pagination buttons carry the name of the step they take
- fix(tabs): the marker moves by left and inline-size, the two layout properties on the same thread

## 0.1.0-beta.7 — 2026-10-20

- fix(presence): reversible stop() for React StrictMode, destroy() is final again
- chore(theme): regenerate the contract with menu width and the ring inset
- fix(app-shell, side-navigation): the ring inset is published from --_row-ring-inset, and the side-navigation tokens.json lists it
- fix(side-navigation): the contract reads --slotted-app-shell-row-ring-inset
- feat(menu): width 'content' | 'anchor'
- fix(button, kbd): the Button slot stops imposing display:block and 16px on a key
- fix(app-shell): the seam rereads the color in each region; nav head, body and foot share the bar rail and a focus ring inset (--slotted-app-shell-row-ring-inset), and side-navigation keeps the row border
- fix(table): TableEmpty writes its own row
- fix(presence): destroy is reversible

## 0.1.0-beta.6 — 2026-10-20

- ci(release): a single validation
- style(harness): format tabs-marker.mjs
- Revert "feat(segmented-control): gap between segments of --slotted-space-2, one step above the ring; the thumb keeps the height"
- Revert "docs(plans): sixth iteration
- feat(segmented-control): gap between segments of --slotted-space-2, one step above the ring; the thumb keeps the height
- feat(segmented-control): dividers back, refined
- feat(segmented-control): segments spaced by the ring step and without dividers; the thumb moves one column and one gap, and the radio covers half the gap on each side
- feat(segmented-control): neutral look
- fix(stat-card): @scope boundary anchored on :scope
- fix(tabs): the marker slides only when the selection changes, with medium duration on a curve that starts and ends slowly; a new measurement of the same tab no longer animates it
- feat(tabs): --slotted-tabs-marker-offset

## 0.1.0-beta.5 — 2026-10-20

- perf(angular, popups): data-open and data-positioned written on the element in the opening task, without waiting for the next check
- perf(pickers): surface mounted, in the portal and positioned at the opening commit; entry focus and time list reveal on the next frame
- perf(side-navigation): flyout with portal and positioner in layout effect, data-open written by the measurement
- perf(cascader): data-open written by the measurement that positions the layer, at the opening commit
- perf(entity-picker): data-open written by the measurement that positions the popup, at the opening commit
- perf(tooltip): data-open written by the measurement that positions the hint, without a positioned render; portal layer when the pointer or focus arrives
- perf(menu): data-open on the first frame after the click; entry focus moves on the next frame
- perf(popover): data-open on the first frame after the click; initial focus moves on the next frame
- perf(multi-select, combobox): data-open on the first frame after the click, like select; popup-open.mjs scenario per family
- perf(select, angular): the recorded press replaces the box read on click, the portal layer is born on focus or press, and the highlight reveals on the next frame
- fix(stat-card): part rules in @scope with boundary at the content of a nested family
- perf(select, core/positioner): data-open on the first frame after the click
- fix(agent-docs): renderExamples in its own directory per call
- fix(core/measure): createIndicator writes data-positioned at the second position, without requestAnimationFrame
- feat(tabs): a marker in the list that slides by translate, in the tab content box, with thickness, radius, inset and hover opacity tokens
- feat(core/measure): createIndicator
- feat(page-header): a single background under a title without header-area and --slotted-page-header-backdrop-filter while stuck
- feat(react): slotted-agent-docs bin
- fix(agent-docs): SKILL.md and guideline paths relative to the file itself; the snippet declares the base in the first sentence
- fix(table, scroll-area, chart): scroll region ring only for keyboard focus; the browser ring leaves for pointer focus
- fix(app-shell): main receives tabindex only for the focus of the skip link and focusMain; a click on the content does not focus it
- feat(core/focus): focusTarget and createFocusOrigin
- fix(stat-card): value of StatCardValue and StatCardDelta accepts undefined under exactOptionalPropertyTypes

## 0.1.0-beta.4 — 2026-10-20

- test(accordion): the 100 ms wall-clock ceiling is removed
- test(table): the wall-clock ratio test is removed
- fix(theme): contract generated alongside the --slotted-table-edge-inset token and data-edges
- fix(date-picker): SlDatePicker generic over the value type
- feat(date-picker): granularity month
- docs(text-field): the type row names the control that replaces each type outside the list
- docs(agent-docs): CP-09 e LP-14
- feat(tabs): deferPanels and useTabs().shownValue
- feat(page): development warning when PageBody is missing
- fix(select): the closed control shows the SelectItem label without items
- feat(table): edges inset and flush
- perf(overflow): the scroll shadow measures on the first ResizeObserver report
- perf(accordion): fifty closed items mount in one commit and without a style read
- perf(combobox): opening and moving the highlight recount the list once per render

### Guidelines

- Added: CP-09, LP-14

## 0.1.0-beta.3 — 2026-10-19

- feat(react): usePressSelection
- feat(button): justify between
- feat(theme): translucent material
- perf(filter-bar): compact mode and sticky measure only on the observer report
- perf(page-header): the sticky-header measures on the first ResizeObserver report
- perf(chart): the theme is read once per context and never inside the mount
- fix(agent-docs): the design system export reads a state layer as a color with alpha
- fix(theme): generated fonts and proof snapshot alongside the contracts
- fix(react): the package stops bundling react-dom
- docs(dialog): who owns the panel inset
- feat(chart): annotation labels without overlap
- feat(currency-field): display appearance
- feat(list): end of group header and ruled variant
- feat(segmented-control): underline variant
- feat(table): group row, current row and row action
- feat(theme): neutral tone, state layers and tracking
- perf(positioner): one computation for the requests made in the same task
- fix(app-shell): the navigation comes back open on leaving overlay

## 0.1.0-beta.2 — 2026-10-17

- fix(docs): llms.txt lists the skills/index.md of each binding
- fix(agent-docs): renderExamples removes the global require it defined
- docs(agent-docs): 2026-10-17 evaluation report
- fix(agent-docs): returns own-element to the original case and takes focus to seat-map
- fix(agent-docs): brand-theme accepts the accent seed in any form of the API (ThemeScope seeds, seedStyle, theme definition) and checks the brand hex; a partial run prints the report instead of overwriting the one in docs/history/evals
- fix(agent-docs): seat-map accepts seats drawn by toggle, toggle-group or checkbox in place of the hand-written focus, target and forced colors
- feat(agent-docs): the evaluation records each session in a journal and resumes from it
- perf(agent-docs): the evaluation runs --jobs sessions at the same time (4 by default) and ends a session after 15 minutes; the first failure prevents new sessions
- fix(agent-docs): brand-theme accepts the brand passed by seedStyle({ accent }) from @slotted/theme/seeds
- fix(agent-docs): the evaluation no-literal ignores the step of a media or container query and comments, like specs/demo-screen-tokens.test.mjs
- fix(agent-docs): build-own-element names the :focus-visible selector, the focus ring tokens, --slotted-target-min and forced-colors: active
- fix(agent-docs): uses-family in React accepts any component the family exports (SkeletonText, ProgressBar, Loader) or the subpath import
- fix(agent-docs): the evaluation stops when a session does not run
- fix(agent-docs): the evaluation installs the fixtures of all bindings before the first session, and the Angular fixture pins @angular/forms, a peer of @slotted/angular
- fix(agent-docs): theme-app measures restyling by the appearance the CSS changes in a family, like review-screen and the snippet
- fix(agent-docs): the design system book says where a rule id (CP-01) is resolved
- fix(agent-docs): review-screen flags application CSS that changes the color, border, radius, padding or type of a family, and not any selector on data-ui
- docs(agent-docs): the maintainer guide describes the design system export
- feat(agent-docs): design system export
- feat(agent-docs): design system component folders
- feat(agent-docs): design system tokens.json
- docs(agent-docs): design of subproject 4
- docs(agent-docs): the maintainer guide cites the evaluation seeds, the line of each skill in the snippet, the generated skills/index.md and the theme API in the catalog
- feat(agent-docs): theme-app skill
- feat(agent-docs): build-own-element skill
- fix(agent-docs): index.md points to skills/index.md, which lists each skill with its description
- feat(agent-docs): review-screen skill
- docs(agents): the 0.x betas go out on the latest dist-tag, as scripts/release.mjs publishes
- feat(agent-docs): evaluation with a seed screen
- feat(agent-docs): the catalog reads the public API of @slotted/theme and @slotted/themes (exports, command, subpaths, theme attributes, seeds, layers, schemes and densities); the {{themeScope}} placeholder names the React ThemeScope and the Angular slThemeScope, checked against the binding code
- docs(agent-docs): design of subproject 3
- feat(agent-docs): the rules for reports, builders, conversations, workspaces and ledgers now hold for any application
- docs(token-foundation): the Glyph sentence names the family's own icon instead of pointing to a removed predecessor
- fix(agent-docs): final review
- test(agent-docs): own-element case
- docs(agent-docs): maintainer guide (what to edit, what is generated, release sequence) and skill writing guide; each skill requires an evaluation case and each case an existing skill
- refactor(agent-docs): the id registry is read from the topics, now and at the last tag; ids.json goes away, and a new rule is edited in a single file; the release reads the same registry
- feat(agent-docs): own-elements topic (OE-01..OE-10)
- feat(docs): the site serves the tokens.md of each binding and lists it in llms.txt
- feat(agent-docs): each binding publishes tokens.md, cited by index.md; the text goes through the catalog and the publication filter
- feat(agent-docs): renderTokens
- feat(theme): the contract says what each token is for
- feat(theme): token-groups
- docs(agent-docs): plan of subproject 2
- docs(agent-docs): design of subproject 2
- fix(agent-docs): final review
- fix(tabs): the close control is neutral and round, like the dialog close, and sits at the tab inset distance from the last letter
- fix(progress-indicator): the bar thickness becomes 4, 6 and 8 pixels
- perf(dashboard-grid): dragging stops producing long tasks
- feat(agent-docs): pnpm eval:agent-docs
- feat(agent-docs): core of the effectiveness evaluation
- feat(release): the changelog entry lists the guideline rules added, retired and rewritten, by the ids.json diff against the previous tag
- docs(nexora): the demo reads the agent instructions as a consumer
- feat(docs): the site serves the guidelines and skills of each binding as the package publishes them, and llms.txt lists them; the binding READMEs say where the snippet goes
- feat(agent-docs): compose-screen product skill
- feat(agent-docs): waiting-states product skill
- docs(guidelines): ER, BR, OV and PM move to the package; PM-03 retired in the package and rewritten in Nexora as PC-01, a procurement domain rule; citations of demo spec sections (§) forbidden in the published text; the demo keeps only the rules of its domain
- docs(guidelines): LP, RP and FM move to the package
- docs(guidelines): AF, LA, SC and CP move to the package
- docs(guidelines): the writing protocol gets a single source in tools/agent-docs/content, with Verified in only in the source and Check written for the consumer; reading protocol published; the demo points to both; the resolver accepts the format vocabulary and the docs paths that exist
- test(agent-docs): the published content enters pnpm check
- feat(agent-docs): the build writes guidelines/ and skills/ from tools/agent-docs/content, with {{docsDir}} and {{package}} per binding; index.md gains the Guidelines and Skills sections; turbo rebuilds the bindings when content/ changes
- feat(agent-docs): guideline ID registry
- feat(agent-docs): resolution of backticked names against contracts, theme, tokens and properties declared in the sheets
- feat(agent-docs): parsing, validation and rendering of the guideline topics
- docs: plan of the product agent material
- docs: design of the product agent material
- chore: delete .codex
- docs: result of the triage of the recorded defects
- fix(multi-select): the grid carries the field label and the count, as the contract says
- fix(drawer): an inline panel without a role writes no name
- fix(menu): the trigger render props carry children as required
- fix(nexora): row headers with customer identifiers ask for text="nowrap"
- fix(number-field): the scrub mark is its own bidi run
- fix(app-shell): the hover of a navigation row shows over the inset canvas background
- fix(stat-card): the action is a whole touch target on a coarse pointer
- docs(feedback): the ledgers stop saying uncommitted on 141 lines, all merged into main on 2026-10-15; combobox and calendar (React) become fixed with the evidence
- fix(combobox): the list reveals the highlight without scrolling the page and hides what the filter removed
- docs: triage of the recorded defects
- feat(event-calendar): now
- fix(data-grid): a Tab stop with a selection column in Angular

### Guidelines

- Added: AF-01, AF-02, AF-03, AF-04, AF-05, AF-06, AF-07, BD-01, BD-02, BD-03, BD-04, BD-05, BD-06, BR-01, BR-02, BR-03, BR-04, CP-01, CP-02, CP-03, CP-04, CP-05, CP-06, CP-07, CP-08, CV-01, CV-02, CV-03, ER-01, ER-02, ER-03, ER-04, FM-01, FM-02, FM-03, FM-04, FM-05, FM-06, FM-07, FM-08, FM-09, FM-10, FM-11, FM-12, FM-13, FM-14, FM-15, FM-16, LA-01, LA-02, LA-03, LA-04, LA-05, LA-06, LG-01, LG-02, LP-01, LP-02, LP-03, LP-04, LP-05, LP-06, LP-08, LP-09, LP-10, LP-11, LP-12, LP-13, OE-01, OE-02, OE-03, OE-04, OE-05, OE-06, OE-07, OE-08, OE-09, OE-10, OV-01, OV-02, OV-03, OV-04, OV-05, PM-01, PM-02, RE-01, RE-02, RE-03, RE-04, RE-05, RE-06, RE-07, RE-08, RE-09, RP-01, RP-02, RP-03, RP-04, RP-05, RP-06, RP-07, RP-08, RP-09, RP-10, RP-11, RP-12, RP-13, SC-01, SC-02, SC-03, SC-04, SC-05, SC-06, WS-01, WS-02

## 0.1.0-beta.1 — 2026-10-15

- docs(release): the command that configures the trusted publisher of a new package
- feat(release): releases without token or OTP
- docs: documentation aligned with the public beta

## 0.1.0-beta.0 — 2026-10-15

- First public beta: `@slotted/react`, `@slotted/angular`, `@slotted/core`, `@slotted/theme`, `@slotted/themes` and `@slotted/styles`, with 124 component families specified in `specs/components/`.
