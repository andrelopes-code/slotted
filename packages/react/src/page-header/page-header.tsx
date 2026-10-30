import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/page-header/page-header.css';

import { pageHeaderMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import { createStickyHeader } from '@slotted/core/sticky-header';
import type { StickyHeaderHandle } from '@slotted/core/sticky-header';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { Container } from '../container';
import { useMessages } from '../i18n';
import { usePage } from '../page';
import { usePageHeaderDefaults } from './page-header-defaults';
import type {
  PageHeaderContextValue,
  PageHeaderExpandedReason,
  PageHeaderPinnedReason,
  PageHeaderProps,
  PageHeaderRootProps,
} from './page-header.types';

const PageHeaderContext = createContext<PageHeaderContextValue | undefined>(undefined);

/**
 * What the header around this part says. A part outside one has no state to
 * report, so this throws rather than rendering a control that does nothing.
 */
export function usePageHeader(): PageHeaderContextValue {
  const context = useContext(PageHeaderContext);
  if (context === undefined) {
    throw new Error('A PageHeader part must be rendered inside PageHeader.');
  }
  return context;
}

const useIsomorphicLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * The body of the page a header heads, while that page fills: nothing
 * scrolls outside it there, so its principal scroller is what snaps the area.
 * Read from the DOM on every scroll, so a page that turns `fill` on or off is
 * followed without rebuilding the engine.
 */
function filledBody(root: HTMLElement): HTMLElement | null {
  const page = root.closest<HTMLElement>('[data-ui="page"]');
  if (page === null || !page.hasAttribute('data-fill')) return null;
  return page.querySelector<HTMLElement>(':scope > [data-part="scroll"] > [data-part="body"]');
}

/**
 * The shell of a screen's top: a title area that never leaves, a header area
 * that scrolls away under it and comes back, a pill of controls on the
 * chrome's edge, and a slot for tabs. SAP Fiori's Dynamic Page, rebuilt on one
 * sticky root.
 *
 * **The stylesheet does the moving.** The root is `position: sticky` with a
 * negative offset the size of the header area, measured here into
 * `--slotted-page-header-collapse`. Scrolling takes the area under the title
 * and leaves the title where it is; nothing is animated on scroll, because
 * the scroll is the movement.
 *
 * **Two values a consumer may own.** `expanded` moves by the toggle, by the
 * pin, by the application and by the scroll, and the request says which —
 * `scroll` is a reason of its own, so a product saving the reader's
 * preference persists the click and ignores the scroll. `pinned` moves by the
 * pin and by the application.
 *
 * **What the scroll knows is a fact.** `data-scrolled` says the scroll has
 * passed the area; `data-revealed` says the area was opened whole in place
 * after it had. Both come from `@slotted/core/sticky-header`, which the
 * Angular binding drives the same way.
 */
export function PageHeader({
  children,
  className,
  collapse,
  defaultExpanded,
  defaultPinned,
  expanded,
  level,
  loading,
  material,
  messages,
  onExpandedChange,
  onPinnedChange,
  pinned,
  ref,
  render,
  size,
  style,
  variant,
  ...nativeProps
}: PageHeaderProps) {
  const defaults = usePageHeaderDefaults();
  const page = usePage();
  const baseId = useId();

  const resolvedCollapse = collapse ?? defaults.collapse;
  const resolvedLevel = level ?? defaults.level;
  const resolvedMaterial = material ?? defaults.material;
  const resolvedSize = size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;
  const t = useMessages(pageHeaderMessages, messages);

  const [ownExpanded, setOwnExpanded] = useState<boolean>(defaultExpanded ?? true);
  const [ownPinned, setOwnPinned] = useState<boolean>(defaultPinned ?? false);
  const currentExpanded = expanded ?? ownExpanded;
  const currentPinned = pinned ?? ownPinned;

  const [scrolled, setScrolled] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [tall, setTall] = useState(false);
  const [compact, setCompact] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const engine = useRef<StickyHeaderHandle | null>(null);

  /** The latest values, for the engine's synchronous reads. */
  const latest = useRef({
    collapse: resolvedCollapse,
    expanded: currentExpanded,
    pinned: currentPinned,
  });
  latest.current = {
    collapse: resolvedCollapse,
    expanded: currentExpanded,
    pinned: currentPinned,
  };

  const callbacks = useRef({ onExpandedChange, onPinnedChange });
  callbacks.current = { onExpandedChange, onPinnedChange };

  /**
   * Who asked for the move the next render will show. The engine is told once
   * the value has actually changed — in controlled mode that is when the
   * consumer's new value arrives, and a value the application changed with no
   * request at all is reported as `programmatic`.
   */
  const expandedBy = useRef<'control' | 'pin' | 'programmatic' | 'scroll'>('programmatic');
  const seenExpanded = useRef(currentExpanded);
  /* Layout effects, not passive ones: the engine must hear of the change
     before the browser computes style for it, so the fold it arms is instant
     rather than a transition already under way. */
  useIsomorphicLayoutEffect(() => {
    if (seenExpanded.current === currentExpanded) return;
    seenExpanded.current = currentExpanded;
    engine.current?.expandedChanged(currentExpanded, expandedBy.current);
    expandedBy.current = 'programmatic';
  }, [currentExpanded]);

  const seenPinned = useRef(currentPinned);
  useIsomorphicLayoutEffect(() => {
    if (seenPinned.current === currentPinned) return;
    seenPinned.current = currentPinned;
    engine.current?.pinnedChanged(currentPinned);
  }, [currentPinned]);

  function requestExpanded(
    next: boolean,
    reason: PageHeaderExpandedReason,
    source: unknown,
    by: 'control' | 'pin' | 'programmatic' | 'scroll',
  ) {
    if (next === latest.current.expanded) return;
    let cancelled = false;
    const state = createControllable<boolean>({
      controlled: expanded,
      initial: latest.current.expanded,
      onRequest: (request) => {
        callbacks.current.onExpandedChange?.(request.value, request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return;
    expandedBy.current = by;
    if (moved) {
      latest.current.expanded = next;
      setOwnExpanded(next);
    }
  }

  function requestPinned(next: boolean, reason: PageHeaderPinnedReason, source: unknown) {
    if (next === latest.current.pinned) return;
    let cancelled = false;
    const state = createControllable<boolean>({
      controlled: pinned,
      initial: latest.current.pinned,
      onRequest: (request) => {
        callbacks.current.onPinnedChange?.(request.value, request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return;
    if (moved) {
      latest.current.pinned = next;
      setOwnPinned(next);
    }
    /* A pinned header is by definition an open one. */
    if (next && !latest.current.expanded) requestExpanded(true, 'programmatic', source, 'pin');
  }

  const setExpanded = (next: boolean, reason: PageHeaderExpandedReason, source: unknown) => {
    /* Collapsing by the toggle while pinned lets the pin go first. */
    if (!next && latest.current.pinned) requestPinned(false, 'programmatic', source);
    requestExpanded(next, reason, source, reason === 'programmatic' ? 'programmatic' : 'control');
  };

  const setPinned = (next: boolean, reason: PageHeaderPinnedReason, source: unknown) => {
    requestPinned(next, reason, source);
  };

  useImperativeHandle(
    ref,
    () => ({
      element: root,
      expand: () => requestExpanded(true, 'programmatic', undefined, 'programmatic'),
      collapse: () => {
        if (latest.current.pinned) requestPinned(false, 'programmatic', undefined);
        requestExpanded(false, 'programmatic', undefined, 'programmatic');
      },
      pin: () => requestPinned(true, 'programmatic', undefined),
      unpin: () => requestPinned(false, 'programmatic', undefined),
    }),
    [root, expanded, pinned],
  );

  /**
   * The engine attaches once the root exists. It reads the parts off the
   * root with a scoped query rather than through refs, because the parts are
   * the consumer's to arrange and a part that is not written is simply
   * absent.
   */
  useIsomorphicLayoutEffect(() => {
    if (root === null) return undefined;
    const part = (name: string) =>
      root.querySelector<HTMLElement>(`:scope > * > [data-part="${name}"]`);
    const handle = createStickyHeader({
      root,
      area: () => part('header-area'),
      chrome: () =>
        [part('title-area'), part('controls'), part('tabs')].filter(
          (element): element is HTMLElement => element !== null,
        ),
      state: () => latest.current,
      onScrolled: setScrolled,
      onRevealed: setRevealed,
      onScrollRequest: (next) => requestExpanded(next, 'scroll', undefined, 'scroll'),
      onTall: setTall,
      onCompact: setCompact,
      onStuck: setStuck,
      onPinRequest: (next) => requestPinned(next, 'programmatic', undefined),
      contained: () => filledBody(root),
    });
    engine.current = handle;
    return () => {
      handle.destroy();
      engine.current = null;
    };
    // The engine re-reads state through `latest`; it is rebuilt only with the root or the axis.
  }, [root, resolvedCollapse]);

  /* The parts the consumer projects arrive after the first measurement. */
  useEffect(() => {
    engine.current?.refresh();
  });

  const context: PageHeaderContextValue = {
    collapse: resolvedCollapse,
    expanded: currentExpanded,
    ids: { areaId: `${baseId}area`, headingId: `${baseId}heading` },
    level: resolvedLevel,
    loading: loading === true,
    t,
    pinned: currentPinned,
    revealed,
    scrolled,
    size: resolvedSize,
    setExpanded,
    setPinned,
  };

  const rootProps: PageHeaderRootProps = keyedProps({
    ...nativeProps,
    ...(loading === true ? { 'aria-busy': true } : {}),
    children: (
      <Container inset={page?.inset} size={page?.width ?? 'content'}>
        {children}
      </Container>
    ),
    className,
    'data-collapse': resolvedCollapse,
    ...(currentExpanded ? { 'data-expanded': '' } : {}),
    'data-level': resolvedLevel,
    ...(loading === true ? { 'data-loading': '' } : {}),
    ...(resolvedMaterial ? { 'data-material': '' } : {}),
    'data-part': 'root',
    ...(revealed ? { 'data-revealed': '' } : {}),
    ...(scrolled ? { 'data-scrolled': '' } : {}),
    ...(tall ? { 'data-tall': '' } : {}),
    ...(compact ? { 'data-compact': '' } : {}),
    'data-size': resolvedSize,
    ...(stuck ? { 'data-stuck': '' } : {}),
    'data-ui': 'page-header',
    'data-variant': resolvedVariant,
    style,
  });

  return (
    <PageHeaderContext.Provider value={context}>
      {render === undefined ? <header {...rootProps} ref={setRoot} /> : render(rootProps)}
    </PageHeaderContext.Provider>
  );
}
