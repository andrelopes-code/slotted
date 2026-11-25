import { useState } from 'react';
import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { createDateFormat, isPlainDate, plainDate, type PlainDate } from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);
const PRESETS = [
  { label: 'End of last month', value: plainDate(2026, 8, 31) },
  { label: 'End of last quarter', value: plainDate(2026, 6, 30) },
  { label: 'End of fiscal 2025', value: plainDate(2025, 12, 31) },
];
const words = createDateFormat({ locale: 'en-US' });

export default function DatePickerReportDate() {
  const [asOf, setAsOf] = useState<PlainDate | null>(plainDate(2026, 8, 31));

  return (
    <Field>
      <FieldLabel>Balance sheet as of</FieldLabel>
      <DatePicker
        max={TODAY}
        onValueChange={(value) => setAsOf(isPlainDate(value) ? value : null)}
        presets={PRESETS}
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
