import '@slotted/styles/combobox/combobox.css';

import { createFilter, revealWithin } from '@slotted/core/collection';
import { comboboxMessages, type ComboboxMessages, type FamilyTranslator } from '@slotted/core/i18n';
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
import { useComboboxDefaults } from './combobox-defaults';
import type {
  ComboboxAlign,
  ComboboxAutocomplete,
  ComboboxHighlightReason,
  ComboboxInputReason,
  ComboboxItems,
  ComboboxMount,
  ComboboxOpenOn,
  ComboboxOpenReason,
  ComboboxOption,
  ComboboxOptionGroup,
  ComboboxOptionValue,
  ComboboxProps,
  ComboboxSide,
  ComboboxSize,
  ComboboxStrategy,
  ComboboxValueReason,
  ComboboxVariant,
  ComboboxWidth,
} from './combobox.types';

/** Where the highlight goes when the popup opens. */
export type ComboboxEntry = 'selected' | 'first' | 'last' | 'none';

export interface ComboboxContextValue {
  align: ComboboxAlign;
  alignOffset: number;
  allowsCustomValue: boolean;
  autocomplete: ComboboxAutocomplete;
  autoHighlight: boolean;
  clear: (reason: ComboboxValueReason, source?: unknown) => void;
  clearable: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePress: boolean;
  closeOnSelect: boolean;
  collisionPadding: number;
  /**
   * The completion string `autocomplete="both"` shows: the rest of the first
   * match, or `null`. It is **state and not a DOM write**, because the input is
   * controlled — the first version of this wrote the value straight onto the
   * element in a layout effect, and React put it back on the very next render.
   * It is part of what the input renders; `inputValue` stays what was typed.
   */
  completion: string | null;
  contentId: string;
  contentNode: HTMLElement | null;
  disabled: boolean;
  entry: MutableRefObject<ComboboxEntry>;
  flip: boolean;
  form: string | undefined;
  fullWidth: boolean;
  hideWhenDetached: boolean;
  highlighted: ComboboxOptionValue | null;
  highlightMatch: boolean;
  inputId: string;
  inputValue: string;
  invalid: boolean;
  labelFor: (value: ComboboxOptionValue) => string | undefined;
  /** Whether the consumer will take a value the collection does not hold (CB8). */
  canCreate: boolean;
  /** Reports the query the reader asked to add. The collection is the consumer's. */
  create: (query: string, reason: ComboboxValueReason, source?: unknown) => void;
  /** Settles the typed text against the collection, which `blur` is the moment for. */
  settleInput: (source?: unknown) => void;
  loading: boolean;
  /** The locale the default filter compares in: the `locale` prop, or the language in force. */
  locale: string;
  loop: boolean;
  matches: (label: string) => boolean;
  mount: ComboboxMount;
  name: string | undefined;
  onLoadMore: (() => void) | undefined;
  open: boolean;
  openOn: ComboboxOpenOn;
  optionId: (value: ComboboxOptionValue) => string;
  portal: boolean;
  query: string;
  readOnly: boolean;
  registerLabel: (value: ComboboxOptionValue, label: string) => void;
  required: boolean;
  seen: boolean;
  select: (
    value: ComboboxOptionValue | null,
    reason: ComboboxValueReason,
    source?: unknown,
  ) => void;
  setContentNode: (node: HTMLElement | null) => void;
  setHighlighted: (
    value: ComboboxOptionValue | null,
    reason: ComboboxHighlightReason,
    source?: unknown,
  ) => void;
  setCompletion: (completion: string | null) => void;
  setInputNode: (node: HTMLInputElement | null) => void;
  wantsCompletion: MutableRefObject<boolean>;
  setInputValue: (value: string, reason: ComboboxInputReason, source?: unknown) => void;
  setOpen: (next: boolean, reason: ComboboxOpenReason, source?: unknown) => void;
  shift: boolean;
  side: ComboboxSide;
  sideOffset: number;
  size: ComboboxSize;
  strategy: ComboboxStrategy;
  /** The family's words in the language in force, with this combobox's `messages` laid over them. */
  t: FamilyTranslator<ComboboxMessages>;
  total: number | undefined;
  inputNode: HTMLInputElement | null;
  value: ComboboxOptionValue | null;
  variant: ComboboxVariant;
  width: ComboboxWidth;
}

const ComboboxContext = createContext<ComboboxContextValue | undefined>(undefined);

