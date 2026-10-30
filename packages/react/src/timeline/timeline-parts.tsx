import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { createControllable } from '@slotted/core/state';
import {
  connectorOf,
  formatTimestamp,
  isComplete,
  setSizeOf,
  sideOf,
} from '@slotted/core/timeline';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';

import { useLocale } from '../i18n';
import { Glyph, Icon } from '../icon';
import {
  TimelineContext,
  TimelineItemContext,
  useTimeline,
  useTimelineItem,
  useTimelineList,
} from './timeline-context';
import type {
  TimelineGroupProps,
  TimelineGroupRootProps,
  TimelineItemProps,
  TimelineItemRootProps,
  TimelineOpenReason,
  TimelineTimeProps,
} from './timeline.types';
import { SPINNER_RING } from '../button/spinner-ring';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

/** Where a group's first event stands in the whole list. */
const TimelineOffsetContext = createContext(0);

/**
 * The two facts an event cannot know about itself — its index across the
 * whole list, groups included, and whether it is the last of its own list —
 * are read from the elements the consumer wrote, the way `stepper` counts its
 * steps. A group counts the events inside it and moves the offset along.
 *
 * An event wrapped in a component of the consumer's own is not seen, which is
 * the limit Mantine documents for the same walk; a group of the consumer's
 * own is not seen either. The parts are the walk's vocabulary.
 */
export interface EventLayout {
  nodes: ReactNode[];
  count: number;
  /** The index of the event marked current, or -1. */
  currentIndex: number;
}

function elements(children: ReactNode): ReactElement<Record<string, unknown>>[] {
  return Children.toArray(children).filter(
    (child): child is ReactElement<Record<string, unknown>> => isValidElement(child),
  );
}

function countEvents(children: ReactNode): { count: number; currentIndex: number } {
  let count = 0;
  let currentIndex = -1;
  for (const child of elements(children)) {
    if (child.type === TimelineItem) {
      if (child.props['current'] === true && currentIndex === -1) currentIndex = count;
      count += 1;
    } else if (child.type === TimelineGroup) {
      const inner = countEvents(child.props['children'] as ReactNode);
      if (inner.currentIndex !== -1 && currentIndex === -1) {
        currentIndex = count + inner.currentIndex;
      }
      count += inner.count;
    }
  }
  return { count, currentIndex };
}

export function layoutEvents(children: ReactNode, offset: number): EventLayout {
  const items = elements(children);
  const lastItem = items.reduce(
    (last, child, index) => (child.type === TimelineItem ? index : last),
    -1,
  );
  const measured = countEvents(children);
  let running = offset;

  const nodes = items.map((child, position) => {
    if (child.type === TimelineItem) {
      const index = running;
      running += 1;
      return (
        <TimelineItemContext.Provider
          key={child.key ?? index}
          value={{ index, last: position === lastItem }}
        >
          {child}
        </TimelineItemContext.Provider>
      );
    }
    if (child.type === TimelineGroup) {
      const start = running;
      running += countEvents(child.props['children'] as ReactNode).count;
      return (
        <TimelineOffsetContext.Provider key={child.key ?? position} value={start}>
          {child}
        </TimelineOffsetContext.Provider>
      );
    }
    return child;
  });

  return {
    count: measured.count,
    currentIndex: measured.currentIndex === -1 ? -1 : offset + measured.currentIndex,
    nodes,
  };
}

/**
 * A period: a heading and its own list of events. The heading spans the
 * width and the line breaks at it, because a group is a break in time.
 *
 * `collapsible` makes the heading a disclosure: a `button` with
 * `aria-expanded` and `aria-controls`, and the list takes `hidden` when it is
 * closed rather than leaving the DOM — a feed that lost its folded events
 * would lose the reader's position in it. `open` is the family's one mutable
 * value, and it carries the request every mutable value carries.
 *
 * In feed mode the group is a `div` and its list another, so the articles
 * stay descendants of the feed with no role between them; the heading stays a
 * heading, which is the departure the design records.
 */
