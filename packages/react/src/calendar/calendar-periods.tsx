import { plainDate } from '@slotted/core/date';
import type { DateFormat, PlainDate } from '@slotted/core/date';
import type { MouseEvent } from 'react';

import type { CalendarView } from './calendar.types';

type Press = MouseEvent<HTMLButtonElement>;

interface CalendarPeriodsProps {
  readonly focused: PlainDate;
  readonly format: DateFormat;
  /** The value's month, which is the month cell marked as chosen. */
  readonly held: { year: number; month: number } | null;
  /** The months of the year are where a choice is made. */
  readonly monthly: boolean;
  readonly onMonth: (month: number, event: Press) => void;
  readonly onWalkDown: (date: PlainDate, view: CalendarView, event: Press) => void;
  readonly refused: (month: number) => boolean;
  readonly view: CalendarView;
  readonly years: readonly number[];
}

/** The months of a year, or a page of years, above the day grid. */
export function CalendarPeriods({
  focused,
  format,
  held,
  monthly,
  onMonth,
  onWalkDown,
  refused,
  view,
  years,
}: CalendarPeriodsProps) {
  if (view !== 'month') {
    return (
      <div data-part="years" data-part-years="">
        {years.map((year) => (
          <button
            aria-pressed={focused.year === year}
            data-part="period"
            data-part-period=""
            key={year}
            onClick={(event) => onWalkDown({ ...focused, year, day: 1 }, 'month', event)}
            type="button"
            {...(focused.year === year ? { 'data-selected': '' } : {})}
          >
            {year}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div data-part="months" data-part-months="">
      {format.monthNames('long').map((name, index) => {
        const month = index + 1;
        const reached = focused.month === month;
        const chosen = monthly ? held?.year === focused.year && held.month === month : reached;
        const choice = {
          'aria-label': format.monthYear(plainDate(focused.year, month, 1)),
          tabIndex: reached ? 0 : -1,
          ...(refused(month) ? { 'aria-disabled': true, 'data-unavailable': '' } : {}),
          ...(reached ? { 'data-focused': '' } : {}),
        };

        return (
          <button
            aria-pressed={chosen}
            data-part="period"
            data-part-period=""
            key={name}
            onClick={(event) => {
              if (monthly) onMonth(month, event);
              else onWalkDown({ ...focused, month, day: 1 }, 'day', event);
            }}
            type="button"
            {...(chosen ? { 'data-selected': '' } : {})}
            {...(monthly ? choice : {})}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
