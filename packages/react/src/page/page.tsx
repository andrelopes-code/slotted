import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/page/page.css';

import { pageMessages } from '@slotted/core/i18n';
import { createPresence } from '@slotted/core/presence';
import type { PresenceStatus } from '@slotted/core/presence';
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Container } from '../container';
import { useMessages } from '../i18n';
import { HeadingLevel } from '../typography';
import { usePageDefaults } from './page-defaults';
import type {
  PageBodyProps,
  PageContextValue,
  PageFooterProps,
  PageProps,
  PageRootProps,
} from './page.types';

/** The custom property the scroller carries for what sticks above the footer. */
export const STICKY_BOTTOM_PROPERTY = '--slotted-page-sticky-bottom';

/**
 * The custom property the scroller carries for its own visible height: a
 * sticky element of the consumer's caps its height by it rather than by the
 * viewport, which an inset canvas makes taller than the scroller.
 */
export const SCROLLPORT_BLOCK_SIZE_PROPERTY = '--slotted-page-scrollport-block-size';

/** Writes a length only when it differs from the value already written. */
function writeLength(target: HTMLElement, property: string, length: number) {
  const value = `${length}px`;
  if (target.style.getPropertyValue(property) === value) return;
  target.style.setProperty(property, value);
}

const PageContext = createContext<PageContextValue | undefined>(undefined);

/** What the page around this part says, or nothing: a header standing alone is complete. */
export function usePage(): PageContextValue | undefined {
  return useContext(PageContext);
}

const useIsomorphicLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

/**
 * The inset lives on the body, so content written straight into the page is
 * drawn against the viewport's edges and nothing else says why. A header is
 * not that content — it carries its own inset — so it is the one child the
 * check passes over, and a `render` that produces the body part satisfies it.
 */
function warnWithoutBody(root: HTMLElement) {
  const scroll = root.querySelector(':scope > [data-part="scroll"]');
  if (scroll === null) return;
  const content = [...scroll.children].filter(
    (child) => child.getAttribute('data-ui') !== 'page-header',
  );
  if (content.length === 0) return;
  if (content.some((child) => child.getAttribute('data-part') === 'body')) return;
  console.warn(
    'Page has content outside PageBody. Content outside PageBody receives no inset: wrap it in PageBody.',
  );
}

/**
 * The column of a screen: who scrolls, how wide the content is, where the
 * footer stays, how much air the body has.
 *
 * **The header is a direct child of what scrolls.** There is no header part: a
 * `sticky` element never leaves the box that contains it, so a wrapper exactly
 * the header's height would pin nothing. A `PageHeader` written as the first
 * child of the page lands in the scroll part beside the body.
 *
 * **The footer is a prop.** It has to sit outside the scroll part — below the
 * scroller under `self`, stuck to the bottom of the root under `ancestor` —
 * and a child would be inside it. It is mounted while it is passed and held
 * through its exit by `@slotted/core/presence`, so the bar slides out rather
 * than vanishing.
 *
 * **The page steps the outline.** Its body is one `HeadingLevel` deeper, so a
 * section written directly in it takes `h2` under the header's `h1` without
 * either family reading the other.
 */
export function Page({
  children,
  className,
  fill,
  footer,
  ground,
  inset,
  landmark,
  loading,
  messages,
  ref,
  render,
  scroll,
  style,
  width,
  ...nativeProps
}: PageProps) {
  const defaults = usePageDefaults();
  const t = useMessages(pageMessages, messages);
  const resolvedGround = ground ?? defaults.ground;
  const resolvedInset = inset ?? defaults.inset;
  const resolvedLandmark = landmark ?? defaults.landmark;
  const resolvedScroll = scroll ?? defaults.scroll;
  const resolvedWidth = width ?? defaults.width;

  const context: PageContextValue = {
    ground: resolvedGround,
    inset: resolvedInset,
    loading: loading === true,
    scroll: resolvedScroll,
    t,
    width: resolvedWidth,
  };

  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isDevelopment && root !== null) warnWithoutBody(root);
  }, [root]);

  /**
   * The footer's height, written on the scroller so a table's sticky summary
   * stops above the bar, and the scroller's own visible height, so a sticky
   * element of the consumer's caps itself by the scroller and not the viewport. Under `self` the footer is outside the scroller and
   * covers nothing, so the property says nought.
   *
   * The property inherits, so every write invalidates style for everything
   * under the scroller: it is written only when the height changes, and a
   * footer mounting re-observes without taking the value down first.
   */
  useIsomorphicLayoutEffect(() => {
    if (root === null || typeof ResizeObserver === 'undefined') return undefined;
    const target = findScroller(root) ?? root.ownerDocument.documentElement;
    /* Under `self` the page's own scroll part is what scrolls. */
    const scroller =
      (resolvedScroll === 'self'
        ? root.querySelector<HTMLElement>(':scope > [data-part="scroll"]')
        : null) ?? target;
    const observer = new ResizeObserver(() => {
      const bar = root.querySelector<HTMLElement>(':scope > [data-part="footer"]');
      const height = resolvedScroll === 'self' ? 0 : (bar?.offsetHeight ?? 0);
      writeLength(target, STICKY_BOTTOM_PROPERTY, height);
      writeLength(target, SCROLLPORT_BLOCK_SIZE_PROPERTY, scroller.clientHeight);
    });
    observer.observe(root);
    observer.observe(scroller);
    const bar = root.querySelector<HTMLElement>(':scope > [data-part="footer"]');
    if (bar !== null) observer.observe(bar);
    return () => observer.disconnect();
  }, [root, resolvedScroll, footer !== undefined]);

  useIsomorphicLayoutEffect(() => {
    if (root === null) return undefined;
    const target = findScroller(root) ?? root.ownerDocument.documentElement;
    return () => {
      target.style.removeProperty(STICKY_BOTTOM_PROPERTY);
      target.style.removeProperty(SCROLLPORT_BLOCK_SIZE_PROPERTY);
    };
  }, [root]);

  const rootProps: PageRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        <div data-part="scroll" data-part-scroll="">
          {children}
        </div>
        <FooterPresence>{footer}</FooterPresence>
      </>
    ),
    className,
    ...(fill === true ? { 'data-fill': '' } : {}),
    'data-ground': resolvedGround,
    ...(loading === true ? { 'data-loading': '' } : {}),
    'data-part': 'root',
    'data-scroll': resolvedScroll,
    'data-ui': 'page',
    'data-width': resolvedWidth,
    style,
  });

  const attach = (node: HTMLElement | null) => {
    setRoot(node);
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  };

  const Root = resolvedLandmark === 'main' ? 'main' : 'div';

  return (
    <PageContext.Provider value={context}>
      {render === undefined ? <Root {...rootProps} ref={attach} /> : render(rootProps)}
    </PageContext.Provider>
  );
}

