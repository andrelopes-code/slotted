import { selectorKeyProps } from '@slotted/core/selector-key';
import { isSameDate, toISODate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { listDayParts, listDays } from '@slotted/core/event-calendar';
import type { CalendarEvent, EventOccurrence } from '@slotted/core/event-calendar';
import { createElement } from 'react';
import type { ReactNode } from 'react';

import { useEventCalendarModel } from './event-calendar-context';
import { EventItem } from './event-calendar-event';

export interface ListProps {
  days: readonly PlainDate[];
  occurrences: readonly EventOccurrence<CalendarEvent>[];
  emptyText: string;
  empty: ReactNode;
}

/**
 * The list: a section per day that holds an event, named by its heading, so a
 * screen reader walks the days by heading and the events by Tab. It is not a
 * grid — every event is in the tab order — because a list read top to bottom
 * has no second axis to arrow along.
 */
export function List({ days, empty, emptyText, occurrences }: ListProps) {
  const model = useEventCalendarModel();
  const grouped = listDays(occurrences, days);
  const headingTag = `h${Math.min(6, model.headingLevel + 1)}`;

  if (grouped.length === 0) {
    return (
      <div data-part="list" data-part-list="">
        <div data-part="empty" data-part-empty="">
          <p>{emptyText}</p>
          {empty}
        </div>
      </div>
    );
  }

  return (
    <div data-part="list" data-part-list="">
      {grouped.map((day) => {
        const iso = toISODate(day.date);
        const headingId = `${model.id}-list-${iso}`;
        const parts = listDayParts(day.date, model.locale);
        return (
          <section
            aria-labelledby={headingId}
            data-date={iso}
            data-part="list-day"
            data-part-list-day=""
            data-today={model.today !== null && isSameDate(day.date, model.today) ? '' : undefined}
            key={iso}
          >
            {createElement(
              headingTag,
              {
                'aria-label': parts.label,
                'data-part': 'list-day-heading',
                ...selectorKeyProps('part', 'list-day-heading'),
                id: headingId,
              },
              <>
                <span data-part="list-weekday" data-part-list-weekday="">
                  {parts.weekday}
                </span>{' '}
                <span data-part="list-date" data-part-list-date="">
                  {parts.date}
                </span>
              </>,
            )}
            <ul data-part="list-events" data-part-list-events="" role="list">
              {day.occurrences.map((occurrence) => (
                <li key={occurrence.key}>
                  <EventItem
                    date={day.date}
                    inGrid={false}
                    layout="list"
                    occurrence={occurrence}
                    withLocation
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
