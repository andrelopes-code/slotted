import { useState } from 'react';
import type { DateRange } from '@slotted/react/calendar';
import { DateRangePicker } from '@slotted/react/date-range-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { plainDate, toISODate } from '@slotted/core/date';

export default function DateRangePickerPosition() {
  const [rental, setRental] = useState<DateRange | null>({
    start: plainDate(2026, 10, 5),
    end: plainDate(2026, 10, 9),
  });

  return (
    <Field>
      <FieldLabel>Scissor lift rental</FieldLabel>
      <DateRangePicker
        defaultPosition="end"
        onValueChange={(value) => setRental(value)}
        value={rental}
      />
      <FieldDescription>
        {rental?.end
          ? `Returns ${toISODate(rental.end)}. Open the calendar and press a day to move the return date.`
          : 'Choose a return date.'}
      </FieldDescription>
    </Field>
  );
}
