import { useRef } from 'react';
import { Button } from '@slotted/react/button';
import { DateRangePicker, type DateRangePickerHandle } from '@slotted/react/date-range-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

export default function DateRangePickerFocusAndOpen() {
  const picker = useRef<DateRangePickerHandle>(null);

  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Contract term</FieldLabel>
        <DateRangePicker
          ref={picker}
          defaultValue={{ start: plainDate(2026, 4, 1), end: plainDate(2027, 3, 31) }}
        />
      </Field>
      <Inline gap={2}>
        <Button
          size="sm"
          tone="secondary"
          variant="outline"
          onClick={() => picker.current?.focus('end')}
        >
          Edit end date
        </Button>
        <Button size="sm" tone="secondary" variant="outline" onClick={() => picker.current?.open()}>
          Open calendar
        </Button>
      </Inline>
    </Stack>
  );
}
