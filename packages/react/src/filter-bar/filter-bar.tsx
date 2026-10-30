import { withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/filter-bar/filter-bar.css';

import {
  describeFilter,
  describeFilterGroup,
  emptyFilterGroup,
  firstLevelRules,
  isFilterActive,
  isFilterGroup,
  normalizeFilterGroup,
  operandCount,
  operatorsFor,
  removeNodeAt,
  ruleFor,
  serializeFilterGroup,
  withCondition,
  withoutRuleFor,
  withRuleFor,
} from '@slotted/core/filter';
import type {
  FilterDescriptor,
  FilterGroup,
  FilterNode,
  FilterOperator,
  FilterPath,
} from '@slotted/core/filter';
import { createRemovalFocus, createRovingTabindex } from '@slotted/core/focus';
import { filterBarMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { Button, IconButton } from '../button';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerTitle,
} from '../drawer';
import { Glyph, Icon } from '../icon';
import { Kbd } from '../kbd';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuItemIcon,
  MenuItemLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '../menu';
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverLayer,
  PopoverTrigger,
  usePopover,
} from '../popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { useMessages } from '../i18n';
import { TextField } from '../text-field';
import { useFilterBarDefaults } from './filter-bar-defaults';
import {
  blankRule,
  ConditionEditor,
  FieldIcon,
  fieldByKey,
  GroupEditor,
  operatorName,
  ruleWords,
} from './filter-bar-rules';
import type { RuleEnvironment } from './filter-bar-rules';
import type {
  FilterBarField,
  FilterBarOpenReason,
  FilterBarPresetReason,
  FilterBarProps,
  FilterBarQueryReason,
  FilterBarRevealedReason,
  FilterBarValueReason,
} from './filter-bar.types';
import { SPINNER_RING } from '../button/spinner-ring';

export const FILTER_BAR_FALLBACK = {
  apply: 'live',
  chipLimit: 6,
  queryDelay: 320,
  shortcut: null,
  size: 'md',
} as const;

/**
 * Every stop of the one toolbar, in DOM order: the arrows walk the pills, each
 * segment of each chip, more, add, clear and the actions, line after line. A
 * stop the stylesheet hides at this width is skipped by its visibility.
 */
const BAR_ITEMS = [
  'summary',
  'pill',
  'chip-operator',
  'chip-value',
  'chip-remove',
  'more',
  'add',
  'clear',
  'reset',
  'apply',
]
  .map((part) => `[data-part='${part}']`)
  .join(', ');

/** The bar's narrow breakpoint and the builder's sheet breakpoint, in rems — the stylesheet's. */
const NARROW_REM = 36;

function remToPx(element: Element, rem: number) {
  const size = parseFloat(
    element.ownerDocument.defaultView?.getComputedStyle(element.ownerDocument.documentElement)
      .fontSize ?? '16',
  );
  return rem * (Number.isFinite(size) ? size : 16);
}

function sameGroup(a: FilterGroup | null, b: FilterGroup | null) {
  return serializeFilterGroup(a) === serializeFilterGroup(b);
}

function isEditable(element: Element | null) {
  if (!element) return false;
  const tag = element.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    (element as HTMLElement).isContentEditable
  );
}

/**
 * A bar above a listing that edits one value: a tree of conditions over the
 * listing's fields, whose leaves are the descriptor `table` edits in a column
 * header. The bar draws the first level — a search field, a pill per pinned
 * field, a chip per applied rule — and opens a drawer on the whole tree.
 *
 * The family applies nothing. It reports the tree and the query, and
 * `createFilterGroupPredicate` and `createSearchPredicate` in
 * `@slotted/core/filter` are what a consumer applies to its own rows.
 */
const STICKY_TOP = '--slotted-page-sticky-top';

const useIsomorphicLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Whether the bar is under its narrow breakpoint. The stylesheet draws the
 * phone's row from the same width with a container query; the binding reads it
 * to send an edit to the builder instead of a popover.
 *
 * Read only in the observer's reports, the first of which arrives after
 * layout: a read in the mount forced a layout of the page just committed and
 * a second render before the first paint.
 */
function useNarrow(root: { current: HTMLElement | null }) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const element = root.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    /* A bar with no width has not been laid out, and is not narrow. */
    const observer = new ResizeObserver(() => {
      const width = element.getBoundingClientRect().width;
      setNarrow(width > 0 && width < remToPx(element, NARROW_REM));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return narrow;
}

/**
 * Whether the viewport is under the sheet breakpoint. The side a drawer opens
 * from is the viewport's question: the builder comes up from the bottom as a
 * sheet on a phone and from the inline end everywhere else.
 */
function useSheet() {
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    const view = typeof window === 'undefined' ? undefined : window;
    if (!view?.matchMedia) return;
    const query = view.matchMedia(`(max-width: ${NARROW_REM}rem)`);
    const read = () => setSheet(query.matches);
    read();
    query.addEventListener?.('change', read);
    return () => query.removeEventListener?.('change', read);
  }, []);
  return sheet;
}

