import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';
import { Switch } from '@slotted/react/switch';

export default function SwitchField() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Backorders</FieldLabel>
        <Switch>Accept orders when an item is out of stock</Switch>
        <FieldDescription>Customers see the restock date at checkout.</FieldDescription>
      </Field>
      <Field invalid>
        <FieldLabel>Sales tax</FieldLabel>
        <Switch defaultChecked>Collect tax on orders shipped to Nevada</Switch>
        <FieldError>Add a Nevada tax ID before collecting tax there.</FieldError>
      </Field>
    </Stack>
  );
}
