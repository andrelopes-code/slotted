import '@slotted/styles/entity-picker/entity-picker.css';
import '@slotted/styles/tag/tag.css';
import '@slotted/styles/spinner/spinner.css';
import '@slotted/styles/skeleton/skeleton.css';

import {
  CREATE_OPTION,
  RETRY_OPTION,
  createEntityCache,
  createEntityResolver,
  createEntitySearch,
  entityOptions,
  entitySections,
  localEntitySource,
  offersCreation,
} from '@slotted/core/entity-picker';
import type {
  Entity,
  EntityCache,
  EntityOption,
  EntityResolver,
  EntitySearchSession,
  EntitySearchState,
  EntitySections,
  EntitySource,
} from '@slotted/core/entity-picker';
import {
  entityPickerMessages,
  type EntityPickerMessages,
  type FamilyTranslator,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { MutableRefObject } from 'react';

import { useField } from '../field';
import { useLocale, useMessages } from '../i18n';
import { useEntityPickerDefaults } from './entity-picker-defaults';
import { EntityPickerControl } from './entity-picker-control';
import { EntityPickerPopup } from './entity-picker-popup';
import type {
  EntityPickerHighlightReason,
  EntityPickerInputReason,
  EntityPickerMedia,
  EntityPickerOpenOn,
  EntityPickerOpenReason,
  EntityPickerOverflow,
  EntityPickerProps,
  EntityPickerSide,
  EntityPickerSize,
  EntityPickerStrategy,
  EntityPickerValueReason,
  EntityPickerValueRequest,
  EntityPickerVariant,
  EntityPickerWidth,
} from './entity-picker.types';

/** Where the highlight goes as the popup opens. */
export type EntityPickerEntry = 'selected' | 'first' | 'last' | 'keep';

/** Everything the control and the popup read. Internal: not exported from the package. */
export interface EntityPickerContextValue {
  cache: EntityCache;
  chosen: readonly string[];
  clear: (source?: unknown) => void;
  clearable: boolean;
  contentId: string;
  controlNode: HTMLDivElement | null;
  create: (reason: EntityPickerValueReason, source?: unknown) => void;
  creating: boolean;
  disabled: boolean;
  entry: MutableRefObject<EntityPickerEntry>;
  highlightMatch: boolean;
  highlighted: string | null;
  inputId: string;
  inputNode: HTMLInputElement | null;
  inputValue: string;
  invalid: boolean;
  /** The family's words in the language in force, with this picker's `messages` laid over them. */
  t: FamilyTranslator<EntityPickerMessages>;
  /** The locale the local filter and the mark compare in: the `locale` prop, or the language in force. */
  locale: string;
  loop: boolean;
  max: number | null;
  media: EntityPickerMedia;
  multiple: boolean;
  open: boolean;
  optionId: (key: string) => string;
  options: readonly EntityOption[];
  overflow: EntityPickerOverflow;
  portal: boolean;
  props: EntityPickerProps;
  query: string;
  readOnly: boolean;
  remove: (id: string, source?: unknown) => void;
  required: boolean;
  resolver: EntityResolver;
  retry: () => void;
  scope: string | null;
  search: EntitySearchState;
  session: EntitySearchSession;
  sections: EntitySections;
  offerCreate: boolean;
  setControlNode: (node: HTMLDivElement | null) => void;
  setHighlighted: (
    key: string | null,
    reason: EntityPickerHighlightReason,
    source?: unknown,
  ) => void;
  setInputNode: (node: HTMLInputElement | null) => void;
  setOpen: (open: boolean, reason: EntityPickerOpenReason, source?: unknown) => void;
  setScope: (scope: string | null, reason: ChangeReason, source?: unknown) => void;
  setTyped: (text: string, source?: unknown) => void;
  settle: (source?: unknown) => void;
  revert: (source?: unknown) => void;
  clearQuery: (source?: unknown) => void;
  side: EntityPickerSide;
  size: EntityPickerSize;
  strategy: EntityPickerStrategy;
  activate: (key: string, reason: EntityPickerValueReason, source?: unknown) => void;
  variant: EntityPickerVariant;
  version: number;
  width: EntityPickerWidth;
  fullWidth: boolean;
  openOn: EntityPickerOpenOn;
}

const EntityPickerContext = createContext<EntityPickerContextValue | undefined>(undefined);

export function useEntityPicker(): EntityPickerContextValue {
  const context = useContext(EntityPickerContext);
  if (context === undefined) throw new Error('An entity picker part is outside an EntityPicker.');
  return context;
}

const EMPTY: readonly Entity[] = [];

/** What the first render reads, before the effect has made the sessions. */
const IDLE_SESSION: EntitySearchSession = {
  state: {
    status: 'idle',
    query: '',
    scope: null,
    items: [],
    answered: false,
    total: undefined,
    hasMore: false,
    loadingMore: false,
    indicator: false,
    error: undefined,
  },
  search: () => {},
  more: () => {},
  retry: () => {},
  refresh: () => {},
  reset: () => {},
  dispose: () => {},
};

const WAITING_RESOLVER: EntityResolver = {
  require: () => {},
  status: () => 'pending',
  retry: () => {},
  dispose: () => {},
};

function idsOf(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value as readonly string[];
  return typeof value === 'string' ? [value] : [];
}

/**
 * A field that chooses records from a remote collection.
 *
 * The value is an id — or, with `selectionMode="multiple"`, an array of ids —
 * and every request to change it carries the records the family knows for
 * the new value (`request.entities`), so the normalised object reaches the
 * consumer without a second API. The search, the page after it and the
 * resolution of an id nobody has shown the family are `source`'s; the
 * delay, the abort and the cache are the family's, in
 * `@slotted/core/entity-picker`.
 *
 * The field is one line in a form (visual gate): a chosen set collapses into
 * a "+N" chip whose records the popup lists first, and a scope stands in
 * front of the field rather than above it.
 */
export function EntityPicker(props: EntityPickerProps) {
  const {
    clearable,
    defaultHighlightedValue = null,
    defaultInputValue,
    defaultOpen = false,
    defaultScope = null,
    disabled,
    entities = EMPTY,
    favorites = EMPTY,
    fullWidth,
    handleRef,
    highlightMatch,
    highlightedValue,
    inputValue,
    invalid,
    items,
    locale: localeProp,
    messages,
    loop,
    max,
    media,
    minQueryLength,
    onCreate,
    open,
    openOn,
    overflow,
    portal,
    readOnly,
    recent = EMPTY,
    required,
    scope,
    searchDelay,
    side,
    size,
    source,
    strategy,
    variant,
    width,
  } = props;
  const multiple = props.selectionMode === 'multiple';

  const defaults = useEntityPickerDefaults();
  const field = useField();
  const generated = useId();
  const contentId = `${generated}listbox`;
  const inputId = `${generated}input`;
  const optionId = useCallback(
    (key: string) => `${generated}option-${encodeURIComponent(key)}`,
    [generated],
  );

  const t = useMessages(entityPickerMessages, messages);
  const inForce = useLocale();
  const locale = localeProp ?? inForce;

  const resolvedDisabled = disabled ?? field?.disabled ?? defaults.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly ?? defaults.readOnly;
  const resolvedMinQuery = minQueryLength ?? defaults.minQueryLength;

  // ── The records ────────────────────────────────────────────────────────

  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((count) => count + 1), []);
  const cacheRef = useRef<EntityCache | null>(null);
  if (cacheRef.current === null) cacheRef.current = createEntityCache();
  const cache = cacheRef.current;
  /* What the application hands over is known before anything is asked. */
  cache.remember(entities);
  cache.remember(favorites);
  cache.remember(recent);

  const resolvedSource: EntitySource = useMemo(
    () => source ?? localEntitySource(items ?? EMPTY, { locale }),
    [items, locale, source],
  );
  const sourceRef = useRef(resolvedSource);
  sourceRef.current = resolvedSource;
  /* The sessions are made once and reach the latest source through this. */
  const proxy = useMemo<EntitySource>(
    () => ({
      search: (request, options) => sourceRef.current.search(request, options),
      resolve: (ids, options) =>
        sourceRef.current.resolve === undefined
          ? Promise.resolve([])
          : sourceRef.current.resolve(ids, options),
    }),
    [],
  );

  const [searchState, setSearchState] = useState<EntitySearchState | null>(null);
  const minQueryRef = useRef(resolvedMinQuery);
  minQueryRef.current = resolvedMinQuery;
  const delayRef = useRef(searchDelay ?? defaults.searchDelay);
  delayRef.current = searchDelay ?? defaults.searchDelay;

  /**
   * The two sessions are made in an effect and closed by its cleanup, so each
   * pair lives exactly as long as one mount. Made during render and closed in
   * an unmount cleanup, they were closed by StrictMode's rehearsal of the
   * unmount and never made again: the story view showed chips resolving
   * forever and a search that never went out.
   */
  const [engines, setEngines] = useState<{
    session: EntitySearchSession;
    resolver: EntityResolver;
  } | null>(null);

  useEffect(() => {
    const session = createEntitySearch({
      source: proxy,
      get delay() {
        return delayRef.current;
      },
      get minQueryLength() {
        return minQueryRef.current;
      },
      onChange: setSearchState,
      onResults: (found) => cache.remember(found),
    });
    const resolver = createEntityResolver({
      source: {
        search: proxy.search,
        resolve: (ids, options) =>
          sourceRef.current.resolve === undefined
            ? Promise.reject(new Error('no resolve'))
            : sourceRef.current.resolve(ids, options),
      },
      cache,
      onChange: bump,
    });
    setEngines({ session, resolver });
    return () => {
      session.dispose();
      resolver.dispose();
      setSearchState(null);
    };
  }, [bump, cache, proxy]);

  const session = engines?.session ?? IDLE_SESSION;
  const resolver = engines?.resolver ?? WAITING_RESOLVER;

  // ── State ──────────────────────────────────────────────────────────────

  const initialIds = idsOf(props.defaultValue);
  const [ownIds, setOwnIds] = useState<readonly string[]>(initialIds);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [ownHighlighted, setOwnHighlighted] = useState<string | null>(defaultHighlightedValue);
  const [ownScope, setOwnScope] = useState<string | null>(defaultScope);

  const controlledValue = props.value;
  const currentIds = controlledValue === undefined ? ownIds : idsOf(controlledValue);
  const currentOpen = (open ?? ownOpen) && !resolvedDisabled;
  const currentHighlighted = highlightedValue === undefined ? ownHighlighted : highlightedValue;
  const currentScope = scope === undefined ? ownScope : scope;

  const labelOf = (id: string | undefined) =>
    id === undefined ? '' : (cache.get(id)?.label ?? '');

  const [ownInput, setOwnInput] = useState(
    () => defaultInputValue ?? (multiple ? '' : labelOf(initialIds[0])),
  );
  const currentInput = inputValue ?? ownInput;
  /** Whether the text is the reader's own since the last choice. */
  const [typed, setTypedFlag] = useState(false);

  const query = multiple ? currentInput : typed ? currentInput : '';

  const entry = useRef<EntityPickerEntry>('keep');
  const [inputNode, setInputNode] = useState<HTMLInputElement | null>(null);
  const [controlNode, setControlNode] = useState<HTMLDivElement | null>(null);

  const latest = useRef({
    props,
    currentIds,
    currentOpen,
    currentHighlighted,
    currentInput,
    currentScope,
    typed,
  });
  latest.current = {
    props,
    currentIds,
    currentOpen,
    currentHighlighted,
    currentInput,
    currentScope,
    typed,
  };

  const announce = useCallback(
    (message: string) => {
      getLiveAnnouncer(inputNode?.ownerDocument).announce(message, { repeat: true });
    },
    [inputNode],
  );

  const requestIds = useCallback(
    (next: readonly string[], reason: EntityPickerValueReason, source?: unknown) => {
      const state = latest.current;
      const before = state.currentIds;
      if (next.length === before.length && next.every((id, index) => id === before[index])) {
        return false;
      }
      const isMultiple = state.props.selectionMode === 'multiple';
      const toValue = (ids: readonly string[]) => (isMultiple ? ids : (ids[0] ?? null));
      const controllable = createControllable<unknown>({
        controlled: state.props.value,
        initial: toValue(before),
        equals: (a, b) => JSON.stringify(a) === JSON.stringify(b),
        onRequest: (request) => {
          const extended = Object.assign(request, {
            entities: cache.pick(next),
          }) as unknown as EntityPickerValueRequest<unknown>;
          (
            state.props.onValueChange as
              ((value: unknown, request: EntityPickerValueRequest<unknown>) => void) | undefined
          )?.(request.value, extended);
        },
      });
      const moved = controllable.request(toValue(next), reason, source);
      if (moved) setOwnIds(next);
      return moved || state.props.value !== undefined;
    },
    [cache],
  );

  const setInput = useCallback(
    (next: string, reason: EntityPickerInputReason, source?: unknown) => {
      const state = latest.current;
      if (next === state.currentInput) return;
      const controllable = createControllable<string>({
        controlled: state.props.inputValue,
        initial: state.currentInput,
        onRequest: (request) => state.props.onInputValueChange?.(request.value, request),
      });
      if (controllable.request(next, reason, source)) setOwnInput(next);
    },
    [],
  );

  const setOpen = useCallback((next: boolean, reason: EntityPickerOpenReason, source?: unknown) => {
    const state = latest.current;
    if (next === state.currentOpen) return;
    const controllable = createControllable<boolean>({
      controlled: state.props.open,
      initial: state.currentOpen,
      onRequest: (request) => state.props.onOpenChange?.(request.value, request),
    });
    if (!controllable.request(next, reason, source)) return;
    setOwnOpen(next);
    if (!next) {
      setOwnHighlighted(null);
      entry.current = 'keep';
    }
  }, []);

  const setHighlighted = useCallback(
    (next: string | null, reason: EntityPickerHighlightReason, source?: unknown) => {
      const state = latest.current;
      if (next === state.currentHighlighted) return;
      const controllable = createControllable<string | null>({
        controlled: state.props.highlightedValue,
        initial: state.currentHighlighted,
        onRequest: (request) => state.props.onHighlightedValueChange?.(request.value, request),
      });
      if (controllable.request(next, reason, source)) setOwnHighlighted(next);
    },
    [],
  );

  const setScope = useCallback((next: string | null, reason: ChangeReason, source?: unknown) => {
    const state = latest.current;
    if (next === state.currentScope) return;
    const controllable = createControllable<string | null>({
      controlled: state.props.scope,
      initial: state.currentScope,
      onRequest: (request) => state.props.onScopeChange?.(request.value, request),
    });
    if (controllable.request(next, reason, source)) setOwnScope(next);
  }, []);

  /** The reader typed. In `single` the text stops being the chosen name. */
  const setTyped = useCallback(
    (text: string, source?: unknown) => {
      setTypedFlag(true);
      setInput(text, 'keyboard', source);
    },
    [setInput],
  );

  const chooseSingle = useCallback(
    (id: string | null, reason: EntityPickerValueReason, source?: unknown) => {
      requestIds(id === null ? [] : [id], reason, source);
      setTypedFlag(false);
      setInput(id === null ? '' : labelOf(id), 'select', source);
    },
    [requestIds, setInput],
  );

  const maxResolved = multiple ? (max ?? null) : null;

  const toggleMultiple = useCallback(
    (id: string, reason: EntityPickerValueReason, source?: unknown) => {
      const state = latest.current;
      const chosen = state.currentIds;
      const name = labelOf(id);
      if (chosen.includes(id)) {
        const next = chosen.filter((item) => item !== id);
        if (requestIds(next, reason === 'remove' ? 'remove' : reason, source)) {
          announce(t('removed', { label: name, count: next.length }));
        }
      } else {
        if (maxResolved !== null && chosen.length >= maxResolved) return;
        const next = [...chosen, id];
        if (requestIds(next, reason, source)) {
          announce(t('added', { label: name, count: next.length }));
          if (maxResolved !== null && next.length === maxResolved) {
            announce(t('complete', { max: maxResolved }));
          }
        }
      }
      setInput('', 'select', source);
    },
    [announce, maxResolved, requestIds, setInput, t],
  );

  const remove = useCallback(
    (id: string, source?: unknown) => {
      const state = latest.current;
      const next = state.currentIds.filter((item) => item !== id);
      if (requestIds(next, 'remove', source)) {
        announce(
          t('removed', {
            label: labelOf(id) || t('unresolved'),
            count: next.length,
          }),
        );
      }
    },
    [announce, requestIds, t],
  );

  const clear = useCallback(
    (source?: unknown) => {
      requestIds([], 'clear', source);
      setTypedFlag(false);
      setInput('', 'clear', source);
    },
    [requestIds, setInput],
  );

  const [creating, setCreating] = useState(false);

  const create = useCallback(
    (reason: EntityPickerValueReason, source?: unknown) => {
      const state = latest.current;
      const text = (multiple ? state.currentInput : state.currentInput).trim();
      const handler = state.props.onCreate;
      if (handler === undefined || text === '') return;
      const adopt = (made: Entity | null | undefined | void) => {
        setCreating(false);
        if (made === null || made === undefined) return;
        cache.remember([made]);
        bump();
        if (latest.current.props.selectionMode === 'multiple') {
          const chosen = latest.current.currentIds;
          if (!chosen.includes(made.id)) {
            requestIds([...chosen, made.id], 'submit', source);
            announce(t('added', { label: made.label, count: chosen.length + 1 }));
          }
          setInput('', 'select', source);
        } else {
          requestIds([made.id], 'submit', source);
          setTypedFlag(false);
          setInput(made.label, 'select', source);
        }
      };
      const result = handler(text);
      if (result instanceof Promise) {
        setCreating(true);
        result.then(adopt, () => setCreating(false));
      } else {
        adopt(result);
      }
      void reason;
    },
    [announce, bump, cache, multiple, requestIds, setInput, t],
  );

  const activate = useCallback(
    (key: string, reason: EntityPickerValueReason, source?: unknown) => {
      if (key === RETRY_OPTION) {
        session.retry();
        return;
      }
      if (key === CREATE_OPTION) {
        create(reason, source);
        if (!multiple) setOpen(false, 'select', source);
        return;
      }
      const entity = cache.get(key);
      if (entity?.disabled === true) return;
      if (multiple) {
        toggleMultiple(key, reason, source);
        return;
      }
      chooseSingle(key, reason, source);
      setOpen(false, 'select', source);
    },
    [cache, chooseSingle, create, multiple, session, setOpen, toggleMultiple],
  );

  /**
   * The text the reader left behind, at the moment they leave. `single` has no
   * value of its own text: text that is not the chosen name goes back to it,
   * and a field emptied by the reader is a choice cleared.
   */
  const settle = useCallback(
    (source?: unknown) => {
      const state = latest.current;
      if (state.props.selectionMode === 'multiple') return;
      if (!state.typed) return;
      if (state.currentInput.trim() === '') {
        if (state.currentIds.length > 0) requestIds([], 'clear', source);
        setTypedFlag(false);
        return;
      }
      setTypedFlag(false);
      setInput(labelOf(state.currentIds[0]), 'blur', source);
    },
    [requestIds, setInput],
  );

  /** `Escape` on a closed single field (the pattern's two optional steps). */
  const revert = useCallback(
    (source?: unknown) => {
      const state = latest.current;
      const name = labelOf(state.currentIds[0]);
      if (state.currentIds.length === 0) {
        setTypedFlag(false);
        setInput('', 'programmatic', source);
        return;
      }
      if (state.currentInput === name) {
        clear(source);
        return;
      }
      setTypedFlag(false);
      setInput(name, 'programmatic', source);
    },
    [clear, setInput],
  );

  const clearQuery = useCallback((source?: unknown) => setInput('', 'clear', source), [setInput]);

  // ── Effects ────────────────────────────────────────────────────────────

  /* An id nobody has shown the family is asked for once. */
  useEffect(() => {
    resolver.require(currentIds);
  }, [currentIds, resolver, version]);

  /* In single, the field reads the chosen name whenever the reader is not
     typing: a value set by the application, or resolved later, shows up. */
  const chosenName = multiple ? '' : labelOf(currentIds[0]);
  useEffect(() => {
    if (multiple || typed) return;
    if (latest.current.currentInput !== chosenName) setInput(chosenName, 'programmatic');
  }, [chosenName, multiple, setInput, typed]);

  /* The search follows the open popup, the query and the scope. */
  useEffect(() => {
    if (!currentOpen) return;
    session.search({ query, scope: currentScope, selected: latest.current.currentIds });
  }, [currentOpen, currentScope, query, session]);

  useImperativeHandle(
    handleRef,
    () => ({
      close: () => setOpen(false, 'programmatic'),
      focus: () => inputNode?.focus({ preventScroll: true }),
      open: () => setOpen(true, 'programmatic'),
      refresh: () => session.refresh(),
    }),
    [inputNode, session, setOpen],
  );

  // ── What the popup shows ───────────────────────────────────────────────

  const search = searchState ?? session.state;
  const results = search.answered || search.status === 'loading' ? search.items : EMPTY;
  const sections = entitySections({
    query,
    scope: currentScope,
    chosen: multiple ? cache.pick(currentIds) : EMPTY,
    favorites,
    recent,
    results: search.status === 'error' || search.status === 'short' ? search.items : results,
    searchedEmpty: resolvedMinQuery === 0,
    labels: {
      chosen: t('chosen'),
      favorites: t('favorites'),
      recent: t('recent'),
      results: t('results'),
    },
  });
  const offerCreate =
    !creating &&
    offersCreation({
      enabled: onCreate !== undefined,
      query,
      answered: search.status === 'ready',
      results: search.items,
      locale,
    });
  const blocked = useMemo(() => {
    if (maxResolved === null || currentIds.length < maxResolved) return undefined;
    const chosen = new Set(currentIds);
    return new Set(
      sections.sections
        .flatMap((section) => section.entities)
        .map((entity) => entity.id)
        .filter((id) => !chosen.has(id)),
    );
  }, [currentIds, maxResolved, sections]);
  const records = entityOptions({
    sections: sections.sections,
    create: offerCreate,
    ...(blocked === undefined ? {} : { blocked }),
  });
  const options: EntityOption[] =
    search.status === 'error'
      ? [
          ...records.filter((option) => option.key !== CREATE_OPTION),
          { key: RETRY_OPTION, disabled: false },
        ]
      : records;

  const context: EntityPickerContextValue = {
    activate,
    cache,
    chosen: currentIds,
    clear,
    clearQuery,
    clearable: clearable ?? defaults.clearable,
    contentId,
    controlNode,
    create,
    creating,
    disabled: resolvedDisabled,
    entry,
    fullWidth: fullWidth ?? defaults.fullWidth,
    highlightMatch: highlightMatch ?? defaults.highlightMatch,
    highlighted: currentHighlighted,
    inputId,
    inputNode,
    inputValue: currentInput,
    invalid: invalid ?? field?.invalid ?? defaults.invalid,
    locale,
    loop: loop ?? defaults.loop,
    max: maxResolved,
    media: media ?? defaults.media,
    multiple,
    offerCreate,
    open: currentOpen,
    openOn: openOn ?? defaults.openOn,
    optionId,
    options,
    overflow: overflow ?? defaults.overflow,
    portal: portal ?? defaults.portal,
    props,
    query,
    readOnly: resolvedReadOnly,
    remove,
    required: required ?? field?.required ?? defaults.required,
    resolver,
    retry: () => session.retry(),
    revert,
    scope: currentScope,
    search,
    sections,
    session,
    setControlNode,
    setHighlighted,
    setInputNode,
    setOpen,
    setScope,
    setTyped,
    settle,
    side: side ?? defaults.side,
    size: size ?? field?.size ?? defaults.size,
    strategy: strategy ?? defaults.strategy,
    t,
    variant: variant ?? defaults.variant,
    version,
    width: width ?? defaults.width,
  };

  return (
    <EntityPickerContext.Provider value={context}>
      <EntityPickerControl />
      <EntityPickerPopup />
    </EntityPickerContext.Provider>
  );
}
