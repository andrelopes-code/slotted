import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';

export default function ComboboxStates() {
  return (
    <Stack gap={5}>
      <Field disabled>
        <FieldLabel>Warehouse</FieldLabel>
        <Combobox defaultInputValue="Reno, NV" defaultValue="RNO">
          <ComboboxInput />
          <ComboboxContent>
            <ComboboxItem value="RNO">Reno, NV</ComboboxItem>
            <ComboboxItem value="CMH">Columbus, OH</ComboboxItem>
          </ComboboxContent>
        </Combobox>
        <FieldDescription>Locked while the transfer is in transit.</FieldDescription>
      </Field>
      <Field readOnly>
        <FieldLabel>Billing entity</FieldLabel>
        <Combobox defaultInputValue="Northwind Trading Co." defaultValue="northwind-us">
          <ComboboxInput />
          <ComboboxContent>
            <ComboboxItem value="northwind-us">Northwind Trading Co.</ComboboxItem>
            <ComboboxItem value="northwind-eu">Northwind Europe B.V.</ComboboxItem>
          </ComboboxContent>
        </Combobox>
        <FieldDescription>
          Set by the contract. The text can still be selected and copied.
        </FieldDescription>
      </Field>
    </Stack>
  );
}
