import { useRef, useState } from 'react';
import { Button } from '@slotted/react/button';
import { DatePicker, type DatePickerHandle } from '@slotted/react/date-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { addDays, isPlainDate, plainDate, type PlainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);

const PRESETS = [
  { label: 'Today', date: TODAY },
  { label: 'Tomorrow', date: addDays(TODAY, 1) },
  { label: 'Next Monday', date: plainDate(2026, 10, 5) },
  { label: 'In 2 weeks', date: addDays(TODAY, 14) },
];

export default function DatePickerPresets() {
  const picker = useRef<DatePickerHandle>(null);
  const [date, setDate] = useState<PlainDate | null>(TODAY);

  const choose = (next: PlainDate) => {
    setDate(next);
    picker.current?.close();
  };

  return (
    <Field>
      <FieldLabel>Dispatch date</FieldLabel>
      <DatePicker
        ref={picker}
        onValueChange={(value) => setDate(isPlainDate(value) ? value : null)}
        presets={PRESETS.map((preset) => (
          <Button key={preset.label} size="sm" variant="ghost" onClick={() => choose(preset.date)}>
            {preset.label}
          </Button>
        ))}
        value={date}
      />
    </Field>
  );
}