export function useCombobox(): ComboboxContextValue {
  const context = useContext(ComboboxContext);
  if (context === undefined) {
    throw new Error(
      'ComboboxInput, ComboboxContent and every option have to be inside a Combobox.',
    );
  }
  return context;
}

const isGroup = (entry: ComboboxItems[number]): entry is ComboboxOptionGroup => 'options' in entry;

function flatten(items: ComboboxItems | undefined): readonly ComboboxOption[] {
  if (items === undefined) return [];
  return items.flatMap((entry) => (isGroup(entry) ? entry.options : [entry]));
}

/**
 * A text input with a listbox of options filtered by what was typed.
 *
 * This component owns the state and **renders nothing**. `ComboboxInput`
 * renders the frame, the input and the two buttons; `ComboboxContent` renders
 * the layer and the list.
 *
 * **The typed text and the chosen key are two contracts, not one.**
 * `docs/component-features.md` §6 asks for it in those words, and the reason is
 * a list whose labels are not unique: a family that held one value and derived
 * the other would resolve `Paris` to whichever Paris came first. Each transition
 * emits exactly one request — typing emits `onInputValueChange` with reason
 * `keyboard`; committing an option emits both, each with reason `select`.
 *
 * **Filtering is an adapter.** The default is a locale-sensitive `contains`
 * from `packages/core/src/collection`, `filter` replaces it, and `filter={null}`
 * turns it off for a list a server has already filtered.
 */
