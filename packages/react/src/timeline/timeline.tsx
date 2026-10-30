import { keyedProps, selectorKeyProps } from '@slotted/core/selector-key';
import '@slotted/styles/timeline/timeline.css';
import '@slotted/styles/spinner/spinner.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import { tabbables } from '@slotted/core/focus';
import { timelineMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { feedFocusTarget, revealFocusIndex } from '@slotted/core/timeline';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';

import { useLocale, useMessages } from '../i18n';
import { useTimelineDefaults } from './timeline-defaults';
import { TimelineContext, TimelineListContext } from './timeline-context';
import { layoutEvents } from './timeline-parts';
import type { TimelineContextValue, TimelineProps, TimelineRootProps } from './timeline.types';
import { SPINNER_RING } from '../button/spinner-ring';

/**
 * An ordered list of events on one line, each with a marker, a machine
 * timestamp and a body — and, in feed mode, the APG Feed pattern drawn the
 * same way.
 *
 * **It is an `ol`, or a feed, and `mode` decides which.** A timeline that
 * does not grow is an ordered list, which the platform gives for free. One
 * that grows is `role="feed"` with an `article` per event, `aria-posinset`,
 * `aria-setsize`, `aria-busy` while more is on its way, and the four keys the
 * pattern names: `PageDown` and `PageUp` between articles, `Control+End` and
 * `Control+Home` out of the feed. A `li` admits no `article` role, so the list
 * element changes with the mode rather than the item alone.
 *
 * **It never reverses the array.** `order` says what the list is, and it is
 * what decides where `autoComplete` cuts: the events on the past side of the
 * current one. Ant, Nuxt and MUI reverse the visual order and the reading
 * order then disagrees with the DOM.
 *
 * **It holds no events.** Loading more and revealing fresh ones are requests
 * with a reason and nothing to hold; the consumer owns the array and adds to
 * it. The one mutable value is whether a group is open.
 */
export function Timeline({
  autoComplete = false,
  children,
  count,
  empty,
  freshCount = 0,
  growing,
  label,
  labelledBy,
  level,
  loading = false,
  locale,
  messages,
  mode,
  now,
  onKeyDown,
  onLoadMore,
  onReveal,
  order,
  orientation,
  placement,
  reflow = true,
  render,
  size,
  timeFormat,
  timeZone,
  tone,
  variant,
  ...nativeProps
}: TimelineProps) {
  const defaults = useTimelineDefaults();
  const runtimeLocale = useLocale();
  const t = useMessages(timelineMessages, messages);
  const generatedId = useId();
  const listId = `slotted-timeline-${generatedId}`;
  const listRef = useRef<HTMLElement | null>(null);
  const moreRef = useRef<HTMLElement | null>(null);
  const freshRef = useRef<HTMLButtonElement | null>(null);

  /**
   * The pill's last count, kept past the render that drops it to zero: the
   * pill stays mounted from its first appearance, hidden at zero with the
   * words it had, so it can leave with a transition instead of vanishing.
   */
  const [heldCount, setHeldCount] = useState(freshCount);
  if (freshCount > 0 && freshCount !== heldCount) setHeldCount(freshCount);
  const previousFresh = useRef(freshCount);

  const resolvedMode = mode ?? defaults.mode ?? 'list';
  const resolvedGrowing = growing ?? defaults.growing ?? 'none';
  const feed = resolvedMode === 'feed';

  const layout = layoutEvents(children, 0);

  const articles = () =>
    [...(listRef.current?.querySelectorAll<HTMLElement>('[data-part="item"]') ?? [])].filter(
      (element) => element.closest('[data-part="group-list"][hidden]') === null,
    );

  const focusItem = (index: number) => {
    articles()[index]?.focus();
  };

  const context: TimelineContextValue = {
    autoComplete,
    count,
    focusItem,
    growing: resolvedGrowing,
    ids: {
      item: (index, part) => `${listId}-${index}-${part}`,
      list: listId,
    },
    level: level ?? defaults.level ?? 3,
    loading,
    locale: locale ?? runtimeLocale,
    mode: resolvedMode,
    now: now ?? defaults.now,
    order: order ?? defaults.order ?? 'oldest-first',
    orientation: orientation ?? defaults.orientation ?? 'vertical',
    placement: placement ?? defaults.placement ?? 'end',
    size: size ?? defaults.size ?? 'md',
    t,
    timeFormat: timeFormat ?? defaults.timeFormat ?? 'absolute',
    timeZone: timeZone ?? defaults.timeZone,
    tone: tone ?? defaults.tone ?? 'secondary',
    variant: variant ?? defaults.variant ?? 'subtle',
  };

  /**
   * The feed keys, on the list so a key pressed on a control inside an
   * article still finds the article. The consumer's handler runs first and
   * may refuse.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event as KeyboardEvent<HTMLDivElement>);
    if (event.defaultPrevented || !feed) return;
    const all = articles();
    const from = all.findIndex((article) => article.contains(event.target as Node));
    const target = feedFocusTarget({
      count: all.length,
      ctrlKey: event.ctrlKey,
      from,
      key: event.key,
      metaKey: event.metaKey,
    });
    if (target === null) return;
    event.preventDefault();
    if (typeof target === 'number') {
      all[target]?.focus();
      return;
    }
    const list = listRef.current;
    if (list === null) return;
    const page = tabbables(list.ownerDocument.body);
    const position = list.compareDocumentPosition.bind(list);
    const outside =
      target === 'after'
        ? page.find(
            (element) =>
              position(element) & Node.DOCUMENT_POSITION_FOLLOWING && !list.contains(element),
          )
        : [...page]
            .reverse()
            .find(
              (element) =>
                position(element) & Node.DOCUMENT_POSITION_PRECEDING && !list.contains(element),
            );
    outside?.focus();
  };

  /** Fresh events are announced once per change of the count, politely. */
  useEffect(() => {
    if (freshCount <= 0) return;
    getLiveAnnouncer().announce(t('freshItems', { count: freshCount }));
    /* The count is the dependency; the translator is not state. */
  }, [freshCount]);

  /**
   * A reader who pressed the pill is taken to the first event it revealed,
   * not left on a control that is hiding. Before paint, while the pill still
   * holds focus.
   */
  useLayoutEffect(() => {
    const revealed = previousFresh.current;
    previousFresh.current = freshCount;
    const pill = freshRef.current;
    if (freshCount > 0 || revealed <= 0 || pill === null) return;
    if (!pill.contains(pill.ownerDocument.activeElement)) return;
    const all = articles();
    const index = revealFocusIndex({ loaded: all.length, revealed, order: context.order });
    const event = index === null ? undefined : all[index];
    if (event === undefined) return;
    (event.hasAttribute('tabindex') ? event : tabbables(event)[0])?.focus();
  }, [freshCount]);

  /**
   * `growing="scroll"` asks when the end of the loaded list enters the
   * scrollport. Only in an effect, and only where the observer exists: a
   * server, or a test without one, asks for nothing and the consumer who
   * needs a control there declares `button`.
   */
  useEffect(() => {
    const more = moreRef.current;
    if (resolvedGrowing !== 'scroll' || more === null || loading) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onLoadMore?.('scroll');
    });
    observer.observe(more);
    return () => observer.disconnect();
  }, [resolvedGrowing, loading, onLoadMore]);

  const listProps = {
    'aria-label': labelledBy === undefined ? label : undefined,
    'aria-labelledby': labelledBy,
    'data-part': 'list',
    ...selectorKeyProps('part', 'list'),
    id: listId,
    onKeyDown: handleKeyDown,
  };

  const list = feed ? (
    <div
      {...listProps}
      aria-busy={loading ? true : undefined}
      ref={listRef as RefObject<HTMLDivElement | null>}
      role="feed"
    >
      {layout.nodes}
    </div>
  ) : (
    <ol {...listProps} ref={listRef as RefObject<HTMLOListElement | null>}>
      {layout.nodes}
    </ol>
  );

  const more =
    resolvedGrowing === 'none' ? null : loading ? (
      <div
        aria-live="polite"
        data-part="more"
        data-part-more=""
        ref={moreRef as RefObject<HTMLDivElement | null>}
      >
        <span
          aria-hidden="true"
          data-part="root"
          data-part-root=""
          data-ui="spinner"
          data-ui-spinner=""
        >
          {SPINNER_RING}
        </span>
        {t('loading')}
      </div>
    ) : resolvedGrowing === 'button' ? (
      <button
        data-part="more"
        data-part-more=""
        onClick={(event) => onLoadMore?.(event.detail === 0 ? 'keyboard' : 'pointer', event)}
        ref={moreRef as RefObject<HTMLButtonElement | null>}
        type="button"
      >
        {t('loadMore')}
      </button>
    ) : (
      <div data-part="more" data-part-more="" ref={moreRef as RefObject<HTMLDivElement | null>} />
    );

  const rootProps: TimelineRootProps = keyedProps({
    ...nativeProps,
    children: (
      <TimelineContext.Provider value={context}>
        <TimelineListContext.Provider
          value={{ currentIndex: layout.currentIndex, loaded: layout.count }}
        >
          {heldCount > 0 ? (
            <button
              data-part="fresh"
              data-part-fresh=""
              hidden={freshCount <= 0}
              onClick={(event) => onReveal?.(event.detail === 0 ? 'keyboard' : 'pointer', event)}
              ref={freshRef}
              type="button"
            >
              {t('freshItems', { count: heldCount })}
            </button>
          ) : null}
          {list}
          {more}
          {layout.count === 0 && !loading ? (
            <div data-part="empty" data-part-empty="">
              {empty ?? t('empty')}
            </div>
          ) : null}
        </TimelineListContext.Provider>
      </TimelineContext.Provider>
    ),
    'data-growing': context.growing,
    'data-loading': loading ? '' : undefined,
    'data-mode': context.mode,
    'data-order': context.order,
    'data-orientation': context.orientation,
    'data-part': 'root',
    'data-placement': context.placement,
    'data-reflow': reflow ? undefined : 'false',
    'data-size': context.size,
    'data-tone': context.tone,
    'data-ui': 'timeline',
    'data-variant': context.variant,
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
