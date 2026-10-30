import { DateRangePicker, DateRangePickerPreset } from '@slotted/react/date-range-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { addDays, plainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

export default function DateRangePickerNarrow() {
  return (
    <Field>
      <FieldLabel>Deliveries between</FieldLabel>
      <DateRangePicker
        max={TODAY}
        presets={
          <>
            <DateRangePickerPreset value={{ start: TODAY, end: TODAY }}>
              Today
            </DateRangePickerPreset>
            <DateRangePickerPreset value={{ start: addDays(TODAY, -6), end: TODAY }}>
              Last 7 days
            </DateRangePickerPreset>
          </>
        }
      />
    </Field>
  );
}
