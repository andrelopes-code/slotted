import { monthGrid, plainDate } from '@slotted/core/date';
import type { CalendarWeek, DateFormat } from '@slotted/core/date';
import type { MouseEvent, ReactNode } from 'react';

import { CalendarDayCell } from './calendar-day-cell';
import type { CalendarDayContext } from './calendar-day-cell';

interface CalendarMonthTableProps extends CalendarDayContext {
  readonly firstDayOfWeek: number;
  readonly fixedWeeks: boolean;
  readonly format: DateFormat;
  /** Absent without a header: the caption names the grid. */
  readonly header: ReactNode;
  readonly headingId: string | undefined;
  readonly month: { year: number; month: number };
  /** Present where a press on a week number chooses the week. */
  readonly onWeek: ((week: CalendarWeek, event: MouseEvent) => void) | undefined;
  readonly weekName: (week: number) => string;
  readonly weekNumbers: boolean;
}

/** One month: its header, and the `table` the grid role belongs on. */
export function CalendarMonthTable({
  firstDayOfWeek,
  fixedWeeks,
  format,
  header,
  headingId,
  month,
  onWeek,
  weekName,
  weekNumbers,
  ...context
}: CalendarMonthTableProps) {
  const weeks = monthGrid({ ...month, firstDayOfWeek, fixedWeeks });
  const caption = format.monthYear(plainDate(month.year, month.month, 1));
  const long = format.weekdayNames('long');
  const names = format.weekdayNames(context.filled ? 'short' : 'narrow');

  return (
    <div data-part="month" data-part-month="">
      {header}

      <table aria-labelledby={headingId} data-part="grid" data-part-grid="" role="grid">
        <caption data-part="grid-caption" data-part-grid-caption="">
          {caption}
        </caption>

        <thead>
          <tr data-part="week-headers" data-part-week-headers="">
            {weekNumbers && (
              <th aria-hidden="true" data-part="week-number" data-part-week-number="" />
            )}
            {names.map((name, index) => (
              /* What a column holds is not always a weekday; the full name reaches
               assistive technology through `abbr`, which is the APG's own answer. */
              <th
                abbr={long[index]}
                data-part="week-header"
                data-part-week-header=""
                key={long[index]}
                scope="col"
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {weeks.map((week) => (
            <tr data-part="week" data-part-week="" key={week.weekNumber}>
              {weekNumbers && (
                <th data-part="week-number" data-part-week-number="" scope="row">
                  {onWeek === undefined ? (
                    week.weekNumber
                  ) : (
                    <button
                      aria-label={weekName(week.weekNumber)}
                      data-part="week-choice"
                      data-part-week-choice=""
                      onClick={(event) => onWeek(week, event)}
                      tabIndex={-1}
                      type="button"
                    >
                      {week.weekNumber}
                    </button>
                  )}
                </th>
              )}
              {week.days.map((day) => (
                <CalendarDayCell
                  {...context}
                  day={day}
                  key={`${String(day.date.month)}-${String(day.date.day)}`}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
