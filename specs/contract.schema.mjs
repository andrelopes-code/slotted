import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * Schema 5 adds the two facts schema 4 left to each family to invent: the
 * public identifier a consumer selects the family by, and the state model —
 * controlled, uncontrolled, and the reason a change carries. A family still on
 * schema 4 is listed in `legacy-families.json` and is awaiting the rebuild
 * ordered in `docs/process/build-order.md`; that list only shrinks.
 */
export const SCHEMA_VERSION = 5;
export const LEGACY_SCHEMA_VERSION = 4;

export const LEGACY_FAMILIES = JSON.parse(
  readFileSync(new URL('./legacy-families.json', import.meta.url), 'utf8'),
).families;

/**
 * The shelf a family sits on, in the order a reader meets them: the docs
 * sidebar and the agent index group by it, so a family declares it here rather
 * than in each consumer.
 */
export const GROUPS = [
  'Actions',
  'Forms',
  'Data display',
  'Feedback',
  'Navigation',
  'Overlays',
  'Layout',
];

/**
 * One sentence an agent reads to choose the family, short enough that 123 of
 * them fit the 8 KB agent index beside their names.
 */
export const SUMMARY_MAX = 56;

function assertSummary(contract) {
  const summary = contract.catalog?.summary;
  assert.equal(typeof summary, 'string', `${contract.family}: catalog.summary must be a string`);
  assert.ok(
    summary.length <= SUMMARY_MAX,
    `${contract.family}: catalog.summary exceeds ${SUMMARY_MAX} characters`,
  );
  assert.match(
    summary,
    /^[A-Z][^]*\.$/,
    `${contract.family}: catalog.summary must open with a capital and end with a period`,
  );
  assert.ok(
    !/[.!?]\s/.test(summary),
    `${contract.family}: catalog.summary holds more than one sentence`,
  );
}

export const PSEUDO_STATES = ['default', 'hover', 'active', 'focus-visible'];

export const STATE_ATTRIBUTES = {
  disabled: 'data-disabled',
  loading: 'data-loading',
  pressed: 'data-pressed',
  selected: 'data-selected',
  loaded: 'data-loaded',
  indeterminate: 'data-indeterminate',
  current: 'data-current',
  invalid: 'data-invalid',
  required: 'data-required',
  readonly: 'data-readonly',
  dragging: 'data-dragging',
  checked: 'data-checked',
  /**
   * Something that has finished: a step of a flow the reader has walked past,
   * and equally a quantity that has reached the top of its range. It is not
   * `checked` and not `selected` — both of those are the reader's own choice,
   * while completion is a fact about the thing itself.
   *
   * The second reading is here because CSS cannot compare a value to a
   * maximum, so a bar that must read differently at a hundred per cent has no
   * selector to write without it.
   */
  complete: 'data-complete',
  open: 'data-open',
  expanded: 'data-expanded',
  /**
   * A value the component was holding back and is now showing whole. The
   * capability existed from `text-field`, whose reveal is a swap of the input's
   * own `type` and needs no selector; `description-list` clamps a long value in
   * CSS, so the stylesheet has to be able to select the state that releases the
   * clamp.
   *
   * It is not `open` and not `expanded`: both of those are a section of content
   * appearing beside or below a control, while this is one value being shown at
   * its full length in the place it already occupied.
   */
  revealed: 'data-revealed',
  /**
   * A layer the reader has told to take the whole of the space it is shown in.
   *
   * It is not `expanded` and not `open`: those are content appearing, while
   * this is one already-visible surface growing to its container's edges on the
   * reader's own word. `dialog` states it apart from its `fullScreen` axis,
   * which is the responsive rule the consumer chose in advance.
   */
  fullscreen: 'data-fullscreen',
  /**
   * A notification the reader has seen. It is not `checked` and not
   * `selected` — those are the reader's choice of a set — and not `complete`,
   * which is a fact about the thing itself: a read notification is still
   * pending whatever it is about. `notification-center` found the vocabulary
   * had no word for the one state every inbox draws, and Knock, Novu, UI5 and
   * GitHub all call it read.
   */
  read: 'data-read',
  'drop-target': 'data-drop-target',
  /**
   * A drag the region has already decided it will refuse.
   *
   * It is not `drop-target`, which says the drag is over this region and it
   * will be taken, and it is not `invalid`, which is a state of the value the
   * control holds rather than of something still hanging over it.
   * `docs/component-features.md` §2.5 names the drag-and-drop set as
   * `dragging`, `drop-target` and `drop-invalid`; the first two were here and
   * `upload` is the family that found the third missing.
   *
   * `DataTransfer.items` exposes each item's `kind` and `type` during the drag
   * and neither its name nor its size, so the verdict is only paintable for
   * the rules those two answer. What cannot be known is not judged.
   */
  'drop-invalid': 'data-drop-invalid',
  /**
   * A surface in the mode where the reader rearranges it: blocks carry a
   * handle, a resize grip and the columns they snap to.
   *
   * It is not `open` and not `expanded`, which are content appearing, and not
   * `pressed`, which is the state of the control that asks for the mode rather
   * than of the surface in it. `dashboard-grid` found the gap; Grafana and
   * gridstack both draw the same surface twice, at rest and in edit.
   */
  editing: 'data-editing',
};

