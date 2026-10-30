import { useState, type SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Field, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

function emailError(value: string): string {
  if (value.trim() === '') return 'Enter the address invoices are sent to.';
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter an address like billing@company.com.';
  return '';
}

export default function FieldValidation() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const error = submitted ? emailError(email) : '';

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setSaved(emailError(email) === '');
  };

  return (
    <form noValidate onSubmit={submit}>
      <Stack gap={4}>
        <Field required invalid={error !== '' ? true : undefined}>
          <FieldLabel>Billing email</FieldLabel>
          <TextField
            type="email"
            value={email}
            onValueChange={(value) => {
              setEmail(value);
              setSaved(false);
            }}
          />
          <FieldError live="polite" reserve>
            {error}
          </FieldError>
        </Field>
        <Inline gap={3} align="center">
          <Button type="submit">Save billing details</Button>
          {saved ? <span role="status">Saved.</span> : null}
        </Inline>
      </Stack>
    </form>
  );
}
