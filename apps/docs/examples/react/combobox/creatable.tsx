import { useState } from 'react';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';

const CATEGORIES = ['Apparel', 'Bags', 'Home', 'Kitchen', 'Stationery', 'Outdoor'];

export default function ComboboxCreatable() {
  const [categories, setCategories] = useState(CATEGORIES);
  const [value, setValue] = useState<string | null>(null);

  const create = (query: string) => {
    setCategories((held) => [...held, query]);
    setValue(query);
  };

  return (
    <Field>
      <FieldLabel>Category</FieldLabel>
      <Combobox onCreate={create} value={value} onValueChange={setValue}>
        <ComboboxInput placeholder="Type “Garden” to add it" />
        <ComboboxContent>
          {categories.map((category) => (
            <ComboboxItem key={category} value={category}>
              {category}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
      <FieldDescription>{categories.length} categories</FieldDescription>
    </Field>
  );
}
