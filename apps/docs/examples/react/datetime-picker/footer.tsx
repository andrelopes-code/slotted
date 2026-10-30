import { useRef } from 'react';
import { Button } from '@slotted/react/button';
import { DateTimePicker, type DateTimePickerHandle } from '@slotted/react/datetime-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';

export default function DateTimePickerFooter() {
  const picker = useRef<DateTimePickerHandle>(null);

  return (
    <Field>
      <FieldLabel>Maintenance window starts</FieldLabel>
      <DateTimePicker
        closeOnSelect="never"
        defaultValue={plainDateTime(plainDate(2026, 10, 3), plainTime(22, 0))}
        footer={
          <Button onClick={() => picker.current?.close()} size="sm">
            Done
          </Button>
        }
        ref={picker}
        step={3600}
      />
      <FieldDescription>Conveyors stop for four hours from this time.</FieldDescription>
    </Field>
  );
}