export function TimelineGroup({
  children,
  collapsible = false,
  defaultOpen,
  label,
  level,
  onOpenChange,
  open,
  ref,
  render,
  ...nativeProps
}: TimelineGroupProps) {
  const timeline = useTimeline();
  const offset = useContext(TimelineOffsetContext);
  const [own, setOwn] = useState(defaultOpen ?? true);
  const isOpen = collapsible ? (open ?? own) : true;
  const listId = `${timeline.ids.list}-group-${offset}`;
  const Heading = `h${level ?? timeline.level}` as 'h2';
  const layout = layoutEvents(children, offset);

  const move = (next: boolean, reason: TimelineOpenReason, source?: unknown) => {
    const state = createControllable<boolean>({
      controlled: open,
      initial: isOpen,
      onRequest: (request) => onOpenChange?.(request.value, request),
    });
    if (state.request(next, reason, source)) setOwn(next);
  };

  const heading = (
    <Heading data-part="group-label" data-part-group-label="">
      {collapsible ? (
        <button
          aria-controls={listId}
          aria-expanded={isOpen}
          data-part="group-trigger"
          data-part-group-trigger=""
          onClick={(event) => move(!isOpen, event.detail === 0 ? 'keyboard' : 'pointer', event)}
          type="button"
        >
          <span aria-hidden="true" data-part="group-indicator" data-part-group-indicator="">
            <Icon>
              <Glyph name="chevron-down" />
            </Icon>
          </span>
          {label}
          <span data-ui="visually-hidden" data-ui-visually-hidden="">
            {isOpen ? timeline.t('collapse') : timeline.t('expand')}
          </span>
        </button>
      ) : (
        label
      )}
    </Heading>
  );

  const feed = timeline.mode === 'feed';
  const list = feed ? (
    <div data-part="group-list" data-part-group-list="" hidden={!isOpen} id={listId}>
      {layout.nodes}
    </div>
  ) : (
    <ol data-part="group-list" data-part-group-list="" hidden={!isOpen} id={listId}>
      {layout.nodes}
    </ol>
  );

  const rootProps: TimelineGroupRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {heading}
        {list}
      </>
    ),
    'data-open': isOpen ? '' : undefined,
    'data-part': 'group',
  });

  if (render !== undefined) return render({ ...rootProps, ref });
  return feed ? (
    <div {...(rootProps as unknown as ComponentPropsWithRef<'div'>)} ref={ref as never} />
  ) : (
    <li {...rootProps} ref={ref} />
  );
}

/**
 * One event: its marker on the rail, the line to the next one, and its body —
 * title and timestamp on the first line, the actor under them, then the
 * description, whatever else the consumer wrote, and the actions.
 *
 * In feed mode it is an `article` and a tab stop, labelled by its title, its
 * actor and its time in that order and described by its description, with
 * its position in the set — the APG Feed pattern item by item. `current` is
 * mirrored into `aria-current`, and read out after the title because not
 * every screen reader speaks `aria-current` inside an article.
 */
