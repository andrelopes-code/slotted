import { useState, type SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Checkbox } from '@slotted/react/checkbox';
import { Field, FieldError } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';

export default function CheckboxValidation() {
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [placed, setPlaced] = useState(false);
  const error = submitted && !accepted ? 'Accept the supplier terms to place the order.' : '';

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setPlaced(accepted);
  };

  return (
    <form noValidate onSubmit={submit}>
      <Stack gap={4}>
        <Field required invalid={error !== '' ? true : undefined}>
          <Checkbox
            checked={accepted}
            onCheckedChange={(checked) => {
              setAccepted(checked);
              setPlaced(false);
            }}
          >
            I accept the supplier terms for this purchase order
          </Checkbox>
          <FieldError live="polite" reserve>
            {error}
          </FieldError>
        </Field>
        <Inline gap={3} align="center">
          <Button type="submit">Place order</Button>
          {placed ? <span role="status">Order placed.</span> : null}
        </Inline>
      </Stack>
    </form>
  );
}
