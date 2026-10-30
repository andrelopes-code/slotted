import { useState, type SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import {
  FieldGroup,
  FieldGroupContent,
  FieldGroupError,
  FieldGroupLegend,
} from '@slotted/react/field-group';
import { Inline } from '@slotted/react/inline';
import { Radio, RadioGroup } from '@slotted/react/radio-group';
import { Stack } from '@slotted/react/stack';

export default function RadioGroupValidation() {
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);
  const missing = submitted && reason === undefined;

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <form noValidate onSubmit={submit}>
      <Stack gap={4}>
        <FieldGroup required>
          <FieldGroupLegend>Return reason</FieldGroupLegend>
          <FieldGroupError live="polite" reserve>
            {missing ? 'Choose why the order is coming back.' : ''}
          </FieldGroupError>
          <FieldGroupContent>
            <RadioGroup
              invalid={missing ? true : undefined}
              value={reason}
              onValueChange={setReason}
            >
              <Radio value="damaged">Damaged in transit</Radio>
              <Radio value="wrong-item">Wrong item shipped</Radio>
              <Radio value="not-needed">No longer needed</Radio>
            </RadioGroup>
          </FieldGroupContent>
        </FieldGroup>
        <Inline gap={3} align="center">
          <Button type="submit">Request return</Button>
          {submitted && reason !== undefined ? <span role="status">Return requested.</span> : null}
        </Inline>
      </Stack>
    </form>
  );
}
