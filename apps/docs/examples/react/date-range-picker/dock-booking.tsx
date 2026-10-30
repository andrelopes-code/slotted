import { useState } from 'react';
import type { DateRange } from '@slotted/react/calendar';
import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  createDateFormat,
  dayOfWeek,
  plainDate,
  toISODate,
  type PlainDate,
} from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);
/** Days another carrier already holds dock 4. */
const HELD = new Set(['2026-10-07', '2026-10-08', '2026-10-21', '2026-10-22', '2026-10-23']);
const words = createDateFormat({ locale: 'en-US' });

const isClosed = (date: PlainDate) =>
  dayOfWeek(date) === 0 || dayOfWeek(date) === 6 || HELD.has(toISODate(date));

export default function DateRangePickerDockBooking() {
  const [slot, setSlot] = useState<DateRange | null>(null);

  return (
    <Field required>
      <FieldLabel>Dock 4 unloading window</FieldLabel>
      <DateRangePicker
        isDateUnavailable={isClosed}
        max={plainDate(2026, 11, 30)}
        maxLength={3}
        min={plainDate(2026, 10, 1)}
        onValueChange={(value) => setSlot(value)}
        value={slot}
      />
      <FieldDescription>
        {slot?.start && slot.end
          ? `Dock 4 is yours from ${words.describe(slot.start)} to ${words.describe(slot.end)}.`
          : `Book 1 to 3 weekdays from October 1. Booked as of ${words.describe(TODAY)}: Oct 7–8 and Oct 21–23.`}
      </FieldDescription>
    </Field>
  );
}
