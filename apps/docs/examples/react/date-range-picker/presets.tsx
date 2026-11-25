import type { DateRange } from '@slotted/react/calendar';
import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { addDays, plainDate, type PickerPreset } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

const LAST_30_DAYS: DateRange = { start: addDays(TODAY, -29), end: TODAY };

const PRESETS: PickerPreset<DateRange>[] = [
  { label: 'Last 7 days', value: { start: addDays(TODAY, -6), end: TODAY } },
  { label: 'Last 30 days', value: LAST_30_DAYS },
  { label: 'This quarter', value: { start: plainDate(2026, 7, 1), end: TODAY } },
  { label: 'Last quarter', value: { start: plainDate(2026, 4, 1), end: plainDate(2026, 6, 30) } },
  { label: 'Year to date', value: { start: plainDate(2026, 1, 1), end: TODAY } },
];

export default function DateRangePickerPresets() {
  return (
    <Field>
      <FieldLabel>Report period</FieldLabel>
      <DateRangePicker defaultValue={LAST_30_DAYS} max={TODAY} presets={PRESETS} />
    </Field>
  );
}
