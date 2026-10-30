import { isPlainDateTime, isSameDate, secondsOfDay, toISODate } from '@slotted/core/date';
import type { PlainDate, PlainDateTime } from '@slotted/core/date';
import {
  formatHour,
  formatTime,
  formatTimeRange,
  isWorkingDay,
  layoutColumn,
  layoutRow,
  offHoursOn,
  offsetChangeOn,
  zoneLabel,
} from '@slotted/core/event-calendar';
import type {
  CalendarEvent,
  EventOccurrence,
  TimeFormatOptions,
} from '@slotted/core/event-calendar';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, Ref } from 'react';

import { useEventCalendarModel } from './event-calendar-context';
import { EventItem } from './event-calendar-event';
import { fullDate, selectionHolds } from './event-calendar-month';

/**
 * The narrowest block a title is worth drawing in, in CSS pixels: a word and
 * its padding. A cluster gets as many columns as blocks this wide fit in a
 * day's column, never more than `maxColumns`; with one, the first column's
 * events are drawn whole and the rest is a count laid over them. At this
 * width the block shows its title
 * wrapped on words; the event's container query has already hidden the time.
 */
const MIN_BLOCK_WIDTH = 64;

/** A block shorter than this puts its time beside its title, on one line. */
const SHORT_MINUTES = 45;
/** The shortest block drawn, in minutes, which decides whether two short events touch. */
const MIN_BLOCK_MINUTES = 20;

const minutesOf = (value: PlainDateTime) => secondsOfDay(value.time) / 60;

/**
 * The slots of a clock change: which way the clocks move, by how many hours,
 * and the local time they move at.
 */
function offsetSlots(
  change: NonNullable<ReturnType<typeof offsetChangeOn>>,
  options: TimeFormatOptions,
) {
  return {
    direction: change.minutes > 0 ? 'forward' : 'back',
    hours: Math.abs(change.minutes) / 60,
    at: formatTime(change.at, options),
  };
}

export interface TimeGridProps {
  days: readonly PlainDate[];
  occurrences: readonly EventOccurrence<CalendarEvent>[];
  titleId: string;
  scrollerRef: Ref<HTMLDivElement>;
}

/**
 * The week and the day: three grids with one column template — the headers,
 * the all-day lanes and the hours — so the hours scroll under the two that
 * stay. Every place, length and column below is `@slotted/core/event-calendar`'s,
 * written as the runtime properties the stylesheet reads.
 */
