import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import { Stack } from '@slotted/react/stack';

const WAREHOUSES: SelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

export default function SelectStates() {
  return (
    <Stack gap={5}>
      <Field invalid required>
        <FieldLabel>Return warehouse</FieldLabel>
        <Select defaultValue="SAV" items={WAREHOUSES}>
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
        <FieldError>Savannah does not accept returns. Choose Reno or Columbus.</FieldError>
      </Field>
      <Field readOnly>
        <FieldLabel>Origin warehouse</FieldLabel>
        <Select defaultValue="RNO" items={WAREHOUSES}>
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
        <FieldDescription>Set when the order was picked.</FieldDescription>
      </Field>
      <Field disabled>
        <FieldLabel>Transfer warehouse</FieldLabel>
        <Select defaultValue="CMH" items={WAREHOUSES}>
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
        <FieldDescription>Transfers open once the order is invoiced.</FieldDescription>
      </Field>
    </Stack>
  );
}
