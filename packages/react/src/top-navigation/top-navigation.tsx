import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/top-navigation/top-navigation.css';

import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { topNavigationMessages } from '@slotted/core/i18n';
import { COMPACT_BELOW, createWidthGate } from '@slotted/core/measure';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
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

import { useAppShellIfPresent } from '../app-shell';
import { useMessages } from '../i18n';
import { useTopNavigationDefaults } from './top-navigation-defaults';
import type {
  TopNavigationContextValue,
  TopNavigationHandle,
  TopNavigationMoreReason,
  TopNavigationPriority,
  TopNavigationProps,
  TopNavigationRootProps,
} from './top-navigation.types';

/**
 * The three steps of the bar's width, in CSS pixels, under which each
 * priority folds. The stylesheet reads the same three literals in its
 * container conditions and `top-navigation.styles.test.mjs` compares them
 * with the contract; this is the copy the script reads. `medium` is the
 * compact size class's limit, where app-shell overlays its regions.
 */
export const TOP_NAVIGATION_COLLAPSE_AT: Readonly<Record<TopNavigationPriority, number>> = {
  high: 480,
  low: 1024,
  medium: COMPACT_BELOW,
};

/** Every control a reader can land on in the bar, in DOM order. */
export const TOP_NAVIGATION_CONTROL_SELECTOR =
  '[data-part="skip"], [data-part="home"][href], [data-part="link"], [data-part="trigger"], [data-part="more"], [data-part="search"] input, [data-part="search-toggle"], [data-part="help"], [data-part="notifications"], [data-part="account"]';

const TopNavigationContext = createContext<TopNavigationContextValue | undefined>(undefined);

/**
 * What the bar around this part says. A part outside one has no width to
 * read and no panel to fold into, so this throws rather than rendering a row
 * that folds nowhere.
 */
export function useTopNavigation(): TopNavigationContextValue {
  const context = useContext(TopNavigationContext);
  if (context === undefined) {
    throw new Error('Every top-navigation part must be rendered inside TopNavigation.');
  }
  return context;
}

interface ItemRecord {
  current: boolean;
  order: number;
  priority: TopNavigationPriority;
}

/**
 * The bar across the top of an application: the mark, the context, the
 * destinations, the search and the global actions, folding by priority as
 * its own width goes.
 *
 * **Three values, three models.** `value` is the current destination,
 * `moreOpen` the panel and `searchOpen` the search, each on
 * `@slotted/core/state`. Which items fold is not a fourth: it is read from
 * the width and reported as a fact — `data-collapsed` on the item, the count
 * on `more`, `onCollapseChange` when the set moves.
 *
 * **The picture is the stylesheet's.** The container queries fold the items
 * before any script runs; the three width gates here write `data-collapsed`
 * from the same three numbers, count what folded, and move the folded parts
 * into the panel while it is present.
 *
 * **The panel is the same DOM.** A folded item, the context and the help are
 * rendered into the panel through `createPortal` while it is present, so a
 * section trigger keeps the menu wrapped around it and a link keeps its badge.
 */
