import { dayOfWeek, isSameDate, toISODate } from '@slotted/core/date';
import type { CalendarDay, PlainDate } from '@slotted/core/date';

import { CalendarDayButton } from './calendar-day-button';
import { isSelected, rangeStateOf } from './calendar-selection';
import type {
  CalendarDayState,
  CalendarMark,
  CalendarOutsideDays,
  CalendarProps,
  CalendarValue,
  DateRange,
} from './calendar.types';

/** What every day of a month is drawn against. */
export interface CalendarDayContext {
  readonly dayLabel: CalendarProps['dayLabel'];
  readonly editable: boolean;
  /** The `fill` layout, which draws the number in a box of its own. */
  readonly filled: boolean;
  readonly focused: PlainDate;
  readonly inert: (date: PlainDate) => boolean;
  readonly markName: (mark: CalendarMark) => string;
  readonly marks: ReadonlyMap<string, CalendarMark> | undefined;
  readonly onHover: (date: PlainDate | null) => void;
  readonly onSelect: (date: PlainDate, reason: 'pointer' | 'keyboard', source: unknown) => void;
  readonly outsideDays: CalendarOutsideDays;
  /** The days of the run that are past its limit. */
  readonly over: ((date: PlainDate) => boolean) | undefined;
  /** The run as drawn, which is the value's own once the run is whole. */
  readonly pending: DateRange | null;
  readonly renderDay: CalendarProps['renderDay'];
  readonly renderDayTooltip: CalendarProps['renderDayTooltip'];
  readonly today: PlainDate | null;
  readonly unavailable: (date: PlainDate) => boolean;
  readonly value: CalendarValue;
}

interface CalendarDayCellProps extends CalendarDayContext {
  readonly day: CalendarDay;
}

/** One day of a month. */
export function CalendarDayCell({
  day,
  dayLabel,
  editable,
  filled,
  focused,
  inert,
  markName,
  marks,
  onHover,
  onSelect,
  outsideDays,
  over,
  pending,
  renderDay,
  renderDayTooltip,
  today,
  unavailable,
  value,
}: CalendarDayCellProps) {
  const { date, outsideMonth: outside } = day;

  /* A hidden day is an empty cell and nothing else. It carried the marks of
     the date it stood for, so a range across a month boundary painted a band
     with no digits under it. */
  if (outside && outsideDays === 'hidden') {
    return <td data-outside-month="" data-part="cell" data-part-cell="" />;
  }

  const plain = inert(date);
  const refused = plain || unavailable(date) || (outside && outsideDays === 'shown');
  const chosen = isSelected(date, value);
  const run = rangeStateOf(date, pending ?? value);
  /* Every cell of the pending band is a proposal except the start the reader
     already chose. */
  const proposed = pending !== null && run !== null && !chosen;
  const roving = isSameDate(date, focused);
  const mark = marks?.get(toISODate(date));
  const state: CalendarDayState = {
    outside,
    selected: chosen,
    today: today !== null && isSameDate(date, today),
    unavailable: unavailable(date),
  };

  /* An inert day has no role, so it takes no name and no state of one. */
  const pressable = {
    'aria-disabled': refused ? true : undefined,
    'aria-pressed': chosen,
    role: 'button',
    ...(dayLabel === undefined ? {} : { 'aria-label': dayLabel(date) }),
  };

  return (
    <td
      data-part="cell"
      data-part-cell=""
      {...(outside ? { 'data-outside-month': '' } : {})}
      {...(plain ? { 'data-inert': '' } : {})}
      {...(state.unavailable ? { 'data-unavailable': '' } : {})}
      {...(chosen ? { 'data-selected': '' } : {})}
      {...(run === 'start' ? { 'data-range-start': '' } : {})}
      {...(run === 'end' ? { 'data-range-end': '' } : {})}
      {...(run === 'inside' ? { 'data-in-range': '' } : {})}
      {...(proposed ? { 'data-preview': '' } : {})}
      {...(run !== null && over?.(date) === true ? { 'data-over': '' } : {})}
      {...(dayOfWeek(date) % 6 === 0 ? { 'data-weekend': '' } : {})}
    >
      <CalendarDayButton
        data-part="day"
        data-part-day=""
        {...(state.today ? { 'data-today': '' } : {})}
        onClick={(event) => {
          if (!refused) onSelect(date, 'pointer', event);
        }}
        onPointerEnter={() => onHover(date)}
        onPointerLeave={() => onHover(null)}
        tabIndex={roving && editable ? 0 : -1}
        tooltip={plain ? null : renderDayTooltip?.(date, state)}
        {...(plain ? {} : pressable)}
      >
        {filled && (
          <span data-part="day-number" data-part-day-number="">
            {date.day}
          </span>
        )}
        {!filled && date.day}
        {renderDay !== undefined && (
          <span data-part="day-content" data-part-day-content="">
            {renderDay(date, state)}
          </span>
        )}
        {mark !== undefined && (
          <span
            data-part="mark"
            data-part-mark=""
            {...(mark.tone === undefined ? {} : { 'data-tone': mark.tone })}
          >
            <span data-ui="visually-hidden" data-ui-visually-hidden="">
              {`, ${markName(mark)}`}
            </span>
          </span>
        )}
      </CalendarDayButton>
    </td>
  );
}
