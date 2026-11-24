import { Button } from '@slotted/react/button';
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function StackForm() {
  return (
    <Stack
      gap={5}
      render={(props) => (
        <form
          {...props}
          onSubmit={(event) => {
            event.preventDefault();
          }}
        />
      )}
    >
      <Field required>
        <FieldLabel>Email</FieldLabel>
        <TextField type="email" autoComplete="email" />
      </Field>
      <Field required>
        <FieldLabel>Password</FieldLabel>
        <TextField type="password" autoComplete="current-password" />
      </Field>
      <Inline justify="end">
        <Button type="submit">Sign in</Button>
      </Inline>
    </Stack>
  );
}
