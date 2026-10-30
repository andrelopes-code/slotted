import {
  Combobox,
  ComboboxContent,
  ComboboxDefaultsProvider,
  ComboboxInput,
  ComboboxItem,
} from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';

const WAREHOUSES = ['Reno, NV', 'Columbus, OH', 'Savannah, GA'];
const CARRIERS = ['UPS', 'FedEx', 'DHL', 'USPS'];

export default function ComboboxAppDefaults() {
  return (
    <ComboboxDefaultsProvider variant="subtle" autoHighlight>
      <Stack gap={4}>
        <Field>
          <FieldLabel>Warehouse</FieldLabel>
          <Combobox>
            <ComboboxInput placeholder="Any warehouse" />
            <ComboboxContent>
              {WAREHOUSES.map((warehouse) => (
                <ComboboxItem key={warehouse} value={warehouse}>
                  {warehouse}
                </ComboboxItem>
              ))}
            </ComboboxContent>
          </Combobox>
        </Field>
        <Field>
          <FieldLabel>Carrier</FieldLabel>
          <Combobox>
            <ComboboxInput placeholder="Any carrier" />
            <ComboboxContent>
              {CARRIERS.map((carrier) => (
                <ComboboxItem key={carrier} value={carrier}>
                  {carrier}
                </ComboboxItem>
              ))}
            </ComboboxContent>
          </Combobox>
        </Field>
      </Stack>
    </ComboboxDefaultsProvider>
  );
}