export const ATTRIBUTE_STATES = Object.keys(STATE_ATTRIBUTES);

/**
 * Strongest first. Two states that can be true at once are resolved in this
 * order, and a stylesheet that paints a weaker state has to hold it back for
 * every stronger one: a disabled control does not answer hover, and a loading
 * control does not answer press. Naming the order once is what makes the rule
 * checkable instead of a habit each family relearns after a defect.
 */
export const STATE_PRECEDENCE = [
  'disabled',
  'loading',
  'readonly',
  'invalid',
  'checked',
  'selected',
  'pressed',
  'current',
  'complete',
  'active',
  'hover',
  'focus-visible',
  'default',
];

/**
 * The five semantic colours the library speaks in. They belong to the theme —
 * every one of them carries the same nine roles — so no family owns the list.
 *
 * It is stated here because it was not stated anywhere: `alert` and `tag` each
 * asserted their tones by reading `badge`'s contract, which held only while all
 * three families were on the same schema. Rebuilding one of the three renamed
 * the axis under the other two, and two tests failed for a family neither of
 * them is about.
 */
export const TONES = ['accent', 'secondary', 'info', 'success', 'warning', 'danger'];

/** Why a change was requested. A boolean cannot say, so every request does. */
export const CHANGE_REASONS = [
  'pointer',
  'keyboard',
  'clear',
  'remove',
  'select',
  'dismiss',
  'escape',
  'outsidePress',
  'blur',
  'submit',
  'programmatic',
  /**
   * The time the component was given ran out. It is neither `dismiss`, which is
   * the reader pressing the control, nor `programmatic`, which is the
   * application asking; a consumer who has to tell an expiry from a dismissal
   * by elimination writes the wrong handler, which is the failure this
   * vocabulary exists to prevent.
   *
   * `toast` is the first family in the library with a timer of its own.
   */
  'timeout',
  /**
   * The reader scrolled past the thing, and the thing answered. It is neither
   * `pointer` — a wheel, a trackpad, a scrollbar drag and a touch fling are one
   * gesture, and none of them is a press on the control — nor `programmatic`,
   * because the application asked for nothing.
   *
   * `page-header` is the first family whose state a scroll moves: the header
   * area collapses when it leaves the scrollport and expands when it returns.
   * UI5's `title-toggle` fires the same event for a scroll and for a click, so
   * a product saving the reader's preference has to guess which one it saw;
   * the reason is what lets it persist the click and ignore the scroll.
   */
  'scroll',
  /**
   * The space the thing was given changed, and the thing answered. It is
   * neither `pointer` — dragging a window's corner, rotating a phone and
   * zooming to 400% are three gestures and none of them is a press on the
   * control — nor `programmatic`, because the application asked for nothing.
   *
   * `app-shell` is the first family whose state a width moves: the navigation
   * region closes when the shell becomes too narrow to hold it beside the
   * content. The reason is what lets a product persist the reader's own choice
   * and ignore the one the layout forced, which is the line
   * `docs/component-features.md` §15 asks for when it says sidebar persistence
   * belongs to the product. Ant Design is the only surveyed implementation
   * that distinguishes the two origins, and it does so with a string of its
   * own outside any shared vocabulary.
   */
  'resize',
  /**
   * The platform's own way back — a phone's gesture, a browser's button —
   * used while a modal layer stood over the page, and answered by the layer
   * rather than by the history. Neither `escape`, a key a touch screen does
   * not have, nor `dismiss`, a control of the layer's own. `dismissable-layer`
   * keeps one close watcher per layer that asks for it where the platform has
   * `CloseWatcher`, and one history entry elsewhere; `dialog`, `drawer` and
   * `app-shell` were the first families to ask.
   */
  'back',
  /**
   * The reader spoke, and the platform's speech recognition wrote the words.
   * It is neither `keyboard`, because no key was pressed, nor `programmatic`,
   * because the application asked for nothing. `prompt-composer` is the first
   * family that takes speech.
   */
  'dictation',
];

