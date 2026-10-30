import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';

export default function ComboboxClearable() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Default warehouse</FieldLabel>
        <Combobox defaultInputValue="Columbus, OH" defaultValue="CMH">
          <ComboboxInput />
          <ComboboxContent>
            <ComboboxItem value="RNO">Reno, NV</ComboboxItem>
            <ComboboxItem value="CMH">Columbus, OH</ComboboxItem>
            <ComboboxItem value="SAV">Savannah, GA</ComboboxItem>
          </ComboboxContent>
        </Combobox>
        <FieldDescription>Optional. Clearing it routes orders by distance.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Payment terms</FieldLabel>
        <Combobox clearable={false} defaultInputValue="Net 30" defaultValue="net-30">
          <ComboboxInput />
          <ComboboxContent>
            <ComboboxItem value="prepaid">Prepaid</ComboboxItem>
            <ComboboxItem value="net-30">Net 30</ComboboxItem>
            <ComboboxItem value="net-45">Net 45</ComboboxItem>
          </ComboboxContent>
        </Combobox>
        <FieldDescription>Every account has terms, so there is nothing to clear.</FieldDescription>
      </Field>
    </Stack>
  );
}