export function TopNavigation({
  children,
  className,
  defaultMoreOpen,
  defaultSearchOpen,
  defaultValue,
  frame,
  landmark,
  messages,
  moreOpen,
  onCollapseChange,
  onMoreOpenChange,
  onSearchOpenChange,
  onValueChange,
  ref,
  render,
  searchOpen,
  size,
  skipTo,
  style,
  value,
  ...nativeProps
}: TopNavigationProps) {
  const defaults = useTopNavigationDefaults();
  const shell = useAppShellIfPresent();
  const baseId = useId();

  /**
   * The shell's banner is already the banner landmark and already paints the
   * bar's ground, so a bar inside it renders a div and paints nothing; an
   * explicit `landmark` or `frame` still wins over the shell.
   */
  const resolvedLandmark = landmark ?? (shell === undefined ? defaults.landmark : false);
  const resolvedFrame = frame ?? (shell === undefined ? defaults.frame : false);
  const t = useMessages(topNavigationMessages, messages);
  const resolvedSize = size ?? defaults.size;

  const [ownValue, setOwnValue] = useState<string | null>(defaultValue ?? null);
  const [ownMoreOpen, setOwnMoreOpen] = useState(defaultMoreOpen ?? false);
  const [ownSearchOpen, setOwnSearchOpen] = useState(defaultSearchOpen ?? false);
  const currentValue = value === undefined ? ownValue : value;
  const currentMoreOpen = moreOpen === undefined ? ownMoreOpen : moreOpen;
  const currentSearchOpen = searchOpen === undefined ? ownSearchOpen : searchOpen;

  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [underLow, setUnderLow] = useState(false);
  const [underMedium, setUnderMedium] = useState(false);
  const [underHigh, setUnderHigh] = useState(false);
  const [panelNode, setPanelNode] = useState<HTMLElement | null>(null);
  const [panelListNode, setPanelListNode] = useState<HTMLElement | null>(null);
  const [moreNode, setMoreNode] = useState<HTMLElement | null>(null);
  const [searchNode, setSearchNode] = useState<HTMLElement | null>(null);
  const [searchToggleNode, setSearchToggleNode] = useState<HTMLElement | null>(null);
  const [hasSearch, setHasSearch] = useState(false);
  const [hasContext, setHasContext] = useState(false);
  const [hasHelp, setHasHelp] = useState(false);
  const [panelStatus, setPanelStatus] = useState<PresenceStatus>('unmounted');

  const folded = useMemo(() => {
    const set = new Set<TopNavigationPriority>();
    if (underLow) set.add('low');
    if (underMedium) set.add('medium');
    if (underHigh) set.add('high');
    return set;
  }, [underHigh, underLow, underMedium]);

  /** Every item's priority and whether it is current, in the order they mounted. */
  const [items, setItems] = useState<ReadonlyMap<string, ItemRecord>>(() => new Map());
  const order = useRef(0);
  const registerItem = useCallback<TopNavigationContextValue['registerItem']>(
    (itemValue, priority, current) => {
      setItems((previous) => {
        const next = new Map(previous);
        next.set(itemValue, {
          current,
          order: previous.get(itemValue)?.order ?? (order.current += 1),
          priority,
        });
        return next;
      });
      return () => {
        setItems((previous) => {
          if (!previous.has(itemValue)) return previous;
          const next = new Map(previous);
          next.delete(itemValue);
          return next;
        });
      };
    },
    [],
  );

  const { collapsed, currentFolded } = useMemo(() => {
    const entries = [...items.entries()]
      .filter(([, record]) => folded.has(record.priority))
      .sort(([, a], [, b]) => a.order - b.order);
    return {
      collapsed: entries.map(([itemValue]) => itemValue),
      currentFolded: entries.some(
        ([itemValue, record]) => record.current || itemValue === currentValue,
      ),
    };
  }, [currentValue, folded, items]);

  const latest = useRef({
    currentMoreOpen,
    currentSearchOpen,
    currentValue,
    moreOpen,
    searchOpen,
    value,
  });
  latest.current = {
    currentMoreOpen,
    currentSearchOpen,
    currentValue,
    moreOpen,
    searchOpen,
    value,
  };

  const setMoreOpen = useCallback<TopNavigationContextValue['setMoreOpen']>(
    (next, reason, source) => {
      const state = createControllable<boolean>({
        controlled: latest.current.moreOpen,
        initial: latest.current.currentMoreOpen,
        onRequest: (request) => onMoreOpenChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnMoreOpen(next);
    },
    [onMoreOpenChange],
  );

  const setSearchOpen = useCallback<TopNavigationContextValue['setSearchOpen']>(
    (next, reason, source) => {
      const state = createControllable<boolean>({
        controlled: latest.current.searchOpen,
        initial: latest.current.currentSearchOpen,
        onRequest: (request) => onSearchOpenChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnSearchOpen(next);
    },
    [onSearchOpenChange],
  );

  const select = useCallback<TopNavigationContextValue['select']>(
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

  /** The three steps, measured: each gate reports once per crossing. */
  useEffect(() => {
    if (root === null) return undefined;
    const gates = [
      createWidthGate(root, { at: TOP_NAVIGATION_COLLAPSE_AT.low, onChange: setUnderLow }),
      createWidthGate(root, { at: TOP_NAVIGATION_COLLAPSE_AT.medium, onChange: setUnderMedium }),
      createWidthGate(root, { at: TOP_NAVIGATION_COLLAPSE_AT.high, onChange: setUnderHigh }),
    ];
    setUnderLow(gates[0]!.narrow());
    setUnderMedium(gates[1]!.narrow());
    setUnderHigh(gates[2]!.narrow());
    return () => {
      for (const gate of gates) gate.destroy();
    };
  }, [root]);

  /** The folded set is a fact the consumer is told about when it moves. */
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (root === null) return;
    const key = collapsed.join(' ');
    if (reported.current === key) return;
    const first = reported.current === null;
    reported.current = key;
    if (!first || collapsed.length > 0) onCollapseChange?.(collapsed, 'resize');
  }, [collapsed, onCollapseChange, root]);

  /**
   * Nothing folded takes the panel with it, and the width passing the medium
   * step takes the open search back to its place. Both are transitions, not
   * states: a bar that mounts narrow with `defaultMoreOpen` keeps its panel,
   * and the gates have to have measured before either answer counts.
   */
  const panelHolds = collapsed.length > 0 || (underMedium && hasContext) || (underHigh && hasHelp);
  const held = useRef(panelHolds);
  useEffect(() => {
    const before = held.current;
    held.current = panelHolds;
    if (before && !panelHolds && latest.current.currentMoreOpen) setMoreOpen(false, 'resize');
  }, [panelHolds, setMoreOpen]);

  const wasNarrow = useRef(underMedium);
  useEffect(() => {
    const before = wasNarrow.current;
    wasNarrow.current = underMedium;
    if (before && !underMedium && latest.current.currentSearchOpen) {
      setSearchOpen(false, 'resize');
    }
  }, [setSearchOpen, underMedium]);

  /** The panel stays through its exit, so the folded parts stay in it until it has left. */
  const presence = useRef<PresenceHandle | null>(null);
  useEffect(() => {
    const handle = createPresence({ present: false, onStatusChange: setPanelStatus });
    presence.current = handle;
    return () => {
      handle.destroy();
      presence.current = null;
    };
  }, []);
  useEffect(() => {
    presence.current?.setNode(panelNode);
  }, [panelNode]);
  useEffect(() => {
    presence.current?.sync(currentMoreOpen);
  }, [currentMoreOpen]);

  /** Escape and a press outside close the panel; `more` is a branch, so a press on it toggles. */
  useEffect(() => {
    if (panelNode === null || !currentMoreOpen) return undefined;
    const layer = createDismissableLayer(panelNode, {
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      ...(moreNode ? { branches: [moreNode] } : {}),
      onDismiss: (request) => {
        const reason: TopNavigationMoreReason =
          request.reason === 'escape' ? 'escape' : 'outsidePress';
        setMoreOpen(false, reason, request.source);
        if (reason === 'escape') moreNode?.focus();
      },
    });
    return () => layer.destroy();
  }, [currentMoreOpen, moreNode, panelNode, setMoreOpen]);

  const searchIsToggle = underMedium && hasSearch;

  useImperativeHandle<TopNavigationHandle, TopNavigationHandle>(
    ref,
    () => ({
      focus: () => root?.querySelector<HTMLElement>(TOP_NAVIGATION_CONTROL_SELECTOR)?.focus(),
      focusSearch: () => {
        if (searchIsToggle && !latest.current.currentSearchOpen) {
          setSearchOpen(true, 'programmatic');
          return;
        }
        searchNode?.querySelector<HTMLElement>('input, [contenteditable]')?.focus();
      },
      openMore: () => setMoreOpen(true, 'programmatic'),
      closeMore: () => setMoreOpen(false, 'programmatic'),
      root,
    }),
    [root, searchIsToggle, searchNode, setMoreOpen, setSearchOpen],
  );

  const ids = useMemo(() => ({ moreId: `${baseId}-more`, panelId: `${baseId}-panel` }), [baseId]);

  const context = useMemo<TopNavigationContextValue>(
    () => ({
      collapsed,
      currentFolded,
      folded,
      hasContext,
      hasHelp,
      hasSearch,
      ids,
      panelHolds,
      moreNode,
      moreOpen: currentMoreOpen,
      narrow: underMedium,
      narrowest: underHigh,
      panelListNode,
      panelNode,
      panelPresent: panelStatus !== 'unmounted',
      registerItem,
      searchNode,
      searchOpen: currentSearchOpen,
      searchToggleNode,
      select,
      setHasContext,
      setHasHelp,
      setHasSearch,
      setMoreNode,
      setMoreOpen,
      setPanelListNode,
      setPanelNode,
      setSearchNode,
      setSearchOpen,
      setSearchToggleNode,
      size: resolvedSize,
      t,
      value: currentValue,
    }),
    [
      collapsed,
      currentFolded,
      currentMoreOpen,
      currentSearchOpen,
      currentValue,
      folded,
      hasContext,
      hasHelp,
      hasSearch,
      ids,
      moreNode,
      panelHolds,
      panelListNode,
      panelNode,
      panelStatus,
      registerItem,
      resolvedSize,
      searchNode,
      searchToggleNode,
      select,
      setMoreOpen,
      setSearchOpen,
      t,
      underHigh,
      underMedium,
    ],
  );

  const rootProps: TopNavigationRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {skipTo !== undefined ? (
          <a data-part="skip" data-part-skip="" href={`#${skipTo}`}>
            {t('skip')}
          </a>
        ) : null}
        {children}
      </>
    ),
    className,
    ...(resolvedFrame ? { 'data-frame': '' as const } : {}),
    'data-part': 'root',
    ...(searchIsToggle && currentSearchOpen ? { 'data-search-open': '' as const } : {}),
    'data-size': resolvedSize,
    'data-ui': 'top-navigation',
    ref: setRoot,
    style,
  });

  const Element = resolvedLandmark ? 'header' : 'div';

  return (
    <TopNavigationContext.Provider value={context}>
      {render === undefined ? <Element {...rootProps} /> : render(rootProps)}
    </TopNavigationContext.Provider>
  );
}