export const KNOWN_CAPABILITIES = [
  'appearance',
  /** Arranging children: separation, alignment along the flow and across it. */
  'arrangement',
  'size',
  'shape',
  /**
   * A quantity the consumer states and the family draws: a progress, a level,
   * a share of a whole. It is deliberately not mutable, and the distinction is
   * the one `value` exists for — a control whose value the reader moves holds
   * `value` and a state model, where a measured quantity is read-only by the
   * definition of the role that reports it. `progress-bar` put the word in
   * this vocabulary and schema 5 filed it under the mutable list, where it
   * would have obliged `progress-indicator` to declare a request nothing can
   * emit and a reason no vocabulary holds.
   */
  'measurement',
  /**
   * What a container does with more content than it has room for: keeping it
   * on a second row, scrolling past it, or hiding it behind a control that
   * holds it.
   *
   * It is deliberately not mutable, for the reason `measurement` is not. The
   * set that does not fit is read from the layout, so a consumer who owned it
   * could assert that a bar fits when the browser says it does not, and the
   * DOM would then contradict the model. What the consumer gets instead is the
   * fact — the count in the DOM and a callback when it changes.
   *
   * `toolbar` put the word in this vocabulary. `tabs` scrolls its own list and
   * `breadcrumb` folds its trail behind an ellipsis; each takes the word when
   * it is next opened.
   */
  'overflow',
  'live',
  'current',
  'open',
  'placement',
  'status',
  'content',
  'fullWidth',
  'disabled',
  'loading',
  'pressed',
  'orientation',
  'invalid',
  'required',
  'readOnly',
  'wiring',
  'focusable',
  'decorative',
  'underline',
  'external',
  'activation',
  'selection',
  /**
   * Which column a set of rows is ordered by, and which way. It is mutable and
   * a consumer can own it: a server sorts, a query string carries the
   * descriptor back, and a saved view restores it.
   *
   * The vocabulary had four words that look like this one and are not.
   * `selection` is the reader's own choice of records; `current` is where the
   * reader is; `value` is the text a control holds; `measurement` is a quantity
   * the consumer states and the family only draws. None of them says "these
   * rows are ordered by that column, ascending".
   *
   * `table` found the gap. `data-grid`, `tree-grid` and `pivot-grid` each hold
   * the same value later, and a word invented per family would have been three
   * families disagreeing about the shape of one descriptor.
   */
  'sort',
  /**
   * The condition a reader has put on a column: which values to keep, or which
   * comparison a value has to answer. It is mutable and a consumer can own it: a
   * server filters, a query string carries the condition back, and a saved view
   * restores it.
   *
   * It is not `selection`, which is the reader's choice of *records* — a table
   * holds both at once and they mean opposite things, one naming rows to act on
   * and the other naming rows to see. It is not `value`, which is the text a
   * control holds: what is held here is a descriptor over values the consumer
   * supplied, not text the reader typed.
   *
   * `table` found the gap and first held a chosen set alone; the word covers a
   * typed condition too, because `@slotted/core/filter` gave the five kinds one
   * descriptor and `data-grid`, `filter-bar` and `pivot-grid` each hold that
   * same descriptor later. A second capability for "the typed one" would have
   * been two words for one value.
   */
  'filter',
  /**
   * Asking to be taken out of the collection that holds it. It is deliberately
   * not mutable: the family emits a request carrying a reason, and the
   * consumer's own collection decides. A component that removed itself would
   * render nothing while the consumer's array still held the item, which is
   * the desync `docs/state-and-events.md` exists to prevent.
   */
  'removable',
  /**
   * Marking a notification read or unread. It is deliberately not mutable,
   * for the reason `removable` is not: the fact lives per item in the
   * consumer's store, and a family that flipped it itself would show a
   * notification as read while the server still held it unread. The family
   * asks — with the keys, the value and a reason — and the consumer's items
   * answer. `notification-center` found the gap.
   */
  'read',
  /**
   * Putting a value the component displays onto the clipboard. It is
   * deliberately not mutable: the clipboard belongs to the platform and the
   * family holds none of it, so there is no controlled value and nothing to
   * cancel — the component writes, then reports what happened with a reason.
   *
   * `description-list` found the vocabulary had no word for it. Section 10 of
   * `docs/component-features.md` asks that a long value be reachable by copying
   * rather than truncated, and `code-block` in wave 7 asks for the same control
   * over a different kind of value.
   */
  'copyable',
  'virtualization',
  'files',
  'checked',
  /**
   * The text a control holds. It is the most common mutable value a component
   * library ships and the vocabulary had no word for it, which is how the
   * deleted `input` family came to declare five capabilities, none of them
   * mutable, and no state model for the one thing the control does.
   */
  'value',
  /** A hidden value shown in the clear, which is a password field's own bit. */
  'revealed',
  /**
   * A surface already on screen taking the whole of the space it is shown in,
   * on the reader's own word. It is mutable and a consumer can own it: a
   * product that remembers how a reader left a dialog sets it back.
   *
   * It is not `open` and not `expanded`. `dialog` put the word in this
   * vocabulary; its `fullScreen` axis is the responsive rule chosen in advance
   * and stays an axis, because a consumer decides that one and a reader
   * decides this one.
   */
  'fullscreen',
  /**
   * The errors a form holds, keyed by the name of the control each one is
   * about. It is mutable and a consumer can own it: a server sends the map
   * back, and the family also builds one from `checkValidity()`.
   *
   * `invalid` is the state one control is in; this is the set of reasons a
   * whole form is in it. Calling it `value` would have named it for something
   * it is not, and `form` was the family that found the vocabulary had no word
   * for what it holds.
   */
  'validity',
  /**
   * How much of the space available to it a panel takes, as a fraction the
   * reader can move.
   *
   * The vocabulary had three words that look like this one and are not.
   * `size` is a step on an appearance scale and is deliberately immutable;
   * `measurement` is a quantity the consumer states and the family only draws;
   * `value` is the text a control holds. None of them says "how much of the
   * layer this panel takes, and the reader decides".
   *
   * `drawer` found the gap — `docs/component-features.md` §8 asks it for
   * "extent com limites" — and `splitter` in wave 8 holds the same value
   * between two panes. Both answer the WAI-ARIA Window Splitter pattern, whose
   * separator has a value, a minimum and a maximum, which is exactly the shape
   * a state model gives it.
   */
  'extent',
  /**
   * An ordered collection of transient entries the component both holds and
   * expires on its own, and which a consumer may own instead.
   *
   * `files` is the closest word already here and it names a list the reader
   * chose; `value` names what one control holds. Neither says "the messages
   * currently on screen, the ones waiting behind them, and the order they leave
   * in". `toast` found the gap, and a later family with a queue of its own —
   * an upload list, a background-job tray — reads the same word.
   */
  'queue',
  /**
   * The reader's own arrangement of a grid's columns — their order, their
   * widths, which are hidden and which are pinned to either edge. It is
   * mutable and a consumer can own it: a saved view restores it, and
   * `column-manager` edits it in a panel of its own.
   *
   * The vocabulary had four words that look like this one and are not.
   * `arrangement` and `size` are deliberately immutable, a consumer's choice
   * of how children are laid out; `extent` is the share of a layer one panel
   * takes; `value` is the text a control holds. None of them says "these
   * columns, in this order, at these widths, and the reader moved them".
   *
   * `data-grid` found the gap: `table` declined resizing, reordering and
   * pinning by name and deferred all three to it. `tree-grid`, `pivot-grid`
   * and `column-manager` hold or edit the same object later.
   */
  'columns',
  /**
   * Which of a chart's series, or a pie's slices, are drawn. It is mutable and
   * a consumer can own it: a saved dashboard restores the series a reader hid,
   * and two charts that share the value hide the same series together.
   *
   * It is not `selection`, which names data to act on: a chart holds a
   * selected point and a hidden series at once, and the two mean opposite
   * things. It is not `filter`, which is a descriptor over the values of
   * records; hiding a series leaves every record in the data and its table.
   * `chart` found the gap; MUI X calls it `hiddenItems` and ECharts
   * `legend.selected`.
   */
  'visibility',
  /**
   * The window of a data domain in view, as a start and an end the reader
   * moves by wheel, pinch, drag or key. It is mutable and a consumer can own
   * it: a query string carries the range back, and a dashboard applies one
   * range to every chart on it.
   *
   * It is not `extent`, which is the share of a layer a panel takes rather
   * than a range of data, and it is not `filter`: the records outside the
   * window are still the chart's, still in its table, and a reset brings them
   * back without asking the consumer for them. `chart` found the gap;
   * `docs/component-features.md` §13 asks for zoom with a reset and an
   * announcement.
   */
  'zoom',
  /**
   * The named arrangements of a grid a reader keeps — each a whole view, its
   * columns, query and density — with the one in use and the one a visit
   * opens on. It is mutable and a consumer can own it: a store keeps the list
   * across visits, and a team shares it.
   *
   * It is not `columns`, which is one arrangement, and not `selection` or
   * `current`: the set itself is edited — saved, renamed, deleted — and which
   * view is in use is one field of it. `saved-views` found the gap; Airtable,
   * Notion and Linear each hold the same list.
   */
  'views',
  /**
   * The reader's own arrangement of a surface of blocks: their order, the
   * share of the surface each takes, and which are hidden. It is mutable and a
   * consumer can own it: a store restores it across visits, and a product
   * ships a default one.
   *
   * It is not `columns`, which is one grid's columns of data, and not
   * `arrangement`, which is the consumer's immutable choice of how children
   * are laid out. `dashboard-grid` found the gap; react-grid-layout, gridstack
   * and Kendo each call the same value a layout.
   */
  'layout',
  /**
   * Whether a surface is in the mode where the reader rearranges it. It is
   * mutable and a consumer can own it: the button that enters the mode is the
   * product's, and a product that saves on exit decides when the mode ends.
   * `dashboard-grid` found the gap.
   */
  'editing',
  /**
   * The notation a value is written in, when the family lets the reader
   * switch it: `color-picker` writes the same colour as hex, rgb, hsl or
   * oklch, and the string it hands back is in the notation shown. It is state
   * a consumer may own — a design tool remembers the last notation — so it
   * carries its own model beside the value's.
   */
  'format',
  /**
   * Whether a component that advances on a timer of its own is advancing. It
   * is mutable and a consumer can own it: the reader stops the rotation with
   * a control, focus entering by keyboard stops it, and a product that
   * remembers the reader's choice sets it back.
   *
   * It is not `pressed`, which is the state of a toggle the reader holds down:
   * the APG gives the rotation control a label that changes with the action
   * and no pressed state. It is not `open` or `current`. `carousel` found the
   * gap; `media-player` holds the same value for its own playback.
   */
  'playback',
];

