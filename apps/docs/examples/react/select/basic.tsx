import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';

const WAREHOUSES = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

export default function SelectBasic() {
  return (
    <Field>
      <FieldLabel>Fulfilment warehouse</FieldLabel>
      <Select>
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
      <FieldDescription>New orders ship from this warehouse.</FieldDescription>
    </Field>
  );
}
