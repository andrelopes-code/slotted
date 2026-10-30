import { useState } from 'react';
import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate } from '@slotted/core/date';

const MESSAGES = {
  choose: 'Choose blackout dates',
  change: 'Change blackout dates, {start} to {end}, {length}',
};

export default function DateRangePickerKeyboard() {
  const [last, setLast] = useState('Focus either date and press Alt+ArrowDown.');

  return (
    <Field>
      <FieldLabel>Shipping blackout</FieldLabel>
      <DateRangePicker
        defaultValue={{ start: plainDate(2026, 11, 26), end: plainDate(2026, 11, 29) }}
        messages={MESSAGES}
        onOpenChange={(open, request) =>
          setLast(`${open ? 'Opened' : 'Closed'} by ${request.reason}.`)
        }
      />
      <FieldDescription>{last}</FieldDescription>
    </Field>
  );
}
