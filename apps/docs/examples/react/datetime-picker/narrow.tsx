import { useRef, useState } from 'react';
import { Button } from '@slotted/react/button';
import { DateTimePicker, type DateTimePickerHandle } from '@slotted/react/datetime-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import {
  addDays,
  plainDate,
  plainDateTime,
  plainTime,
  type PlainDateTime,
} from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

export default function DateTimePickerNarrow() {
  const picker = useRef<DateTimePickerHandle>(null);
  const [delivery, setDelivery] = useState<PlainDateTime | null>(null);

  const choose = (next: PlainDateTime) => {
    setDelivery(next);
    picker.current?.close();
  };

  return (
    <Field>
      <FieldLabel>Delivery appointment</FieldLabel>
      <DateTimePicker
        onValueChange={setDelivery}
        presets={
          <>
            <Button
              onClick={() => choose(plainDateTime(TODAY, plainTime(17, 0)))}
              size="sm"
              variant="ghost"
            >
              Today, 5:00 PM
            </Button>
            <Button
              onClick={() => choose(plainDateTime(addDays(TODAY, 1), plainTime(9, 0)))}
              size="sm"
              variant="ghost"
            >
              Tomorrow, 9:00 AM
            </Button>
          </>
        }
        ref={picker}
        referenceDateTime={plainDateTime(TODAY, plainTime(9, 0))}
        step={1800}
        value={delivery}
      />
    </Field>
  );
}
