import { useState } from 'react';
import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { isPlainDate, isoWeekNumber, plainDate, type PlainDate } from '@slotted/core/date';

export default function DatePickerWeekNumbers() {
  const [date, setDate] = useState<PlainDate | null>(plainDate(2026, 9, 30));

  return (
    <Field>
      <FieldLabel>Production run</FieldLabel>
      <DatePicker
        firstDayOfWeek={1}
        onValueChange={(value) => setDate(isPlainDate(value) ? value : null)}
        value={date}
        weekNumbers
      />
      <FieldDescription>
        {date === null ? 'No week planned.' : `Planned for week ${isoWeekNumber(date)}.`}
      </FieldDescription>
    </Field>
  );
}
