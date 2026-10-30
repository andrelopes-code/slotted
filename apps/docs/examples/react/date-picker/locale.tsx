import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

const SHIP_DATE = plainDate(2026, 9, 30);

export default function DatePickerLocale() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Ship date, United States (en-US)</FieldLabel>
        <DatePicker defaultValue={SHIP_DATE} locale="en-US" />
      </Field>
      <Field>
        <FieldLabel>Ship date, United Kingdom (en-GB)</FieldLabel>
        <DatePicker defaultValue={SHIP_DATE} locale="en-GB" />
      </Field>
      <Field>
        <FieldLabel>Ship date, Germany (de-DE)</FieldLabel>
        <DatePicker defaultValue={SHIP_DATE} locale="de-DE" />
      </Field>
      <Field>
        <FieldLabel>Ship date, Japan (ja-JP)</FieldLabel>
        <DatePicker defaultValue={SHIP_DATE} locale="ja-JP" />
      </Field>
    </Stack>
  );
}
