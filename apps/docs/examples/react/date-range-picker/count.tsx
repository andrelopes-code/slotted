import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

const TRIP = { start: plainDate(2026, 10, 12), end: plainDate(2026, 10, 16) };

export default function DateRangePickerCount() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Hotel stay</FieldLabel>
        <DateRangePicker count="nights" defaultValue={TRIP} />
        <FieldDescription>Counted in nights: October 12 to 16 is 4 nights.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Trade show leave</FieldLabel>
        <DateRangePicker count="days" defaultValue={TRIP} />
        <FieldDescription>Counted in days: October 12 to 16 is 5 days.</FieldDescription>
      </Field>
    </Stack>
  );
}
