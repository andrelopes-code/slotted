import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { addDays, plainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

export default function DateRangePickerNarrow() {
  return (
    <Field>
      <FieldLabel>Deliveries between</FieldLabel>
      <DateRangePicker
        max={TODAY}
        presets={[
          { label: 'Today', value: { start: TODAY, end: TODAY } },
          { label: 'Last 7 days', value: { start: addDays(TODAY, -6), end: TODAY } },
        ]}
      />
    </Field>
  );
}
