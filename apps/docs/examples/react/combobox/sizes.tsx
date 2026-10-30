import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  type ComboboxSize,
} from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';

const SIZES: { size: ComboboxSize; label: string }[] = [
  { size: 'sm', label: 'Small' },
  { size: 'md', label: 'Medium' },
  { size: 'lg', label: 'Large' },
];

const WAREHOUSES = ['Reno, NV', 'Columbus, OH', 'Savannah, GA'];

export default function ComboboxSizes() {
  return (
    <Stack gap={5}>
      {SIZES.map((step) => (
        <Field key={step.size}>
          <FieldLabel>{step.label}</FieldLabel>
          <Combobox size={step.size} defaultInputValue="Reno, NV" defaultValue="Reno, NV">
            <ComboboxInput />
            <ComboboxContent>
              {WAREHOUSES.map((warehouse) => (
                <ComboboxItem key={warehouse} value={warehouse}>
                  {warehouse}
                </ComboboxItem>
              ))}
            </ComboboxContent>
          </Combobox>
        </Field>
      ))}
    </Stack>
  );
}