export function TimeGrid({ days, occurrences, scrollerRef, titleId }: TimeGridProps) {
  const model = useEventCalendarModel();
  const [startHour, endHour] = model.dayHours;

  /* The width of one day's column, measured, so a cluster never draws blocks
     too narrow to hold a word. */
  const scroller = useRef<HTMLDivElement | null>(null);
  const [columnWidth, setColumnWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const column = scroller.current?.querySelector<HTMLElement>("[data-part='column']");
    if (column === null || column === undefined || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const measure = () => setColumnWidth(column.getBoundingClientRect().width || null);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(column);
    return () => observer.disconnect();
  }, [days.length]);
  const columnsThatFit =
    columnWidth === null
      ? model.maxColumns
      : Math.max(1, Math.min(model.maxColumns, Math.floor(columnWidth / MIN_BLOCK_WIDTH)));
  const attachScroller = useCallback(
    (node: HTMLDivElement | null) => {
      scroller.current = node;
      if (typeof scrollerRef === 'function') scrollerRef(node);
      else if (scrollerRef !== null && scrollerRef !== undefined) scrollerRef.current = node;
    },
    [scrollerRef],
  );
  const { segments, lanes } = layoutRow(occurrences, days, { allDayOnly: true });
  const selection = model.pendingSelection ?? model.selection;
  const timeOptions = { locale: model.locale, hourCycle: model.hourCycle };
  const firstDay = days[0] as PlainDate;
  const tabDay = (date: PlainDate) => isSameDate(date, model.date);
  const isToday = (date: PlainDate) => model.today !== null && isSameDate(date, model.today);
  const hours = Array.from(
    { length: Math.max(0, endHour - startHour) },
    (_, index) => startHour + index,
  );

  return (
    <div
      aria-labelledby={titleId}
      data-part="time-grid"
      data-part-time-grid=""
      role="grid"
      style={
        {
          '--slotted-event-calendar-days': days.length,
          '--slotted-event-calendar-slot': model.slotDuration,
        } as CSSProperties
      }
    >
      <div data-part="time-head" data-part-time-head="" role="rowgroup">
        <div data-part="columns" data-part-columns="" role="row">
          <div data-part="zone" data-part-zone="" role="columnheader">
            {zoneLabel(firstDay, model.timeZone, model.locale)}
          </div>
          {days.map((date) => {
            const change = offsetChangeOn(date, model.timeZone);
            const content = model.renderDayContent?.(date, { view: model.view });
            return (
              <div
                data-date={toISODate(date)}
                data-offset-change={change === null ? undefined : ''}
                data-part="column-header"
                data-part-column-header=""
                data-row="header"
                data-today={isToday(date) ? '' : undefined}
                key={toISODate(date)}
                role="columnheader"
                tabIndex={model.row === 'header' && tabDay(date) ? 0 : -1}
              >
                <span aria-hidden="true" data-part="weekday" data-part-weekday="">
                  {new Intl.DateTimeFormat(model.locale, {
                    timeZone: 'UTC',
                    weekday: 'short',
                  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)))}
                </span>
                <button
                  aria-label={fullDate(model, date)}
                  data-part="day-number"
                  data-part-day-number=""
                  onClick={(clicked) =>
                    model.drill(date, clicked.detail === 0 ? 'keyboard' : 'pointer', clicked)
                  }
                  tabIndex={-1}
                  type="button"
                >
                  {date.day}
                </button>
                {content === undefined || content === null ? null : (
                  <div data-part="day-content" data-part-day-content="">
                    {content}
                  </div>
                )}
                {change === null ? null : (
                  <span
                    aria-label={model.t('offsetChange', offsetSlots(change, timeOptions))}
                    data-part="offset-change"
                    data-part-offset-change=""
                    role="note"
                  >
                    {model.t('offsetChangeShort', offsetSlots(change, timeOptions))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div
          data-part="all-day-row"
          data-part-all-day-row=""
          role="row"
          style={{ '--slotted-event-calendar-lanes': Math.max(1, lanes) } as CSSProperties}
        >
          <div data-part="all-day-label" data-part-all-day-label="" role="rowheader">
            {model.t('allDay')}
          </div>
          {days.map((date, index) => {
            const starting = segments.filter((segment) => segment.start === index);
            const continuing = segments.filter(
              (segment) => segment.start < index && segment.start + segment.span > index,
            );
            const selected = selectionHolds(selection, date, true);
            return (
              <div
                aria-selected={model.selectionMode === 'range' ? selected : undefined}
                data-date={toISODate(date)}
                data-non-working={isWorkingDay(date, model.workingHours) ? undefined : ''}
                data-part="all-day-cell"
                data-part-all-day-cell=""
                data-row="all-day"
                data-selected={selected ? '' : undefined}
                data-today={isToday(date) ? '' : undefined}
                key={toISODate(date)}
                role="gridcell"
                tabIndex={model.row === 'all-day' && tabDay(date) ? 0 : -1}
              >
                {starting.map((segment) => (
                  <EventItem
                    continuesAfter={segment.continuesAfter}
                    continuesBefore={segment.continuesBefore}
                    date={date}
                    inGrid
                    key={segment.occurrence.key}
                    layout="bar"
                    occurrence={segment.occurrence}
                    style={
                      {
                        '--slotted-event-lane': segment.lane + 1,
                        '--slotted-event-span': segment.span,
                      } as CSSProperties
                    }
                  />
                ))}
                {continuing.map((segment) => (
                  <span
                    data-part="continuation"
                    data-part-continuation=""
                    key={segment.occurrence.key}
                  >
                    {model.t('titleContinues', { title: segment.occurrence.event.title })}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div data-part="scroller" data-part-scroller="" ref={attachScroller} role="rowgroup">
        <div data-part="time-row" data-part-time-row="" role="row">
          <div data-part="gutter" data-part-gutter="" role="rowheader">
            <span data-ui="visually-hidden" data-ui-visually-hidden="">
              {model.t('timed')}
            </span>
            {hours.map((hour) => (
              <span aria-hidden="true" data-part="hour" data-part-hour="" key={hour}>
                {formatHour(hour, timeOptions)}
              </span>
            ))}
          </div>
          {days.map((date) => {
            const { items, more } = layoutColumn(occurrences, date, {
              startHour,
              endHour,
              maxColumns: columnsThatFit,
              minLength: MIN_BLOCK_MINUTES,
            });
            const change = offsetChangeOn(date, model.timeZone);
            const nowHere =
              model.now !== null && isSameDate(model.now.date, date) ? minutesOf(model.now) : null;
            const timed =
              selection !== null &&
              isPlainDateTime(selection.start) &&
              isSameDate(selection.start.date, date)
                ? (selection as { start: PlainDateTime; end: PlainDateTime })
                : null;
            return (
              <div
                data-date={toISODate(date)}
                data-non-working={isWorkingDay(date, model.workingHours) ? undefined : ''}
                data-part="column"
                data-part-column=""
                data-row="timed"
                data-today={isToday(date) ? '' : undefined}
                key={toISODate(date)}
                role="gridcell"
                tabIndex={model.row === 'timed' && tabDay(date) ? 0 : -1}
              >
                {offHoursOn(date, model.workingHours, { startHour, endHour }).map((entry) => (
                  <div
                    aria-hidden="true"
                    data-part="off-hours"
                    data-part-off-hours=""
                    key={entry.start}
                    style={
                      {
                        '--slotted-event-start': entry.start,
                        '--slotted-event-length': entry.length,
                      } as CSSProperties
                    }
                  />
                ))}
                {change === null ? null : (
                  <div
                    aria-hidden="true"
                    data-part="offset-line"
                    data-part-offset-line=""
                    style={
                      {
                        '--slotted-event-start':
                          change.at.hour * 60 + change.at.minute - startHour * 60,
                      } as CSSProperties
                    }
                  />
                )}
                {timed === null ? null : (
                  <div
                    aria-hidden="true"
                    data-part="selection"
                    data-part-selection=""
                    style={
                      {
                        '--slotted-event-start': minutesOf(timed.start) - startHour * 60,
                        '--slotted-event-length':
                          (isSameDate(timed.end.date, date) ? minutesOf(timed.end) : 1440) -
                          minutesOf(timed.start),
                      } as CSSProperties
                    }
                  >
                    {formatTimeRange(timed.start.time, timed.end.time, timeOptions)}
                  </div>
                )}
                {items.map((item) => (
                  <EventItem
                    clippedEnd={item.clippedEnd}
                    clippedStart={item.clippedStart}
                    continuesAfter={item.continuesAfter}
                    continuesBefore={item.continuesBefore}
                    date={date}
                    inGrid
                    key={item.occurrence.key}
                    layout="block"
                    occurrence={item.occurrence}
                    short={item.length < SHORT_MINUTES}
                    style={
                      {
                        '--slotted-event-start': item.start,
                        '--slotted-event-length': item.length,
                        '--slotted-event-column': item.column,
                        '--slotted-event-columns': item.columns,
                        '--slotted-event-span': item.span,
                      } as CSSProperties
                    }
                    withLocation={item.length >= SHORT_MINUTES}
                  />
                ))}
                {more.map((entry) => (
                  <button
                    aria-expanded={model.moreDate === toISODate(date)}
                    aria-haspopup="dialog"
                    aria-label={model.t('moreEvents', { count: entry.occurrences.length })}
                    data-overlay={entry.overlay ? '' : undefined}
                    data-part="more"
                    data-part-more=""
                    key={entry.start}
                    onClick={(clicked) => model.openMore(date, clicked.currentTarget)}
                    style={
                      {
                        '--slotted-event-start': entry.start,
                        '--slotted-event-length': entry.length,
                        '--slotted-event-column': entry.column,
                        '--slotted-event-columns': entry.columns,
                        '--slotted-event-span': 1,
                      } as CSSProperties
                    }
                    tabIndex={-1}
                    type="button"
                  >
                    {`+${entry.occurrences.length}`}
                    <span>{model.t('more')}</span>
                  </button>
                ))}
                {nowHere === null || nowHere < startHour * 60 || nowHere > endHour * 60 ? null : (
                  <div
                    aria-hidden="true"
                    data-part="now"
                    data-part-now=""
                    style={{ '--slotted-event-start': nowHere - startHour * 60 } as CSSProperties}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
