import {
  Combobox,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
} from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';

const CATALOG = [
  {
    category: 'Kitchen',
    products: [
      { sku: 'KIT-1042', name: 'Cast-iron skillet' },
      { sku: 'KIT-1043', name: 'Stoneware mug' },
      { sku: 'KIT-1051', name: 'Pour-over kettle' },
    ],
  },
  {
    category: 'Bags',
    products: [
      { sku: 'BAG-2010', name: 'Canvas tote' },
      { sku: 'BAG-2014', name: 'Trail daypack' },
      { sku: 'BAG-2019', name: 'Weekender bag' },
    ],
  },
  {
    category: 'Stationery',
    products: [
      { sku: 'STA-3002', name: 'Field notebook' },
      { sku: 'STA-3007', name: 'Fountain pen' },
      { sku: 'STA-3011', name: 'Brass stapler' },
    ],
  },
];

export default function ComboboxGroups() {
  return (
    <Field>
      <FieldLabel>Product</FieldLabel>
      <Combobox>
        <ComboboxInput placeholder="Search the catalog" />
        <ComboboxContent>
          {CATALOG.map((group) => (
            <ComboboxGroup key={group.category} label={group.category}>
              {group.products.map((product) => (
                <ComboboxItem key={product.sku} value={product.sku}>
                  {product.name}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          ))}
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
