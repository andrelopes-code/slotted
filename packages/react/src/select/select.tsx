import '@slotted/styles/select/select.css';

import { createFilter, revealWithin } from '@slotted/core/collection';
import { selectMessages, type FamilyTranslator, type SelectMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { MutableRefObject } from 'react';

import { useField } from '../field';
import { useLocale, useMessages } from '../i18n';
import { useSelectDefaults } from './select-defaults';
import type {
  SelectAlign,
  SelectHighlightReason,
  SelectItems,
  SelectMount,
  SelectOpenReason,
  SelectOption,
  SelectOptionGroup,
  SelectOptionValue,
  SelectProps,
  SelectSearchReason,
  SelectSelection,
  SelectSide,
  SelectSize,
  SelectStrategy,
  SelectValueReason,
  SelectVariant,
  SelectWidth,
} from './select.types';

/** Where the highlight goes when the popup opens, decided by the key that opened it. */
export type SelectEntry = 'selected' | 'first' | 'last' | 'none';

export interface SelectContextValue {
  align: SelectAlign;
  alignOffset: number;
  clear: (reason: SelectValueReason, source?: unknown) => void;
  clearable: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePress: boolean;
  closeOnSelect: boolean;
  collisionPadding: number;
  contentId: string;
  contentNode: HTMLElement | null;
  disabled: boolean;
  entry: MutableRefObject<SelectEntry>;
  flip: boolean;
  form: string | undefined;
  fullWidth: boolean;
  hideWhenDetached: boolean;
  highlighted: SelectOptionValue | null;
  highlightMatch: boolean;
  invalid: boolean;
  labelFor: (value: SelectOptionValue) => string | undefined;
  listId: string;
  loading: boolean;
  /** The locale the default filter compares in: the `locale` prop, or the language in force. */
  locale: string;
  loop: boolean;
  /** Whether an option's label answers the query. Always true while it is empty. */
  matches: (label: string) => boolean;
  mount: SelectMount;
  multiple: boolean;
  name: string | undefined;
  open: boolean;
  optionId: (value: SelectOptionValue) => string;
  portal: boolean;
  /** What the reader has typed into the search field. Empty when there is none. */
  query: string;
  readOnly: boolean;
  registerLabel: (value: SelectOptionValue, label: string) => void;
  required: boolean;
  /** Returns the selection to `defaultValue`, which is what a native form reset does. */
  restore: (source?: unknown) => void;
  search: boolean;
  searchId: string;
  searchNode: HTMLInputElement | null;
  seen: boolean;
  selection: readonly SelectOptionValue[];
  setContentNode: (node: HTMLElement | null) => void;
  setHighlighted: (
    value: SelectOptionValue | null,
    reason: SelectHighlightReason,
    source?: unknown,
  ) => void;
  setOpen: (next: boolean, reason: SelectOpenReason, source?: unknown) => void;
  setQuery: (next: string, reason: SelectSearchReason, source?: unknown) => void;
  setSearchNode: (node: HTMLInputElement | null) => void;
  setTriggerNode: (node: HTMLElement | null) => void;
  shift: boolean;
  side: SelectSide;
  sideOffset: number;
  size: SelectSize;
  strategy: SelectStrategy;
  /** The family's words in the language in force, with this select's `messages` laid over them. */
  t: FamilyTranslator<SelectMessages>;
  toggle: (value: SelectOptionValue, reason: SelectValueReason, source?: unknown) => void;
  total: number | undefined;
  triggerId: string;
  triggerNode: HTMLElement | null;
  typeahead: boolean;
  typeaheadTimeout: number;
  variant: SelectVariant;
  width: SelectWidth;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

/**
 * What the select around this part says. A trigger, a popup or an option
 * outside one has no state to report, so this throws rather than rendering
 * markup that looks right and never opens.
 */
export function useSelect(): SelectContextValue {
  const context = useContext(SelectContext);
  if (context === undefined) {
    throw new Error('SelectTrigger, SelectContent and every option have to be inside a Select.');
  }
  return context;
}

/** One value, several, or none — always read as a list, whatever was passed. */
function normalize(selection: SelectSelection | undefined): readonly SelectOptionValue[] {
  if (selection === undefined || selection === null) return [];
  return typeof selection === 'string' ? [selection] : selection;
}

/** The shape a consumer gets back, which is the shape they gave. */
function denormalize(values: readonly SelectOptionValue[], multiple: boolean): SelectSelection {
  if (multiple) return values;
  return values[0] ?? null;
}

const isGroup = (entry: SelectItems[number]): entry is SelectOptionGroup => 'options' in entry;

/** Every option a consumer declared up front, flattened out of its groups. */
function flatten(items: SelectItems | undefined): readonly SelectOption[] {
  if (items === undefined) return [];
  return items.flatMap((entry) => (isGroup(entry) ? entry.options : [entry]));
}

/**
 * A control that shows the current choice and opens a listbox of the rest.
 *
 * This component owns the state and **renders nothing**: the control stays
 * where the consumer wrote it and the popup is portalled to the end of the
 * document, so no single element could hold both. `SelectTrigger` renders the
 * frame and the button; `SelectContent` renders the layer and the list.
 *
 * **Three values a consumer can own, and each one asks before it moves.** What
 * is selected, whether the popup is open, and which option the highlight is on.
 * The third is `aria-activedescendant` rather than focus: DOM focus stays on
 * the trigger for the whole interaction, which is what the APG's own
 * select-only combobox example does and what `combobox` — this family's pair —
 * has no choice about.
 *
 * **Unset means ask the field.** `disabled`, `readOnly`, `invalid`, `required`
 * and `size` default to `undefined` rather than to a value, which is what makes
 * "not disabled" and "said nothing" different answers.
 */
export function Select({
  align,
  alignOffset,
  children,
  clearable,
  closeOnEscape,
  closeOnOutsidePress,
  closeOnSelect,
  collisionPadding,
  defaultHighlightedValue = null,
  defaultOpen = false,
  defaultSearchValue = '',
  defaultValue,
  disabled,
  filter,
  flip,
  form,
  fullWidth,
  hideWhenDetached,
  highlightedValue,
  highlightMatch,
  invalid,
  items,
  loading,
  locale: localeProp,
  loop,
  messages,
  mount,
  multiple,
  name,
  onHighlightedValueChange,
  onOpenChange,
  onSearchValueChange,
  onValueChange,
  open,
  portal,
  readOnly,
  ref,
  required,
  search,
  searchValue,
  shift,
  side,
  sideOffset,
  size,
  strategy,
  total,
  typeahead,
  typeaheadTimeout,
  value,
  variant,
  width,
}: SelectProps) {
  const defaults = useSelectDefaults();
  const field = useField();
  const t = useMessages(selectMessages, messages);
  const inForce = useLocale();
  const locale = localeProp ?? inForce;

  const generated = useId();
  const contentId = `${generated}listbox`;
  /**
   * The listbox's own identifier, which is the content's while there is no
   * search field and the inner list's while there is: `aria-controls` on the
   * trigger names the popup, and with a search field the popup is a dialog and
   * the listbox is one element in.
   */
  const listId = `${generated}list`;
  const searchId = `${generated}search`;
  /** The field's control identifier inside a field, so its label's `for` reaches the trigger. */
  const triggerId = field?.ids.control ?? `${generated}trigger`;

  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  /* `defaultValue` is read once, and a form reset returns to what it was then. */
  const [initialSelection] = useState<readonly SelectOptionValue[]>(() => normalize(defaultValue));
  const [ownSelection, setOwnSelection] = useState<readonly SelectOptionValue[]>(initialSelection);
  const [ownHighlighted, setOwnHighlighted] = useState<SelectOptionValue | null>(
    defaultHighlightedValue,
  );
  const [ownQuery, setOwnQuery] = useState(defaultSearchValue);
  const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);
  const [contentNode, setContentNode] = useState<HTMLElement | null>(null);
  const [searchNode, setSearchNode] = useState<HTMLInputElement | null>(null);

  const resolvedMultiple = multiple ?? defaults.multiple;
  const resolvedDisabled = disabled ?? field?.disabled ?? defaults.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly ?? defaults.readOnly;

  const currentOpen = (open ?? ownOpen) && !resolvedDisabled;
  const currentSelection = value === undefined ? ownSelection : normalize(value);
  const currentHighlighted = highlightedValue === undefined ? ownHighlighted : highlightedValue;
  const resolvedSearch = search ?? defaults.search;
  /* A query only exists while there is a field holding it, so a select whose
     consumer turned `search` off never filters, whatever `searchValue` says. */
  const currentQuery = resolvedSearch ? (searchValue === undefined ? ownQuery : searchValue) : '';

  const seen = useRef(currentOpen);
  if (currentOpen) seen.current = true;

  const entry = useRef<SelectEntry>('selected');

  /**
   * Labels for values, from three places, in the order a reader needs them.
   *
   * The popup does not exist while the control is closed under the default
   * `mount="active"`, so an option's own label is unavailable exactly when the
   * closed control has to print it. `items` is the answer for a select that
   * knows its options up front; the registry below is the answer for one that
   * does not, filled by the options themselves — rendered once into a detached
   * fragment while a held value has no label, and again whenever the popup is
   * built — and kept afterwards; and
   * `SelectValue`'s render function is the answer for a value the family cannot
   * resolve at all. When none of the three answers, the control prints the raw
   * value under `data-unmatched` rather than falling back to the placeholder,
   * which is what every surveyed implementation does and what makes a form
   * holding a value look empty.
   */
  const registry = useRef(new Map<SelectOptionValue, string>());
  /**
   * A counter rather than a state Map: the map is written from the options'
   * own effects during the popup's first render, and a new Map per
   * registration would re-render the tree once per option. Bumping a number,
   * and only when a label is new or has changed, batches the whole first open
   * into one render and leaves every later open free.
   */
  const [registered, setRegistered] = useState(0);

  const declared = useMemo(() => {
    const table = new Map<SelectOptionValue, string>();
    for (const option of flatten(items)) table.set(option.value, option.label);
    return table;
  }, [items]);

  const registerLabel = useCallback((optionValue: SelectOptionValue, label: string) => {
    if (registry.current.get(optionValue) === label) return;
    registry.current.set(optionValue, label);
    setRegistered((count) => count + 1);
  }, []);

  const labelFor = useCallback(
    (optionValue: SelectOptionValue) =>
      declared.get(optionValue) ?? registry.current.get(optionValue),
    /* The map it reads is a ref, so the count is what tells React the answer
       may have changed. */
    [declared, registered],
  );

  const fallbackFilter = useMemo(() => createFilter({ locale }), [locale]);

  /**
   * Three answers, and `undefined` is not one of them. Not giving `filter` asks
   * for the library's own locale-sensitive `contains`; giving `null` turns
   * filtering off, which is what a list a server has already filtered needs;
   * giving a function replaces the comparison. `combobox` draws the same three
   * lines, and reading an absent prop as "off" is the mistake that made its
   * first version show every option however much was typed.
   */
  const matches = useCallback(
    (label: string) => {
      if (currentQuery === '' || filter === null) return true;
      if (filter !== undefined) return filter(label, currentQuery);
      return fallbackFilter.contains(label, currentQuery);
    },
    [currentQuery, fallbackFilter, filter],
  );

  const optionId = useCallback(
    (optionValue: SelectOptionValue) => `${generated}option-${encodeURIComponent(optionValue)}`,
    [generated],
  );

  const state = {
    currentHighlighted,
    currentOpen,
    currentQuery,
    currentSelection,
    highlightedValue,
    onHighlightedValueChange,
    onOpenChange,
    onSearchValueChange,
    onValueChange,
    open,
    resolvedMultiple,
    resolvedSearch,
    searchNode,
    searchValue,
    triggerNode,
    value,
  };
  const latest = useRef(state);
  latest.current = state;

  /**
   * What the reader has typed into the search field.
   *
   * It is a value the consumer can own and it is **not** the selection: no
   * request ever carries both, and committing an option emits one of each. The
   * reset the popup performs as it opens and as it closes carries `clear`,
   * which is what happened to the field.
   */
  const setQuery = useCallback((next: string, reason: SelectSearchReason, source?: unknown) => {
    const current = latest.current;
    if (next === current.currentQuery) return;

    const controllable = createControllable<string>({
      controlled: current.searchValue,
      initial: current.currentQuery,
      onRequest: (request) => current.onSearchValueChange?.(request.value, request),
    });
    if (controllable.request(next, reason, source)) setOwnQuery(next);
  }, []);

  /**
   * `createControllable` returns `false` in controlled mode and after a
   * cancellation, so one call answers both questions: whether the component may
   * move its own copy, and whether anything moved at all.
   */
  const setOpen = useCallback(
    (next: boolean, reason: SelectOpenReason, source?: unknown) => {
      const state = latest.current;
      if (next === state.currentOpen) return;

      const controllable = createControllable<boolean>({
        controlled: state.open,
        initial: state.currentOpen,
        onRequest: (request) => state.onOpenChange?.(request.value, request),
      });
      if (!controllable.request(next, reason, source)) return;
      setOwnOpen(next);
      /* A popup that closes takes its highlight with it, and gives the next open
       back its default entry. Both are put back here rather than when the popup
       opens, because a layout effect runs twice per mount under StrictMode and
       anything consumed there is consumed once too often. */
      if (!next) {
        setOwnHighlighted(null);
        entry.current = 'selected';
        /* A popup that closes takes the query with it as well: the field is built
         with the popup, and a select that reopened onto four characters nobody
         had typed this time would filter a list the reader thought was whole. */
        setQuery('', 'clear', source);
      }
    },
    [setQuery],
  );

  const setHighlighted = useCallback(
    (next: SelectOptionValue | null, reason: SelectHighlightReason, source?: unknown) => {
      const state = latest.current;
      if (next === state.currentHighlighted) return;

      const controllable = createControllable<SelectOptionValue | null>({
        controlled: state.highlightedValue,
        initial: state.currentHighlighted,
        onRequest: (request) => state.onHighlightedValueChange?.(request.value, request),
      });
      if (controllable.request(next, reason, source)) setOwnHighlighted(next);
    },
    [],
  );

  /**
   * A request for a set rather than for a value, so single and multiple are one
   * transition with one reason. `docs/state-and-events.md` refuses a request
   * for a value equal to the current one, and the comparison here is by
   * membership rather than by identity: two arrays holding the same three
   * strings are the same selection.
   */
  const commit = useCallback(
    (next: readonly SelectOptionValue[], reason: SelectValueReason, source?: unknown) => {
      const state = latest.current;
      const same =
        next.length === state.currentSelection.length &&
        next.every((entryValue, index) => entryValue === state.currentSelection[index]);
      if (same) return;

      const controllable = createControllable<SelectSelection>({
        controlled: state.value,
        initial: denormalize(state.currentSelection, state.resolvedMultiple),
        /* Membership was compared above, on the two lists; comparing the
           denormalised shapes here would compare two fresh arrays by identity
           and call every request a change. */
        equals: () => false,
        onRequest: (request) => state.onValueChange?.(request.value, request),
      });
      if (controllable.request(denormalize(next, state.resolvedMultiple), reason, source)) {
        setOwnSelection(next);
      }
    },
    [],
  );

  const toggle = useCallback(
    (optionValue: SelectOptionValue, reason: SelectValueReason, source?: unknown) => {
      const state = latest.current;
      if (!state.resolvedMultiple) {
        commit([optionValue], reason, source);
        return;
      }
      const held = state.currentSelection.includes(optionValue);
      commit(
        held
          ? state.currentSelection.filter((candidate) => candidate !== optionValue)
          : [...state.currentSelection, optionValue],
        reason,
        source,
      );
    },
    [commit],
  );

  const clear = useCallback(
    (reason: SelectValueReason, source?: unknown) => commit([], reason, source),
    [commit],
  );

  const restore = useCallback(
    (source?: unknown) => commit(initialSelection, 'programmatic', source),
    [commit, initialSelection],
  );

  useImperativeHandle(
    ref,
    () => ({
      close: () => setOpen(false, 'programmatic'),
      focus: () => latest.current.triggerNode?.focus({ preventScroll: true }),
      /* The field when there is one and the popup is open, and the control
         otherwise: a handle that focused nothing would be a handle a consumer
         has to guard before calling. */
      focusSearch: () => {
        const current = latest.current;
        const target = current.searchNode ?? current.triggerNode;
        target?.focus({ preventScroll: true });
      },
      open: () => setOpen(true, 'programmatic'),
      scrollToKey: (optionValue) => {
        const option = contentNode?.querySelector<HTMLElement>(
          `[data-part='item'][data-value="${CSS.escape(optionValue)}"]`,
        );
        if (option !== null && option !== undefined && contentNode !== null) {
          revealWithin(option, contentNode);
        }
      },
    }),
    [contentNode, setOpen],
  );

  const context: SelectContextValue = {
    align: align ?? defaults.align,
    alignOffset: alignOffset ?? defaults.alignOffset,
    clear,
    clearable: clearable ?? defaults.clearable,
    closeOnEscape: closeOnEscape ?? defaults.closeOnEscape,
    closeOnOutsidePress: closeOnOutsidePress ?? defaults.closeOnOutsidePress,
    closeOnSelect: closeOnSelect ?? defaults.closeOnSelect,
    collisionPadding: collisionPadding ?? defaults.collisionPadding,
    contentId,
    contentNode,
    disabled: resolvedDisabled,
    entry,
    flip: flip ?? defaults.flip,
    form,
    fullWidth: fullWidth ?? defaults.fullWidth,
    hideWhenDetached: hideWhenDetached ?? defaults.hideWhenDetached,
    highlighted: currentHighlighted,
    highlightMatch: highlightMatch ?? defaults.highlightMatch,
    invalid: invalid ?? field?.invalid ?? defaults.invalid,
    labelFor,
    listId,
    loading: loading ?? defaults.loading,
    locale,
    loop: loop ?? defaults.loop,
    matches,
    mount: mount ?? defaults.mount,
    multiple: resolvedMultiple,
    name,
    open: currentOpen,
    optionId,
    portal: portal ?? defaults.portal,
    query: currentQuery,
    readOnly: resolvedReadOnly,
    registerLabel,
    required: required ?? field?.required ?? defaults.required,
    restore,
    search: resolvedSearch,
    searchId,
    searchNode,
    seen: seen.current,
    selection: currentSelection,
    setContentNode,
    setHighlighted,
    setOpen,
    setQuery,
    setSearchNode,
    setTriggerNode,
    shift: shift ?? defaults.shift,
    side: side ?? defaults.side,
    sideOffset: sideOffset ?? defaults.sideOffset,
    size: size ?? field?.size ?? defaults.size,
    strategy: strategy ?? defaults.strategy,
    t,
    toggle,
    total,
    triggerId,
    triggerNode,
    /* A reader typing into a field cannot also be driving a typeahead on the
       same keys: two searches on one keystroke move the highlight twice. */
    typeahead: resolvedSearch ? false : (typeahead ?? defaults.typeahead),
    typeaheadTimeout: typeaheadTimeout ?? defaults.typeaheadTimeout,
    variant: variant ?? defaults.variant,
    width: width ?? defaults.width,
  };

  return <SelectContext.Provider value={context}>{children}</SelectContext.Provider>;
}
