import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';

const UNITS = ['Each', 'Case of 6', 'Case of 12', 'Pallet', 'Kilogram', 'Pound', 'Meter', 'Liter'];

export default function ComboboxAutoHighlight() {
  return (
    <Field>
      <FieldLabel>Unit of measure</FieldLabel>
      <Combobox autoHighlight loop>
        <ComboboxInput placeholder="Type “ca” and press Enter" />
        <ComboboxContent>
          {UNITS.map((unit) => (
            <ComboboxItem key={unit} value={unit}>
              {unit}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
      <FieldDescription>The first match is highlighted, so Enter takes it.</FieldDescription>
    </Field>
  );
}
