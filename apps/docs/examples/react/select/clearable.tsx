import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';

const OWNERS: SelectOption[] = [
  { value: 'avery', label: 'Avery Collins' },
  { value: 'kenji', label: 'Kenji Watanabe' },
  { value: 'lucia', label: 'Lucía Fernández' },
  { value: 'ruth', label: 'Ruth Adeyemi' },
];

export default function SelectClearable() {
  return (
    <Field>
      <FieldLabel>Assignee</FieldLabel>
      <Select clearable defaultValue="kenji" items={OWNERS}>
        <SelectTrigger>
          <SelectValue placeholder="Unassigned" />
        </SelectTrigger>
        <SelectContent>
          {OWNERS.map((owner) => (
            <SelectItem key={owner.value} value={owner.value}>
              {owner.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>Clear the assignee to return the ticket to the queue.</FieldDescription>
    </Field>
  );
}
