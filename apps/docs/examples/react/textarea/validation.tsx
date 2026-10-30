import { useState, type SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Field, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Textarea } from '@slotted/react/textarea';

const MIN_LENGTH = 20;

function detailsError(value: string): string {
  if (value === '') return 'Describe what is wrong with the item.';
  if (value.length < MIN_LENGTH) return `Add more detail: at least ${MIN_LENGTH} characters.`;
  return '';
}

export default function TextareaValidation() {
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);
  const error = submitted ? detailsError(details) : '';

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setSent(detailsError(details) === '');
  };

  return (
    <form noValidate onSubmit={submit}>
      <Stack gap={4}>
        <Field required invalid={error !== '' ? true : undefined}>
          <FieldLabel>What is wrong with the item?</FieldLabel>
          <Textarea
            value={details}
            onValueChange={(value) => {
              setDetails(value);
              setSent(false);
            }}
          />
          <FieldError live="polite" reserve>
            {error}
          </FieldError>
        </Field>
        <Inline gap={3} align="center">
          <Button type="submit">Request a return</Button>
          {sent ? <span role="status">Return requested.</span> : null}
        </Inline>
      </Stack>
    </form>
  );
}
