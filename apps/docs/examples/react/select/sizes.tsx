import { Field, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  type SelectSize,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import { Stack } from '@slotted/react/stack';

const SIZES: { size: SelectSize; label: string }[] = [
  { size: 'sm', label: 'Small' },
  { size: 'md', label: 'Medium' },
  { size: 'lg', label: 'Large' },
];

const WAREHOUSES: SelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

export default function SelectSizes() {
  return (
    <Stack gap={5}>
      {SIZES.map((step) => (
        <Field key={step.size}>
          <FieldLabel>{step.label}</FieldLabel>
          <Select size={step.size} defaultValue="RNO" items={WAREHOUSES}>
            <SelectTrigger>
              <SelectValue />
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
