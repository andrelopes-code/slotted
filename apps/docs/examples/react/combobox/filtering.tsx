import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';

const CITIES = [
  'São Paulo',
  'Zürich',
  'Montréal',
  'Kraków',
  'Malmö',
  'Querétaro',
  'Reykjavík',
  'Düsseldorf',
];

export default function ComboboxFiltering() {
  return (
    <Field>
      <FieldLabel>Destination city</FieldLabel>
      <Combobox>
        <ComboboxInput placeholder="Try “sao” or “zurich”" />
        <ComboboxContent>
          {CITIES.map((city) => (
            <ComboboxItem key={city} value={city}>
              {city}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
      <FieldDescription>Accents and case are ignored when matching.</FieldDescription>
    </Field>
  );
}
