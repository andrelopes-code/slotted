import { withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/cascader/cascader.css';
import '@slotted/styles/skeleton/skeleton.css';
import '@slotted/styles/spinner/spinner.css';

import { cascaderFit, cascaderMeasure, pathTo } from '@slotted/core/cascader';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { createPortalRoot } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useField } from '../field';
import { Glyph, Icon } from '../icon';
import { ChipRow } from '../select/select-tags';
import { useCascaderDefaults } from './cascader-defaults';
import { useCascaderState } from './cascader-state';
import type { CascaderState } from './cascader-state';
import { CascaderSurfaceBody, useRevealActive } from './cascader-surface';
import type { CascaderPanelProps, CascaderProps } from './cascader.types';
import { SPINNER_RING } from '../button/spinner-ring';

const directionOf = (node: Element | null): 'ltr' | 'rtl' =>
  node !== null && node.ownerDocument.defaultView?.getComputedStyle(node).direction === 'rtl'
    ? 'rtl'
    : 'ltr';

/**
 * Typeahead in the level the reader is on, when no search field holds the
 * characters: the next node of the active column whose label begins with what
 * was typed.
 */
function useLevelTypeahead<T>(state: CascaderState<T>) {
  const handle = useRef<TypeaheadHandle | null>(null);
  useEffect(() => {
    handle.current = createTypeahead({ timeout: 500 });
    return () => handle.current?.destroy();
  }, []);

  return (key: string, source: unknown) => {
    const typeahead = handle.current;
    if (typeahead === null || !isPrintable(key, typeahead.query.length > 0)) return false;
    const active = state.activeKey;
    const node = active === null ? undefined : state.collection.nodeFor(active);
    const siblings =
      state.layout === 'tree'
        ? (state.view.columns[0]?.nodes.map((entry) => entry.key) ?? [])
        : node === undefined
          ? state.collection.roots
          : state.collection.siblingsOf(node.key);
    const labels = siblings.map((sibling) => state.collection.nodeFor(sibling)?.label ?? '');
    const index = typeahead.match(key, labels, active === null ? -1 : siblings.indexOf(active));
    const target = siblings[index];
    if (target !== undefined) state.setActive(target, 'keyboard', source);
    return true;
  };
}

/** Space the surface measured, kept while the popup is open. */
interface Room {
  available: number | undefined;
  columnMeasure: number;
  inset: number;
}

/**
 * A control that picks one place in a hierarchy, or several.
 *
 * The control is `select`'s control; the popup is a tree drawn as columns, one
 * level at a time, or an indented list, chosen by the room it has.
 */
