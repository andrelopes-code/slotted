import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';
import { Stack } from '@slotted/react/stack';

const CHANNELS: MultiSelectOption[] = [
  { value: 'web', label: 'Web store' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'phone', label: 'Phone orders' },
];

const options = CHANNELS.map((channel) => (
  <MultiSelectItem key={channel.value} value={channel.value}>
    {channel.label}
  </MultiSelectItem>
));

export default function MultiSelectClearing() {
  return (
    <Stack gap={5}>
      <Field>
        <FieldLabel>Show orders from</FieldLabel>
        <MultiSelect defaultValue={['web', 'marketplace', 'phone']} items={CHANNELS}>
          <MultiSelectControl placeholder="All channels" />
          <MultiSelectContent>{options}</MultiSelectContent>
        </MultiSelect>
        <FieldDescription>The clear button empties the filter in one press.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Sell through</FieldLabel>
        <MultiSelect clearable={false} defaultValue={['web', 'wholesale']} items={CHANNELS}>
          <MultiSelectControl />
          <MultiSelectContent>{options}</MultiSelectContent>
        </MultiSelect>
        <FieldDescription>No clear button: channels come off one at a time.</FieldDescription>
      </Field>
    </Stack>
  );
}
