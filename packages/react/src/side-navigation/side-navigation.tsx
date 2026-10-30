import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/side-navigation/side-navigation.css';

import { nextOpenValues, sameOpenValues } from '@slotted/core/disclosure';
import { sideNavigationMessages } from '@slotted/core/i18n';
import { createWidthGate } from '@slotted/core/measure';
import { createControllable } from '@slotted/core/state';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent } from 'react';

import { useAppShellIfPresent } from '../app-shell';
import { useMessages } from '../i18n';
import { useSideNavigationDefaults } from './side-navigation-defaults';
import type {
  SideNavigationContextValue,
  SideNavigationExpandedReason,
  SideNavigationHandle,
  SideNavigationProps,
  SideNavigationRootProps,
} from './side-navigation.types';

/** Every row a reader can land on, in the order the DOM holds them. */
export const SIDE_NAVIGATION_ROW_SELECTOR = '[data-part="link"], [data-part="trigger"]';

const SideNavigationContext = createContext<SideNavigationContextValue | undefined>(undefined);

/**
 * What the column around this part says. A part outside one has no set to
 * report to and no current destination to compare with, so this throws rather
 * than rendering a row that navigates nothing.
 */
export function useSideNavigation(): SideNavigationContextValue {
  const context = useContext(SideNavigationContext);
  if (context === undefined) {
    throw new Error('Every side-navigation part must be rendered inside SideNavigation.');
  }
  return context;
}

/**
 * A row the keyboard may land on: not inside a closed group. Read from the
 * structure rather than from the layout, so the answer is the same before the
 * stylesheet has loaded and in an environment with no layout at all.
 */
function visible(element: HTMLElement, root: HTMLElement): boolean {
  for (
    let group = element.closest<HTMLElement>('[data-part="group"]');
    group !== null && root.contains(group);
    group = group.parentElement?.closest<HTMLElement>('[data-part="group"]') ?? null
  ) {
    if (!group.parentElement?.hasAttribute('data-expanded')) return false;
  }
  return true;
}

/**
 * A column of destinations: nested groups, a current destination, and a rail
 * when the room it has is under `compactAt` pixels.
 *
 * **Three values, three models.** `value` is the current destination and
 * `expanded` the set of open groups, both on `@slotted/core/state`; `flyout`
 * is the one group shown beside the rail, transient by design, and it never
 * writes into `expanded` — a flyout that did would open every group the
 * reader had open the moment the shell collapsed.
 *
 * **The rail is a width.** The stylesheet decides the picture from the root's
 * own inline size, before any script; the `ResizeObserver` here writes
 * `data-compact` afterwards, and that is what turns on the tooltip and the
 * flyout, the two behaviours that need a script anyway.
 *
 * **The keyboard is the pattern's.** Tab reaches every row; the arrow keys,
 * Home and End walk the visible rows — into the flyout, when it is open — and
 * Escape closes the group holding focus and lands on its trigger, all as the
 * APG's Disclosure Navigation Menu example lists them.
 */
