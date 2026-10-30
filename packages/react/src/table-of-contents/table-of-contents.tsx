import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/table-of-contents/table-of-contents.css';

import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { tableOfContentsMessages } from '@slotted/core/i18n';
import { collectOutline } from '@slotted/core/outline';
import type { OutlineEntry } from '@slotted/core/outline';
import {
  createScrollSpy,
  focusTarget,
  landOn,
  prefersReducedMotion,
  readStickyTop,
  resolveScroller,
} from '@slotted/core/scroll-spy';
import type { ScrollSpyHandle } from '@slotted/core/scroll-spy';
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
import type { KeyboardEvent, ReactNode, RefObject } from 'react';

import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { Skeleton } from '../skeleton';
import { TableOfContentsContext } from './table-of-contents-context';
import { useTableOfContentsDefaults } from './table-of-contents-defaults';
import {
  TableOfContentsGroup,
  TableOfContentsItem,
  TableOfContentsLink,
} from './table-of-contents-parts';
import type {
  TableOfContentsContextValue,
  TableOfContentsHandle,
  TableOfContentsItemData,
  TableOfContentsOpenReason,
  TableOfContentsProps,
  TableOfContentsRootProps,
  TableOfContentsValueReason,
} from './table-of-contents.types';

/**
 * The tolerance under the reading line: a target whose top is within it is
 * taken as reached, so a heading landed on by a press — sitting exactly at
 * the line, give or take a subpixel — is the one marked. Ant's `bounds`.
 */
export const TABLE_OF_CONTENTS_BOUNDS = 4;

/** How many skeleton rows the list draws while loading. */
const SKELETON_ROWS = ['72%', '56%', '80%', '48%'];

function resolveElement(
  ref: RefObject<HTMLElement | null> | HTMLElement | null | undefined,
): HTMLElement | null | undefined {
  if (ref === undefined || ref === null) return ref;
  return ref instanceof HTMLElement ? ref : ref.current;
}

function renderItems(items: readonly TableOfContentsItemData[]): ReactNode {
  return items.map((item) => (
    <TableOfContentsItem key={item.id} value={item.id}>
      <TableOfContentsLink>{item.label}</TableOfContentsLink>
      {item.children !== undefined && item.children.length > 0 ? (
        <TableOfContentsGroup>{renderItems(item.children)}</TableOfContentsGroup>
      ) : null}
    </TableOfContentsItem>
  ));
}

function fromOutline(entries: readonly OutlineEntry[]): TableOfContentsItemData[] {
  return entries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    children: fromOutline(entry.children),
  }));
}

/**
 * A list of links into the document the reader is in, with the link of the
 * place in view marked.
 *
 * **Three ways in, one list.** `children` written as parts, `items` as data,
 * or `source` — a region whose headings are read after mount by
 * `@slotted/core/outline`. Whichever way, every link registers its target
 * here, and the set of registered targets is what the spy watches and the
 * keyboard walks.
 *
 * **Two values, two models.** `value` is the current target and `open` is
 * whether the collapsed list is shown, both over `@slotted/core/state`. The
 * spy asks `value` to move with the reason `scroll`; a press asks with
 * `pointer` or `keyboard` before it scrolls, and the scroll happens whether
 * or not the request is accepted, because the navigation is the anchor's and
 * not the state's.
 *
 * **The chrome is read, never measured.** `--slotted-page-sticky-top` on the
 * scroller is the reading line's origin and where a target lands, read at
 * every recomputation because `page`'s header changes height as it collapses.
 */