/** Capabilities that hold state a consumer can own, and therefore need a model. */
export const MUTABLE_CAPABILITIES = [
  'open',
  'fullscreen',
  'checked',
  'pressed',
  'selection',
  'sort',
  'filter',
  'activation',
  'files',
  'current',
  'value',
  'revealed',
  'validity',
  'queue',
  'extent',
  'columns',
  'visibility',
  'zoom',
  'views',
  'layout',
  'editing',
  'format',
  'playback',
];

export function strongestState(states) {
  return STATE_PRECEDENCE.find((state) => states.includes(state));
}

function assertUnique(values, label) {
  const duplicates = [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
  assert.deepEqual(duplicates, [], `${label} repeats ${duplicates.join(', ')}`);
}

function assertOneModel(entry, label) {
  for (const field of ['controlled', 'uncontrolled', 'request', 'reasons']) {
    assert.ok(field in entry, `${label} state model is missing ${field}`);
  }
  assert.ok(Array.isArray(entry.reasons) && entry.reasons.length > 0, `${label} reasons`);
  assertUnique(entry.reasons, `${label} reasons`);
  for (const reason of entry.reasons) {
    assert.ok(CHANGE_REASONS.includes(reason), `${label} unknown reason ${reason}`);
  }
}

/**
 * A family may hold one capability for more than one thing — `app-shell` has
 * a navigation region and a secondary pane, and each of them opens — and the
 * model is indexed by capability. The entry for such a capability is a *set*
 * of named models, told apart from a single model by the absence of
 * `controlled` on the entry itself, and every member is held to the same
 * shape a single model is. A set that names nothing declares a model and
 * models nothing; two members that share a prop name are one model written
 * twice.
 */
export function stateModels(entry) {
  return 'controlled' in entry ? [entry] : Object.values(entry);
}

function assertStateModel(contract, capabilities) {
  const model = contract.stateModel ?? {};

  for (const capability of MUTABLE_CAPABILITIES) {
    if (!capabilities.has(capability)) continue;
    const entry = model[capability];
    assert.ok(entry, `${capability} holds state and declares no model`);

    if ('controlled' in entry) {
      assertOneModel(entry, capability);
      continue;
    }
    const names = Object.keys(entry);
    assert.ok(names.length > 0, `${capability} declares a set and models nothing`);
    for (const name of names) assertOneModel(entry[name], `${capability}.${name}`);
    assertUnique(
      names.flatMap((name) => [entry[name].controlled, entry[name].uncontrolled]),
      `${capability} set`,
    );
  }

  for (const capability of Object.keys(model)) {
    assert.ok(
      MUTABLE_CAPABILITIES.includes(capability) && capabilities.has(capability),
      `${capability} declares a state model and holds no state`,
    );
  }
}

export function assertContractShape(contract) {
  assert.ok(
    typeof contract.family === 'string' && contract.family.length > 0,
    'family must be a non-empty string',
  );

  const legacy = LEGACY_FAMILIES.includes(contract.family);
  assert.equal(
    contract.schemaVersion,
    legacy ? LEGACY_SCHEMA_VERSION : SCHEMA_VERSION,
    legacy
      ? `${contract.family} is listed as legacy, so it stays on schema ${LEGACY_SCHEMA_VERSION} until it is rebuilt`
      : `${contract.family} is not listed as legacy, so it must satisfy schema ${SCHEMA_VERSION}`,
  );

  assert.ok(
    GROUPS.includes(contract.catalog?.group),
    `${contract.family}: catalog.group ${contract.catalog?.group} is not one of ${GROUPS.join(', ')}`,
  );
  assertSummary(contract);

  const memberNames = Object.keys(contract.members ?? {});
  assert.ok(memberNames.length > 0, 'contract declares no members');

  const declaredStates = new Set();
  const declaredCapabilities = new Set();
  for (const [name, member] of Object.entries(contract.members)) {
    for (const field of ['nativeElement', 'defaults', 'capabilities', 'states', 'parts']) {
      assert.ok(field in member, `${name} is missing ${field}`);
    }
    assertUnique(member.capabilities, `${name} capabilities`);
    assertUnique(member.states, `${name} states`);
    assertUnique(member.parts, `${name} parts`);

    for (const capability of member.capabilities) {
      assert.ok(
        KNOWN_CAPABILITIES.includes(capability),
        `${name} unknown capability ${capability}`,
      );
      declaredCapabilities.add(capability);
    }
    for (const state of member.states) {
      assert.ok(
        PSEUDO_STATES.includes(state) || ATTRIBUTE_STATES.includes(state),
        `${name} unknown state ${state}`,
      );
      declaredStates.add(state);
    }

    if (!legacy) {
      assert.ok(member.parts.includes('root'), `${name} declares no root part`);
    }
  }

  const stateAttributes = contract.stateAttributes ?? {};
  for (const state of declaredStates) {
    if (PSEUDO_STATES.includes(state)) {
      assert.ok(!(state in stateAttributes), `${state} must not declare an attribute`);
      continue;
    }
    assert.ok(state in stateAttributes, `${state} needs a declared attribute`);
  }
  for (const [state, attribute] of Object.entries(stateAttributes)) {
    assert.equal(attribute, STATE_ATTRIBUTES[state], `${state} disagrees with the vocabulary`);
    assert.ok(declaredStates.has(state), `${state} is declared but no member uses it`);
  }

  for (const [page, ids] of Object.entries(contract.scenarios ?? {})) {
    assert.ok(page === 'overview' || memberNames.includes(page), `scenario page ${page}`);
    assertUnique(ids, `scenario page ${page}`);
    assert.ok(ids.length > 0, `scenario page ${page} is empty`);
  }

  if (legacy) return;

  assert.equal(
    contract.ui,
    contract.family,
    'the root part carries data-ui, and its value is the family name',
  );
  assertStateModel(contract, declaredCapabilities);
}