export function SideNavigation({
  autoExpand,
  children,
  className,
  compactAt,
  defaultExpanded,
  defaultFlyout,
  defaultValue,
  expanded,
  flyout,
  guides,
  landmark,
  messages,
  mode,
  multiple,
  onExpandedChange,
  onFlyoutChange,
  onKeyDown,
  onValueChange,
  ref,
  render,
  size,
  style,
  truncate,
  value,
  ...nativeProps
}: SideNavigationProps) {
  const defaults = useSideNavigationDefaults();
  const shell = useAppShellIfPresent();

  const resolvedAutoExpand = autoExpand ?? defaults.autoExpand;
  const resolvedCompactAt = compactAt ?? defaults.compactAt;
  const resolvedGuides = guides ?? defaults.guides;
  /**
   * The shell's nav region is already the navigation landmark, so a column
   * inside it renders a div; an explicit `landmark` still wins over the shell.
   */
  const resolvedLandmark = landmark ?? (shell === undefined ? defaults.landmark : false);
  const t = useMessages(sideNavigationMessages, messages);
  const resolvedMode = mode ?? defaults.mode;
  const resolvedMultiple = multiple ?? defaults.multiple;
  const resolvedSize = size ?? defaults.size;
  const resolvedTruncate = truncate ?? defaults.truncate;

  const [ownValue, setOwnValue] = useState<string | null>(defaultValue ?? null);
  const [ownExpanded, setOwnExpanded] = useState<readonly string[]>(defaultExpanded ?? []);
  const [ownFlyout, setOwnFlyout] = useState<string | null>(defaultFlyout ?? null);
  const currentValue = value === undefined ? ownValue : value;
  const currentExpanded = expanded === undefined ? ownExpanded : expanded;
  const currentFlyout = flyout === undefined ? ownFlyout : flyout;

  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [measureTick, setMeasureTick] = useState(0);
  const [flyoutNode, setFlyoutNode] = useState<HTMLElement | null>(null);
  const compact = resolvedMode === 'compact' || (resolvedMode === 'auto' && narrow);

  /** Every item's parent, so the ancestors of a destination can be opened. */
  const parents = useRef(new Map<string, string | null>());
  const registerItem = useCallback((itemValue: string, parent: string | null) => {
    parents.current.set(itemValue, parent);
    return () => {
      parents.current.delete(itemValue);
    };
  }, []);

  const latest = useRef({ currentExpanded, currentFlyout, currentValue, expanded, flyout, value });
  latest.current = { currentExpanded, currentFlyout, currentValue, expanded, flyout, value };

  const requestExpanded = useCallback(
    (next: readonly string[], reason: SideNavigationExpandedReason, source?: unknown) => {
      const state = createControllable<readonly string[]>({
        controlled: latest.current.expanded,
        equals: sameOpenValues,
        initial: latest.current.currentExpanded,
        onRequest: (request) => onExpandedChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnExpanded(next);
    },
    [onExpandedChange],
  );

  const toggleExpanded = useCallback<SideNavigationContextValue['toggleExpanded']>(
    (itemValue, next, reason, source) => {
      const current = latest.current.currentExpanded;
      const open = current.includes(itemValue);
      if (open === next) return;
      requestExpanded(
        nextOpenValues(current, itemValue, { multiple: resolvedMultiple }),
        reason,
        source,
      );
    },
    [requestExpanded, resolvedMultiple],
  );

  const setFlyout = useCallback<SideNavigationContextValue['setFlyout']>(
    (next, reason, source) => {
      const state = createControllable<string | null>({
        controlled: latest.current.flyout,
        initial: latest.current.currentFlyout,
        onRequest: (request) => onFlyoutChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnFlyout(next);
    },
    [onFlyoutChange],
  );

  const select = useCallback<SideNavigationContextValue['select']>(
    (next, reason, source) => {
      const state = createControllable<string | null>({
        controlled: latest.current.value,
        initial: latest.current.currentValue,
        onRequest: (request) => onValueChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnValue(next);
    },
    [onValueChange],
  );

  /** The rail, measured: the width gate reports once per crossing. */
  useEffect(() => {
    if (root === null || resolvedMode !== 'auto') return undefined;
    const gate = createWidthGate(root, { at: resolvedCompactAt, onChange: setNarrow });
    setNarrow(gate.narrow());
    return () => gate.destroy();
  }, [resolvedCompactAt, resolvedMode, root]);

  /** A label measures again when the column was resized or the fonts arrived. */
  useEffect(() => {
    if (root === null || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => setMeasureTick((tick) => tick + 1));
    observer.observe(root);
    const fonts = root.ownerDocument.fonts;
    let live = true;
    if (fonts !== undefined) {
      void fonts.ready.then(() => {
        if (live) setMeasureTick((tick) => tick + 1);
      });
    }
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [root]);

  /** Compact mode ending takes the flyout with it: there is no rail to stand beside. */
  useEffect(() => {
    if (!compact && latest.current.currentFlyout !== null) setFlyout(null, 'resize');
  }, [compact, setFlyout]);

  /** The ancestors of the current destination open, with the reason `select`. */
  useEffect(() => {
    if (!resolvedAutoExpand || currentValue === null) return;
    const missing: string[] = [];
    for (
      let parent = parents.current.get(currentValue) ?? null;
      parent !== null;
      parent = parents.current.get(parent) ?? null
    ) {
      if (!latest.current.currentExpanded.includes(parent)) missing.push(parent);
    }
    if (missing.length === 0) return;
    const next = resolvedMultiple
      ? [...latest.current.currentExpanded, ...missing]
      : [missing[missing.length - 1] as string];
    requestExpanded(next, 'select');
  }, [currentValue, requestExpanded, resolvedAutoExpand, resolvedMultiple]);

  /** The rows the arrow keys walk, with the flyout's spliced in after its trigger. */
  const rows = useCallback((): HTMLElement[] => {
    if (root === null) return [];
    const inColumn = [...root.querySelectorAll<HTMLElement>(SIDE_NAVIGATION_ROW_SELECTOR)].filter(
      (row) => visible(row, root),
    );
    if (flyoutNode === null || currentFlyout === null) return inColumn;
    const inLayer = [...flyoutNode.querySelectorAll<HTMLElement>(SIDE_NAVIGATION_ROW_SELECTOR)];
    const at = inColumn.findIndex(
      (row) => row.closest('[data-part="item"]')?.getAttribute('data-value') === currentFlyout,
    );
    if (at === -1) return [...inColumn, ...inLayer];
    return [...inColumn.slice(0, at + 1), ...inLayer, ...inColumn.slice(at + 1)];
  }, [currentFlyout, flyoutNode, root]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (!target.matches(SIDE_NAVIGATION_ROW_SELECTOR)) return;

    if (event.key === 'Escape') {
      /* Inside the layer, the dismissable layer has already answered. */
      if (flyoutNode?.contains(target)) return;
      const group = target.closest<HTMLElement>('[data-part="group"]');
      const item = group?.parentElement;
      const itemValue = item?.getAttribute('data-value');
      if (!group || !item || !itemValue || !item.hasAttribute('data-expanded')) return;
      event.preventDefault();
      toggleExpanded(itemValue, false, 'escape', event.nativeEvent);
      item.querySelector<HTMLElement>(':scope > [data-part="trigger"]')?.focus();
      return;
    }

    const step =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? -1
          : 0;
    if (step === 0 && event.key !== 'Home' && event.key !== 'End') return;

    const all = rows();
    if (all.length === 0) return;
    event.preventDefault();
    const index = all.indexOf(target);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? all.length - 1
          : Math.min(all.length - 1, Math.max(0, index + step));
    all[next]?.focus();
  };

  useImperativeHandle<SideNavigationHandle, SideNavigationHandle>(
    ref,
    () => ({
      focus: () => rows()[0]?.focus(),
      expand: (itemValue) => toggleExpanded(itemValue, true, 'programmatic'),
      collapse: (itemValue) => toggleExpanded(itemValue, false, 'programmatic'),
      root,
    }),
    [root, rows, toggleExpanded],
  );

  const context = useMemo<SideNavigationContextValue>(
    () => ({
      autoExpand: resolvedAutoExpand,
      compact,
      expanded: currentExpanded,
      flyout: currentFlyout,
      flyoutNode,
      guides: resolvedGuides,
      isExpanded: (itemValue) => currentExpanded.includes(itemValue),
      measureTick,
      mode: resolvedMode,
      multiple: resolvedMultiple,
      registerItem,
      select,
      setFlyout,
      setFlyoutNode,
      size: resolvedSize,
      toggleExpanded,
      truncate: resolvedTruncate,
      value: currentValue,
    }),
    [
      compact,
      currentExpanded,
      currentFlyout,
      currentValue,
      flyoutNode,
      measureTick,
      registerItem,
      resolvedAutoExpand,
      resolvedGuides,
      resolvedMode,
      resolvedMultiple,
      resolvedSize,
      resolvedTruncate,
      select,
      setFlyout,
      toggleExpanded,
    ],
  );

  /* The name belongs to the landmark: the div inside the shell carries none,
     written or not, because the shell's nav region already says it. */
  const { 'aria-label': writtenLabel, ...unnamedProps } = nativeProps;
  const rootProps: SideNavigationRootProps = keyedProps({
    ...unnamedProps,
    ...(resolvedLandmark ? { 'aria-label': writtenLabel ?? t('navigation') } : {}),
    children,
    className,
    ...(compact ? { 'data-compact': '' as const } : {}),
    ...(resolvedGuides ? { 'data-guides': '' as const } : {}),
    'data-mode': resolvedMode,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-truncate': resolvedTruncate,
    'data-ui': 'side-navigation',
    onKeyDown: handleKeyDown,
    style,
  });

  const Element = resolvedLandmark ? 'nav' : 'div';

  return (
    <SideNavigationContext.Provider value={context}>
      {render === undefined ? <Element {...rootProps} ref={setRoot} /> : render(rootProps)}
    </SideNavigationContext.Provider>
  );
}
