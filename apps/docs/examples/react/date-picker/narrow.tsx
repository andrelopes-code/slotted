import { useRef, useState } from 'react';
import { Button } from '@slotted/react/button';
import { DatePicker, type DatePickerHandle } from '@slotted/react/date-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { addDays, isPlainDate, plainDate, type PlainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

export default function DatePickerNarrow() {
  const picker = useRef<DatePickerHandle>(null);
  const [date, setDate] = useState<PlainDate | null>(null);

  const choose = (next: PlainDate) => {
    setDate(next);
    picker.current?.close();
  };

  return (
    <Field>
      <FieldLabel>Proof of delivery date</FieldLabel>
      <DatePicker
        ref={picker}
        onValueChange={(value) => setDate(isPlainDate(value) ? value : null)}
        presets={
          <>
            <Button size="sm" variant="ghost" onClick={() => choose(TODAY)}>
              Today
            </Button>
            <Button size="sm" variant="ghost" onClick={() => choose(addDays(TODAY, -1))}>
              Yesterday
            </Button>
          </>
        }
        value={date}
      />
    </Field>
  );
}