export function TimelineItem({
  actions,
  actor,
  children,
  complete,
  connector,
  current = false,
  description,
  loading = false,
  marker,
  opposite,
  ref,
  render,
  side,
  time,
  timeLabel,
  title,
  tone,
  variant,
  ...nativeProps
}: TimelineItemProps) {
  const timeline = useTimeline();
  const list = useTimelineList();
  const placed = useTimelineItem();
  const index = placed?.index ?? 0;
  const last = placed?.last ?? true;
  const feed = timeline.mode === 'feed';

  const finished = isComplete({
    autoComplete: timeline.autoComplete,
    complete,
    currentIndex: list.currentIndex,
    index,
    order: timeline.order,
  });
  const line = connectorOf({
    autoComplete: timeline.autoComplete,
    connector,
    currentIndex: list.currentIndex,
    index,
    order: timeline.order,
  });
  const resolvedSide =
    timeline.placement === 'alternate' || side !== undefined
      ? sideOf(timeline.placement, index, side)
      : undefined;

  const id = (part: string) => timeline.ids.item(index, part);
  const labelledBy = [
    title === undefined ? null : id('title'),
    actor === undefined ? null : id('actor'),
    time === undefined ? null : id('time'),
  ].filter((value): value is string => value !== null);

  useEffect(() => {
    if (!isDevelopment || !feed || labelledBy.length > 0) return;
    console.warn(
      'Timeline: an event in feed mode has no title, actor or time, so its article has no accessible name.',
    );
    /* The three sources are the dependency, by their presence. */
  }, [feed, labelledBy.length]);

  /**
   * A finished dot's check, which artwork the consumer put in the marker
   * replaces. `data-check` tells the sheet it is the family's own, so the
   * marker stays a dot rather than becoming a badge.
   */
  const check =
    finished && !current ? (
      <Icon data-check="">
        <Glyph name="check" />
      </Icon>
    ) : null;

  const body = (
    <div data-part="content" data-part-content="">
      {title === undefined ? null : (
        <div data-part="title" data-part-title="" id={id('title')}>
          {title}
          {current ? (
            <span data-ui="visually-hidden" data-ui-visually-hidden="">
              {timeline.t('current')}
            </span>
          ) : null}
        </div>
      )}
      {time === undefined ? null : (
        <TimelineTime id={id('time')} value={time}>
          {timeLabel}
        </TimelineTime>
      )}
      {actor === undefined ? null : (
        <div data-part="actor" data-part-actor="" id={id('actor')}>
          {actor}
        </div>
      )}
      {description === undefined ? null : (
        <div data-part="description" data-part-description="" id={id('description')}>
          {description}
        </div>
      )}
      {children}
      {actions === undefined ? null : (
        <div data-part="actions" data-part-actions="">
          {actions}
        </div>
      )}
    </div>
  );

  const rootProps: TimelineItemRootProps = keyedProps({
    ...nativeProps,
    ...(current ? { 'aria-current': true } : {}),
    ...(feed
      ? {
          'aria-describedby': description === undefined ? undefined : id('description'),
          'aria-labelledby': labelledBy.length === 0 ? undefined : labelledBy.join(' '),
          'aria-posinset': index + 1,
          'aria-setsize': setSizeOf({
            count: timeline.count,
            growing: timeline.growing,
            loaded: list.loaded,
          }),
          role: 'article',
          tabIndex: nativeProps.tabIndex ?? 0,
        }
      : {}),
    ...(loading ? { 'aria-busy': true } : {}),
    children: (
      <>
        {opposite === undefined ? null : (
          <div data-part="opposite" data-part-opposite="">
            {opposite}
          </div>
        )}
        <div data-part="rail" data-part-rail="">
          <span data-part="marker" data-part-marker="">
            {loading ? (
              <span
                aria-hidden="true"
                data-part="root"
                data-part-root=""
                data-ui="spinner"
                data-ui-spinner=""
              >
                {SPINNER_RING}
              </span>
            ) : (
              (marker ?? check)
            )}
          </span>
          {last ? null : <span aria-hidden="true" data-part="connector" data-part-connector="" />}
        </div>
        {body}
      </>
    ),
    'data-complete': finished && !current ? '' : undefined,
    'data-connector': line === 'solid' ? undefined : line,
    'data-current': current ? '' : undefined,
    'data-loading': loading ? '' : undefined,
    'data-part': 'item',
    'data-side': resolvedSide,
    'data-tone': tone ?? timeline.tone,
    'data-variant': variant ?? timeline.variant,
  });

  if (render !== undefined) return render({ ...rootProps, ref });
  return feed ? (
    <article {...(rootProps as unknown as ComponentPropsWithRef<'article'>)} ref={ref as never} />
  ) : (
    <li {...rootProps} ref={ref} />
  );
}

/**
 * When it happened, as the platform reads it and as the reader does. The
 * machine value always goes to `datetime`; the text is the family's
 * formatting unless the consumer wrote its own, and a relative reading keeps
 * the absolute one in `title`. Outside a timeline it still works, from the
 * locale in force and the runtime's zone, so a page can put one in a table
 * cell.
 */
export function TimelineTime({
  children,
  format,
  locale,
  now,
  ref,
  timeZone,
  value,
  ...nativeProps
}: TimelineTimeProps) {
  const timeline = useContext(TimelineContext);
  const runtimeLocale = useLocale();
  const formatted = formatTimestamp(value, {
    format: format ?? timeline?.timeFormat,
    locale: locale ?? timeline?.locale ?? runtimeLocale,
    now: now ?? timeline?.now,
    timeZone: timeZone ?? timeline?.timeZone,
  });

  return (
    <time
      {...(formatted.title === null ? {} : { title: formatted.title })}
      {...withSelectorKey(nativeProps, 'part', 'time')}

      dateTime={formatted.dateTime}
      ref={ref}
    >
      {children ?? formatted.text}
    </time>
  );
}