function findScroller(element: HTMLElement): HTMLElement | null {
  const view = element.ownerDocument.defaultView;
  let node = element.parentElement;
  while (view !== null && node !== null && node !== element.ownerDocument.body) {
    const overflow = view.getComputedStyle(node).overflowY;
    if (overflow === 'auto' || overflow === 'scroll') return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * Keeps the footer mounted through its exit. The status reaches the DOM on the
 * footer itself, which is what the stylesheet transitions on.
 */
function FooterPresence({ children }: { children: React.ReactNode }) {
  const present = children !== undefined && children !== null && children !== false;
  const [status, setStatus] = useState<PresenceStatus>(present ? 'open' : 'unmounted');
  const last = useRef(children);
  if (present) last.current = children;
  const presence = useRef(
    createPresence({
      present,
      skipInitialAnimation: true,
      onStatusChange: (next) => setStatus(next),
    }),
  );

  useEffect(() => {
    presence.current.sync(present);
  }, [present]);

  /* Stopped, not destroyed: StrictMode mounts again on the same handle. */
  useEffect(() => {
    const handle = presence.current;
    return () => handle.stop();
  }, []);

  if (status === 'unmounted') return null;
  return (
    <FooterStatusContext.Provider value={{ status, setNode: presence.current.setNode }}>
      {present ? children : last.current}
    </FooterStatusContext.Provider>
  );
}

const FooterStatusContext = createContext<{
  status: PresenceStatus;
  setNode: (node: HTMLElement | null) => void;
}>({ status: 'open', setNode: () => {} });

/**
 * The padded column: one container at the page's width and inset, and one
 * outline step deeper than the header.
 */
export function PageBody({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: PageBodyProps) {
  const page = usePage();
  const rootProps = keyedProps({
    ...nativeProps,
    ...(page?.loading ? { 'aria-busy': true as const } : {}),
    children: (
      <Container inset={page?.inset} size={page?.width}>
        <HeadingLevel>{children}</HeadingLevel>
      </Container>
    ),
    className,
    'data-part': 'body',
    style,
  });

  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/**
 * The bar for the actions that finish the task. In the flow and never fixed:
 * it takes its own height, so the last line of content scrolls up to it
 * rather than under it. Its actions sit in one wrapping row aligned to the
 * end, inside a container at the page's measure.
 */
export function PageFooter({
  'aria-label': ariaLabel,
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: PageFooterProps) {
  const page = usePage();
  /* A footer outside a page still speaks the language in force. */
  const own = useMessages(pageMessages);
  const t = page?.t ?? own;
  const { setNode, status } = useContext(FooterStatusContext);
  const rootProps = keyedProps({
    ...nativeProps,
    'aria-label': ariaLabel ?? t('footer'),
    children: (
      <Container inset={page?.inset} size={page?.width}>
        <div data-part="actions" data-part-actions="">
          {children}
        </div>
      </Container>
    ),
    className,
    'data-part': 'footer',
    'data-status': status,
    style,
  });

  if (render !== undefined) return render(rootProps);
  return (
    <footer
      {...rootProps}
      ref={(node) => {
        setNode(node);
        if (typeof ref === 'function') ref(node);
        else if (ref !== null && ref !== undefined) ref.current = node;
      }}
    />
  );
}
