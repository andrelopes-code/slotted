import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DateRangePickerFirstDay() {
  return (
    <Field>
      <FieldLabel>Sprint 42</FieldLabel>
      <DateRangePicker
        defaultValue={{ start: plainDate(2026, 10, 5), end: plainDate(2026, 10, 16) }}
        firstDayOfWeek={1}
        weekNumbers
      />
      <FieldDescription>Sprints run two ISO weeks, Monday to Friday.</FieldDescription>
    </Field>
  );
}