export function Combobox({
  align,
  alignOffset,
  allowsCustomValue,
  autocomplete,
  autoHighlight,
  children,
  clearable,
  closeOnEscape,
  closeOnOutsidePress,
  closeOnSelect,
  collisionPadding,
  onCreate,
  defaultHighlightedValue = null,
  defaultInputValue = '',
  defaultOpen = false,
  defaultValue = null,
  disabled,
  filter,
  flip,
  form,
  fullWidth,
  hideWhenDetached,
  highlightedValue,
  highlightMatch,
  inputValue,
  invalid,
  items,
  loading,
  locale: localeProp,
  loop,
  messages,
  mount,
  name,
  onHighlightedValueChange,
  onInputValueChange,
  onInputReset,
  onLoadMore,
  onOpenChange,
  onValueChange,
  open,
  openOn,
  portal,
  readOnly,
  ref,
  required,
  shift,
  side,
  sideOffset,
  size,
  strategy,
  total,
  value,
  variant,
  width,
}: ComboboxProps) {
  const defaults = useComboboxDefaults();
  const field = useField();
  const t = useMessages(comboboxMessages, messages);
  const inForce = useLocale();
  const locale = localeProp ?? inForce;

  const generated = useId();
  const contentId = `${generated}listbox`;
  const inputId = `${generated}input`;

  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [ownValue, setOwnValue] = useState<ComboboxOptionValue | null>(defaultValue);
  const [ownInput, setOwnInput] = useState(defaultInputValue);
  const [ownHighlighted, setOwnHighlighted] = useState<ComboboxOptionValue | null>(
    defaultHighlightedValue,
  );
  const [inputNode, setInputNode] = useState<HTMLInputElement | null>(null);
  const [contentNode, setContentNode] = useState<HTMLElement | null>(null);

  const resolvedDisabled = disabled ?? field?.disabled ?? defaults.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly ?? defaults.readOnly;

  const currentOpen = (open ?? ownOpen) && !resolvedDisabled;
  const currentValue = value === undefined ? ownValue : value;
  const currentInput = inputValue ?? ownInput;
  const currentHighlighted = highlightedValue === undefined ? ownHighlighted : highlightedValue;

  const seen = useRef(currentOpen);
  if (currentOpen) seen.current = true;

  const entry = useRef<ComboboxEntry>('none');
  const [completion, setCompletion] = useState<string | null>(null);
  /** The reader grew the text; the popup decides whether there is anything to add. */
  const wantsCompletion = useRef(false);

  const registry = useRef(new Map<ComboboxOptionValue, string>());
  const [registered, setRegistered] = useState(0);

  const declared = useMemo(() => {
    const table = new Map<ComboboxOptionValue, string>();
    for (const option of flatten(items)) table.set(option.value, option.label);
    return table;
  }, [items]);

  const registerLabel = useCallback((optionValue: ComboboxOptionValue, label: string) => {
    if (registry.current.get(optionValue) === label) return;
    registry.current.set(optionValue, label);
    setRegistered((count) => count + 1);
  }, []);

  const labelFor = useCallback(
    (optionValue: ComboboxOptionValue) =>
      declared.get(optionValue) ?? registry.current.get(optionValue),
    [declared, registered],
  );

  const optionId = useCallback(
    (optionValue: ComboboxOptionValue) => `${generated}option-${encodeURIComponent(optionValue)}`,
    [generated],
  );

  /**
   * The query the options filter against, and it is not always the typed text.
   *
   * Once an option has been committed, the input holds that option's label —
   * so filtering on it would leave the popup showing one option, the one
   * already chosen, the next time the reader opens it. The query is the text
   * only while it differs from what was committed.
   */
  const committedLabel = currentValue === null ? undefined : labelFor(currentValue);
  const query = currentInput === committedLabel ? '' : currentInput;

  const fallbackFilter = useMemo(() => createFilter({ locale }), [locale]);

  /**
   * Three answers, and `undefined` is not one of them. Not giving `filter` asks
   * for the library's own locale-sensitive `contains`; giving `null` turns
   * filtering off, which is what a server-filtered list needs; giving a
   * function replaces the comparison. Collapsing the first two — reading an
   * absent prop as "off" — was the first version of this line, and it made a
   * combobox with no `filter` show every option however much was typed.
   */
  const matches = useCallback(
    (label: string) => {
      if (query === '' || filter === null) return true;
      if (filter !== undefined) return filter(label, query);
      return fallbackFilter.contains(label, query);
    },
    [fallbackFilter, filter, query],
  );

  const latest = useRef({
    currentHighlighted,
    currentInput,
    currentOpen,
    currentValue,
    highlightedValue,
    inputNode,
    inputValue,
    onHighlightedValueChange,
    onInputValueChange,
    onCreate,
    onOpenChange,
    onValueChange,
    open,
    value,
  });
  latest.current = {
    currentHighlighted,
    currentInput,
    currentOpen,
    currentValue,
    highlightedValue,
    inputNode,
    inputValue,
    onHighlightedValueChange,
    onInputValueChange,
    onCreate,
    onOpenChange,
    onValueChange,
    open,
    value,
  };

  const setOpen = useCallback((next: boolean, reason: ComboboxOpenReason, source?: unknown) => {
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
    (next: ComboboxOptionValue | null, reason: ComboboxHighlightReason, source?: unknown) => {
      const state = latest.current;
      if (next === state.currentHighlighted) return;

      const controllable = createControllable<ComboboxOptionValue | null>({
        controlled: state.highlightedValue,
        initial: state.currentHighlighted,
        onRequest: (request) => state.onHighlightedValueChange?.(request.value, request),
      });
      if (controllable.request(next, reason, source)) setOwnHighlighted(next);
    },
    [],
  );

  /**
   * The option whose label *is* the text, by the same collator the filter used:
   * a reader who typed an option in full has chosen it, and comparing with
   * `===` would refuse `resume` for `Resumé` on a page the filter had just
   * matched.
   */
  const valueForLabel = useCallback(
    (text: string) => {
      if (text === '') return undefined;
      for (const [candidate, label] of declared) {
        if (fallbackFilter.equals(label, text)) return candidate;
      }
      for (const [candidate, label] of registry.current) {
        if (fallbackFilter.equals(label, text)) return candidate;
      }
      return undefined;
    },
    [declared, fallbackFilter, registered],
  );

  const setInputValue = useCallback(
    (next: string, reason: ComboboxInputReason, source?: unknown) => {
      const state = latest.current;
      /* Whatever moves the text withdraws the completion: it is an offer about
         text that no longer exists. */
      setCompletion(null);
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

  const select = useCallback(
    (next: ComboboxOptionValue | null, reason: ComboboxValueReason, source?: unknown) => {
      const state = latest.current;
      if (next === state.currentValue) return;

      const controllable = createControllable<ComboboxOptionValue | null>({
        controlled: state.value,
        initial: state.currentValue,
        onRequest: (request) => state.onValueChange?.(request.value, request),
      });
      if (controllable.request(next, reason, source)) setOwnValue(next);
    },
    [],
  );

  /**
   * What becomes of text that matched no option, at the moment the reader
   * leaves the field (CB7).
   *
   * Blur is the moment because it is the last one at which the reader is still
   * choosing: settling on every keystroke would fight the typing, and settling
   * never leaves a control whose value is `apple` sitting there reading `appl`.
   *
   * Three answers, in order. Text that *is* an option is that option, however
   * it was arrived at. Text that is not, in a field that allows one of its own,
   * is the value. Text that is not, in a field that does not, is undone: the
   * field goes back to the committed label — or to nothing — and the caller is
   * told what was refused, so it can say so.
   */
  const settling = useRef({
    allowsCustomValue: false,
    currentInput,
    currentValue,
    labelFor,
    onInputReset,
    select,
    setInputValue,
    valueForLabel,
  });
  settling.current = {
    allowsCustomValue: allowsCustomValue ?? defaults.allowsCustomValue,
    currentInput,
    currentValue,
    labelFor,
    onInputReset,
    select,
    setInputValue,
    valueForLabel,
  };

  const settleInput = useCallback((source?: unknown) => {
    const state = settling.current;
    const text = state.currentInput;
    const matched = state.valueForLabel(text);

    if (matched !== undefined) {
      if (matched !== state.currentValue) state.select(matched, 'blur', source);
      state.setInputValue(state.labelFor(matched) ?? text, 'blur', source);
      return;
    }

    if (text === '') {
      if (state.currentValue !== null) state.select(null, 'blur', source);
      return;
    }

    if (state.allowsCustomValue) {
      if (text !== state.currentValue) state.select(text, 'blur', source);
      return;
    }

    const committed = state.currentValue === null ? '' : (state.labelFor(state.currentValue) ?? '');
    state.setInputValue(committed, 'blur', source);
    state.onInputReset?.(text, { reason: 'blur', source });
  }, []);

  /**
   * Taking the offer reports the query and selects nothing. The collection does
   * not hold the value yet, and a control naming an option that does not exist
   * is a control whose value and picture disagree — the same fault CB7 fixed at
   * the other end. What the consumer does with it, including whether the value
   * is then chosen, is the consumer's.
   */
  const create = useCallback((text: string, reason: ComboboxValueReason, source?: unknown) => {
    latest.current.onCreate?.(text, { reason, source });
  }, []);

  const clear = useCallback(
    (reason: ComboboxValueReason, source?: unknown) => {
      select(null, reason, source);
      setInputValue('', reason === 'clear' ? 'clear' : 'programmatic', source);
    },
    [select, setInputValue],
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
    }),
    [contentNode, setOpen],
  );

  const context: ComboboxContextValue = {
    align: align ?? defaults.align,
    alignOffset: alignOffset ?? defaults.alignOffset,
    allowsCustomValue: allowsCustomValue ?? defaults.allowsCustomValue,
    autocomplete: autocomplete ?? defaults.autocomplete,
    autoHighlight: autoHighlight ?? defaults.autoHighlight,
    clear,
    clearable: clearable ?? defaults.clearable,
    closeOnEscape: closeOnEscape ?? defaults.closeOnEscape,
    closeOnOutsidePress: closeOnOutsidePress ?? defaults.closeOnOutsidePress,
    closeOnSelect: closeOnSelect ?? defaults.closeOnSelect,
    collisionPadding: collisionPadding ?? defaults.collisionPadding,
    completion,
    contentId,
    contentNode,
    canCreate: onCreate !== undefined,
    create,
    disabled: resolvedDisabled,
    entry,
    flip: flip ?? defaults.flip,
    form,
    fullWidth: fullWidth ?? defaults.fullWidth,
    hideWhenDetached: hideWhenDetached ?? defaults.hideWhenDetached,
    highlighted: currentHighlighted,
    highlightMatch: highlightMatch ?? defaults.highlightMatch,
    inputId,
    inputNode,
    inputValue: currentInput,
    invalid: invalid ?? field?.invalid ?? defaults.invalid,
    labelFor,
    loading: loading ?? defaults.loading,
    locale,
    loop: loop ?? defaults.loop,
    matches,
    mount: mount ?? defaults.mount,
    name,
    onLoadMore,
    open: currentOpen,
    openOn: openOn ?? defaults.openOn,
    optionId,
    portal: portal ?? defaults.portal,
    query,
    readOnly: resolvedReadOnly,
    registerLabel,
    required: required ?? field?.required ?? defaults.required,
    seen: seen.current,
    select,
    setCompletion,
    setContentNode,
    setHighlighted,
    setInputNode,
    setInputValue,
    setOpen,
    settleInput,
    shift: shift ?? defaults.shift,
    side: side ?? defaults.side,
    sideOffset: sideOffset ?? defaults.sideOffset,
    size: size ?? field?.size ?? defaults.size,
    strategy: strategy ?? defaults.strategy,
    t,
    total,
    value: currentValue,
    variant: variant ?? defaults.variant,
    wantsCompletion,
    width: width ?? defaults.width,
  };

  return <ComboboxContext.Provider value={context}>{children}</ComboboxContext.Provider>;
}
