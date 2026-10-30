import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

export default function DateTimePickerGranularity() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Shift starts</FieldLabel>
        <DateTimePicker
          defaultValue={plainDateTime(plainDate(2026, 10, 1), plainTime(6, 0))}
          granularity="hour"
          step={3600}
        />
        <FieldDescription>Shifts start on the hour.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Batch run starts</FieldLabel>
        <DateTimePicker
          defaultValue={plainDateTime(plainDate(2026, 9, 30), plainTime(2, 0, 30))}
          granularity="second"
          maxTime={plainTime(2, 5)}
          minTime={plainTime(2, 0)}
          step={30}
        />
        <FieldDescription>The nightly run starts between 2:00:00 and 2:05:00 AM.</FieldDescription>
      </Field>
    </Stack>
  );
}
