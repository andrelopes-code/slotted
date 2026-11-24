import { monthGrid, plainDate } from '@slotted/core/date';
import type { DateFormat } from '@slotted/core/date';

import { CalendarDayCell } from './calendar-day-cell';
import type { CalendarDayContext } from './calendar-day-cell';

interface CalendarMonthTableProps extends CalendarDayContext {
  readonly firstDayOfWeek: number;
  readonly fixedWeeks: boolean;
  readonly format: DateFormat;
  /** Absent without a header: the caption names the grid. */
  readonly headingId: string | undefined;
  readonly month: { year: number; month: number };
  readonly weekNumbers: boolean;
}

/** One month, as the `table` the grid role belongs on. */
export function CalendarMonthTable({
  firstDayOfWeek,
  fixedWeeks,
  format,
  headingId,
  month,
  weekNumbers,
  ...context
}: CalendarMonthTableProps) {
  const weeks = monthGrid({ ...month, firstDayOfWeek, fixedWeeks });
  const caption = format.monthYear(plainDate(month.year, month.month, 1));
  const long = format.weekdayNames('long');
  const names = format.weekdayNames(context.filled ? 'short' : 'narrow');

  return (
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
                {week.weekNumber}
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
  );
}
