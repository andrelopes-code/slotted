import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';

const OWNERS = ['Avery Collins', 'Kenji Watanabe', 'Lucía Fernández', 'Omar Haddad'];
const COST_CENTERS = ['4100 Fulfilment', '4200 Customer care', '4300 Marketing'];

export default function ComboboxField() {
  return (
    <Stack gap={5}>
      <Field required>
        <FieldLabel>Account manager</FieldLabel>
        <Combobox>
          <ComboboxInput placeholder="Search people" />
          <ComboboxContent>
            {OWNERS.map((owner) => (
              <ComboboxItem key={owner} value={owner}>
                {owner}
              </ComboboxItem>
            ))}
          </ComboboxContent>
        </Combobox>
        <FieldDescription>Receives the renewal reminders for this account.</FieldDescription>
      </Field>
      <Field invalid required>
        <FieldLabel>Cost center</FieldLabel>
        <Combobox defaultInputValue="4900">
          <ComboboxInput />
          <ComboboxContent>
            {COST_CENTERS.map((center) => (
              <ComboboxItem key={center} value={center}>
                {center}
              </ComboboxItem>
            ))}
          </ComboboxContent>
        </Combobox>
        <FieldError>4900 is closed. Choose an open cost center.</FieldError>
      </Field>
    </Stack>
  );
}
