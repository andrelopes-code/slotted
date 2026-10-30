import { useState } from 'react';
import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';
import { isPlainDate, plainDate, toISODate, type PlainDate } from '@slotted/core/date';

export default function DatePickerTimeZones() {
  const [date, setDate] = useState<PlainDate | null>(plainDate(2026, 9, 30));

  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Settlement date, Auckland desk</FieldLabel>
        <DatePicker
          onValueChange={(value) => setDate(isPlainDate(value) ? value : null)}
          timeZone="Pacific/Auckland"
          value={date}
        />
        <FieldDescription>Today is marked by the date in Auckland.</FieldDescription>
      </Field>
      <Text size="sm" tone="muted">
        {date === null
          ? 'Value: null'
          : `Value: ${JSON.stringify(date)}, sent as ${toISODate(date)}`}
      </Text>
    </Stack>
  );
}
