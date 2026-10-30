import { useRef } from 'react';
import { Button } from '@slotted/react/button';
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { NumberField, NumberFieldHandle } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldHandleExample() {
  const cases = useRef<NumberFieldHandle>(null);

  return (
    <Stack gap={3}>
      <Field>
        <FieldLabel>Cases of Chang</FieldLabel>
        <NumberField defaultValue={4} handle={cases} max={48} min={0} />
      </Field>
      <Inline gap={2}>
        <Button onClick={() => cases.current?.decrement()} variant="outline">
          Remove a case
        </Button>
        <Button onClick={() => cases.current?.increment()} variant="outline">
          Add a case
        </Button>
      </Inline>
    </Stack>
  );
}
