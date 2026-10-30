import { useState } from 'react';
import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  addDays,
  compareDate,
  createDateFormat,
  dayOfWeek,
  isPlainDate,
  plainDate,
  toISODate,
  type PlainDate,
} from '@slotted/core/date';

const ORDERED = plainDate(2026, 9, 30);
const HOLIDAYS = new Set(['2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25']);
const words = createDateFormat({ locale: 'en-US' });

const isBusinessDay = (date: PlainDate) =>
  dayOfWeek(date) !== 0 && dayOfWeek(date) !== 6 && !HOLIDAYS.has(toISODate(date));

const addBusinessDays = (from: PlainDate, count: number) => {
  let date = from;
  for (let added = 0; added < count;) {
    date = addDays(date, 1);
    if (isBusinessDay(date)) added += 1;
  }
  return date;
};

const businessDaysBetween = (from: PlainDate, to: PlainDate) => {
  let count = 0;
  for (let date = addDays(from, 1); compareDate(date, to) <= 0; date = addDays(date, 1)) {
    if (isBusinessDay(date)) count += 1;
  }
  return count;
};

const EARLIEST = addBusinessDays(ORDERED, 2);
const LATEST = addBusinessDays(ORDERED, 40);

export default function DatePickerShippingDate() {
  const [date, setDate] = useState<PlainDate | null>(EARLIEST);

  return (
    <Field required>
      <FieldLabel>Ship date</FieldLabel>
      <DatePicker
        isDateUnavailable={(day) => !isBusinessDay(day)}
        max={LATEST}
        min={EARLIEST}
        onValueChange={(value) => setDate(isPlainDate(value) ? value : null)}
        value={date}
      />
      <FieldDescription>
        {date === null
          ? 'Orders ship 2 to 40 business days after they are placed.'
          : `Ships ${words.describe(date)}, ${businessDaysBetween(ORDERED, date)} business days after the order.`}
      </FieldDescription>
    </Field>
  );
}
