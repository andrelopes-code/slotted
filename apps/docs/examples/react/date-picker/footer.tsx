import { useRef } from 'react';
import { Button } from '@slotted/react/button';
import { DatePicker, type DatePickerHandle } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

export default function DatePickerFooter() {
  const picker = useRef<DatePickerHandle>(null);

  return (
    <Field>
      <FieldLabel>Stock count date</FieldLabel>
      <DatePicker
        ref={picker}
        closeOnSelect="never"
        defaultValue={plainDate(2026, 10, 3)}
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
