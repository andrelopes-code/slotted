import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';

const TEAMS: SelectOption[] = [
  { value: 'fulfilment', label: 'Fulfilment' },
  { value: 'finance', label: 'Finance' },
  { value: 'customer-care', label: 'Customer care' },
  { value: 'purchasing', label: 'Purchasing' },
  { value: 'returns', label: 'Returns desk' },
];

export default function SelectMultiple() {
  return (
    <Field>
      <FieldLabel>Notify teams</FieldLabel>
      <Select multiple clearable defaultValue={['fulfilment', 'finance']} items={TEAMS}>
        <SelectTrigger>
          <SelectValue placeholder="No one is notified" />
        </SelectTrigger>
        <SelectContent>
          {TEAMS.map((team) => (
            <SelectItem key={team.value} value={team.value}>
              {team.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>Each team gets an email when the order is delayed.</FieldDescription>
    </Field>
  );
}
