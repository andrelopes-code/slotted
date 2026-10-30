import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';

const CARRIERS = ['UPS', 'FedEx', 'DHL', 'USPS', 'OnTrac'];

export default function ComboboxCustomMessages() {
  return (
    <Field>
      <FieldLabel>Carrier</FieldLabel>
      <Combobox
        messages={{
          clear: 'Clear carrier',
          count: '{count, plural, one {# carrier} other {# carriers}}',
          empty: 'No carrier by that name. Check the spelling on the label.',
        }}
      >
        <ComboboxInput placeholder="Type “royal mail”" />
        <ComboboxContent>
          {CARRIERS.map((carrier) => (
            <ComboboxItem key={carrier} value={carrier}>
              {carrier}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