export function Cascader<T>(props: CascaderProps<T>) {
  const {
    nodes,
    getKey,
    getLabel,
    getChildren,
    getParent,
    hasChildren,
    getChildrenCount,
    isNodeDisabled,
    isNodeLoading,
    isNodeFailed,
    loading,
    getDescription,
    renderIcon,
    renderNode,
    onLoadChildren,
    onRetry,
    filter,
    locale,
    selectionMode,
    value,
    defaultValue,
    onValueChange,
    path,
    defaultPath,
    onPathChange,
    activeKey,
    defaultActiveKey,
    onActiveKeyChange,
    expandedKeys,
    defaultExpandedKeys,
    onExpandedKeysChange,
    searchValue,
    defaultSearchValue,
    onSearchValueChange,
    layout,
    selectable,
    checkedStrategy,
    expandOn,
    search,
    size,
    maxColumns,
    maxCrumbs,
    hoverDelay,
    disabled,
    readOnly,
    messages,
    open,
    defaultOpen,
    onOpenChange,
    closeOnSelect,
    clearable,
    variant,
    fullWidth,
    portal,
    required,
    invalid,
    separator,
    renderValue,
    name,
    form,
    handleRef,
    ref,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...nativeProps
  } = props;

  const defaults = useCascaderDefaults();
  const field = useField();
  const generated = useId();
  const contentId = `${generated}content`;
  const treeId = `${generated}tree`;

  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const resolvedDisabled = disabled ?? field?.disabled ?? defaults.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly ?? defaults.readOnly;
  const currentOpen = (open ?? ownOpen) && !resolvedDisabled;
  const resolvedCloseOnSelect = closeOnSelect ?? defaults.closeOnSelect;

  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const [layerNode, setLayerNode] = useState<HTMLElement | null>(null);
  const [surfaceNode, setSurfaceNode] = useState<HTMLElement | null>(null);
  const [searchNode, setSearchNode] = useState<HTMLInputElement | null>(null);
  const [container, setContainer] = useState<Element | null>(null);
  const [status, setStatus] = useState<PresenceStatus>('unmounted');
  /**
   * The reader is about to open the layer: the trigger took focus or a press.
   * The portal's layer is made then, because making it reads the trigger's
   * computed style, and a read in the open's own task is a style recalculation
   * the first frame waits for.
   */
  const [warm, setWarm] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [room, setRoom] = useState<Room>({ available: undefined, columnMeasure: 192, inset: 2 });

  const latestOpen = useRef({ open, currentOpen, onOpenChange, trigger });
  latestOpen.current = { open, currentOpen, onOpenChange, trigger };

  const setOpen = useCallback(
    (
      next: boolean,
      reason:
        | 'pointer'
        | 'keyboard'
        | 'escape'
        | 'outsidePress'
        | 'select'
        | 'dismiss'
        | 'blur'
        | 'programmatic',
      source?: unknown,
    ) => {
      const current = latestOpen.current;
      if (next === current.currentOpen) return;
      let cancelled = false;
      current.onOpenChange?.(next, {
        value: next,
        previous: current.currentOpen,
        reason,
        source,
        get cancelled() {
          return cancelled;
        },
        cancel: () => {
          cancelled = true;
        },
      });
      if (cancelled || current.open !== undefined) return;
      setOwnOpen(next);
    },
    [],
  );

  const state = useCascaderState<T>({
    nodes,
    getKey,
    getLabel,
    getChildren,
    getParent,
    hasChildren,
    getChildrenCount,
    isNodeDisabled,
    isNodeLoading,
    isNodeFailed,
    loading,
    getDescription,
    renderIcon,
    renderNode,
    onLoadChildren,
    onRetry,
    filter,
    locale,
    selectionMode,
    value,
    defaultValue,
    onValueChange,
    path,
    defaultPath,
    onPathChange,
    activeKey,
    defaultActiveKey,
    onActiveKeyChange,
    expandedKeys,
    defaultExpandedKeys,
    onExpandedKeysChange,
    searchValue,
    defaultSearchValue,
    onSearchValueChange,
    layout,
    selectable,
    checkedStrategy,
    expandOn,
    search,
    size,
    maxColumns,
    maxCrumbs,
    hoverDelay,
    disabled: resolvedDisabled,
    readOnly: resolvedReadOnly,
    messages,
    defaults,
    showing: currentOpen,
    available: room.available,
    columnMeasure: room.columnMeasure,
    inset: room.inset,
    closeOnSelect: resolvedCloseOnSelect,
    onCommitted: () => {
      setOpen(false, 'select');
      latestOpen.current.trigger?.focus({ preventScroll: true });
    },
  });

  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedSearch = state.search;
  const resolvedSeparator = separator ?? defaults.separator;
  const typeahead = useLevelTypeahead(state);

  /* Opening shows the level that holds the value, with the value active in it. */
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    if (currentOpen && !wasOpen.current) state.reveal();
    if (!currentOpen && wasOpen.current) state.setQuery('', 'clear');
    wasOpen.current = currentOpen;
  });

  /* ── The layer ───────────────────────────────────────────────────────── */

  const presence = useRef<PresenceHandle | null>(null);
  useEffect(() => {
    const handle = createPresence({ present: currentOpen, onStatusChange: setStatus });
    presence.current = handle;
    setStatus(handle.status);
    return () => {
      handle.destroy();
      presence.current = null;
    };
    // The handle follows the open state through `sync` below.
  }, []);
  useEffect(() => presence.current?.sync(currentOpen), [currentOpen]);
  useEffect(() => presence.current?.setNode(layerNode), [layerNode]);

  /** Open renders the layer in the commit that opens it. */
  const mounted = currentOpen || status !== 'unmounted';
  const resolvedPortal = portal ?? defaults.portal;

  useEffect(() => {
    if (trigger === null || warm) return undefined;
    const prepare = () => setWarm(true);
    trigger.addEventListener('focusin', prepare);
    trigger.addEventListener('pointerdown', prepare);
    return () => {
      trigger.removeEventListener('focusin', prepare);
      trigger.removeEventListener('pointerdown', prepare);
    };
  }, [trigger, warm]);

  const layered = mounted || warm;
  useLayoutEffect(() => {
    if (!layered) {
      setContainer(null);
      return;
    }
    const handle = createPortalRoot({ origin: trigger, disabled: !resolvedPortal });
    setContainer(handle.container);
    return () => handle.release();
  }, [layered, resolvedPortal, trigger]);

  useLayoutEffect(() => {
    if (surfaceNode === null) return;
    const measured = cascaderMeasure(surfaceNode);
    setRoom((held) =>
      held.columnMeasure === measured.columnMeasure && held.inset === measured.inset
        ? held
        : { ...held, ...measured },
    );
  }, [surfaceNode, resolvedSize]);

  const layoutForPlacement = state.layout;
  const positioner = useRef<PositionerHandle | null>(null);

  /**
   * `data-open` is written by the measurement that places the layer, on the
   * element, in the task that opened it: the position, the side and the open
   * state reach one style update together. A render to say "positioned" was a
   * frame of its own.
   */
  const place = useCallback((handle: PositionerHandle, layer: HTMLElement) => {
    void handle.update().then(() => {
      if (positioner.current !== handle || !latestOpen.current.currentOpen) return;
      layer.setAttribute('data-open', '');
    });
  }, []);

  useLayoutEffect(() => {
    if (layerNode === null || frame === null) return;
    /* One level at a time and the tree are as wide as the control; columns
       take the window's width, reserved below. */
    const handle = createPositioner(frame, layerNode, {
      align: 'start',
      side: 'bottom',
      sideOffset: 4,
      boundaryPadding: 8,
      matchWidth: layoutForPlacement !== 'columns',
      onPositioned: (position) => {
        setRoom((held) =>
          held.available === position.availableWidth
            ? held
            : { ...held, available: position.availableWidth },
        );
      },
    });
    positioner.current = handle;
    if (latestOpen.current.currentOpen) place(handle, layerNode);
    return () => {
      handle.destroy();
      positioner.current = null;
      layerNode.removeAttribute('data-open');
    };
  }, [frame, layerNode, layoutForPlacement, place]);

  useLayoutEffect(() => {
    const handle = positioner.current;
    if (handle === null || layerNode === null) return;
    if (currentOpen) place(handle, layerNode);
    else layerNode.removeAttribute('data-open');
  }, [currentOpen, layerNode, place]);

  /**
   * The widest the window can reach, reserved on the layer as it opens, so the
   * positioner places it once against that width and a path that grows never
   * pushes the layer back across the screen under the pointer.
   */
  useLayoutEffect(() => {
    if (layerNode === null) return;
    if (state.layout !== 'columns') {
      layerNode.style.removeProperty('inline-size');
      return;
    }
    const fit = cascaderFit({ ...room, maxColumns: maxColumns ?? defaults.maxColumns });
    layerNode.style.inlineSize = `${fit * room.columnMeasure + room.inset}px`;
  }, [defaults.maxColumns, layerNode, maxColumns, room, state.layout]);

  const latestState = useRef(state);
  latestState.current = state;

  useEffect(() => {
    if (layerNode === null || !currentOpen) return;
    const layer = createDismissableLayer(layerNode, {
      branches: [frame].filter((branch): branch is HTMLDivElement => branch !== null),
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      onDismiss: (request) => {
        /* The query first, the popup second, as `select` decides it. */
        const current = latestState.current;
        if (request.reason === 'escape' && current.query !== '') {
          current.setQuery('', 'clear', request.source);
          return;
        }
        setOpen(false, request.reason === 'escape' ? 'escape' : 'outsidePress', request.source);
        if (request.reason === 'escape') latestOpen.current.trigger?.focus({ preventScroll: true });
      },
    });
    return () => layer.destroy();
  }, [currentOpen, frame, layerNode, setOpen]);

  useEffect(() => {
    if (!currentOpen || !resolvedSearch || searchNode === null) return;
    searchNode.focus({ preventScroll: true });
  }, [currentOpen, resolvedSearch, searchNode]);

  useRevealActive(surfaceNode, state.activeKey === null ? null : state.nodeId(state.activeKey));

  useImperativeHandle(
    handleRef,
    () => ({
      open: () => setOpen(true, 'programmatic'),
      close: () => setOpen(false, 'programmatic'),
      focus: () => latestOpen.current.trigger?.focus({ preventScroll: true }),
      revealValue: () => state.reveal(),
    }),
    [setOpen, state],
  );

  useEffect(() => field?.registerControl(), [field]);

  /* ── Keys ────────────────────────────────────────────────────────────── */

  const onKey = (event: KeyboardEvent<HTMLElement>, fromSearch: boolean) => {
    if (resolvedDisabled) return;
    if (event.key === 'Tab') {
      if (currentOpen) setOpen(false, 'blur', event.nativeEvent);
      return;
    }
    if (!currentOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setOpen(true, 'keyboard', event.nativeEvent);
      }
      return;
    }
    if (event.key === 'Escape') return;
    if (!fromSearch && !resolvedSearch && typeahead(event.key, event.nativeEvent)) {
      event.preventDefault();
      return;
    }
    if (fromSearch && (event.key === 'Home' || event.key === 'End')) return;
    /* The field owns the characters, the space included: a multiple selection
       toggles with Enter while a query is being typed. */
    if (fromSearch && (event.key === ' ' || isPrintable(event.key, false))) return;
    const action = state.handleKey(
      { key: event.key, source: event.nativeEvent },
      directionOf(event.currentTarget),
      true,
    );
    if (action.type !== 'none') event.preventDefault();
  };

  /* ── The control ─────────────────────────────────────────────────────── */

  const pathItems =
    state.emitted.length === 1 && !state.multiple
      ? pathTo(state.collection, state.emitted[0] as string)
          .map((key) => state.itemFor(key))
          .filter((item): item is T => item !== undefined)
      : [];

  const valueContent: ReactNode = state.multiple ? (
    <span data-part="value" data-part-value="">
      <span data-part="summary" data-part-summary="">
        {state.emitted.length === 0 ? '' : state.t('summary', { count: state.emitted.length })}
      </span>
    </span>
  ) : state.emitted.length === 0 ? (
    <span data-part="placeholder" data-part-placeholder="">
      {state.t('placeholder')}
    </span>
  ) : renderValue !== undefined ? (
    <span data-part="value" data-part-value="">
      {renderValue(pathItems)}
    </span>
  ) : (
    <span data-part="value" data-part-value="">
      {pathItems.length === 0 ? (
        <span data-part="value-segment" data-part-value-segment="">
          {state.emitted[0]}
        </span>
      ) : (
        pathItems.flatMap((item, index) => [
          index === 0 ? null : (
            <span
              aria-hidden="true"
              data-part="value-separator"
              data-part-value-separator=""
              key={`s${index}`}
            >
              {resolvedSeparator}
            </span>
          ),
          <span data-part="value-segment" data-part-value-segment="" key={getKey(item)}>
            {getLabel(item)}
          </span>,
        ])
      )}
    </span>
  );

  const showClear =
    (clearable ?? defaults.clearable) &&
    state.emitted.length > 0 &&
    !resolvedDisabled &&
    !resolvedReadOnly;

  const describedBy = [nativeProps['aria-describedby'], field?.describedBy]
    .filter(Boolean)
    .join(' ');
  const resolvedInvalid = invalid ?? field?.invalid ?? defaults.invalid;
  const resolvedRequired = required ?? field?.required ?? defaults.required;

  /* The ring stands where the chevron stood while the roots are on their way. */
  const busy = loading === true;

  const onTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (resolvedDisabled) return;
    setOpen(!currentOpen, event.detail === 0 ? 'keyboard' : 'pointer', event.nativeEvent);
  };

  const content = (
    <div
      aria-label={resolvedSearch ? (ariaLabel ?? state.t('search')) : undefined}
      data-part="content"
      data-part-content=""
      id={contentId}
      ref={setSurfaceNode}
      role={resolvedSearch ? 'dialog' : undefined}
    >
      {resolvedSearch ? (
        <div data-part="search" data-part-search="">
          <Icon>
            <Glyph name="search" />
          </Icon>
          <input
            aria-activedescendant={
              state.activeKey === null ? undefined : state.nodeId(state.activeKey)
            }
            aria-autocomplete="list"
            aria-controls={treeId}
            aria-expanded
            aria-label={state.t('search')}
            data-part="search-input"
            data-part-search-input=""
            onChange={(event) => state.setQuery(event.target.value, 'keyboard', event.nativeEvent)}
            onKeyDown={(event) => onKey(event, true)}
            placeholder={state.t('searchPlaceholder')}
            ref={setSearchNode}
            role="combobox"
            value={state.query}
          />
        </div>
      ) : null}
      <CascaderSurfaceBody
        data={props}
        expandOn={expandOn ?? defaults.expandOn}
        hoverDelay={hoverDelay ?? defaults.hoverDelay}
        label={ariaLabel}
        labelledBy={ariaLabel === undefined ? (ariaLabelledBy ?? field?.ids.label) : undefined}
        separator={resolvedSeparator}
        state={state}
        treeId={treeId}
      />
    </div>
  );

  const layer = mounted ? (
    <div
      data-layout={state.layout}
      data-part="positioner"
      data-part-positioner=""
      data-selection={state.multiple ? 'multiple' : undefined}
      data-size={resolvedSize}
      data-ui="cascader"
      data-ui-cascader=""
      inert={currentOpen ? undefined : true}
      ref={setLayerNode}
    >
      {content}
    </div>
  ) : null;

  return (
    <div
      {...withSelectorKey(nativeProps, 'part', 'root')}
      data-disabled={resolvedDisabled ? '' : undefined}
      data-full-width={(fullWidth ?? defaults.fullWidth) ? '' : undefined}
      data-invalid={resolvedInvalid ? '' : undefined}
      data-narrow={narrow ? '' : undefined}
      data-open={currentOpen ? '' : undefined}

      data-readonly={resolvedReadOnly ? '' : undefined}
      data-required={resolvedRequired ? '' : undefined}
      data-size={resolvedSize}
      data-ui="cascader"
      data-ui-cascader=""
      data-variant={variant ?? defaults.variant}
      ref={(element) => {
        setFrame(element);
        if (typeof ref === 'function') ref(element);
        else if (ref !== null && ref !== undefined) ref.current = element;
      }}
    >
      <button
        aria-activedescendant={
          currentOpen && !resolvedSearch && state.activeKey !== null
            ? state.nodeId(state.activeKey)
            : undefined
        }
        aria-controls={currentOpen ? (resolvedSearch ? contentId : treeId) : undefined}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        aria-expanded={currentOpen}
        aria-haspopup={resolvedSearch ? 'dialog' : 'tree'}
        aria-invalid={resolvedInvalid ? true : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel === undefined ? (ariaLabelledBy ?? field?.ids.label) : undefined}
        aria-readonly={resolvedReadOnly ? true : undefined}
        aria-required={resolvedRequired ? true : undefined}
        data-part="trigger"
        data-part-trigger=""
        disabled={resolvedDisabled}
        id={field?.ids.control}
        onClick={onTriggerClick}
        onKeyDown={(event) => onKey(event, false)}
        ref={setTrigger}
        role="combobox"
        type="button"
      >
        {valueContent}
      </button>
      {state.multiple && state.emitted.length > 0 ? (
        <ChipRow
          disabled={resolvedDisabled || resolvedReadOnly}
          frame={frame}
          labelFor={(key) => state.collection.nodeFor(key)?.label}
          onNarrow={setNarrow}
          onRemove={(key, event) => {
            state.remove(key, event.nativeEvent);
            trigger?.focus({ preventScroll: true });
          }}
          removeLabel={(label) => state.t('remove', { label })}
          values={state.emitted}
        />
      ) : null}
      {showClear ? (
        <button
          aria-label={state.t('clear')}
          data-part="clear"
          data-part-clear=""
          onClick={(event) => {
            state.clear(event.nativeEvent);
            trigger?.focus({ preventScroll: true });
          }}
          type="button"
        >
          <Icon>
            <Glyph name="x" />
          </Icon>
        </button>
      ) : null}
      {busy ? (
        <span
          aria-hidden="true"
          data-part="busy"
          data-part-busy=""
          data-ui="spinner"
          data-ui-spinner=""
        >
          {SPINNER_RING}
        </span>
      ) : (
        <span aria-hidden="true" data-part="arrow" data-part-arrow="">
          <Icon>
            <Glyph name="chevron-down" />
          </Icon>
        </span>
      )}
      {name === undefined
        ? null
        : state.emitted.map((key) => (
            <input form={form} key={key} name={name} type="hidden" value={key} />
          ))}
      {layer === null ? null : container === null ? layer : createPortal(layer, container)}
    </div>
  );
}