export function TableOfContents({
  children,
  className,
  defaultOpen,
  defaultValue,
  exclude,
  history,
  items,
  label,
  landmark,
  layout,
  levels,
  loading = false,
  messages,
  numbered,
  offset,
  onKeyDown,
  onOpenChange,
  onValueChange,
  open,
  ref,
  render,
  scroller,
  size,
  source,
  sticky,
  style,
  value,
  ...nativeProps
}: TableOfContentsProps) {
  const defaults = useTableOfContentsDefaults();
  const resolvedHistory = history ?? defaults.history;
  const resolvedLandmark = landmark ?? defaults.landmark;
  const resolvedLayout = layout ?? defaults.layout;
  const resolvedLevels = levels ?? defaults.levels;
  const resolvedNumbered = numbered ?? defaults.numbered;
  const resolvedOffset = offset ?? defaults.offset;
  const resolvedSize = size ?? defaults.size;
  const resolvedSticky = sticky ?? defaults.sticky;
  const t = useMessages(tableOfContentsMessages, messages);

  const [ownValue, setOwnValue] = useState<string | null>(defaultValue ?? null);
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const currentValue = value === undefined ? ownValue : value;
  const currentOpen = open === undefined ? ownOpen : open;
  const collapsed = resolvedLayout === 'collapsed';
  const shown = collapsed ? currentOpen : true;

  const id = useId();
  const panelId = `${id}-panel`;
  const labelId = `${id}-label`;

  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [outline, setOutline] = useState<OutlineEntry[]>([]);
  const [registrationTick, setRegistrationTick] = useState(0);
  const pendingFocus = useRef(false);

  /** Every link's target, in registration order, with a way to read its label. */
  const links = useRef(new Map<string, () => string>());
  const registerLink = useCallback((linkId: string, readLabel: () => string) => {
    links.current.set(linkId, readLabel);
    setRegistrationTick((tick) => tick + 1);
    return () => {
      links.current.delete(linkId);
      setRegistrationTick((tick) => tick + 1);
    };
  }, []);

  const latest = useRef({ currentOpen, currentValue, open, value });
  latest.current = { currentOpen, currentValue, open, value };

  const requestValue = useCallback(
    (next: string | null, reason: TableOfContentsValueReason, source?: unknown) => {
      const state = createControllable<string | null>({
        controlled: latest.current.value,
        initial: latest.current.currentValue,
        onRequest: (request) => onValueChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnValue(next);
    },
    [onValueChange],
  );

  const requestOpen = useCallback(
    (next: boolean, reason: TableOfContentsOpenReason, source?: unknown) => {
      const state = createControllable<boolean>({
        controlled: latest.current.open,
        initial: latest.current.currentOpen,
        onRequest: (request) => onOpenChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnOpen(next);
    },
    [onOpenChange],
  );

  /** The targets in document order, resolved from the registered ids. */
  const targets = useCallback((): HTMLElement[] => {
    if (root === null) return [];
    const doc = root.ownerDocument;
    return [...links.current.keys()]
      .map((linkId) => doc.getElementById(linkId))
      .filter((element): element is HTMLElement => element !== null)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  }, [root]);

  const spy = useRef<ScrollSpyHandle | null>(null);
  const resolvedScroller = resolveElement(scroller);

  const scrollerOf = useCallback(
    () => spy.current?.scroller() ?? resolvedScroller ?? null,
    [resolvedScroller],
  );

  /** The headings of `source`, read after mount and again when the region changes. */
  const sourceElement = resolveElement(source);
  useEffect(() => {
    if (sourceElement === null || sourceElement === undefined) return undefined;
    const read = () =>
      setOutline(
        collectOutline(sourceElement, {
          levels: resolvedLevels,
          ...(exclude !== undefined ? { exclude } : {}),
        }),
      );
    read();
    if (typeof MutationObserver === 'undefined') return undefined;
    const observer = new MutationObserver(read);
    observer.observe(sourceElement, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [exclude, resolvedLevels, sourceElement]);

  /** The spy, rebuilt when the targets, the scroller or the offset change. */
  useEffect(() => {
    if (root === null || links.current.size === 0) return undefined;
    const doc = root.ownerDocument;
    const scrollerElement =
      resolvedScroller === undefined ? resolveScroller(targets()) : resolvedScroller;
    const handle = createScrollSpy({
      targets,
      scroller: scrollerElement,
      line: () => readStickyTop(scrollerElement, doc) + resolvedOffset + TABLE_OF_CONTENTS_BOUNDS,
      onChange: (next) => requestValue(next, 'scroll'),
      own: root,
    });
    spy.current = handle;

    /* A deep link the browser jumped to on load landed under the chrome: land it again, instantly. */
    const hash = doc.defaultView?.location.hash.slice(1) ?? '';
    if (hash !== '' && links.current.has(hash)) {
      const target = doc.getElementById(hash);
      if (target !== null) {
        landOn(target, {
          scroller: handle.scroller(),
          chrome: readStickyTop(handle.scroller(), doc),
          offset: resolvedOffset,
          behavior: 'instant',
        });
      }
    }
    return () => {
      handle.destroy();
      spy.current = null;
    };
    /* registrationTick is the set of targets, read through the ref. */
  }, [registrationTick, requestValue, resolvedOffset, resolvedScroller, root, targets]);

  const navigate = useCallback(
    (linkId: string, reason: 'pointer' | 'keyboard' | 'programmatic', source?: Event) => {
      if (root === null) return;
      const doc = root.ownerDocument;
      const view = doc.defaultView;
      const target = doc.getElementById(linkId);
      requestValue(linkId, reason, source);
      if (target === null || view === null) return;
      /* The choice holds against the end-of-scroller rule until the reader scrolls by a gesture. */
      spy.current?.pin(linkId);
      const scrollerElement = scrollerOf();
      landOn(target, {
        scroller: scrollerElement,
        chrome: readStickyTop(scrollerElement, doc),
        offset: resolvedOffset,
        behavior: prefersReducedMotion(view) ? 'instant' : 'smooth',
      });
      if (reason !== 'programmatic' && resolvedHistory !== 'none') {
        const url = `#${linkId}`;
        if (resolvedHistory === 'push') view.history.pushState(null, '', url);
        else view.history.replaceState(null, '', url);
      }
      focusTarget(target);
      if (collapsed && latest.current.currentOpen) requestOpen(false, 'select', source);
    },
    [collapsed, requestOpen, requestValue, resolvedHistory, resolvedOffset, root, scrollerOf],
  );

  /** The marker, measured against the panel from the current link's box. */
  useLayoutEffect(() => {
    const marker = markerRef.current;
    if (panel === null || marker === null) return undefined;
    const measure = () => {
      const link = panel.querySelector<HTMLElement>('[data-part="link"][data-current]');
      if (link === null) {
        marker.style.removeProperty('--_marker-start');
        marker.style.removeProperty('--_marker-size');
        return;
      }
      const panelRect = panel.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const rtl = getComputedStyle(panel).direction === 'rtl';
      if (resolvedLayout === 'horizontal') {
        const start = rtl
          ? panelRect.right - linkRect.right - panel.scrollLeft
          : linkRect.left - panelRect.left + panel.scrollLeft;
        marker.style.setProperty('--_marker-start', `${start}px`);
        marker.style.setProperty('--_marker-size', `${linkRect.width}px`);
        /* The current link is kept in view without moving the page: the panel alone scrolls. */
        const from = rtl ? panelRect.right - linkRect.right : linkRect.left - panelRect.left;
        const room = panelRect.width;
        if (from < 0 || from + linkRect.width > room) {
          const delta = from < 0 ? from : from + linkRect.width - room;
          panel.scrollBy({ left: rtl ? -delta : delta, behavior: 'smooth' });
        }
      } else {
        const start = linkRect.top - panelRect.top + panel.scrollTop;
        marker.style.setProperty('--_marker-start', `${start}px`);
        marker.style.setProperty('--_marker-size', `${linkRect.height}px`);
        const from = linkRect.top - panelRect.top;
        if (panel.scrollHeight > panel.clientHeight) {
          if (from < 0) panel.scrollBy({ top: from, behavior: 'smooth' });
          else if (from + linkRect.height > panelRect.height) {
            panel.scrollBy({ top: from + linkRect.height - panelRect.height, behavior: 'smooth' });
          }
        }
      }
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    const fonts = panel.ownerDocument.fonts;
    let live = true;
    if (fonts !== undefined) {
      void fonts.ready.then(() => {
        if (live) measure();
      });
    }
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [currentValue, panel, registrationTick, resolvedLayout, shown]);

  /** The bar says which edge it continues past, for the stylesheet's fade. */
  useEffect(() => {
    if (panel === null || resolvedLayout !== 'horizontal') return undefined;
    const measure = () => {
      const overflow = panel.scrollWidth - panel.clientWidth;
      if (overflow <= 1) {
        panel.removeAttribute('data-overflow');
        return;
      }
      const scrolled = Math.abs(panel.scrollLeft);
      const atStart = scrolled <= 1;
      const atEnd = scrolled >= overflow - 1;
      panel.setAttribute('data-overflow', atStart ? 'end' : atEnd ? 'start' : 'both');
    };
    measure();
    panel.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(panel);
    return () => {
      panel.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [panel, registrationTick, resolvedLayout]);

  /** The collapsed list is a dismissable layer while it is shown, with the trigger as a branch. */
  useEffect(() => {
    if (!collapsed || !currentOpen || panel === null) return undefined;
    const trigger = triggerRef.current;
    const layer = createDismissableLayer(panel, {
      branches: trigger === null ? [] : [trigger],
      onDismiss: (request) => {
        if (request.reason !== 'escape' && request.reason !== 'outsidePress') return;
        requestOpen(false, request.reason, request.source);
        if (request.reason === 'escape') trigger?.focus();
      },
    });
    return () => layer.destroy();
  }, [collapsed, currentOpen, panel, requestOpen]);

  /** ArrowDown on the trigger opened the list: the first link takes focus once it is drawn. */
  useEffect(() => {
    if (!pendingFocus.current || !currentOpen || panel === null) return;
    pendingFocus.current = false;
    panel.querySelector<HTMLElement>('[data-part="link"]')?.focus();
  }, [currentOpen, panel]);

  const focusableLinks = useCallback(
    (): HTMLElement[] =>
      panel === null || !shown
        ? []
        : [...panel.querySelectorAll<HTMLElement>('[data-part="link"]')],
    [panel, shown],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;

    if (target === triggerRef.current) {
      if (event.key === 'ArrowDown' && !currentOpen) {
        event.preventDefault();
        pendingFocus.current = true;
        requestOpen(true, 'keyboard', event.nativeEvent);
      }
      return;
    }
    if (!target.matches('[data-part="link"]')) return;

    const horizontal = resolvedLayout === 'horizontal';
    const forward = horizontal ? 'ArrowRight' : 'ArrowDown';
    const backward = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const step =
      event.key === forward || event.key === 'ArrowDown'
        ? 1
        : event.key === backward || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0 && event.key !== 'Home' && event.key !== 'End') return;

    const all = focusableLinks();
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

  useImperativeHandle<TableOfContentsHandle, TableOfContentsHandle>(
    ref,
    () => ({
      focus: () => (collapsed ? triggerRef.current?.focus() : focusableLinks()[0]?.focus()),
      refresh: () => {
        spy.current?.refresh();
        setRegistrationTick((tick) => tick + 1);
      },
      scrollTo: (linkId) => navigate(linkId, 'programmatic'),
      root,
    }),
    [collapsed, focusableLinks, navigate, root],
  );

  const context = useMemo<TableOfContentsContextValue>(
    () => ({
      layout: resolvedLayout,
      navigate,
      numbered: resolvedNumbered,
      registerLink,
      size: resolvedSize,
      value: currentValue,
    }),
    [currentValue, navigate, registerLink, resolvedLayout, resolvedNumbered, resolvedSize],
  );

  const content = children ?? renderItems(items ?? fromOutline(outline));
  /*
   * The links register in effects. Until they have — on the server, and in
   * the first client render — the list is as empty as what it was given:
   * items by their count, composed links never, a scanned outline by what
   * has been read. Both renders take the same branch, so hydration agrees.
   */
  const registered = registrationTick > 0;
  const given =
    children !== undefined && children !== null
      ? 1
      : items !== undefined
        ? items.length
        : outline.length;
  const empty = !loading && (registered ? links.current.size : given) === 0;
  const currentLabel = currentValue === null ? '' : (links.current.get(currentValue)?.() ?? '');
  const hasLabel = label !== undefined && label !== null;

  const rootProps: TableOfContentsRootProps = keyedProps({
    ...nativeProps,
    ...(resolvedLandmark
      ? hasLabel
        ? { 'aria-labelledby': nativeProps['aria-labelledby'] ?? labelId }
        : { 'aria-label': nativeProps['aria-label'] ?? t('navigation') }
      : {}),
    ...(loading ? { 'aria-busy': true } : {}),
    className,
    ...(empty ? { 'data-empty': '' as const } : {}),
    'data-layout': resolvedLayout,
    ...(loading ? { 'data-loading': '' as const } : {}),
    ...(resolvedNumbered ? { 'data-numbered': '' as const } : {}),
    ...(collapsed && currentOpen ? { 'data-open': '' as const } : {}),
    'data-part': 'root',
    'data-size': resolvedSize,
    ...(resolvedSticky && !collapsed ? { 'data-sticky': '' as const } : {}),
    'data-ui': 'table-of-contents',
    onKeyDown: handleKeyDown,
    style,
    children: (
      <>
        {collapsed ? (
          <button
            aria-controls={panelId}
            aria-expanded={currentOpen}
            data-part="trigger"
            data-part-trigger=""
            onClick={(event) =>
              requestOpen(
                !currentOpen,
                event.detail === 0 ? 'keyboard' : 'pointer',
                event.nativeEvent,
              )
            }
            ref={triggerRef}
            type="button"
          >
            <span data-part="label" data-part-label="" id={labelId}>
              {hasLabel ? label : t('navigation')}
            </span>
            <span data-part="current" data-part-current="">
              {currentLabel}
            </span>
            <span aria-hidden="true" data-part="indicator" data-part-indicator="">
              <Icon>
                <Glyph name="chevron-down" />
              </Icon>
            </span>
          </button>
        ) : hasLabel ? (
          <div data-part="label" data-part-label="" id={labelId}>
            {label}
          </div>
        ) : null}
        <div data-part="panel" data-part-panel="" id={panelId} ref={setPanel}>
          <div aria-hidden="true" data-part="marker" data-part-marker="" ref={markerRef} />
          <ol data-part="list" data-part-list="">
            {loading
              ? SKELETON_ROWS.map((inlineSize) => (
                  <li
                    aria-hidden="true"
                    data-part="skeleton"
                    data-part-skeleton=""
                    key={inlineSize}
                  >
                    <Skeleton inlineSize={inlineSize} shape="text" />
                  </li>
                ))
              : content}
          </ol>
        </div>
      </>
    ),
  });

  const Element = resolvedLandmark ? 'nav' : 'div';

  return (
    <TableOfContentsContext.Provider value={context}>
      {render === undefined ? <Element {...rootProps} ref={setRoot} /> : render(rootProps)}
    </TableOfContentsContext.Provider>
  );
}
