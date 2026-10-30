import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/detail-panel/detail-panel.css';

import { detailPanelMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import { findScrollParent } from '@slotted/core/sticky-header';
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

import { Container } from '../container';
import { useMessages } from '../i18n';
import { usePage } from '../page';
import { PageHeaderDefaultsProvider } from '../page-header';
import { useDetailPanelDefaults } from './detail-panel-defaults';
import type {
  DetailPanelContextValue,
  DetailPanelIdentity,
  DetailPanelProps,
  DetailPanelRootProps,
  DetailPanelSectionEntry,
  DetailPanelSectionReason,
} from './detail-panel.types';

const DetailPanelContext = createContext<DetailPanelContextValue | undefined>(undefined);

/** What the panel around this part says. A part outside one has no model to read. */
export function useDetailPanel(): DetailPanelContextValue {
  const context = useContext(DetailPanelContext);
  if (context === undefined) {
    throw new Error('A DetailPanel part must be rendered inside DetailPanel.');
  }
  return context;
}

/** The selector for the heading the panel is named by and focuses: the page-header's. */
const HEADING_SELECTOR = ':scope > [data-ui="page-header"] [data-part="heading"]';

/** Registered sections in the order the document holds them, which is the only order that is never stale. */
function inDocumentOrder(entries: Iterable<DetailPanelSectionEntry>): DetailPanelSectionEntry[] {
  return [...entries].sort((a, b) => {
    if (a.element === null || b.element === null) return 0;
    const position = a.element.compareDocumentPosition(b.element);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

/**
 * One record on screen: what identifies it, what state it is in, what can be
 * done to it, and what happened to it.
 *
 * **The top is a `PageHeader` the consumer writes**, the root's first child.
 * The panel provides its `level` and `size` as the header's defaults, so a
 * header that states neither takes the panel's; one that does still wins.
 *
 * **One value moves: the current section.** Under `layout="tabs"` the strip
 * (`DetailPanelTabs`, placed in the header's tabs slot) asks with `pointer`
 * or `keyboard`; under `stacked` the value arrives as `programmatic` — a
 * link, the URL, `scrollToSection()` — and the named section is scrolled
 * under the chrome and marked `data-current`. The request can be cancelled.
 *
 * **Focus follows the record.** When `recordKey` changes while focus is
 * inside the root, the heading takes focus and the scroller returns to its
 * start; when focus is elsewhere nothing moves.
 */
export function DetailPanel({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  aside,
  children,
  className,
  defaultSection,
  footer,
  layout,
  level,
  loading,
  messages,
  mount,
  onSectionChange,
  recordKey,
  ref,
  render,
  scroll,
  section,
  size,
  status,
  style,
  ...nativeProps
}: DetailPanelProps) {
  const defaults = useDetailPanelDefaults();
  const page = usePage();

  const resolvedAside = aside ?? defaults.aside;
  const resolvedLayout = layout ?? defaults.layout;
  const resolvedLevel = level ?? defaults.level;
  const resolvedMount = mount ?? defaults.mount;
  const resolvedScroll = scroll ?? defaults.scroll;
  const resolvedSize = size ?? defaults.size;
  const resolvedStatus = status ?? 'ready';
  const resolvedLoading = loading === true;
  const t = useMessages(detailPanelMessages, messages);

  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [headingId, setHeadingId] = useState<string | undefined>(undefined);
  const [registry, setRegistry] = useState<Map<string, DetailPanelSectionEntry>>(() => new Map());
  const [identify, setIdentify] = useState<((name: string) => DetailPanelIdentity) | undefined>(
    undefined,
  );

  const [own, setOwn] = useState<string | undefined>(defaultSection);
  const current = section ?? own;
  const sections = useMemo(() => inDocumentOrder(registry.values()), [registry]);
  /** A strip with nothing selected shows no panel, so under tabs the first section stands in. */
  const effective = current ?? (resolvedLayout === 'tabs' ? sections[0]?.name : undefined);

  const seen = useRef(new Set<string>());
  if (effective !== undefined) seen.current.add(effective);

  const latest = useRef({ current: effective, onSectionChange, section });
  latest.current = { current: effective, onSectionChange, section };

  const select = useCallback((name: string, reason: DetailPanelSectionReason, source: unknown) => {
    if (name === latest.current.current) return;
    let cancelled = false;
    const state = createControllable<string | undefined>({
      controlled: latest.current.section,
      initial: latest.current.current,
      onRequest: (request) => {
        latest.current.onSectionChange?.(request.value, request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(name, reason, source);
    if (cancelled) return;
    if (moved) setOwn(name);
  }, []);

  const register = useCallback((entry: DetailPanelSectionEntry) => {
    setRegistry((previous) => new Map(previous).set(entry.name, entry));
    return () => {
      setRegistry((previous) => {
        if (previous.get(entry.name) !== entry) return previous;
        const next = new Map(previous);
        next.delete(entry.name);
        return next;
      });
    };
  }, []);

  const attachIdentify = useCallback(
    (next: ((name: string) => DetailPanelIdentity) | undefined) => {
      setIdentify(() => next);
    },
    [],
  );

  /**
   * The root is named by the page-header's heading, which is in the DOM
   * once the consumer's header has rendered. Read there rather than passed,
   * because the heading's id is the page-header's to give. A consumer's own
   * `aria-label` or `aria-labelledby` wins and nothing is read.
   */
  useEffect(() => {
    if (root === null || ariaLabel !== undefined || ariaLabelledby !== undefined) return;
    const heading = root.querySelector<HTMLElement>(HEADING_SELECTOR);
    setHeadingId(heading?.id || undefined);
  }, [root, ariaLabel, ariaLabelledby, recordKey, resolvedLoading]);

  const focusHeading = useCallback(() => {
    const heading = root?.querySelector<HTMLElement>(HEADING_SELECTOR);
    if (!heading) return;
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }, [root]);

  const scroller = useCallback(() => {
    if (root === null) return null;
    return resolvedScroll === 'self' ? root : findScrollParent(root);
  }, [root, resolvedScroll]);

  /**
   * Focus follows the record. The first key is the record the panel opened
   * on and moves nothing; a later one is the previous or next control, or
   * the application, changing what is under the reader.
   */
  const seenKey = useRef(recordKey);
  useEffect(() => {
    if (seenKey.current === recordKey) return;
    seenKey.current = recordKey;
    if (root === null) return;
    const active = root.ownerDocument.activeElement;
    if (active === null || !root.contains(active)) return;
    scroller()?.scrollTo({ top: 0 });
    focusHeading();
  }, [recordKey, root, scroller, focusHeading]);

  /**
   * Under `stacked` the current section is a place, so a value that arrived
   * is scrolled under the chrome — `scroll-margin-block-start` reads the
   * chrome's height. Under `tabs` the value is a panel and nothing scrolls.
   */
  const scrolledTo = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (resolvedLayout !== 'stacked' || effective === undefined) return;
    if (scrolledTo.current === effective) return;
    scrolledTo.current = effective;
    registry.get(effective)?.element?.scrollIntoView({ block: 'start' });
  }, [effective, registry, resolvedLayout]);

  useImperativeHandle(
    ref,
    () => ({
      get element() {
        return root;
      },
      focus: focusHeading,
      scrollToSection: (name: string) => {
        scrolledTo.current = undefined;
        select(name, 'programmatic', undefined);
      },
    }),
    [root, focusHeading, select],
  );

  const context: DetailPanelContextValue = {
    aside: resolvedAside,
    attachIdentify,
    current: effective,
    identify,
    layout: resolvedLayout,
    level: resolvedLevel,
    loading: resolvedLoading,
    mount: resolvedMount,
    register,
    sections,
    seen: (name) => seen.current.has(name),
    select,
    size: resolvedSize,
    status: resolvedStatus,
    t,
  };

  const rootProps: DetailPanelRootProps = keyedProps({
    ...nativeProps,
    ...(ariaLabel !== undefined
      ? { 'aria-label': ariaLabel }
      : ariaLabelledby !== undefined
        ? { 'aria-labelledby': ariaLabelledby }
        : headingId !== undefined
          ? { 'aria-labelledby': headingId }
          : resolvedLoading
            ? { 'aria-label': t('loading') }
            : {}),
    ...(resolvedLoading ? { 'aria-busy': true as const, 'data-loading': '' as const } : {}),
    children: (
      <PageHeaderDefaultsProvider level={resolvedLevel} size={resolvedSize}>
        {children}
        {footer !== undefined && footer !== null && footer !== false ? (
          <footer data-part="footer" data-part-footer="">
            <Container inset={page?.inset} size={page?.width}>
              {footer}
            </Container>
          </footer>
        ) : null}
      </PageHeaderDefaultsProvider>
    ),
    className,
    'data-aside': resolvedAside,
    ...(recordKey !== undefined ? { 'data-key': String(recordKey) } : {}),
    'data-layout': resolvedLayout,
    'data-level': resolvedLevel,
    'data-mount': resolvedMount,
    'data-part': 'root',
    'data-scroll': resolvedScroll,
    'data-size': resolvedSize,
    'data-status': resolvedStatus,
    'data-ui': 'detail-panel',
    style,
  });

  return (
    <DetailPanelContext.Provider value={context}>
      {render === undefined ? (
        <article {...rootProps} ref={setRoot} />
      ) : (
        render({ ...rootProps, ref: setRoot })
      )}
    </DetailPanelContext.Provider>
  );
}
