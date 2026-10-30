import { DateTimePicker } from '@slotted/react/datetime-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

const PICKUP = plainDateTime(plainDate(2026, 9, 30), plainTime(14, 30));

export default function DateTimePickerLocale() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Pickup, United States (en-US)</FieldLabel>
        <DateTimePicker defaultValue={PICKUP} locale="en-US" />
      </Field>
      <Field>
        <FieldLabel>Pickup, United Kingdom (en-GB)</FieldLabel>
        <DateTimePicker defaultValue={PICKUP} locale="en-GB" />
      </Field>
      <Field>
        <FieldLabel>Pickup, Germany (de-DE)</FieldLabel>
        <DateTimePicker defaultValue={PICKUP} locale="de-DE" />
      </Field>
      <Field>
        <FieldLabel>Pickup, Japan (ja-JP)</FieldLabel>
        <DateTimePicker defaultValue={PICKUP} locale="ja-JP" />
      </Field>
    </Stack>
  );
}
