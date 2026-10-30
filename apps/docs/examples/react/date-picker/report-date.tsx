import { useRef, useState } from 'react';
import { Button } from '@slotted/react/button';
import { DatePicker, type DatePickerHandle } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { createDateFormat, isPlainDate, plainDate, type PlainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);
const PRESETS = [
  { label: 'Today', date: TODAY },
  { label: 'End of last month', date: plainDate(2026, 8, 31) },
  { label: 'End of last quarter', date: plainDate(2026, 6, 30) },
  { label: 'End of fiscal 2025', date: plainDate(2025, 12, 31) },
];
const words = createDateFormat({ locale: 'en-US' });

export default function DatePickerReportDate() {
  const picker = useRef<DatePickerHandle>(null);
  const [asOf, setAsOf] = useState<PlainDate | null>(plainDate(2026, 8, 31));

  const choose = (next: PlainDate) => {
    setAsOf(next);
    picker.current?.close();
  };

  return (
    <Field>
      <FieldLabel>Balance sheet as of</FieldLabel>
      <DatePicker
        ref={picker}
        max={TODAY}
        onValueChange={(value) => setAsOf(isPlainDate(value) ? value : null)}
        presets={PRESETS.map((preset) => (
          <Button key={preset.label} size="sm" variant="ghost" onClick={() => choose(preset.date)}>
            {preset.label}
          </Button>
        ))}
        value={asOf}
      />
      <FieldDescription>
        {asOf === null
          ? 'Choose the closing date of the report.'
          : `Balances close at the end of ${words.describe(asOf)}.`}
      </FieldDescription>
    </Field>
  );
}
