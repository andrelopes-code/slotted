import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/notification-center/notification-center.css';

import { tabbables } from '@slotted/core/focus';
import {
  type FamilyTranslator,
  type NotificationCenterMessages,
  notificationCenterMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import { findScrollParent } from '@slotted/core/sticky-header';
import { feedFocusTarget, formatTimestamp, setSizeOf } from '@slotted/core/timeline';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';

import { Button } from '../button';
import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import type { GlyphName } from '../icon';
import { Skeleton, SkeletonText } from '../skeleton';
import { Tab, TabList, Tabs } from '../tabs';
import type { TabsChangeRequest } from '../tabs';
import { Tooltip } from '../tooltip';
import { TooltipContent, TooltipLayer, TooltipTrigger } from '../tooltip/tooltip-parts';
import type { TooltipTriggerProps } from '../tooltip/tooltip.types';
import { useNotificationCenterDefaults } from './notification-center-defaults';
import type {
  NotificationCenterControls,
  NotificationCenterLoadReason,
  NotificationCenterPressReason,
  NotificationCenterProps,
  NotificationCenterReadReason,
  NotificationCenterRequest,
  NotificationCenterRootProps,
  NotificationCenterTimeFormat,
  NotificationCenterTone,
  NotificationCenterViewReason,
  NotificationItem,
  NotificationItemState,
  NotificationView,
} from './notification-center.types';

/**
 * One of the family's own controls on an item, and the tooltip it opens with
 * the words its accessible name carries: on hover, on keyboard focus, and on
 * a press held on touch. Two glyphs with no words beside them are two
 * controls nobody can tell apart until they are named, and `aria-label`
 * names them only to a screen reader.
 */
function Control({ text, ...props }: TooltipTriggerProps & { text: string }) {
  return (
    <Tooltip openOn="hover" side="bottom">
      <TooltipTrigger aria-label={text} {...props} />
      <TooltipLayer>
        <TooltipContent>{text}</TooltipContent>
      </TooltipLayer>
    </Tooltip>
  );
}

/**
 * The family's own visual for an item with a tone and no visual of its own,
 * as the contract's `toneGlyph` names it: every glyph a circle.
 */
const TONE_GLYPH: Record<NotificationCenterTone, GlyphName> = {
  accent: 'circle-info',
  secondary: 'bell',
  info: 'circle-info',
  success: 'circle-check',
  warning: 'circle-alert',
  danger: 'circle-x',
};

/** How many skeleton rows stand in while nothing has arrived. */
const WAITING_ROWS = 3;

/** An identifier a key can be part of: word characters and hyphens stay, the rest is spelled out. */
function escapeKey(key: string): string {
  return key.replace(/[^\w-]/g, (character) => `-${character.charCodeAt(0).toString(16)}-`);
}

function createRequest<Reason extends string>(
  reason: Reason,
  source: unknown,
): NotificationCenterRequest<Reason> {
  let cancelled = false;
  return {
    reason,
    source,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  };
}

/** A click with no coordinates is a key. */
function pressReason(event: MouseEvent): NotificationCenterPressReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

function presentNode(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false;
}

interface Group {
  label: ReactNode;
  items: NotificationItem[];
}

/** The items filed under their labels, in the order the labels first appear. */
function groupItems(
  items: readonly NotificationItem[],
  groupBy: (item: NotificationItem) => ReactNode,
): Group[] {
  const groups: Group[] = [];
  const byLabel = new Map<ReactNode, Group>();
  for (const item of items) {
    const label = groupBy(item);
    let group = byLabel.get(label);
    if (group === undefined) {
      group = { label, items: [] };
      byLabel.set(label, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

interface ItemContext {
  controls: NotificationCenterControls;
  ids: (key: string) => { description: string; title: string };
  locale: string;
  now: number | undefined;
  onOpen: NotificationCenterProps['onOpen'];
  onRead: (
    keys: readonly string[],
    read: boolean,
    reason: NotificationCenterReadReason,
    source: unknown,
  ) => void;
  onRemove: NotificationCenterProps['onRemove'];
  renderItem: NotificationCenterProps['renderItem'];
  setSize: number;
  t: FamilyTranslator<NotificationCenterMessages>;
  timeFormat: NotificationCenterTimeFormat;
  timeZone: string | undefined;
}

/**
 * One article. The family owns the element, its wiring and its two controls;
 * `renderItem` substitutes the content between them.
 */
function Item({
  context,
  item,
  position,
}: {
  context: ItemContext;
  item: NotificationItem;
  position: number;
}) {
  const tone: NotificationCenterTone = item.tone ?? 'accent';
  const ids = context.ids(item.key);
  const time = formatTimestamp(item.time, {
    format: context.timeFormat,
    locale: context.locale,
    now: context.now,
    timeZone: context.timeZone,
  });
  const state: NotificationItemState = { ids, position, time, tone };
  const described = presentNode(item.description);

  const onTitleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const request = createRequest(pressReason(event), event);
    context.onOpen?.(item.key, request);
    if (request.cancelled) event.preventDefault();
  };

  const content =
    context.renderItem === undefined ? (
      <>
        {item.href === undefined ? (
          <span data-part="title" data-part-title="" id={ids.title}>
            {item.title}
          </span>
        ) : (
          <a
            data-part="title"
            data-part-title=""
            href={item.href}
            id={ids.title}
            onClick={onTitleClick}
          >
            {item.title}
          </a>
        )}
        {described ? (
          <p data-part="description" data-part-description="" id={ids.description}>
            {item.description}
          </p>
        ) : null}
        <time
          data-part="time"
          data-part-time=""
          dateTime={time.dateTime}
          {...(time.title === null ? {} : { title: time.title })}
        >
          {time.text}
        </time>
        {presentNode(item.actions) ? (
          <div data-part="actions" data-part-actions="">
            {item.actions}
          </div>
        ) : null}
      </>
    ) : (
      context.renderItem(item, state)
    );

  const readToggle = context.controls === 'both' || context.controls === 'read';
  const dismiss = context.controls === 'both' || context.controls === 'dismiss';

  return (
    <article
      aria-describedby={described ? ids.description : undefined}
      aria-labelledby={ids.title}
      aria-posinset={position}
      aria-setsize={context.setSize}
      data-key={item.key}
      data-part="item"
      data-part-item=""
      {...(item.read ? { 'data-read': '' } : {})}
      data-tone={tone}
      tabIndex={0}
    >
      {presentNode(item.visual) || item.tone !== undefined ? (
        <span data-part="visual" data-part-visual="" data-tone={item.tone}>
          {presentNode(item.visual) ? (
            item.visual
          ) : (
            /* `data-tone-glyph` tells the sheet the glyph is the family's, not the consumer's. */
            <Icon data-tone-glyph="">
              <Glyph name={TONE_GLYPH[tone]} />
            </Icon>
          )}
        </span>
      ) : null}
      <div data-part="content" data-part-content="">
        {content}
      </div>
      {readToggle || dismiss ? (
        <div data-part="controls" data-part-controls="">
          {readToggle ? (
            <Control
              data-part="read-toggle"
              data-part-read-toggle=""
              onClick={(event) => context.onRead([item.key], !item.read, pressReason(event), event)}
              text={item.read ? context.t('markUnread') : context.t('markRead')}
            >
              {/* Unread offers the check; read offers the dot, to mark it unread again. */}
              <Icon>
                <Glyph name={item.read ? 'dot' : 'check'} />
              </Icon>
            </Control>
          ) : null}
          {dismiss ? (
            <Control
              data-part="dismiss"
              data-part-dismiss=""
              onClick={(event) =>
                context.onRemove?.(item.key, createRequest(pressReason(event), event))
              }
              text={context.t('dismiss')}
            >
              <Icon>
                <Glyph name="x" />
              </Icon>
            </Control>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/**
 * The persistent list of what happened while the reader was not looking.
 *
 * **It holds none of the facts.** `items` is the consumer's array: whether an
 * item is read, whether it exists, how many there are. Marking, removing,
 * opening, revealing and loading are requests with a reason, and the store
 * answers by changing the array.
 *
 * **One value moves: the view.** `view` / `defaultView` / `onViewChange`,
 * with the built-in `all` and `unread` when the consumer states no views. The
 * strip is `tabs` holding its list alone; the feed is its one panel.
 *
 * **Arrivals are held while the reader reads.** Under `arrivals="hold"` a
 * key the family has not shown, arriving while focus is inside the feed or
 * the feed's scroller is past its start, waits behind `fresh` with a polite
 * announcement; otherwise it shows at once. Changes to shown items and
 * removals apply at once under both values.
 *
 * **The feed is the APG pattern.** `role="feed"`, an `article` per item with
 * its position and the set's size, `PageDown` and `PageUp` between articles,
 * `Control+End` and `Control+Home` out of the feed, `Delete` to ask for a
 * removal, and `aria-busy` while a page is on its way.
 */
export function NotificationCenter({
  actions,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  arrivals,
  className,
  controls,
  count,
  defaultView,
  empty,
  footer,
  groupBy,
  growing,
  items,
  level,
  loading = false,
  locale,
  messages,
  now,
  onKeyDown,
  onLoadMore,
  onOpen,
  onReadChange,
  onRemove,
  onReveal,
  onUnreadChange,
  onViewChange,
  ref,
  render,
  renderItem,
  size,
  style,
  timeFormat,
  timeZone,
  view,
  views,
  ...nativeProps
}: NotificationCenterProps) {
  const defaults = useNotificationCenterDefaults();
  const baseId = `slotted-notification-center-${useId()}`;
  const titleId = `${baseId}-title`;
  const feedId = `${baseId}-feed`;

  const resolvedArrivals = arrivals ?? defaults.arrivals;
  const resolvedControls = controls ?? defaults.controls;
  const resolvedGrowing = growing ?? defaults.growing;
  const resolvedLevel = level ?? defaults.level;
  const runtimeLocale = useLocale();
  const resolvedLocale = locale ?? runtimeLocale;
  const resolvedSize = size ?? defaults.size;
  const resolvedTimeFormat = timeFormat ?? defaults.timeFormat;
  const resolvedTimeZone = timeZone ?? defaults.timeZone;
  const t = useMessages(notificationCenterMessages, messages);

  const [root, setRoot] = useState<HTMLElement | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const freshRef = useRef<HTMLButtonElement | null>(null);
  const moreRef = useRef<HTMLElement | null>(null);

  const articles = () => [
    ...(feedRef.current?.querySelectorAll<HTMLElement>('article[data-part="item"]') ?? []),
  ];

  /* ── The view ──────────────────────────────────────────────────────── */

  const unread = useMemo(() => items.filter((item) => !item.read).length, [items]);
  const resolvedViews: readonly NotificationView[] = useMemo(
    () =>
      views ?? [
        { label: t('all'), value: 'all' },
        { count: unread, label: t('unreadView'), value: 'unread' },
      ],
    [views, t, unread],
  );
  const [ownView, setOwnView] = useState<string | undefined>(defaultView);
  const currentView = view ?? ownView ?? resolvedViews[0]?.value ?? 'all';

  const latest = useRef({ currentView, onViewChange, view });
  latest.current = { currentView, onViewChange, view };

  const selectView = useCallback(
    (next: string, reason: NotificationCenterViewReason, source: unknown) => {
      if (next === latest.current.currentView) return;
      let cancelled = false;
      const state = createControllable<string>({
        controlled: latest.current.view,
        initial: latest.current.currentView,
        onRequest: (request) => {
          latest.current.onViewChange?.(request.value, request);
          cancelled = request.cancelled;
        },
      });
      const moved = state.request(next, reason, source);
      if (cancelled) return;
      if (moved) setOwnView(next);
    },
    [],
  );

  /* ── Arrivals ──────────────────────────────────────────────────────── */

  const [shown, setShown] = useState<ReadonlySet<string>>(
    () => new Set(items.map((item) => item.key)),
  );
  const [held, setHeld] = useState<readonly string[]>([]);
  const holding = resolvedArrivals === 'hold';

  /** Whether the reader is reading: focus in the feed, or the feed's scroller past its start. */
  const reading = useCallback(() => {
    const feed = feedRef.current;
    if (feed === null) return false;
    const active = feed.ownerDocument.activeElement;
    if (active !== null && feed.contains(active)) return true;
    const scroller = findScrollParent(feed);
    return scroller !== null && scroller.scrollTop > 0;
  }, []);

  /*
   * A key the family has not shown is either held or shown, decided before
   * paint so a key that shows at once never flashes in a frame later. Keys
   * that left the array leave both sets.
   */
  useLayoutEffect(() => {
    const keys = new Set(items.map((item) => item.key));
    const fresh = [...keys].filter((key) => !shown.has(key) && !held.includes(key));
    const stale = held.filter((key) => !keys.has(key));
    if (fresh.length === 0 && stale.length === 0) return;
    if (holding && fresh.length > 0 && reading()) {
      setHeld([...held.filter((key) => keys.has(key)), ...fresh]);
      return;
    }
    if (fresh.length > 0) {
      setShown(new Set([...shown, ...fresh]));
    }
    if (stale.length > 0) {
      setHeld(held.filter((key) => keys.has(key)));
    }
  }, [items, shown, held, holding, reading]);

  /** Held arrivals are announced once per change of the count, politely. */
  useEffect(() => {
    if (held.length === 0) return;
    getLiveAnnouncer().announce(t('fresh', { count: held.length }));
    /* The count is the dependency; the translator is not state. */
  }, [held.length]);

  const focusKey = useRef<string | null>(null);
  const reveal = useCallback(
    (reason: NotificationCenterReadReason, source: unknown) => {
      if (held.length === 0) return;
      const request = createRequest(reason, source);
      onReveal?.(held.length, request);
      if (request.cancelled) return;
      if (reason === 'keyboard') focusKey.current = held[0] ?? null;
      setShown(new Set([...shown, ...held]));
      setHeld([]);
    },
    [held, shown, onReveal],
  );

  useEffect(() => {
    const key = focusKey.current;
    if (key === null) return;
    focusKey.current = null;
    feedRef.current?.querySelector<HTMLElement>(`article[data-key="${CSS.escape(key)}"]`)?.focus();
  });

  /* ── The unread count, for the bell ────────────────────────────────── */

  const reportedUnread = useRef<number | null>(null);
  useEffect(() => {
    if (reportedUnread.current === unread) return;
    const first = reportedUnread.current === null;
    reportedUnread.current = unread;
    onUnreadChange?.(unread);
    if (!first) getLiveAnnouncer().announce(t('unread', { count: unread }));
    /* The count is the dependency; the handler and the message are not state. */
  }, [unread]);

  /* ── Requests ──────────────────────────────────────────────────────── */

  const requestRead = useCallback(
    (
      keys: readonly string[],
      read: boolean,
      reason: NotificationCenterReadReason,
      source: unknown,
    ) => {
      if (keys.length === 0) return;
      onReadChange?.({ keys, read }, createRequest(reason, source));
    },
    [onReadChange],
  );

  const shownItems = useMemo(
    () => (holding ? items.filter((item) => shown.has(item.key)) : items),
    [items, shown, holding],
  );
  const visibleItems = useMemo(
    () => (currentView === 'unread' ? shownItems.filter((item) => !item.read) : shownItems),
    [shownItems, currentView],
  );
  const setSize = setSizeOf({ count, growing: resolvedGrowing, loaded: visibleItems.length });

  /* ── The feed keys ─────────────────────────────────────────────────── */

  const focusFirst = useCallback(() => {
    const target = freshRef.current ?? articles()[0];
    target?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const feed = feedRef.current;
    if (feed === null || !feed.contains(event.target as Node)) return;
    const all = articles();
    const from = all.findIndex((article) => article.contains(event.target as Node));
    if (from === -1) return;

    if (event.key === 'Delete' && event.target === all[from] && !event.repeat) {
      const article = all[from] as HTMLElement;
      const key = article.dataset['key'] ?? '';
      const request = createRequest('keyboard' as const, event);
      onRemove?.(key, request);
      if (request.cancelled) return;
      event.preventDefault();
      const next = all[from + 1] ?? all[from - 1];
      if (next !== undefined) {
        next.focus();
      } else {
        (freshRef.current ?? (root === null ? undefined : tabbables(root)[0]))?.focus();
      }
      return;
    }

    const target = feedFocusTarget({
      count: all.length,
      ctrlKey: event.ctrlKey,
      from,
      key: event.key,
      metaKey: event.metaKey,
    });
    if (target === null) return;
    /* PageUp on the first article reaches fresh when arrivals are held. */
    if (target === from && event.key === 'PageUp' && freshRef.current !== null) {
      event.preventDefault();
      freshRef.current.focus();
      return;
    }
    event.preventDefault();
    if (typeof target === 'number') {
      all[target]?.focus();
      return;
    }
    const page = tabbables(feed.ownerDocument.body);
    const position = feed.compareDocumentPosition.bind(feed);
    const outside =
      target === 'after'
        ? page.find(
            (element) =>
              position(element) & Node.DOCUMENT_POSITION_FOLLOWING && !feed.contains(element),
          )
        : [...page]
            .reverse()
            .find(
              (element) =>
                position(element) & Node.DOCUMENT_POSITION_PRECEDING && !feed.contains(element),
            );
    outside?.focus();
  };

  /* ── Growing ───────────────────────────────────────────────────────── */

  /**
   * `growing="scroll"` asks when the end of the loaded list enters the
   * scrollport. Only in an effect, and only where the observer exists.
   */
  useEffect(() => {
    const more = moreRef.current;
    if (resolvedGrowing !== 'scroll' || more === null || loading) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onLoadMore?.(createRequest('scroll' as NotificationCenterLoadReason, entries));
      }
    });
    observer.observe(more);
    return () => observer.disconnect();
  }, [resolvedGrowing, loading, onLoadMore]);

  /* ── The handle ────────────────────────────────────────────────────── */

  useImperativeHandle(
    ref,
    () => ({
      get element() {
        return root;
      },
      focus: focusFirst,
      markAllRead: () =>
        requestRead(
          shownItems.filter((item) => !item.read).map((item) => item.key),
          true,
          'programmatic',
          undefined,
        ),
      reveal: () => reveal('programmatic', undefined),
    }),
    [root, focusFirst, requestRead, shownItems, reveal],
  );

  /* ── Rendering ─────────────────────────────────────────────────────── */

  const ids = useCallback(
    (key: string) => ({
      description: `${baseId}-${escapeKey(key)}-d`,
      title: `${baseId}-${escapeKey(key)}-t`,
    }),
    [baseId],
  );

  const itemContext: ItemContext = {
    controls: resolvedControls,
    ids,
    locale: resolvedLocale,
    now,
    onOpen,
    onRead: requestRead,
    onRemove,
    renderItem,
    setSize,
    t,
    timeFormat: resolvedTimeFormat,
    timeZone: resolvedTimeZone,
  };

  const Heading = `h${resolvedLevel}` as 'h2' | 'h3' | 'h4';
  const GroupHeading = `h${Math.min(Number(resolvedLevel) + 1, 6)}` as 'h3' | 'h4' | 'h5';

  const waiting = loading && visibleItems.length === 0;
  const chip = (value: number) => (
    <span data-part="count" data-part-count="">
      {value}
    </span>
  );

  const renderRows = () => {
    if (waiting) {
      return Array.from({ length: WAITING_ROWS }, (_, index) => (
        <div aria-hidden="true" data-part="item" data-part-item="" key={index}>
          <span data-part="visual" data-part-visual="">
            <Skeleton shape="circle" size="sm" />
          </span>
          <div data-part="content" data-part-content="">
            <SkeletonText lines={2} />
          </div>
        </div>
      ));
    }
    if (groupBy === undefined) {
      return visibleItems.map((item, index) => (
        <Item context={itemContext} item={item} key={item.key} position={index + 1} />
      ));
    }
    let position = 0;
    return groupItems(visibleItems, groupBy).map((group, index) => (
      <div data-part="group" data-part-group="" key={index}>
        <GroupHeading data-part="group-label" data-part-group-label="">
          {group.label}
        </GroupHeading>
        {group.items.map((item) => (
          <Item context={itemContext} item={item} key={item.key} position={++position} />
        ))}
      </div>
    ));
  };

  const more =
    resolvedGrowing === 'none' ? null : loading && !waiting ? (
      <div
        aria-live="polite"
        data-part="more"
        data-part-more=""
        ref={moreRef as RefObject<HTMLDivElement>}
      >
        {t('loading')}
      </div>
    ) : resolvedGrowing === 'button' ? (
      <button
        data-part="more"
        data-part-more=""
        onClick={(event) => onLoadMore?.(createRequest(pressReason(event), event))}
        ref={moreRef as RefObject<HTMLButtonElement>}
        type="button"
      >
        {t('loadMore')}
      </button>
    ) : (
      <div data-part="more" data-part-more="" ref={moreRef as RefObject<HTMLDivElement>} />
    );

  const showEmpty = !waiting && visibleItems.length === 0;

  const rootProps: NotificationCenterRootProps = keyedProps({
    ...nativeProps,
    ...(ariaLabel !== undefined
      ? { 'aria-label': ariaLabel }
      : { 'aria-labelledby': ariaLabelledby ?? titleId }),
    children: (
      <>
        <div data-part="header" data-part-header="">
          <Heading data-part="title" data-part-title="" id={titleId}>
            {t('title')}
            {unread > 0 ? <> {chip(unread)}</> : null}
          </Heading>
          <span data-part="mark-all" data-part-mark-all="">
            <Button
              disabled={unread === 0}
              onClick={(event) =>
                requestRead(
                  shownItems.filter((item) => !item.read).map((item) => item.key),
                  true,
                  pressReason(event),
                  event,
                )
              }
              size="sm"
              tone="secondary"
              variant="ghost"
            >
              {t('markAll')}
            </Button>
          </span>
          {presentNode(actions) ? (
            <div data-part="actions" data-part-actions="">
              {actions}
            </div>
          ) : null}
        </div>
        {resolvedViews.length > 1 ? (
          <div data-part="views" data-part-views="">
            <Tabs
              onValueChange={(value: string, request: TabsChangeRequest) =>
                selectView(value, request.reason as NotificationCenterViewReason, request.source)
              }
              size={resolvedSize}
              track="none"
              value={currentView}
            >
              <TabList aria-label={t('views')}>
                {resolvedViews.map((entry) => (
                  <Tab controls={feedId} key={entry.value} value={entry.value}>
                    {entry.label}
                    {entry.count === undefined || entry.count === 0 ? null : (
                      <> {chip(entry.count)}</>
                    )}
                  </Tab>
                ))}
              </TabList>
            </Tabs>
          </div>
        ) : null}
        {held.length > 0 ? (
          <button
            data-part="fresh"
            data-part-fresh=""
            onClick={(event) => reveal(pressReason(event), event)}
            ref={freshRef}
            type="button"
          >
            {t('fresh', { count: held.length })}
          </button>
        ) : null}
        <div
          aria-busy={loading ? true : undefined}
          aria-labelledby={titleId}
          data-part="feed"
          data-part-feed=""
          id={feedId}
          ref={feedRef}
          role="feed"
        >
          {renderRows()}
        </div>
        {showEmpty ? (
          <div data-part="empty" data-part-empty="">
            {empty ?? (currentView === 'unread' ? t('caughtUp') : t('empty'))}
          </div>
        ) : (
          more
        )}
        {presentNode(footer) ? (
          <div data-part="footer" data-part-footer="">
            {footer}
          </div>
        ) : null}
      </>
    ),
    className,
    'data-arrivals': resolvedArrivals,
    'data-controls': resolvedControls,
    'data-growing': resolvedGrowing,
    'data-level': resolvedLevel,
    ...(loading ? { 'data-loading': '' as const } : {}),
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-time-format': resolvedTimeFormat,
    'data-ui': 'notification-center',
    'data-view': currentView,
    onKeyDown: handleKeyDown,
    style,
  });

  return render === undefined ? (
    <section {...rootProps} ref={setRoot} />
  ) : (
    render({ ...rootProps, ref: setRoot })
  );
}
