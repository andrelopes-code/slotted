import { Field, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type SelectVariant,
} from '@slotted/react/select';
import { Stack } from '@slotted/react/stack';

const VARIANTS: { variant: SelectVariant; label: string }[] = [
  { variant: 'outline', label: 'Outline' },
  { variant: 'subtle', label: 'Subtle' },
  { variant: 'plain', label: 'Plain' },
];

const WAREHOUSES = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

export default function SelectVariants() {
  return (
    <Stack gap={5}>
      {VARIANTS.map((step) => (
        <Field key={step.variant}>
          <FieldLabel>{step.label}</FieldLabel>
          <Select variant={step.variant}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a warehouse" />
            </SelectTrigger>
            <SelectContent>
              {WAREHOUSES.map((warehouse) => (
                <SelectItem key={warehouse.value} value={warehouse.value}>
                  {warehouse.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ))}
    </Stack>
  );
}
