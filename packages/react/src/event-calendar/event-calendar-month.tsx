import {
  compareDate,
  isPlainDateTime,
  isSameDate,
  isoWeekNumber,
  toISODate,
} from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import {
  isMultiDay,
  isWorkingDay,
  layoutRow,
  occurrencesOn,
  overflowByDay,
} from '@slotted/core/event-calendar';
import type { CalendarEvent, EventOccurrence } from '@slotted/core/event-calendar';
import type { CSSProperties } from 'react';

import { useEventCalendarModel } from './event-calendar-context';
import type { EventCalendarModel } from './event-calendar-context';
import { EventItem } from './event-calendar-event';
import type { EventCalendarSelection } from './event-calendar.types';

/** Whether a run of days holds `date`. A stretch of hours holds no day of the month. */
export function selectionHolds(
  selection: EventCalendarSelection | null,
  date: PlainDate,
  allDay: boolean,
): boolean {
  if (selection === null) return false;
  if (isPlainDateTime(selection.start)) return false;
  if (!allDay) return false;
  const { start, end } = selection as { start: PlainDate; end: PlainDate };
  return compareDate(date, start) >= 0 && compareDate(date, end) <= 0;
}

function weekdayName(model: EventCalendarModel, date: PlainDate, style: 'long' | 'short') {
  return new Intl.DateTimeFormat(model.locale, { timeZone: 'UTC', weekday: style }).format(
    new Date(Date.UTC(date.year, date.month - 1, date.day)),
  );
}

export function fullDate(model: Pick<EventCalendarModel, 'locale'>, date: PlainDate) {
  return new Intl.DateTimeFormat(model.locale, {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
}

export interface MonthProps {
  weeks: readonly (readonly PlainDate[])[];
  occurrences: readonly EventOccurrence<CalendarEvent>[];
  anchorMonth: number;
  titleId: string;
}

/**
 * The month as a real `table` with the grid role on it, as in `calendar`:
 * rows and cells are implied by `tr`, `th` and `td`, and only the grid role and
 * the cell's own name are written.
 *
 * Each week reserves `maxEvents` lanes and a line for "+N", whatever it holds,
 * so every row is the same height and a month whose events are still loading
 * is the same boxes as the month they land in.
 */
export function Month({ anchorMonth, occurrences, titleId, weeks }: MonthProps) {
  const model = useEventCalendarModel();
  const first = weeks[0] ?? [];
  const selection = model.pendingSelection ?? model.selection;

  return (
    <table aria-labelledby={titleId} data-part="month" data-part-month="" role="grid">
      <thead>
        <tr data-part="weekdays" data-part-weekdays="">
          {model.weekNumbers ? (
            <th data-part="week-number-header" data-part-week-number-header="" scope="col">
              <span data-ui="visually-hidden" data-ui-visually-hidden="">
                {model.t('weekNumber')}
              </span>
            </th>
          ) : null}
          {first.map((date) => (
            <th
              abbr={weekdayName(model, date, 'long')}
              data-part="weekday"
              data-part-weekday=""
              key={toISODate(date)}
              scope="col"
            >
              {weekdayName(model, date, 'short')}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => {
          const { segments } = layoutRow(occurrences, week, {});
          const hidden = overflowByDay(segments, week.length, model.maxEvents);
          const firstDay = week[0] as PlainDate;
          return (
            <tr
              data-part="week"
              data-part-week=""
              key={toISODate(firstDay)}
              style={{ '--slotted-event-calendar-lanes': model.maxEvents } as CSSProperties}
            >
              {model.weekNumbers ? (
                <th data-part="week-number" data-part-week-number="" scope="row">
                  {isoWeekNumber(firstDay)}
                </th>
              ) : null}
              {week.map((date, index) => {
                const iso = toISODate(date);
                const numberId = `${model.id}-day-${iso}`;
                const countId = `${numberId}-count`;
                const starting = segments.filter(
                  (segment) => segment.start === index && segment.lane < model.maxEvents,
                );
                const continuing = segments.filter(
                  (segment) =>
                    segment.start < index &&
                    segment.start + segment.span > index &&
                    segment.lane < model.maxEvents,
                );
                const count = occurrencesOn(occurrences, date).length;
                const selected = selectionHolds(selection, date, true);
                const content = model.renderDayContent?.(date, { view: 'month' });
                const more = hidden[index] ?? 0;
                return (
                  <td
                    aria-labelledby={`${numberId} ${countId}`}
                    aria-selected={model.selectionMode === 'range' ? selected : undefined}
                    data-date={iso}
                    data-non-working={isWorkingDay(date, model.workingHours) ? undefined : ''}
                    data-outside-month={date.month === anchorMonth ? undefined : ''}
                    data-part="day"
                    data-part-day=""
                    data-row="day"
                    data-selected={selected ? '' : undefined}
                    data-today={
                      model.today !== null && isSameDate(date, model.today) ? '' : undefined
                    }
                    key={iso}
                    role="gridcell"
                    tabIndex={isSameDate(date, model.date) ? 0 : -1}
                  >
                    <div data-part="day-header" data-part-day-header="">
                      <button
                        aria-label={fullDate(model, date)}
                        aria-haspopup={model.narrow ? 'dialog' : undefined}
                        data-part="day-number"
                        data-part-day-number=""
                        id={numberId}
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
                      <span data-ui="visually-hidden" data-ui-visually-hidden="" id={countId}>
                        {model.t('events', { count })}
                      </span>
                    </div>
                    <div data-part="day-events" data-part-day-events="">
                      {starting.map((segment) => {
                        const bar = segment.occurrence.allDay || isMultiDay(segment.occurrence);
                        return (
                          <EventItem
                            continuesAfter={segment.continuesAfter}
                            continuesBefore={segment.continuesBefore}
                            date={date}
                            inGrid
                            key={segment.occurrence.key}
                            layout={bar ? 'bar' : 'lane'}
                            occurrence={segment.occurrence}
                            style={
                              {
                                '--slotted-event-lane': segment.lane + 1,
                                ...(bar ? { '--slotted-event-span': segment.span } : {}),
                              } as CSSProperties
                            }
                          />
                        );
                      })}
                      {continuing.map((segment) => (
                        <span
                          data-part="continuation"
                          data-part-continuation=""
                          key={segment.occurrence.key}
                        >
                          {model.t('titleContinues', { title: segment.occurrence.event.title })}
                        </span>
                      ))}
                      {more > 0 ? (
                        <button
                          aria-expanded={model.moreDate === iso}
                          aria-haspopup="dialog"
                          aria-label={model.t('moreEvents', { count: more })}
                          data-part="more"
                          data-part-more=""
                          onClick={(clicked) => model.openMore(date, clicked.currentTarget)}
                          tabIndex={-1}
                          type="button"
                        >
                          {`+${more}`}
                          <span>{model.t('more')}</span>
                        </button>
                      ) : null}
                    </div>
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
