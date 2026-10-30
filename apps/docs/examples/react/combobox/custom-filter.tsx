import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';

const PRODUCTS = [
  { sku: 'KIT-1042', name: 'Cast-iron skillet' },
  { sku: 'KIT-1043', name: 'Stoneware mug' },
  { sku: 'BAG-2010', name: 'Canvas tote' },
  { sku: 'BAG-2014', name: 'Trail daypack' },
  { sku: 'HOM-4010', name: 'Wool throw' },
  { sku: 'HOM-4014', name: 'Brass desk lamp' },
  { sku: 'STA-3010', name: 'Field notebook' },
];

const startsWith = (label: string, query: string) =>
  label.toLowerCase().startsWith(query.toLowerCase());

export default function ComboboxCustomFilter() {
  return (
    <Field>
      <FieldLabel>SKU</FieldLabel>
      <Combobox filter={startsWith}>
        <ComboboxInput placeholder="KIT-, BAG-, HOM-…" />
        <ComboboxContent>
          {PRODUCTS.map((product) => (
            <ComboboxItem key={product.sku} value={product.sku} description={product.name}>
              {product.sku}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
      <FieldDescription>
        Codes match from the first character, so “10” finds nothing.
      </FieldDescription>
    </Field>
  );
}
