import { Badge } from '@slotted/react/badge';
import { Field, FieldAction, FieldHeader, FieldIndicator, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function FieldHeaderExample() {
  return (
    <Stack gap={5}>
      <Field required>
        <FieldHeader>
          <FieldLabel>Password</FieldLabel>
          <FieldAction render={(props) => <a {...props} href="#reset-password" />}>
            Forgot password?
          </FieldAction>
        </FieldHeader>
        <TextField type="password" autoComplete="current-password" />
      </Field>
      <Field>
        <FieldHeader>
          <FieldLabel>Webhook URL</FieldLabel>
          <FieldIndicator>
            <Badge size="sm" tone="accent" variant="soft">
              Beta
            </Badge>
          </FieldIndicator>
          <FieldAction>Send test event</FieldAction>
        </FieldHeader>
        <TextField type="url" defaultValue="https://hooks.northwind.example/orders" />
      </Field>
    </Stack>
  );
}
