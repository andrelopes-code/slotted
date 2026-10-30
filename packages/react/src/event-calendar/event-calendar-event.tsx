import { selectorKeyProps } from '@slotted/core/selector-key';
import { compareDateTime } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import {
  formatOccurrence,
  formatTime,
  formatTimeRange,
  occurrenceTimes,
} from '@slotted/core/event-calendar';
import type { CalendarEvent, EventOccurrence } from '@slotted/core/event-calendar';
import { useCallback } from 'react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

import { Glyph, Icon } from '../icon';
import { useEventCalendarModel } from './event-calendar-context';
import type { EventCalendarModel } from './event-calendar-context';
import type { EventRenderContext } from './event-calendar.types';

/**
 * The time an occurrence shows on one day: its range when both ends fall on
 * the day, "from" or "until" when one does, and nothing for an all-day one,
 * which says so in words elsewhere.
 */
export function timeLabel(
  model: Pick<EventCalendarModel, 't' | 'locale' | 'hourCycle'>,
  occurrence: EventOccurrence,
  date: PlainDate,
): string {
  if (occurrence.allDay) return model.t('allDay');
  const options = { locale: model.locale, hourCycle: model.hourCycle };
  const { start, end } = occurrenceTimes(occurrence, date);
  if (start !== null && end !== null) return formatTimeRange(start, end, options);
  if (start !== null) return model.t('from', { time: formatTime(start, options) });
  if (end !== null) return model.t('until', { time: formatTime(end, options) });
  return model.t('allDay');
}

/**
 * The part of an event's name that is not on screen: its whole span, its
 * calendar, its state. Position and colour say none of it to someone who
 * cannot see them, so the words say all of it.
 */
function metaText(
  model: EventCalendarModel,
  occurrence: EventOccurrence,
  continued: boolean,
): string {
  const parts = [
    formatOccurrence(occurrence, { locale: model.locale, hourCycle: model.hourCycle }),
    occurrence.allDay ? model.t('allDay') : undefined,
    model.calendarLabel(occurrence.event.calendar),
    occurrence.event.status === 'tentative' ? model.t('tentative') : undefined,
    occurrence.event.status === 'cancelled' ? model.t('cancelled') : undefined,
    occurrence.recurring ? model.t('recurring') : undefined,
    continued ? model.t('continues') : undefined,
  ].filter((part): part is string => part !== undefined && part !== '');
  /* A list of descriptors, written the way the locale in force lists them. */
  return `, ${new Intl.ListFormat(model.locale, { type: 'unit' }).format(parts)}`;
}

export interface EventItemProps {
  occurrence: EventOccurrence<CalendarEvent>;
  date: PlainDate;
  layout: EventRenderContext['layout'];
  /** `true` in a grid, where the cell holds the tab stop; `false` in a list. */
  inGrid: boolean;
  style?: CSSProperties | undefined;
  continuesBefore?: boolean | undefined;
  continuesAfter?: boolean | undefined;
  clippedStart?: boolean | undefined;
  clippedEnd?: boolean | undefined;
  short?: boolean | undefined;
  /** Shows the location line, which a block only has room for when it is tall. */
  withLocation?: boolean | undefined;
}

/**
 * One occurrence, in any of the four places it is drawn. It is a link when the
 * event has an `href` — the reader expects to open it in a new tab — and a
 * button otherwise, whose press asks for its detail.
 */
