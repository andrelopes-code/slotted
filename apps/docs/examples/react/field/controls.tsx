import { DatePicker } from '@slotted/react/date-picker';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { NumberField } from '@slotted/react/number-field';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import { Stack } from '@slotted/react/stack';

const TERMS: SelectOption[] = [
  { value: 'net-15', label: 'Net 15' },
  { value: 'net-30', label: 'Net 30' },
  { value: 'net-60', label: 'Net 60' },
];

export default function FieldControls() {
  return (
    <Stack gap={5}>
      <Field required>
        <FieldLabel>Payment terms</FieldLabel>
        <Select defaultValue="net-30" items={TERMS}>
          <SelectTrigger>
            <SelectValue placeholder="Choose terms" />
          </SelectTrigger>
          <SelectContent>
            {TERMS.map((term) => (
              <SelectItem key={term.value} value={term.value}>
                {term.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field required>
        <FieldLabel>Quantity</FieldLabel>
        <NumberField defaultValue={12} min={1} max={500} />
        <FieldDescription>Cases of 24 bags.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Delivery date</FieldLabel>
        <DatePicker locale="en-US" />
      </Field>
    </Stack>
  );
}
