import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  type ComboboxVariant,
} from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';

const VARIANTS: { variant: ComboboxVariant; label: string }[] = [
  { variant: 'outline', label: 'Outline' },
  { variant: 'subtle', label: 'Subtle' },
  { variant: 'plain', label: 'Plain' },
];

const WAREHOUSES = ['Reno, NV', 'Columbus, OH', 'Savannah, GA'];

export default function ComboboxVariants() {
  return (
    <Stack gap={5}>
      {VARIANTS.map((step) => (
        <Field key={step.variant}>
          <FieldLabel>{step.label}</FieldLabel>
          <Combobox variant={step.variant}>
            <ComboboxInput placeholder="Search warehouses" />
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