export function FilterBar({
  apply: applyProp,
  children,
  chipLimit: chipLimitProp,
  count,
  defaultOpen,
  defaultPreset,
  defaultQuery,
  defaultRevealed,
  defaultValue,
  disabled = false,
  fields,
  loading = false,
  messages,
  onOpenChange,
  onPresetChange,
  onPresetSave,
  onQueryChange,
  onRevealedChange,
  onValueChange,
  open: openProp,
  preset: presetProp,
  presets,
  query: queryProp,
  queryDelay: queryDelayProp,
  readOnly = false,
  ref,
  renderOperand,
  revealed: revealedProp,
  shortcut: shortcutProp,
  size: sizeProp,
  sticky = false,
  container,
  total,
  value: valueProp,
  ...nativeProps
}: FilterBarProps) {
  const defaults = useFilterBarDefaults();
  const t = useMessages(filterBarMessages, messages);
  const apply = applyProp ?? defaults.apply ?? FILTER_BAR_FALLBACK.apply;
  const chipLimit = chipLimitProp ?? defaults.chipLimit ?? FILTER_BAR_FALLBACK.chipLimit;
  const queryDelay = queryDelayProp ?? defaults.queryDelay ?? FILTER_BAR_FALLBACK.queryDelay;
  const shortcut =
    shortcutProp === undefined ? (defaults.shortcut ?? FILTER_BAR_FALLBACK.shortcut) : shortcutProp;
  const size = sizeProp ?? defaults.size ?? FILTER_BAR_FALLBACK.size;

  const base = useId();
  const root = useRef<HTMLDivElement | null>(null);
  const search = useRef<HTMLInputElement | null>(null);
  const bar = useRef<HTMLDivElement | null>(null);
  const narrow = useNarrow(root);
  const sheet = useSheet();

  /* ── The five values ─────────────────────────────────────────────────── */

  const [ownValue, setOwnValue] = useState<FilterGroup | null>(defaultValue ?? null);
  const value = valueProp === undefined ? ownValue : valueProp;

  const [ownQuery, setOwnQuery] = useState(defaultQuery ?? '');
  const query = queryProp === undefined ? ownQuery : queryProp;

  const [ownPreset, setOwnPreset] = useState<string | null>(defaultPreset ?? null);
  const preset = presetProp === undefined ? ownPreset : presetProp;

  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const open = openProp === undefined ? ownOpen : openProp;

  const [ownRevealed, setOwnRevealed] = useState(defaultRevealed ?? false);
  const revealed = revealedProp === undefined ? ownRevealed : revealedProp;

  function announce(message: string) {
    getLiveAnnouncer(root.current?.ownerDocument).announce(message);
  }

  const format = useMemo(
    () => ({
      field: (key: string) => fieldByKey(fields, key)?.label ?? key,
      join: (join: 'and' | 'or') => t(`joins.${join}`),
      operator: (operator: string) => operatorName(t, operator),
    }),
    [fields, t],
  );

  /** The sentence for one field's rule, with a set value written as its option's label. */
  const sentence = useCallback(
    (field: FilterBarField | undefined, filter: FilterDescriptor | null | undefined) =>
      describeFilter(filter, {
        ...format,
        value: (value) =>
          field?.options?.find((option) => option.value === value)?.label ?? String(value),
      }),
    [format],
  );

  const requestValue = useCallback(
    (next: FilterGroup | null, reason: FilterBarValueReason, source?: unknown) => {
      const normalized = normalizeFilterGroup(next);
      const state = createControllable<FilterGroup | null>({
        controlled: valueProp,
        equals: sameGroup,
        initial: value,
        onRequest: (request) => onValueChange?.(request.value, request as never),
      });
      if (state.request(normalized, reason, source)) setOwnValue(normalized);
    },
    [onValueChange, value, valueProp],
  );

  const requestQuery = useCallback(
    (next: string, reason: FilterBarQueryReason, source?: unknown) => {
      const state = createControllable<string>({
        controlled: queryProp,
        initial: query,
        onRequest: (request) => onQueryChange?.(request.value, request as never),
      });
      if (state.request(next, reason, source)) setOwnQuery(next);
    },
    [onQueryChange, query, queryProp],
  );

  function requestPreset(next: string | null, reason: FilterBarPresetReason, source?: unknown) {
    const state = createControllable<string | null>({
      controlled: presetProp,
      initial: preset,
      onRequest: (request) => onPresetChange?.(request.value, request as never),
    });
    if (state.request(next, reason, source)) setOwnPreset(next);
  }

  function requestOpen(next: boolean, reason: FilterBarOpenReason, source?: unknown) {
    const state = createControllable<boolean>({
      controlled: openProp,
      initial: open,
      onRequest: (request) => onOpenChange?.(request.value, request as never),
    });
    if (state.request(next, reason, source)) setOwnOpen(next);
  }

  function requestRevealed(next: boolean, reason: FilterBarRevealedReason, source?: unknown) {
    const state = createControllable<boolean>({
      controlled: revealedProp,
      initial: revealed,
      onRequest: (request) => onRevealedChange?.(request.value, request as never),
    });
    if (state.request(next, reason, source)) setOwnRevealed(next);
  }

  /* ── The draft under manual ──────────────────────────────────────────── */

  const [draft, setDraft] = useState<{ value: FilterGroup | null; query: string } | null>(null);
  const shown = apply === 'manual' && draft ? draft.value : value;
  const shownQuery = apply === 'manual' && draft ? draft.query : query;
  const dirty =
    apply === 'manual' &&
    draft !== null &&
    (!sameGroup(draft.value, value) || draft.query !== query);

  /* A controlled value that changes from outside replaces the draft — the application's value wins. */
  const lastValue = useRef(value);
  useEffect(() => {
    if (!sameGroup(lastValue.current, value)) {
      lastValue.current = value;
      setDraft(null);
    }
  }, [value]);

  /* A preset whose tree the value has left is dirty rather than dropped. */
  const presetDirty = useMemo(() => {
    const chosen = presets?.find((entry) => entry.key === preset);
    return chosen !== undefined && !sameGroup(normalizeFilterGroup(chosen.value), value);
  }, [preset, presets, value]);

  /**
   * Every edit of the tree goes through here: under `live` it is requested
   * at once, under `manual` it goes to the draft and Apply requests it.
   */
  function edit(next: FilterGroup | null, reason: FilterBarValueReason, source?: unknown) {
    if (apply === 'manual') {
      setDraft({ value: next, query: shownQuery });
      return;
    }
    requestValue(next, reason, source);
  }

  /* ── Required fields ─────────────────────────────────────────────────── */

  const required = useMemo(() => fields.filter((field) => field.required), [fields]);

  /** The tree with every required field at its default, which is what Clear returns to. */
  function baseline(): FilterGroup | null {
    let next: FilterGroup | null = null;
    for (const field of required) {
      if (field.defaultValue) next = withRuleFor(next, field.key, field.defaultValue);
    }
    return normalizeFilterGroup(next);
  }

  function missing(tree: FilterGroup | null): FilterBarField[] {
    return required.filter((field) => !isFilterActive(ruleFor(tree, field.key) ?? null));
  }

  /* ── Commit points ───────────────────────────────────────────────────── */

  function submit(source?: unknown) {
    if (!draft) return;
    const lacking = missing(draft.value);
    if (lacking.length > 0) {
      const first = lacking[0]!;
      setInvalid(first.key);
      announce(t('required', { field: first.label }));
      root.current
        ?.querySelector<HTMLElement>(`[data-part='pill'][data-field='${CSS.escape(first.key)}']`)
        ?.focus();
      return;
    }
    setInvalid(null);
    requestValue(draft.value, 'submit', source);
    if (draft.query !== query) requestQuery(draft.query, 'submit', source);
    setDraft(null);
    const applied = normalizeFilterGroup(draft.value);
    announce(
      applied
        ? t('appliedCount', {
            count: firstLevelRules(applied).length,
            filters: describeFilterGroup(applied, format),
          })
        : t('cleared'),
    );
  }

  function reset() {
    setDraft(null);
    setInvalid(null);
  }

  function clearAll(source?: unknown) {
    const next = baseline();
    setInvalid(null);
    setPending(null);
    if (apply === 'manual') {
      setDraft({ value: next, query: '' });
    } else {
      requestValue(next, 'clear', source);
      if (query !== '') requestQuery('', 'clear', source);
    }
    announce(next ? t('clearedTo', { filters: describeFilterGroup(next, format) }) : t('cleared'));
  }

  function removeField(key: string, source?: unknown) {
    const field = fieldByKey(fields, key);
    if (field?.required) {
      setInvalid(key);
      announce(t('required', { field: field.label }));
      return;
    }
    if (pending?.key === key) {
      setPending(null);
      if (ruleFor(shown, key) === undefined) return;
    }
    edit(withoutRuleFor(shown, key), 'remove', source);
    announce(t('removed', { field: field?.label ?? key }));
  }

  function removeNode(path: FilterPath, source?: unknown) {
    if (!shown) return;
    edit(removeNodeAt(shown, path), 'remove', source);
  }

  function choosePreset(key: string | null, source?: unknown) {
    requestPreset(key, key === null ? 'clear' : 'select', source);
    const chosen = presets?.find((entry) => entry.key === key);
    if (chosen) {
      setDraft(null);
      requestValue(chosen.value, 'select', source);
      announce(chosen.label);
    }
  }

  const [invalid, setInvalid] = useState<string | null>(null);

  /**
   * A condition the reader started — from `add` or from a pinned field's pill
   * — and whose operand is not there yet. It is the bar's own and not the
   * value's: the engine would drop it as inactive anyway, so it is drawn as an
   * incomplete chip and enters the value the moment it is complete.
   */
  const [pending, setPending] = useState<{
    key: string;
    filter: FilterDescriptor;
    /** Where an applied rule stood before it lost its operand, so its chip keeps its place. */
    at?: number;
  } | null>(null);

  /* ── The query ───────────────────────────────────────────────────────── */

  const [typed, setTyped] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function typeQuery(next: string, reason: FilterBarQueryReason, source?: unknown) {
    if (apply === 'manual') {
      setDraft({ value: shown, query: next });
      return;
    }
    setTyped(next);
    if (timer.current) clearTimeout(timer.current);
    if (reason === 'clear' || queryDelay === 0) {
      setTyped(null);
      requestQuery(next, reason, source);
      return;
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      setTyped(null);
      requestQuery(next, reason, source);
    }, queryDelay);
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.defaultPrevented) return;
    if (event.key === 'Escape' && (typed ?? shownQuery) !== '') {
      event.preventDefault();
      typeQuery('', 'clear', event);
    }
    if (event.key === 'Enter' && apply === 'manual') submit(event);
  }

  /* The document key that reaches the search, unless the reader is typing. */
  useEffect(() => {
    if (!shortcut || disabled) return;
    const doc = root.current?.ownerDocument;
    if (!doc) return;
    const listener = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== shortcut) return;
      if (isEditable(doc.activeElement)) return;
      event.preventDefault();
      search.current?.focus();
    };
    doc.addEventListener('keydown', listener);
    return () => doc.removeEventListener('keydown', listener);
  }, [disabled, shortcut]);

  /* ── The roving ring ─────────────────────────────────────────────────── */

  const ring = useRef<{ refresh: () => void } | null>(null);
  useEffect(() => {
    const barNode = bar.current;
    if (!barNode) return;
    /* A read-only segment keeps its stop: aria-disabled says it will not open, not that it is out of reach. */
    const roving = createRovingTabindex(barNode, {
      includeAriaDisabled: true,
      itemSelector: BAR_ITEMS,
    });
    /* A chip removed by the pointer: focus goes to the stop that took its place. */
    const removal = createRemovalFocus(barNode, {
      fallback: () => barNode.querySelector<HTMLElement>("[data-part='add']") ?? null,
      itemSelector: BAR_ITEMS,
    });
    ring.current = roving;
    return () => {
      roving.destroy();
      removal.destroy();
      ring.current = null;
    };
  }, []);

  /* The ring reads the DOM again after a chip, a pill or a control came or went. */
  useEffect(() => {
    ring.current?.refresh();
  });

  /**
   * Where the keyboard goes after `Delete` removed a chip: the segment of the
   * same role on the chip that followed, else on the one before, else `add`.
   * Chosen before the removal, while both neighbours are still in the DOM, and
   * focused before paint.
   */
  const focusAfter = useRef<HTMLElement | null>(null);
  useIsomorphicLayoutEffect(() => {
    const target = focusAfter.current;
    if (!target) return;
    focusAfter.current = null;
    (target.isConnected
      ? target
      : bar.current?.querySelector<HTMLElement>("[data-part='add']")
    )?.focus();
  });

  /* ── Sticky ──────────────────────────────────────────────────────────── */

  useEffect(() => {
    const element = root.current;
    if (!sticky || !element || typeof ResizeObserver === 'undefined') return;
    const parent = element.parentElement;
    const view = element.ownerDocument.defaultView;
    if (!parent || !view) return;
    /* What the parent declared inline before this bar added itself: put back
       before every read, so a second measure never sums the bar twice. */
    const declared = parent.style.getPropertyValue(STICKY_TOP);
    const restore = () =>
      declared
        ? parent.style.setProperty(STICKY_TOP, declared)
        : parent.style.removeProperty(STICKY_TOP);
    const publish = () => {
      restore();
      const above = view.getComputedStyle(parent).getPropertyValue(STICKY_TOP).trim() || '0px';
      const height = element.getBoundingClientRect().height;
      element.style.setProperty(STICKY_TOP, above);
      parent.style.setProperty(STICKY_TOP, `calc(${above} + ${height}px)`);
    };
    /* Its first report, after layout, is the first measurement. */
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.style.removeProperty(STICKY_TOP);
      restore();
    };
  }, [sticky]);

  /* ── Announce the count ──────────────────────────────────────────────── */

  const countText =
    count === undefined
      ? null
      : total === undefined
        ? t('countOnly', { count })
        : t('count', { count, total });

  /* ── The builder ─────────────────────────────────────────────────────── */

  /** The one rule card open in the builder's card form, by its path. */
  const [expanded, setExpanded] = useState<string | null>(null);
  /** A tree the builder opens on instead of the shown one: a rule the reader just started. */
  const seed = useRef<FilterGroup | null>(null);
  const drawerDraft = useDrawerDraft(open, shown, seed);

  function openBuilder(
    reason: FilterBarOpenReason,
    source?: unknown,
    at?: { tree?: FilterGroup | null; path: FilterPath },
  ) {
    if (at?.tree !== undefined) seed.current = at.tree;
    setExpanded(at ? at.path.join('.') : null);
    requestOpen(true, reason, source);
  }

  /** The builder open on one field's rule: the applied one, the pending one, or a fresh one. */
  function openBuilderOn(key: string, source?: unknown) {
    const field = fieldByKey(fields, key);
    const applied = shown
      ? shown.rules.findIndex((node) => !isFilterGroup(node) && node.field === key)
      : -1;
    if (applied !== -1 && pending?.key !== key) {
      openBuilder('pointer', source, { path: [applied] });
      return;
    }
    const filter = pending?.key === key ? pending.filter : field ? blankRule(field) : null;
    if (!filter) return;
    const tree = withRuleFor(shown, key, filter);
    setPending(null);
    openBuilder('pointer', source, {
      path: [tree.rules.findIndex((node) => !isFilterGroup(node) && node.field === key)],
      tree,
    });
  }

  useImperativeHandle(
    ref as never,
    () => ({
      focusSearch: () => search.current?.focus(),
      open: (path?: FilterPath) =>
        openBuilder('programmatic', undefined, path ? { path } : undefined),
      get root() {
        return root.current;
      },
    }),
    [],
  );

  /* ── Rendering ───────────────────────────────────────────────────────── */

  const environment: RuleEnvironment = {
    apply: () => (apply === 'manual' ? submit() : undefined),
    fields,
    renderOperand,
    size,
    t,
  };

  const locked = disabled || readOnly;
  const pinned = fields.filter((field) => field.pinned || field.required);
  const pinnedKeys = new Set(pinned.map((field) => field.key));
  const activeCount = shown ? countActive(shown) : 0;

  /** Which chip's value popover is open, by its field key. */
  const [valueOpen, setValueOpen] = useState<string | null>(null);

  const unfiltered = fields.filter(
    (field) =>
      !pinnedKeys.has(field.key) &&
      ruleFor(shown, field.key) === undefined &&
      field.key !== pending?.key,
  );
  const sections = new Map<string | undefined, FilterBarField[]>();
  for (const field of unfiltered) {
    const list = sections.get(field.section) ?? [];
    list.push(field);
    sections.set(field.section, list);
  }

  /** A field chosen from `add` or pressed as a pill: its chip, incomplete, with the value popover open. */
  function start(key: string, source?: unknown) {
    const field = fieldByKey(fields, key);
    if (!field || locked) return;
    if (narrow) {
      openBuilderOn(key, source);
      return;
    }
    const filter = blankRule(field);
    if (isFilterActive(filter)) {
      edit(withRuleFor(shown, key, filter), 'pointer', source);
    } else {
      setPending({ key, filter });
    }
    setValueOpen(key);
  }

  /** Every change to one field's rule from a chip: pending until active, then the value's. */
  function changeRule(key: string, next: FilterDescriptor | null, reason: FilterBarValueReason) {
    const field = fieldByKey(fields, key);
    if (next === null) {
      if (field?.required) {
        setInvalid(key);
        announce(t('required', { field: field.label }));
        return;
      }
      if (pending?.key === key) setPending(null);
      edit(withoutRuleFor(shown, key), 'clear');
      return;
    }
    setInvalid(null);
    if (!isFilterActive(next)) {
      /* A draft holds an unfinished rule as it stands; the value never does. */
      if (apply === 'manual') {
        edit(withRuleFor(shown, key, next), reason);
        return;
      }
      const at = shown
        ? shown.rules.findIndex((node) => !isFilterGroup(node) && node.field === key)
        : -1;
      setPending({ key, filter: next, ...(at === -1 ? {} : { at }) });
      if (at !== -1) edit(withoutRuleFor(shown, key), reason);
      return;
    }
    if (pending?.key === key) setPending(null);
    edit(withRuleFor(shown, key, next), reason);
  }

  function setOperator(key: string, filter: FilterDescriptor, operator: string, source?: unknown) {
    const condition = (filter.conditions[0] ?? { operator }) as {
      operator: string;
      value?: unknown;
      end?: unknown;
    };
    const before = operandCount(condition.operator as FilterOperator);
    const after = operandCount(operator as FilterOperator);
    const next = withCondition(filter, 0, {
      operator,
      ...(after >= 1 && before >= 1 ? { value: condition.value } : {}),
      ...(after === 2 && before === 2 ? { end: condition.end } : {}),
    } as never);
    changeRule(key, next, 'pointer');
    void source;
    /* An operator that wants an operand the rule lacks moves on to the value. */
    if (after > 0 && !isFilterActive(next)) setValueOpen(key);
  }

  function onChipKeyDown(event: KeyboardEvent<HTMLDivElement>, key: string) {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    const segment = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-part='chip-operator'], [data-part='chip-value'], [data-part='chip-remove']",
    );
    if (!segment || locked || event.defaultPrevented) return;
    event.preventDefault();
    const field = fieldByKey(fields, key);
    if (field?.required) {
      removeField(key, event);
      return;
    }
    const chipsNow = [
      ...(bar.current?.querySelectorAll<HTMLElement>("[data-part='chip']") ?? []),
    ].filter((chip) => chip.checkVisibility?.() ?? true);
    const here = segment.closest<HTMLElement>("[data-part='chip']");
    const index = here ? chipsNow.indexOf(here) : -1;
    const role = segment.getAttribute('data-part');
    const neighbour = chipsNow[index + 1] ?? chipsNow[index - 1];
    focusAfter.current =
      neighbour?.querySelector<HTMLElement>(`[data-part='${role}']`) ??
      neighbour?.querySelector<HTMLElement>('button') ??
      bar.current?.querySelector<HTMLElement>("[data-part='add']") ??
      null;
    removeField(key, event);
  }

  /** One field's condition as a chip: the field, the operator, the value, the remove control. */
  function chip(
    key: string,
    filter: FilterDescriptor,
    flags: { pinned?: boolean; incomplete?: boolean; folded?: boolean },
  ): ReactNode {
    const field = fieldByKey(fields, key);
    const unknown = field === undefined;
    const label = field?.label ?? key;
    const words = ruleWords(t, field, filter);
    const incomplete = flags.incomplete === true || !isFilterActive(filter);
    const shownValue = words.value || t('noValue');
    const rule = t('rule', {
      condition:
        words.operands > 0
          ? t('condition', { operator: words.operator, value: shownValue })
          : words.operator,
      field: unknown ? t('unknownField', { field: key }) : label,
    });
    const name = incomplete ? t('incomplete', { rule }) : rule;
    const condition = filter.conditions[0];
    const operators =
      field?.operators ?? (field ? (operatorsFor(field.kind) as readonly string[]) : []);
    const lockProps = readOnly ? { 'aria-disabled': true as const } : {};
    const segmentDisabled = disabled || unknown;

    const operatorSegment =
      readOnly || unknown ? (
        <button
          data-part="chip-operator"
          data-part-chip-operator=""
          disabled={disabled}
          type="button"
          {...(unknown ? { 'aria-disabled': true as const } : lockProps)}
        >
          {words.operator}
        </button>
      ) : (
        <Menu>
          <MenuTrigger
            render={(props) => (
              <button
                {...withSelectorKey(props as object, 'part', 'chip-operator')}

                disabled={segmentDisabled}
                type="button"
              >
                {words.operator}
              </button>
            )}
          />
          <MenuContent aria-label={t('operator')}>
            <MenuRadioGroup
              onValueChange={(next, request) => setOperator(key, filter, next, request.source)}
              value={condition?.operator ?? ''}
            >
              {operators.map((operator) => (
                <MenuRadioItem key={operator} value={operator}>
                  {operatorName(t, operator)}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuContent>
        </Menu>
      );

    const valueContent = (
      <>
        <span data-operator="">{words.operator}</span>
        <span data-value="">{shownValue}</span>
      </>
    );
    const valueName = t('condition', { operator: words.operator, value: words.full || shownValue });
    const valueTitle = words.full && words.full !== words.value ? words.full : undefined;

    let valueSegment: ReactNode = null;
    if (words.operands > 0 || incomplete) {
      valueSegment =
        readOnly || !field || narrow ? (
          <button
            aria-haspopup={narrow && !readOnly && !unknown ? 'dialog' : undefined}
            aria-label={valueName}
            data-part="chip-value"
            data-part-chip-value=""
            disabled={disabled}
            onClick={(event) =>
              narrow && !readOnly && !unknown ? openBuilderOn(key, event) : undefined
            }
            title={valueTitle}
            type="button"
            {...(readOnly || unknown ? { 'aria-disabled': true as const } : {})}
          >
            {valueContent}
          </button>
        ) : (
          <Popover
            onOpenChange={(next) => setValueOpen(next ? key : valueOpen === key ? null : valueOpen)}
            open={valueOpen === key}
          >
            <PopoverTrigger
              render={(props) => (
                <button
                  {...withSelectorKey(props as object, 'part', 'chip-value')}
                  aria-haspopup="dialog"
                  aria-label={valueName}

                  disabled={disabled}
                  title={valueTitle}
                  type="button"
                >
                  {valueContent}
                </button>
              )}
            />
            <PopoverLayer>
              <PopoverContent aria-label={label}>
                <PopoverBody>
                  <RuleEditorPopoverBody
                    apply={apply}
                    current={filter}
                    environment={environment}
                    field={field}
                    invalid={invalid === key}
                    onChange={(next) => changeRule(key, next, 'keyboard')}
                    onDone={() => {
                      const rule = ruleFor(shown, key);
                      if (rule && isFilterActive(rule)) {
                        announce(t('rule', { condition: sentence(field, rule), field: label }));
                      }
                    }}
                    queryDelay={queryDelay}
                    withOperator={false}
                  />
                </PopoverBody>
              </PopoverContent>
            </PopoverLayer>
          </Popover>
        );
    }

    return (
      <div
        aria-label={name}
        data-field={key}
        data-operands={words.operands}
        data-part="chip"
        data-part-chip=""
        key={key}
        onKeyDown={(event) => onChipKeyDown(event, key)}
        role="group"
        {...(flags.pinned ? { 'data-pinned': '' } : {})}
        {...(incomplete ? { 'data-incomplete': '' } : {})}
        {...(flags.folded ? { 'data-folded': '' } : {})}
        {...(unknown || invalid === key ? { 'data-invalid': '' } : {})}
      >
        <span data-part="chip-field" data-part-chip-field="">
          <FieldIcon icon={field?.icon} />
          <span>{label}</span>
        </span>
        {operatorSegment}
        {valueSegment}
        {field?.required || readOnly ? null : (
          <button
            aria-label={t('remove', { name: label })}
            data-part="chip-remove"
            data-part-chip-remove=""
            disabled={disabled}
            onClick={(event) => removeField(key, event)}
            type="button"
          >
            <Icon>
              <Glyph name="x" />
            </Icon>
          </button>
        )}
      </div>
    );
  }

  /** A group at the first level, written in the builder: one sentence that opens it, and its remove control. */
  function groupChip(node: FilterGroup, path: FilterPath, folded: boolean): ReactNode {
    const words = `(${describeFilterGroup(node, format)})`;
    return (
      <div
        aria-label={words}
        data-operands={1}
        data-part="chip"
        data-part-chip=""
        key={`group-${path.join('.')}`}
        onKeyDown={(event) => {
          if ((event.key === 'Delete' || event.key === 'Backspace') && !locked) {
            event.preventDefault();
            removeNode(path, event);
          }
        }}
        role="group"
        {...(folded ? { 'data-folded': '' } : {})}
      >
        <button
          aria-haspopup="dialog"
          data-part="chip-value"
          data-part-chip-value=""
          disabled={disabled}
          onClick={(event) => (readOnly ? undefined : openBuilder('pointer', event, { path }))}
          title={words}
          type="button"
          {...(readOnly ? { 'aria-disabled': true as const } : {})}
        >
          <span data-value="">{words}</span>
        </button>
        {readOnly ? null : (
          <button
            aria-label={t('remove', { name: words })}
            data-part="chip-remove"
            data-part-chip-remove=""
            disabled={disabled}
            onClick={(event) => removeNode(path, event)}
            type="button"
          >
            <Icon>
              <Glyph name="x" />
            </Icon>
          </button>
        )}
      </div>
    );
  }

  /* The bar's members in order: pinned fields as declared, then the other conditions, then the one pending. */
  const members: ReactNode[] = [];
  let chipIndex = 0;
  const nextFolded = () => chipIndex++ >= chipLimit;
  for (const field of pinned) {
    const rule = ruleFor(shown, field.key);
    if (rule !== undefined) {
      members.push(chip(field.key, rule, { pinned: true, folded: nextFolded() }));
    } else if (pending?.key === field.key) {
      members.push(
        chip(field.key, pending.filter, { pinned: true, incomplete: true, folded: nextFolded() }),
      );
    } else if (!readOnly) {
      members.push(
        <button
          aria-haspopup="dialog"
          data-field={field.key}
          data-part="pill"
          data-part-pill=""
          disabled={disabled}
          key={field.key}
          onClick={(event) => start(field.key, event)}
          type="button"
          {...(invalid === field.key ? { 'data-invalid': '', 'aria-invalid': true } : {})}
        >
          <Icon>
            <Glyph name="plus" />
          </Icon>
          <span>{field.label}</span>
        </button>,
      );
    }
  }
  const floating =
    pending && !pinnedKeys.has(pending.key) && ruleFor(shown, pending.key) === undefined
      ? pending
      : null;
  const pendingChip = () =>
    floating
      ? chip(floating.key, floating.filter, { incomplete: true, folded: nextFolded() })
      : null;
  let placed = false;
  (shown?.rules ?? []).forEach((node, index) => {
    if (floating?.at === index) {
      members.push(pendingChip());
      placed = true;
    }
    if (isFilterGroup(node)) members.push(groupChip(node, [index], nextFolded()));
    else if (!pinnedKeys.has(node.field))
      members.push(chip(node.field, node.filter, { folded: nextFolded() }));
  });
  if (floating && !placed) members.push(pendingChip());
  const chipCount = chipIndex;
  const folded = Math.max(0, chipCount - chipLimit);

  return (
    <div
      aria-label={t('bar')}
      role="search"
      {...withSelectorKey(nativeProps, 'part', 'root')}
      data-apply={apply}

      data-size={size}
      data-ui="filter-bar"
      data-ui-filter-bar=""
      ref={root}
      {...(disabled ? { 'data-disabled': '' } : {})}
      {...(readOnly ? { 'data-readonly': '' } : {})}
      {...(loading ? { 'data-loading': '' } : {})}
      {...(dirty || presetDirty ? { 'data-dirty': '' } : {})}
      {...(open ? { 'data-open': '' } : {})}
      {...(sticky ? { 'data-sticky': '' } : {})}
    >
      <div data-part="frame" data-part-frame="">
        <div data-part="search" data-part-search="">
          <TextField
            aria-label={t('search')}
            clearable
            disabled={disabled}
            end={shortcut ? <Kbd size="sm">{shortcut}</Kbd> : undefined}
            onKeyDown={onSearchKeyDown}
            onValueChange={(next, request) =>
              typeQuery(next, request.reason === 'clear' ? 'clear' : 'keyboard', request.source)
            }
            placeholder={t('search')}
            ref={search}
            size={size}
            start={
              <Icon>
                <Glyph name="search" />
              </Icon>
            }
            type="search"
            value={typed ?? shownQuery}
          />
        </div>

        <div
          aria-label={t('filters')}
          data-part="bar"
          data-part-bar=""
          ref={bar}
          role="toolbar"
          {...(readOnly ? { 'aria-description': t('readOnly') } : {})}
          {...(revealed ? { 'data-revealed': '' } : {})}
        >
          <Button
            aria-haspopup="dialog"
            disabled={disabled}
            onClick={(event) => openBuilder('pointer', event)}
            render={(props) => <button {...withSelectorKey(props, 'part', 'summary')} />}
            size={size}
            start={
              <Icon>
                <Glyph name="funnel" />
              </Icon>
            }
            tone="secondary"
            variant="outline"
          >
            <span>{t('summary', { count: activeCount })}</span>
          </Button>

          {members}

          {folded > 0 ? (
            <button
              aria-expanded={revealed}
              data-part="more"
              data-part-more=""
              disabled={disabled}
              onClick={(event) => requestRevealed(!revealed, 'pointer', event)}
              type="button"
            >
              {revealed ? t('less') : t('more', { count: folded })}
            </button>
          ) : null}

          {readOnly ? null : (
            <Menu>
              <MenuTrigger
                render={(props) =>
                  chipCount > 0 ? (
                    /* With a chip in the bar, add is its glyph alone, in the chips' shape; the label stays its name. */
                    <IconButton
                      {...(props as object)}
                      aria-label={t('add')}
                      disabled={disabled || unfiltered.length === 0}
                      render={(inner) => (
                        <button {...withSelectorKey(inner, 'part', 'add')} data-compact="" />
                      )}
                      shape="circle"
                      size={size}
                      title={t('add')}
                      tone="secondary"
                      variant="outline"
                    >
                      <Icon>
                        <Glyph name="plus" />
                      </Icon>
                    </IconButton>
                  ) : (
                    <Button
                      {...(props as object)}
                      disabled={disabled || unfiltered.length === 0}
                      render={(inner) => <button {...withSelectorKey(inner, 'part', 'add')} />}
                      size={size}
                      start={
                        <Icon>
                          <Glyph name="plus" />
                        </Icon>
                      }
                      tone="secondary"
                      variant="ghost"
                    >
                      {t('add')}
                    </Button>
                  )
                }
              />
              <MenuContent aria-label={t('add')}>
                {[...sections.entries()].map(([section, list]) => {
                  const items = list.map((field) => (
                    <MenuItem key={field.key} onSelect={(event) => start(field.key, event)}>
                      {field.icon ? (
                        <MenuItemIcon>
                          <FieldIcon icon={field.icon} />
                        </MenuItemIcon>
                      ) : null}
                      <MenuItemLabel>{field.label}</MenuItemLabel>
                    </MenuItem>
                  ));
                  return section === undefined ? (
                    items
                  ) : (
                    <MenuGroup key={section} label={section}>
                      {items}
                    </MenuGroup>
                  );
                })}
              </MenuContent>
            </Menu>
          )}

          {!readOnly && (activeCount > 0 || shownQuery !== '' || pending) ? (
            <Button
              disabled={disabled}
              onClick={(event) => clearAll(event)}
              render={(props) => <button {...withSelectorKey(props, 'part', 'clear')} />}
              size={size}
              tone="secondary"
              variant="ghost"
            >
              {t('clear')}
            </Button>
          ) : null}

          {apply === 'manual' && !readOnly ? (
            <div data-part="actions" data-part-actions="">
              <Button
                disabled={disabled || !dirty}
                onClick={reset}
                render={(props) => <button {...withSelectorKey(props, 'part', 'reset')} />}
                size={size}
                tone="secondary"
                variant="ghost"
              >
                {t('reset')}
              </Button>
              <Button
                disabled={disabled || loading || !dirty}
                onClick={(event) => submit(event)}
                render={(props) => <button {...withSelectorKey(props, 'part', 'apply')} />}
                size={size}
              >
                {t('apply')}
              </Button>
            </div>
          ) : null}
        </div>

        <div data-part="end" data-part-end="">
          {presets && presets.length > 0 ? (
            /* Clearable: leaving a preset is the control's own clear, and
               without it the one way out of a saved view is deleting it. */
            <div data-part="preset" data-part-preset="">
              <Select
                clearable
                disabled={disabled || readOnly}
                items={presets.map((entry) => ({ label: entry.label, value: entry.key }))}
                onValueChange={(next, request) =>
                  choosePreset((next as string | null) ?? null, request.source)
                }
                size={size}
                value={preset}
              >
                <SelectTrigger aria-label={t('preset')}>
                  <SelectValue placeholder={t('presetNone')} />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((entry) => (
                    <SelectItem key={entry.key} value={entry.key}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {children}
        </div>

        {countText !== null || loading ? (
          <p
            aria-live="polite"
            data-part="count"
            data-part-count=""
            {...(loading ? { 'aria-busy': true } : {})}
          >
            {loading ? (
              <span
                data-ui="spinner"
                data-ui-spinner=""
                data-part="root"
                data-part-root=""
                data-size="sm"
                role="progressbar"
                aria-label={t('filters')}
              >
                {SPINNER_RING}
              </span>
            ) : null}
            {countText}
          </p>
        ) : null}
      </div>

      <Drawer
        container={container}
        onOpenChange={(next, request) => {
          requestOpen(next, request.reason as FilterBarOpenReason, request.source);
        }}
        open={open}
        side={sheet ? 'bottom' : 'end'}
        size={sheet ? 'content' : 'xl'}
      >
        <DrawerPanel>
          <DrawerHeader>
            <DrawerTitle>{t('builder')}</DrawerTitle>
            <DrawerClose />
          </DrawerHeader>
          <DrawerBody>
            <div
              data-part="builder"
              data-part-builder=""
              data-ui="filter-bar"
              data-ui-filter-bar=""
              id={`${base}builder`}
            >
              <GroupEditor
                environment={{
                  ...environment,
                  apply: () => commitDrawer(),
                  expanded,
                  onExpandedChange: setExpanded,
                }}
                extra={
                  <>
                    {drawerDraft.value && countActive(drawerDraft.value) > 0 ? (
                      <Button
                        onClick={() => drawerDraft.set(baseline())}
                        render={(props) => <button {...withSelectorKey(props, 'part', 'clear')} />}
                        size="sm"
                        tone="secondary"
                        variant="ghost"
                      >
                        {t('clear')}
                      </Button>
                    ) : null}
                    {onPresetSave ? (
                      <Button
                        onClick={() => onPresetSave(normalizeFilterGroup(drawerDraft.value))}
                        render={(props) => (
                          <button {...withSelectorKey(props, 'part', 'save-preset')} />
                        )}
                        size="sm"
                        tone="secondary"
                        variant="ghost"
                      >
                        {t('savePreset')}
                      </Button>
                    ) : null}
                  </>
                }
                firstField={fields[0]}
                group={drawerDraft.value ?? emptyFilterGroup()}
                onRootChange={(next) => drawerDraft.set(next)}
                path={[]}
                root={drawerDraft.value ?? emptyFilterGroup()}
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button
              onClick={(event) => requestOpen(false, 'dismiss', event)}
              size="sm"
              tone="secondary"
              variant="ghost"
            >
              {t('cancel')}
            </Button>
            <Button onClick={() => commitDrawer()} size="sm">
              {t('apply')}
            </Button>
          </DrawerFooter>
        </DrawerPanel>
      </Drawer>
    </div>
  );

  function commitDrawer() {
    const next = drawerDraft.value;
    const lacking = missing(next);
    if (lacking.length > 0) {
      const first = lacking[0]!;
      setInvalid(first.key);
      announce(t('required', { field: first.label }));
      return;
    }
    setInvalid(null);
    edit(next, 'submit');
    const applied = normalizeFilterGroup(next);
    announce(
      applied
        ? t('appliedCount', {
            count: countActive(applied),
            filters: describeFilterGroup(applied, format),
          })
        : t('cleared'),
    );
    requestOpen(false, 'submit');
  }
}

/**
 * The draft the drawer edits, taken each time it opens from the tree — or from
 * the seed a chip left, when the reader started a rule on a phone and the
 * builder is where it is finished.
 */
function useDrawerDraft(
  open: boolean,
  shown: FilterGroup | null,
  seed: { current: FilterGroup | null },
) {
  const [value, set] = useState<FilterGroup | null>(shown);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      set(seed.current ?? shown);
      seed.current = null;
    }
    wasOpen.current = open;
  }, [open, seed, shown]);
  return { set, value };
}

function countActive(group: FilterGroup): number {
  const active = normalizeFilterGroup(group);
  if (!active) return 0;
  let count = 0;
  const walk = (node: FilterNode) => {
    if (isFilterGroup(node)) node.rules.forEach(walk);
    else count += 1;
  };
  walk(active);
  return count;
}

interface RuleEditorPopoverBodyProps {
  apply: 'live' | 'manual';
  current: FilterDescriptor | undefined;
  environment: RuleEnvironment;
  field: FilterBarField;
  invalid: boolean;
  onChange: (next: FilterDescriptor | null) => void;
  onDone: () => void;
  queryDelay: number;
  /** Draws the operator control: a pill's editor does, a chip's value popover leaves it to the chip. */
  withOperator?: boolean | undefined;
}

/**
 * One rule in a popover. Under `live` every change is requested at once — a
 * text operand after `queryDelay`, so a query does not fire per keystroke —
 * and Done closes; under `manual` the change goes to the draft the same way.
 * Clear removes the rule, which a required field refuses.
 */
function RuleEditorPopoverBody({
  current,
  environment,
  field,
  invalid,
  onChange,
  onDone,
  queryDelay,
  withOperator = true,
}: RuleEditorPopoverBodyProps) {
  const popover = usePopover();
  const close = () => popover.toggle(false, 'dismiss');
  const [local, setLocal] = useState<FilterDescriptor>(current ?? blankRule(field));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* A change made elsewhere — the chip's operator segment — reaches the editor unless a keystroke is still waiting. */
  const incoming = JSON.stringify(current ?? null);
  useEffect(() => {
    if (!timer.current && current) setLocal(current);
  }, [incoming]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function change(next: FilterDescriptor) {
    setLocal(next);
    if (timer.current) clearTimeout(timer.current);
    const debounced = field.kind === 'text' || field.kind === 'number';
    if (!debounced || queryDelay === 0) {
      onChange(next);
      return;
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      onChange(next);
    }, queryDelay);
  }

  function done() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      onChange(local);
    }
    onDone();
    close();
  }

  const condition = local.conditions[0] ?? { operator: field.defaultOperator ?? 'contains' };

  return (
    <div
      data-kind={field.kind}
      data-part="rule"
      data-part-rule=""
      data-ui="filter-bar"
      data-ui-filter-bar=""
      {...(invalid ? { 'data-invalid': '' } : {})}
    >
      <ConditionEditor
        condition={condition}
        environment={{ ...environment, apply: done }}
        field={field}
        invalid={invalid}
        withOperator={withOperator}
        onConditionChange={(next) => change({ ...local, conditions: [next] } as FilterDescriptor)}
      />
      <div data-part="actions" data-part-actions="">
        <Button
          disabled={field.required === true}
          onClick={() => {
            if (timer.current) clearTimeout(timer.current);
            setLocal(blankRule(field));
            onChange(null);
            close();
          }}
          size="sm"
          tone="secondary"
          variant="ghost"
        >
          {environment.t('clearRule')}
        </Button>
        <Button onClick={done} size="sm">
          {environment.t('done')}
        </Button>
      </div>
    </div>
  );
}
