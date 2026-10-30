import { useState, type SubmitEvent } from 'react';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { TextField, TextFieldAction } from '@slotted/react/text-field';

export default function TextFieldActionExample() {
  const [applied, setApplied] = useState('');

  const apply = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = new FormData(event.currentTarget).get('code');
    setApplied(typeof code === 'string' ? code.trim().toUpperCase() : '');
  };

  return (
    <form onSubmit={apply}>
      <Field>
        <FieldLabel>Discount code</FieldLabel>
        <TextField
          autoComplete="off"
          defaultValue="SPRING10"
          end={<TextFieldAction type="submit">Apply</TextFieldAction>}
          mono
          name="code"
        />
        <FieldDescription>
          {applied === '' ? 'One code per order.' : `${applied} is applied to this order.`}
        </FieldDescription>
      </Field>
    </form>
  );
}