export function EventItem({
  clippedEnd,
  clippedStart,
  continuesAfter,
  continuesBefore,
  date,
  inGrid,
  layout,
  occurrence,
  short,
  style,
  withLocation,
}: EventItemProps) {
  const model = useEventCalendarModel();
  const { event } = occurrence;
  const key = occurrence.key;
  const open = model.openKey === key;
  const color = model.colorOf(event.calendar);
  const bar = layout === 'bar';

  const register = useCallback(
    (node: HTMLElement | null) => model.registerEvent(key, node),
    [key, model.registerEvent],
  );

  const showTime = layout !== 'bar' || !occurrence.allDay;
  const timeText =
    layout === 'lane' || (bar && !occurrence.allDay)
      ? formatTime(occurrence.start.time, { locale: model.locale, hourCycle: model.hourCycle })
      : timeLabel(model, occurrence, date);

  const defaultContent: ReactNode = (
    <>
      {showTime && !(bar && occurrence.allDay) ? (
        <span data-part="event-time" data-part-event-time="">
          {timeText}
        </span>
      ) : null}
      <span data-part="event-title" data-part-event-title="">
        {event.title}
      </span>
      {withLocation && event.location ? (
        <span data-part="event-location" data-part-event-location="">
          {event.location}
        </span>
      ) : null}
    </>
  );

  const content =
    model.renderEvent === undefined
      ? defaultContent
      : model.renderEvent(occurrence, { layout, date, content: defaultContent });

  const editable = model.canEdit(occurrence);
  const attributes = {
    'data-part': 'event',
    ...selectorKeyProps('part', 'event'),
    'data-key': key,
    'data-editable': editable && inGrid ? '' : undefined,
    'data-dragging': model.draggingKey === key ? '' : undefined,
    'data-drop-invalid': model.draggingKey === key && model.dropInvalid ? '' : undefined,
    'data-context': model.contextKey === key ? '' : undefined,
    'data-all-day': occurrence.allDay ? '' : undefined,
    'data-bar': bar ? '' : undefined,
    'data-color': color === null ? undefined : String(color),
    'data-status':
      event.status === undefined || event.status === 'confirmed' ? undefined : event.status,
    'data-open': open ? '' : undefined,
    'data-past':
      model.now !== null && compareDateTime(occurrence.end, model.now) <= 0 ? '' : undefined,
    'data-continues-before': continuesBefore ? '' : undefined,
    'data-continues-after': continuesAfter ? '' : undefined,
    'data-clipped-start': clippedStart ? '' : undefined,
    'data-clipped-end': clippedEnd ? '' : undefined,
    'data-short': short ? '' : undefined,
    tabIndex: inGrid ? -1 : undefined,
    style,
  } as const;

  /* The end an edit can pull: the bottom of a block, the inline end of a bar,
     and only where the event ends in this drawing. */
  const resizable =
    editable &&
    inGrid &&
    (layout === 'block'
      ? clippedEnd !== true && continuesAfter !== true
      : layout === 'bar' && continuesAfter !== true);

  /* A bar that goes on past this week's edge says so with a chevron at that
     edge, the one the reader follows to the next row. */
  const edge = (side: 'start' | 'end') => (
    <Icon data-edge={side} size="sm">
      <Glyph name="chevron-right" />
    </Icon>
  );
  const children = (
    <>
      {layout === 'bar' && continuesBefore === true ? edge('start') : null}
      {content}
      <span data-part="event-meta" data-part-event-meta="">
        {metaText(model, occurrence, continuesBefore === true)}
      </span>
      {layout === 'bar' && continuesAfter === true ? edge('end') : null}
      {resizable ? (
        <span aria-hidden="true" data-part="resize-handle" data-part-resize-handle="" />
      ) : null}
    </>
  );

  if (event.href !== undefined) {
    return (
      <a {...attributes} href={event.href} ref={register}>
        {children}
      </a>
    );
  }

  const activate = (reason: 'pointer' | 'keyboard') => (clicked: MouseEvent<HTMLElement>) => {
    model.activate(occurrence, clicked.currentTarget, reason, clicked);
  };

  return (
    <button
      {...attributes}
      aria-expanded={model.hostsDetail || model.openKey !== null ? open : undefined}
      aria-haspopup={model.hostsDetail ? 'dialog' : undefined}
      onClick={(clicked) => activate(clicked.detail === 0 ? 'keyboard' : 'pointer')(clicked)}
      ref={register}
      type="button"
    >
      {children}
    </button>
  );
}
