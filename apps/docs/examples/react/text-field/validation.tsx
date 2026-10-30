import { useState, type SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Field, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TextFieldValidation() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);

  const error = !submitted
    ? ''
    : email.trim() === ''
      ? 'Enter the address the invoice goes to.'
      : EMAIL.test(email)
        ? ''
        : 'Enter an address in the format name@company.com.';

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setSent(EMAIL.test(email));
  };

  return (
    <form noValidate onSubmit={submit}>
      <Stack gap={4}>
        <Field required invalid={error !== '' ? true : undefined}>
          <FieldLabel>Billing email</FieldLabel>
          <TextField
            autoComplete="email"
            onValueChange={(next) => {
              setEmail(next);
              setSent(false);
            }}
            type="email"
            value={email}
          />
          <FieldError live="polite" reserve>
            {error}
          </FieldError>
        </Field>
        <Inline gap={3} align="center">
          <Button type="submit">Send invoice</Button>
          {sent ? <span role="status">Invoice sent.</span> : null}
        </Inline>
      </Stack>
    </form>
  );
}
