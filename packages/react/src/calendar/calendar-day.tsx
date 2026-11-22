import type { ComponentPropsWithoutRef } from 'react';

import type { CalendarDayMarkProps } from './calendar.types';

/** A row of marks in a day, one per record, under the day's number. */
export function CalendarDayMarks(props: ComponentPropsWithoutRef<'span'>) {
  return <span {...props} data-part="day-marks" data-part-day-marks="" />;
}

/**
 * One record of a day: a dot in a tone or a data palette slot, and a ring
 * when the record is still open, so its state is not told by color alone.
 */
export function CalendarDayMark({ hollow = false, tone, ...nativeProps }: CalendarDayMarkProps) {
  return (
    <span
      {...nativeProps}
      data-part="day-mark"
      data-part-day-mark=""
      {...(hollow ? { 'data-hollow': '' } : {})}
      {...(tone === undefined ? {} : { 'data-tone': tone })}
    />
  );
}

/**
 * A short figure of the day (its total): one line in tabular figures at the
 * end of the day, hidden where the calendar is too narrow to read it.
 */
export function CalendarDayValue(props: ComponentPropsWithoutRef<'span'>) {
  return <span {...props} data-part="day-value" data-part-day-value="" />;
}
