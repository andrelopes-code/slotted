import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';

const CATEGORIES: MultiSelectOption[] = [
  { value: 'beverages', label: 'Beverages' },
  { value: 'condiments', label: 'Condiments' },
  { value: 'confections', label: 'Confections' },
  { value: 'dairy', label: 'Dairy products' },
  { value: 'grains', label: 'Grains and cereals' },
  { value: 'meat', label: 'Meat and poultry' },
  { value: 'produce', label: 'Produce' },
  { value: 'seafood', label: 'Seafood' },
];

export default function MultiSelectLimit() {
  return (
    <Field>
      <FieldLabel>Featured categories</FieldLabel>
      <MultiSelect max={3} defaultValue={['beverages', 'confections']} items={CATEGORIES}>
        <MultiSelectControl placeholder="Add a category" />
        <MultiSelectContent>
          {CATEGORIES.map((category) => (
            <MultiSelectItem key={category.value} value={category.value}>
              {category.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
      <FieldDescription>The storefront home page shows up to three categories.</FieldDescription>
    </Field>
  );
}