/**
 * The same tree on the page, without a control or a layer: a settings screen
 * or a sidebar. The tree itself takes focus and carries
 * `aria-activedescendant`, since there is no control to hold it.
 */
export function CascaderPanel<T>(props: CascaderPanelProps<T>) {
  const {
    nodes,
    getKey,
    getLabel,
    getChildren,
    getParent,
    hasChildren,
    getChildrenCount,
    isNodeDisabled,
    isNodeLoading,
    isNodeFailed,
    loading,
    getDescription,
    renderIcon,
    renderNode,
    onLoadChildren,
    onRetry,
    filter,
    locale,
    selectionMode,
    value,
    defaultValue,
    onValueChange,
    path,
    defaultPath,
    onPathChange,
    activeKey,
    defaultActiveKey,
    onActiveKeyChange,
    expandedKeys,
    defaultExpandedKeys,
    onExpandedKeysChange,
    searchValue,
    defaultSearchValue,
    onSearchValueChange,
    layout,
    selectable,
    checkedStrategy,
    expandOn,
    search,
    size,
    maxColumns,
    maxCrumbs,
    hoverDelay,
    disabled,
    readOnly,
    messages,
    ref,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...nativeProps
  } = props;
  const defaults = useCascaderDefaults();
  const treeId = `${useId()}tree`;
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<Room>({ available: undefined, columnMeasure: 192, inset: 2 });

  useLayoutEffect(() => {
    if (surface === null) return;
    const parent = surface.parentElement ?? surface;
    const measure = () => {
      const measured = cascaderMeasure(surface);
      const available = parent.getBoundingClientRect().width;
      setRoom((held) =>
        held.available === available &&
        held.columnMeasure === measured.columnMeasure &&
        held.inset === measured.inset
          ? held
          : { available, ...measured },
      );
    };
    measure();
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(parent);
    return () => observer?.disconnect();
  }, [surface]);

  const state = useCascaderState<T>({
    nodes,
    getKey,
    getLabel,
    getChildren,
    getParent,
    hasChildren,
    getChildrenCount,
    isNodeDisabled,
    isNodeLoading,
    isNodeFailed,
    loading,
    getDescription,
    renderIcon,
    renderNode,
    onLoadChildren,
    onRetry,
    filter,
    locale,
    selectionMode,
    value,
    defaultValue,
    onValueChange,
    path,
    defaultPath,
    onPathChange,
    activeKey,
    defaultActiveKey,
    onActiveKeyChange,
    expandedKeys,
    defaultExpandedKeys,
    onExpandedKeysChange,
    searchValue,
    defaultSearchValue,
    onSearchValueChange,
    layout,
    selectable,
    checkedStrategy,
    expandOn,
    search,
    size,
    maxColumns,
    maxCrumbs,
    hoverDelay,
    disabled,
    readOnly,
    messages,
    defaults,
    showing: true,
    available: room.available,
    columnMeasure: room.columnMeasure,
    inset: room.inset,
    closeOnSelect: false,
  });
  const typeahead = useLevelTypeahead(state);

  const revealed = useRef(false);
  useLayoutEffect(() => {
    if (revealed.current) return;
    revealed.current = true;
    if (state.activeKey === null) state.reveal();
  });

  useRevealActive(surface, state.activeKey === null ? null : state.nodeId(state.activeKey));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (state.disabled) return;
    if (typeahead(event.key, event.nativeEvent)) {
      event.preventDefault();
      return;
    }
    const action = state.handleKey(
      { key: event.key, source: event.nativeEvent },
      directionOf(event.currentTarget),
      true,
    );
    if (action.type !== 'none' && action.type !== 'close') event.preventDefault();
  };

  return (
    <div
      {...withSelectorKey(nativeProps, 'part', 'content')}
      data-disabled={state.disabled ? '' : undefined}
      data-layout={state.layout}

      data-selection={state.multiple ? 'multiple' : undefined}
      data-size={size ?? defaults.size}
      data-ui="cascader"
      data-ui-cascader=""
      ref={(element) => {
        setSurface(element);
        if (typeof ref === 'function') ref(element);
        else if (ref !== null && ref !== undefined) ref.current = element;
      }}
    >
      <CascaderSurfaceBody
        data={props}
        expandOn={expandOn ?? defaults.expandOn}
        hoverDelay={hoverDelay ?? defaults.hoverDelay}
        label={ariaLabel}
        labelledBy={ariaLabelledBy}
        separator={defaults.separator}
        state={state}
        treeId={treeId}
        treeProps={{ tabIndex: state.disabled ? -1 : 0, onKeyDown }}
      />
    </div>
  );
}
