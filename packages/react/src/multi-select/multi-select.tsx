/*
 * The four sheets this family draws with. Three of them belong to other
 * families and are worn as `data-ui` beside this one's own parts: the chips are
 * `tag`s, the mark on a matched span is `highlight`'s, the ring while an answer
 * travels is `spinner`'s and the waiting rows are `skeleton`'s. A family that
 * renders another's identifier and does not import its sheet draws an element
 * with no rules at all — the ring measured 0 × 0 on the rendered page before
 * these two lines existed.
 */
import '@slotted/styles/multi-select/multi-select.css';
import '@slotted/styles/tag/tag.css';
import '@slotted/styles/spinner/spinner.css';
import '@slotted/styles/skeleton/skeleton.css';

import { createFilter, revealWithin } from '@slotted/core/collection';
import {
  multiSelectMessages,
  type FamilyTranslator,
  type MultiSelectMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
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
import { useMultiSelectDefaults } from './multi-select-defaults';
import type {
  MultiSelectAlign,
  MultiSelectChosenOptions,
  MultiSelectHighlightReason,
  MultiSelectInputReason,
  MultiSelectItems,
  MultiSelectMount,
  MultiSelectOpenOn,
  MultiSelectOpenReason,
  MultiSelectOption,
  MultiSelectOptionGroup,
  MultiSelectOptionValue,
  MultiSelectOverflow,
  MultiSelectProps,
  MultiSelectRefuseCause,
  MultiSelectSide,
  MultiSelectSize,
  MultiSelectStrategy,
  MultiSelectValueReason,
  MultiSelectVariant,
  MultiSelectWidth,
} from './multi-select.types';

/** Where the highlight goes when the popup opens. */
export type MultiSelectEntry = 'first' | 'last' | 'none';

export interface MultiSelectContextValue {
  /** Takes text or keys into the set, applying the limit, the duplicate rule and the predicate. */
  admit: (candidates: readonly string[], reason: MultiSelectValueReason, source?: unknown) => void;
  addOnPaste: boolean;
  align: MultiSelectAlign;
  alignOffset: number;
  announce: (message: string) => void;
  chosenOptions: MultiSelectChosenOptions;
  clear: (source?: unknown) => void;
  clearable: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePress: boolean;
  closeOnSelect: boolean;
  collisionPadding: number;
  commitOnBlur: boolean;
  contentId: string;
  contentNode: HTMLElement | null;
  creatable: boolean;
  delimiters: readonly string[];
  disabled: boolean;
  /** The value a refused duplicate is already held under, for the chip to take focus. */
  duplicate: MultiSelectOptionValue | null;
  editable: boolean;
  entry: MutableRefObject<MultiSelectEntry>;
  flip: boolean;
  form: string | undefined;
  /** The set has reached `max` and takes nothing more. */
  full: boolean;
  fullWidth: boolean;
  hideWhenDetached: boolean;
  highlighted: MultiSelectOptionValue | null;
  highlightMatch: boolean;
  inputId: string;
  inputNode: HTMLInputElement | null;
  inputValue: string;
  invalid: boolean;
  labelFor: (value: MultiSelectOptionValue) => string | undefined;
  loading: boolean;
  /** The locale the filter and the duplicate rule compare in: the `locale` prop, or the language in force. */
  locale: string;
  loop: boolean;
  matches: (label: string) => boolean;
  max: number | null;
  /** Moves the value at `from` to `to`, which is the only reorder there is. */
  move: (from: number, to: number, source?: unknown) => void;
  mount: MultiSelectMount;
  name: string | undefined;
  onLoadMore: (() => void) | undefined;
  open: boolean;
  openOn: MultiSelectOpenOn;
  optionId: (value: MultiSelectOptionValue) => string;
  overflow: MultiSelectOverflow;
  portal: boolean;
  query: string;
  readOnly: boolean;
  registerLabel: (value: MultiSelectOptionValue, label: string) => void;
  /** Takes one value out of the set. */
  remove: (value: MultiSelectOptionValue, source?: unknown) => void;
  /** Puts one value in another's place, as one transition. */
  replace: (value: MultiSelectOptionValue, text: string, source?: unknown) => void;
  /** Returns to the set the control started from, which is what a form reset asks. */
  restore: (source?: unknown) => void;
  reorderable: boolean;
  required: boolean;
  seen: boolean;
  setContentNode: (node: HTMLElement | null) => void;
  setDuplicate: (value: MultiSelectOptionValue | null) => void;
  setHighlighted: (
    value: MultiSelectOptionValue | null,
    reason: MultiSelectHighlightReason,
    source?: unknown,
  ) => void;
  setInputNode: (node: HTMLInputElement | null) => void;
  setInputValue: (value: string, reason: MultiSelectInputReason, source?: unknown) => void;
  setNarrow: (narrow: boolean) => void;
  setOpen: (next: boolean, reason: MultiSelectOpenReason, source?: unknown) => void;
  shift: boolean;
  side: MultiSelectSide;
  sideOffset: number;
  size: MultiSelectSize;
  strategy: MultiSelectStrategy;
  /** Whether the frame is too narrow for a chip at all. */
  narrow: boolean;
  /** Adds or removes one value, which is what pressing an option does. */
  toggle: (value: MultiSelectOptionValue, reason: MultiSelectValueReason, source?: unknown) => void;
  /** The family's words in the language in force, with this control's `messages` laid over them. */
  t: FamilyTranslator<MultiSelectMessages>;
  total: number | undefined;
  value: readonly MultiSelectOptionValue[];
  variant: MultiSelectVariant;
  width: MultiSelectWidth;
}

const MultiSelectContext = createContext<MultiSelectContextValue | undefined>(undefined);

export function useMultiSelect(): MultiSelectContextValue {
  const context = useContext(MultiSelectContext);
  if (context === undefined) {
    throw new Error(
      'MultiSelectControl, MultiSelectContent and every option have to be inside a MultiSelect.',
    );
  }
  return context;
}

const isGroup = (entry: MultiSelectItems[number]): entry is MultiSelectOptionGroup =>
  'options' in entry;

function flatten(items: MultiSelectItems | undefined): readonly MultiSelectOption[] {
  if (items === undefined) return [];
  return items.flatMap((entry) => (isGroup(entry) ? entry.options : [entry]));
}

const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * A frame of chosen values, with a field that adds more.
 *
 * This component owns the state and **renders nothing**. `MultiSelectControl`
 * renders the frame, the chips, the field and the two buttons;
 * `MultiSelectContent` renders the layer and the list.
 *
 * **The set is ordered, and the order is the reader's.** It is an array and not
 * a set, because reorder is meaningless against a value the family is free to
 * re-sort. A consumer who wants them alphabetical sorts what they are given.
 *
 * **What is refused is reported, not dropped.** A duplicate, a value past the
 * limit and a value the predicate turned down each leave through
 * `onValueRefuse` with the cause. The four silences the field leaves — Mantine
 * drops a duplicate, PrimeNG stops at the limit, Zag marks the control invalid
 * and says nothing, and none of the eight says what a long paste does — are one
 * event here.
 */
export function MultiSelect({
  children,
  defaultHighlightedValue = null,
  defaultInputValue = '',
  defaultOpen = false,
  defaultValue = [],
  filter,
  form,
  highlightedValue,
  inputValue,
  items,
  locale: localeProp,
  messages,
  name,
  onHighlightedValueChange,
  onInputValueChange,
  onLoadMore,
  onOpenChange,
  onValueChange,
  onValueRefuse,
  open,
  ref,
  total,
  validateValue,
  value,
  ...axes
}: MultiSelectProps) {
  const defaults = useMultiSelectDefaults();
  const field = useField();
  const t = useMessages(multiSelectMessages, messages);
  const inForce = useLocale();
  const locale = localeProp ?? inForce;

  const generated = useId();
  const contentId = `${generated}listbox`;
  const inputId = `${generated}input`;

  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [ownValue, setOwnValue] = useState<readonly MultiSelectOptionValue[]>(defaultValue);
  /* What a form reset returns to: the set the control started from, read once. */
  const [initialValue] = useState<readonly MultiSelectOptionValue[]>(defaultValue);
  const [ownInput, setOwnInput] = useState(defaultInputValue);
  const [ownHighlighted, setOwnHighlighted] = useState<MultiSelectOptionValue | null>(
    defaultHighlightedValue,
  );
  const [inputNode, setInputNode] = useState<HTMLInputElement | null>(null);
  const [contentNode, setContentNode] = useState<HTMLElement | null>(null);
  const [duplicate, setDuplicate] = useState<MultiSelectOptionValue | null>(null);
  const [narrow, setNarrow] = useState(false);

  const resolvedDisabled = axes.disabled ?? field?.disabled ?? defaults.disabled;
  const resolvedReadOnly = axes.readOnly ?? field?.readOnly ?? defaults.readOnly;
  const max = axes.max ?? defaults.max;
  const allowDuplicates = axes.allowDuplicates ?? defaults.allowDuplicates;

  const currentOpen = (open ?? ownOpen) && !resolvedDisabled;
  const currentValue = value ?? ownValue;
  const currentInput = inputValue ?? ownInput;
  const currentHighlighted = highlightedValue === undefined ? ownHighlighted : highlightedValue;

  const seen = useRef(currentOpen);
  if (currentOpen) seen.current = true;

  const entry = useRef<MultiSelectEntry>('none');

  const registry = useRef(new Map<MultiSelectOptionValue, string>());
  const [registered, setRegistered] = useState(0);

  const declared = useMemo(() => {
    const table = new Map<MultiSelectOptionValue, string>();
    for (const option of flatten(items)) table.set(option.value, option.label);
    return table;
  }, [items]);

  const registerLabel = useCallback((optionValue: MultiSelectOptionValue, label: string) => {
    if (registry.current.get(optionValue) === label) return;
    registry.current.set(optionValue, label);
    setRegistered((count) => count + 1);
  }, []);

  const labelFor = useCallback(
    (optionValue: MultiSelectOptionValue) =>
      declared.get(optionValue) ?? registry.current.get(optionValue),
    [declared, registered],
  );

  const optionId = useCallback(
    (optionValue: MultiSelectOptionValue) =>
      `${generated}option-${encodeURIComponent(optionValue)}`,
    [generated],
  );

  /* The query is the typed text. Unlike `combobox`'s it is never a committed
     label, because committing empties it. */
  const query = currentInput;

  const collator = useMemo(() => createFilter({ locale }), [locale]);

  const matches = useCallback(
    (label: string) => {
      if (query === '' || filter === null) return true;
      if (filter !== undefined) return filter(label, query);
      return collator.contains(label, query);
    },
    [collator, filter, query],
  );

  const announcer = useCallback(
    (message: string) => {
      if (message === '') return;
      getLiveAnnouncer(inputNode?.ownerDocument).announce(message, { repeat: true });
    },
    [inputNode],
  );

  const latest = useRef({
    allowDuplicates,
    announcer,
    collator,
    currentHighlighted,
    currentInput,
    currentOpen,
    currentValue,
    highlightedValue,
    inputNode,
    inputValue,
    labelFor,
    max,
    onHighlightedValueChange,
    onInputValueChange,
    onOpenChange,
    onValueChange,
    onValueRefuse,
    open,
    t,
    validateValue,
    value,
  });
  latest.current = {
    allowDuplicates,
    announcer,
    collator,
    currentHighlighted,
    currentInput,
    currentOpen,
    currentValue,
    highlightedValue,
    inputNode,
    inputValue,
    labelFor,
    max,
    onHighlightedValueChange,
    onInputValueChange,
    onOpenChange,
    onValueChange,
    onValueRefuse,
    open,
    t,
    validateValue,
    value,
  };

  const setOpen = useCallback((next: boolean, reason: MultiSelectOpenReason, source?: unknown) => {
    const state = latest.current;
    if (next === state.currentOpen) return;

    const controllable = createControllable<boolean>({
      controlled: state.open,
      initial: state.currentOpen,
      onRequest: (request) => state.onOpenChange?.(request.value, request),
    });
    if (!controllable.request(next, reason, source)) return;
    setOwnOpen(next);
    if (!next) {
      setOwnHighlighted(null);
      entry.current = 'none';
    }
  }, []);

  const setHighlighted = useCallback(
    (next: MultiSelectOptionValue | null, reason: MultiSelectHighlightReason, source?: unknown) => {
      const state = latest.current;
      if (next === state.currentHighlighted) return;

      const controllable = createControllable<MultiSelectOptionValue | null>({
        controlled: state.highlightedValue,
        initial: state.currentHighlighted,
        onRequest: (request) => state.onHighlightedValueChange?.(request.value, request),
      });
      if (controllable.request(next, reason, source)) setOwnHighlighted(next);
    },
    [],
  );

  const setInputValue = useCallback(
    (next: string, reason: MultiSelectInputReason, source?: unknown) => {
      const state = latest.current;
      if (next === state.currentInput) return;

      const controllable = createControllable<string>({
        controlled: state.inputValue,
        initial: state.currentInput,
        onRequest: (request) => state.onInputValueChange?.(request.value, request),
      });
      if (controllable.request(next, reason, source)) setOwnInput(next);
    },
    [],
  );

  /** One request for one transition, whatever moved the set. */
  const commit = useCallback(
    (next: readonly string[], reason: MultiSelectValueReason, source?: unknown) => {
      const state = latest.current;
      if (same(next, state.currentValue)) return false;

      const controllable = createControllable<readonly MultiSelectOptionValue[]>({
        controlled: state.value,
        initial: state.currentValue,
        onRequest: (request) => state.onValueChange?.(request.value, request),
      });
      if (!controllable.request(next, reason, source)) return false;
      setOwnValue(next);
      return true;
    },
    [],
  );

  /**
   * The one door into the set. Every candidate is judged in order against the
   * predicate, the duplicate rule and the limit, and each refusal is collected
   * under its cause rather than thrown away — which is what makes a paste of
   * two hundred values against a limit of five a described outcome instead of
   * an undefined one.
   */
  /**
   * Every candidate judged against the set it would join, in order. It returns
   * the set that survived rather than committing one, so the two doors into it
   * — a value arriving and a value being edited in place — apply one rule and
   * cannot drift apart.
   */
  const judge = useCallback((candidates: readonly string[], held: readonly string[]) => {
    const state = latest.current;
    const next = [...held];
    const refused: Record<MultiSelectRefuseCause, string[]> = {
      duplicate: [],
      limit: [],
      invalid: [],
    };
    let existing: MultiSelectOptionValue | null = null;

    for (const candidate of candidates) {
      const text = candidate.trim();
      if (text === '') continue;

      if (state.validateValue !== undefined && !state.validateValue(text, next)) {
        refused.invalid.push(text);
        continue;
      }

      if (!state.allowDuplicates) {
        const twin = next.find(
          (value) =>
            value === text ||
            state.collator.equals(value, text) ||
            state.collator.equals(state.labelFor(value) ?? value, text),
        );
        if (twin !== undefined) {
          refused.duplicate.push(text);
          existing ??= twin;
          continue;
        }
      }

      if (state.max !== null && next.length >= state.max) {
        refused.limit.push(text);
        continue;
      }

      next.push(text);
    }

    return { existing, next, refused };
  }, []);

  /** Says what happened to what did not get in, once per cause. */
  const report = useCallback(
    (
      refused: Record<MultiSelectRefuseCause, string[]>,
      existing: MultiSelectOptionValue | null,
      source?: unknown,
    ) => {
      const state = latest.current;
      for (const cause of ['duplicate', 'limit', 'invalid'] as const) {
        if (refused[cause].length === 0) continue;
        state.onValueRefuse?.(refused[cause], { cause, source });
      }

      /* Where the reader is shown what happened. A duplicate is answered by the
         chip that already holds it taking focus; the other two have nothing to
         point at, so they are said. */
      if (existing !== null) setDuplicate(existing);
      if (refused.limit.length > 0 && state.max !== null) {
        state.announcer(state.t('counter', { count: state.max, max: state.max }));
      }
    },
    [],
  );

  /**
   * The one door into the set. Every candidate is judged against the predicate,
   * the duplicate rule and the limit, and each refusal is collected under its
   * cause rather than thrown away — which is what makes a paste of two hundred
   * values against a limit of five a described outcome instead of an undefined
   * one.
   */
  const admit = useCallback(
    (candidates: readonly string[], reason: MultiSelectValueReason, source?: unknown) => {
      const state = latest.current;
      const { existing, next, refused } = judge(candidates, state.currentValue);
      if (next.length > state.currentValue.length) commit(next, reason, source);
      report(refused, existing, source);
    },
    [commit, judge, report],
  );

  /**
   * One value edited in place, which is one transition and not a removal
   * followed by an addition. Two calls read the same state and the second one
   * saw the first had not landed yet, so the set held the old value and the new
   * one at once; the edited value also has to be judged against the set
   * *without* it, or every edit is a duplicate of itself.
   */
  const replace = useCallback(
    (target: MultiSelectOptionValue, text: string, source?: unknown) => {
      const state = latest.current;
      const index = state.currentValue.indexOf(target);
      if (index === -1) return;
      if (text.trim() === '' || text === target) return;

      const without = state.currentValue.filter((value) => value !== target);
      const { existing, next, refused } = judge([text], without);
      if (next.length > without.length) {
        const taken = next[next.length - 1] as string;
        const ordered = [...without];
        ordered.splice(index, 0, taken);
        commit(ordered, 'submit', source);
      }
      report(refused, existing, source);
    },
    [commit, judge, report],
  );

  const remove = useCallback(
    (target: MultiSelectOptionValue, source?: unknown) => {
      const state = latest.current;
      const next = state.currentValue.filter((value) => value !== target);
      if (next.length === state.currentValue.length) return;
      if (commit(next, 'remove', source)) {
        state.announcer(`${state.labelFor(target) ?? target}, ${next.length}`);
      }
    },
    [commit],
  );

  const toggle = useCallback(
    (target: MultiSelectOptionValue, reason: MultiSelectValueReason, source?: unknown) => {
      const state = latest.current;
      if (state.currentValue.includes(target)) {
        remove(target, source);
        return;
      }
      admit([target], reason, source);
    },
    [admit, remove],
  );

  const clear = useCallback(
    (source?: unknown) => {
      commit([], 'clear', source);
      setInputValue('', 'clear', source);
    },
    [commit, setInputValue],
  );

  const restore = useCallback(
    (source?: unknown) => {
      commit(initialValue, 'programmatic', source);
      setInputValue('', 'programmatic', source);
    },
    [commit, initialValue, setInputValue],
  );

  /**
   * Reorder, and the only shape it has: one value moving to one index. The set
   * is the same and the request carries `keyboard`, which is what lets a
   * consumer persisting an order listen for exactly that and nothing else.
   */
  const move = useCallback(
    (from: number, to: number, source?: unknown) => {
      const state = latest.current;
      const held = state.currentValue;
      if (from < 0 || from >= held.length) return;
      const target = Math.min(Math.max(to, 0), held.length - 1);
      if (target === from) return;

      const next = [...held];
      const [moved] = next.splice(from, 1);
      next.splice(target, 0, moved as string);
      if (!commit(next, 'keyboard', source)) return;
      state.announcer(`${state.labelFor(moved as string) ?? moved}, ${target + 1}, ${next.length}`);
    },
    [commit],
  );

  useImperativeHandle(
    ref,
    () => ({
      close: () => setOpen(false, 'programmatic'),
      focus: () => latest.current.inputNode?.focus({ preventScroll: true }),
      open: () => setOpen(true, 'programmatic'),
      scrollToKey: (optionValue) => {
        const option = contentNode?.querySelector<HTMLElement>(
          `[data-part='item'][data-value="${CSS.escape(optionValue)}"]`,
        );
        if (option !== null && option !== undefined && contentNode !== null) {
          revealWithin(option, contentNode);
        }
      },
      setValue: (values, reason = 'programmatic') => commit([...values], reason),
    }),
    [commit, contentNode, setOpen],
  );

  const context: MultiSelectContextValue = {
    addOnPaste: axes.addOnPaste ?? defaults.addOnPaste,
    admit,
    align: axes.align ?? defaults.align,
    alignOffset: axes.alignOffset ?? defaults.alignOffset,
    announce: announcer,
    chosenOptions: axes.chosenOptions ?? defaults.chosenOptions,
    clear,
    clearable: axes.clearable ?? defaults.clearable,
    closeOnEscape: axes.closeOnEscape ?? defaults.closeOnEscape,
    closeOnOutsidePress: axes.closeOnOutsidePress ?? defaults.closeOnOutsidePress,
    closeOnSelect: axes.closeOnSelect ?? defaults.closeOnSelect,
    collisionPadding: axes.collisionPadding ?? defaults.collisionPadding,
    commitOnBlur: axes.commitOnBlur ?? defaults.commitOnBlur,
    contentId,
    contentNode,
    creatable: axes.creatable ?? defaults.creatable,
    delimiters: axes.delimiters ?? defaults.delimiters,
    disabled: resolvedDisabled,
    duplicate,
    editable: axes.editable ?? defaults.editable,
    entry,
    flip: axes.flip ?? defaults.flip,
    form,
    full: max !== null && currentValue.length >= max,
    fullWidth: axes.fullWidth ?? defaults.fullWidth,
    hideWhenDetached: axes.hideWhenDetached ?? defaults.hideWhenDetached,
    highlighted: currentHighlighted,
    highlightMatch: axes.highlightMatch ?? defaults.highlightMatch,
    inputId,
    inputNode,
    inputValue: currentInput,
    invalid: axes.invalid ?? field?.invalid ?? defaults.invalid,
    labelFor,
    loading: axes.loading ?? defaults.loading,
    locale,
    loop: axes.loop ?? defaults.loop,
    matches,
    max,
    mount: axes.mount ?? defaults.mount,
    move,
    name,
    narrow,
    onLoadMore,
    open: currentOpen,
    openOn: axes.openOn ?? defaults.openOn,
    optionId,
    overflow: axes.overflow ?? defaults.overflow,
    portal: axes.portal ?? defaults.portal,
    query,
    readOnly: resolvedReadOnly,
    registerLabel,
    remove,
    replace,
    restore,
    reorderable: axes.reorderable ?? defaults.reorderable,
    required: axes.required ?? field?.required ?? defaults.required,
    seen: seen.current,
    setContentNode,
    setDuplicate,
    setHighlighted,
    setInputNode,
    setInputValue,
    setNarrow,
    setOpen,
    shift: axes.shift ?? defaults.shift,
    side: axes.side ?? defaults.side,
    sideOffset: axes.sideOffset ?? defaults.sideOffset,
    size: axes.size ?? field?.size ?? defaults.size,
    strategy: axes.strategy ?? defaults.strategy,
    toggle,
    t,
    total,
    value: currentValue,
    variant: axes.variant ?? defaults.variant,
    width: axes.width ?? defaults.width,
  };

  return <MultiSelectContext.Provider value={context}>{children}</MultiSelectContext.Provider>;
}
