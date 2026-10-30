import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

const SEASON = { start: plainDate(2026, 11, 2), end: plainDate(2026, 12, 23) };

export default function DateRangePickerLocale() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Peak season, United States (en-US)</FieldLabel>
        <DateRangePicker defaultValue={SEASON} locale="en-US" />
      </Field>
      <Field>
        <FieldLabel>Peak season, United Kingdom (en-GB)</FieldLabel>
        <DateRangePicker defaultValue={SEASON} locale="en-GB" />
      </Field>
      <Field>
        <FieldLabel>Peak season, Germany (de-DE)</FieldLabel>
        <DateRangePicker defaultValue={SEASON} locale="de-DE" />
      </Field>
    </Stack>
  );
}
