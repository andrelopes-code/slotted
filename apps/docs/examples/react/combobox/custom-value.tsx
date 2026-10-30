import { useState } from 'react';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';

const BOXES = [
  { id: 'small', label: 'Small · 20 × 15 × 10 cm' },
  { id: 'medium', label: 'Medium · 35 × 25 × 15 cm' },
  { id: 'large', label: 'Large · 50 × 40 × 30 cm' },
];

export default function ComboboxCustomValue() {
  const [value, setValue] = useState<string | null>(null);

  return (
    <Field>
      <FieldLabel>Box size</FieldLabel>
      <Combobox allowsCustomValue value={value} onValueChange={setValue}>
        <ComboboxInput placeholder="Pick a box or type dimensions" />
        <ComboboxContent>
          {BOXES.map((box) => (
            <ComboboxItem key={box.id} value={box.id}>
              {box.label}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
      <FieldDescription>Value: {value ?? 'none'}</FieldDescription>
    </Field>
  );
}
