import { useRef, useState } from 'react';
import { Button } from '@slotted/react/button';
import { DateTimePicker, type DateTimePickerHandle } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Text } from '@slotted/react/typography';
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
  const picker = useRef<DateTimePickerHandle>(null);
  const [pickup, setPickup] = useState<PlainDateTime | null>(null);

  return (
    <Field required>
      <FieldLabel>Carrier pickup slot</FieldLabel>
      <DateTimePicker
        closeOnSelect="never"
        footer={
          <Button onClick={() => picker.current?.close()} size="sm">
            Done
          </Button>
        }
        isDateUnavailable={isWeekend}
        isTimeUnavailable={(time, date) => trucksLeft(time, date) === 0}
        min={plainDateTime(plainDate(2026, 10, 1), plainTime(8, 0))}
        onValueChange={setPickup}
        options={WINDOWS}
        ref={picker}
        referenceDateTime={plainDateTime(plainDate(2026, 10, 1), plainTime(10, 30))}
        renderOption={({ date, label, time, unavailable }) => (
          <>
            <span>{label}</span>
            <Text size="sm" tone="muted">
              {unavailable
                ? 'Full'
                : `${trucksLeft(time, date)} of ${TRUCKS_PER_WINDOW} trucks left`}
            </Text>
          </>
        )}
        value={pickup}
      />
      <FieldDescription>
        {pickup === null
          ? 'Harbor Freightways collects on weekdays, in four windows.'
          : `Harbor Freightways collects on ${words.describe(pickup)}.`}
      </FieldDescription>
    </Field>
  );
}
