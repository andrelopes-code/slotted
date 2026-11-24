import { Button } from '@slotted/react/button';
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { TextField } from '@slotted/react/text-field';

export default function InlineForm() {
  return (
    <Inline
      align="end"
      gap={3}
      render={(props) => (
        <form
          {...props}
          aria-label="Find orders"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        />
      )}
    >
      <Field>
        <FieldLabel>Order number</FieldLabel>
        <TextField placeholder="SO-10482" />
      </Field>
      <Field>
        <FieldLabel>Customer</FieldLabel>
        <TextField placeholder="Harbor Street store" />
      </Field>
      <Button type="submit">Search</Button>
    </Inline>
  );
}
