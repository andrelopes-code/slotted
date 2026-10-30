import { Field, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import { Stack } from '@slotted/react/stack';

const REASONS: SelectOption[] = [
  { value: 'damaged', label: 'Arrived damaged' },
  { value: 'wrong-item', label: 'Wrong item shipped' },
  { value: 'not-needed', label: 'No longer needed' },
];

const TERMS: SelectOption[] = [
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'net-30', label: 'Net 30' },
  { value: 'net-45', label: 'Net 45' },
];

export default function SelectPlaceholder() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Return reason</FieldLabel>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose a reason" />
          </SelectTrigger>
          <SelectContent>
            {REASONS.map((reason) => (
              <SelectItem key={reason.value} value={reason.value}>
                {reason.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
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
    </Stack>
  );
}
