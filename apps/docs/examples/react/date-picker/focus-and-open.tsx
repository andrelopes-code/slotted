import { useRef } from 'react';
import { Button } from '@slotted/react/button';
import { DatePicker, type DatePickerHandle } from '@slotted/react/date-picker';
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { plainDate } from '@slotted/core/date';

export default function DatePickerFocusAndOpen() {
  const picker = useRef<DatePickerHandle>(null);

  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Contract renewal date</FieldLabel>
        <DatePicker ref={picker} defaultValue={plainDate(2027, 3, 31)} />
      </Field>
      <Inline gap={2}>
        <Button
          size="sm"
          tone="secondary"
          variant="outline"
          onClick={() => picker.current?.focus()}
        >
          Edit date
        </Button>
        <Button size="sm" tone="secondary" variant="outline" onClick={() => picker.current?.open()}>
          Open calendar
        </Button>
      </Inline>
    </Stack>
  );
}
