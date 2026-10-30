import { useRef } from 'react';
import { Button } from '@slotted/react/button';
import { DateRangePicker, type DateRangePickerHandle } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DateRangePickerFooter() {
  const picker = useRef<DateRangePickerHandle>(null);

  return (
    <Field>
      <FieldLabel>Stock count freeze</FieldLabel>
      <DateRangePicker
        ref={picker}
        closeOnSelect="never"
        defaultValue={{ start: plainDate(2026, 10, 30), end: plainDate(2026, 11, 1) }}
        footer={
          <Button size="sm" onClick={() => picker.current?.close()}>
            Done
          </Button>
        }
      />
      <FieldDescription>The calendar stays open until you press Done.</FieldDescription>
    </Field>
  );
}
