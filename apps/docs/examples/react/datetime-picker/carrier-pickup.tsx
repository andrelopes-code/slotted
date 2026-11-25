import { useState } from 'react';
import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  createDateTimeFormat,
  dayOfWeek,
  plainDate,
  plainDateTime,
  plainTime,
  toISODate,
  toISOTime,
  type PlainDate,
  type PlainDateTime,
  type PlainTime,
} from '@slotted/core/date';

/** The windows Harbor Freightways collects in, every weekday. */
const WINDOWS = [plainTime(8, 0), plainTime(10, 30), plainTime(13, 0), plainTime(15, 30)];
const TRUCKS_PER_WINDOW = 3;
/** Pickups already booked, by date and window. */
const BOOKED: Record<string, number> = {
  '2026-10-01T08:00:00': 3,
  '2026-10-01T10:30:00': 2,
  '2026-10-02T13:00:00': 3,
  '2026-10-02T15:30:00': 1,
};
const words = createDateTimeFormat({ locale: 'en-US' });

const trucksLeft = (time: PlainTime, date: PlainDate) =>
  TRUCKS_PER_WINDOW - (BOOKED[`${toISODate(date)}T${toISOTime(time)}`] ?? 0);
const isWeekend = (date: PlainDate) => dayOfWeek(date) === 0 || dayOfWeek(date) === 6;

export default function DateTimePickerCarrierPickup() {
  const [pickup, setPickup] = useState<PlainDateTime | null>(null);

  return (
    <Field required>
      <FieldLabel>Carrier pickup slot</FieldLabel>
      <DateTimePicker
        hourCycle={24}
        isDateUnavailable={isWeekend}
        isTimeUnavailable={(time, date) => trucksLeft(time, date) === 0}
        min={plainDateTime(plainDate(2026, 10, 1), plainTime(8, 0))}
        onValueChange={setPickup}
        options={WINDOWS}
        referenceDateTime={plainDateTime(plainDate(2026, 10, 1), plainTime(10, 30))}
        renderSlot={({ date, label, time, unavailable }) =>
          date === null || unavailable ? label : `${label} (${String(trucksLeft(time, date))})`
        }
        value={pickup}
      />
      <FieldDescription>
        {pickup === null
          ? 'Harbor Freightways collects on weekdays. Each window says the trucks left.'
          : `Harbor Freightways collects on ${words.describe(pickup)}.`}
      </FieldDescription>
    </Field>
  );
}
