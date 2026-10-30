import { useState, type SubmitEvent } from 'react';
import { Button } from '@slotted/react/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldValidation() {
  const [quantity, setQuantity] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState('');

  const error = submitted && quantity === null ? 'Enter how many units to ship.' : '';

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const data = new FormData(event.currentTarget);
    setSent(quantity === null ? '' : `Sent quantity=${String(data.get('quantity'))}`);
  };

  return (
    <form noValidate onSubmit={submit}>
      <Stack gap={4}>
        <Field required invalid={error !== '' ? true : undefined}>
          <FieldLabel>Units of Chai to ship</FieldLabel>
          <NumberField
            max={39}
            min={1}
            name="quantity"
            onValueChange={(next) => {
              setQuantity(next);
              setSent('');
            }}
            value={quantity}
          />
          <FieldDescription>39 units in stock.</FieldDescription>
          <FieldError live="polite" reserve>
            {error}
          </FieldError>
        </Field>
        <Inline gap={3}>
          <Button type="submit">Create shipment</Button>
          {sent === '' ? null : <span role="status">{sent}</span>}
        </Inline>
      </Stack>
    </form>
  );
}
