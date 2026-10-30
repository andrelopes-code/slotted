import { Field, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectDefaultsProvider,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import { Stack } from '@slotted/react/stack';

const OWNERS: SelectOption[] = [
  { value: 'avery', label: 'Avery Collins' },
  { value: 'kenji', label: 'Kenji Watanabe' },
  { value: 'lucia', label: 'Lucía Fernández' },
];

const SEGMENTS: SelectOption[] = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'retail', label: 'Retail' },
];

export default function SelectDefaults() {
  return (
    <SelectDefaultsProvider size="sm" variant="subtle" clearable>
      <Stack gap={4}>
        <Field>
          <FieldLabel>Account owner</FieldLabel>
          <Select defaultValue="lucia" items={OWNERS}>
            <SelectTrigger>
              <SelectValue placeholder="Any owner" />
            </SelectTrigger>
            <SelectContent>
              {OWNERS.map((owner) => (
                <SelectItem key={owner.value} value={owner.value}>
                  {owner.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Segment</FieldLabel>
          <Select defaultValue="wholesale" items={SEGMENTS}>
            <SelectTrigger>
              <SelectValue placeholder="Any segment" />
            </SelectTrigger>
            <SelectContent>
              {SEGMENTS.map((segment) => (
                <SelectItem key={segment.value} value={segment.value}>
                  {segment.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Stack>
    </SelectDefaultsProvider>
  );
}
