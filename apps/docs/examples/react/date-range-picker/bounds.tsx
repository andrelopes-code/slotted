import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DateRangePickerBounds() {
  return (
    <Field>
      <FieldLabel>Shipment window</FieldLabel>
      <DateRangePicker max={plainDate(2026, 12, 31)} min={plainDate(2026, 10, 1)} />
      <FieldDescription>
        Carriers accept bookings from October 1 to December 31, 2026.
      </FieldDescription>
    </Field>
  );
}
