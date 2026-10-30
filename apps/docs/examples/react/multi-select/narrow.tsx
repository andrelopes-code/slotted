import { Field, FieldLabel } from '@slotted/react/field';
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

export default function MultiSelectNarrow() {
  return (
    <Stack gap={4} style={{ inlineSize: '7rem' }}>
      <Field>
        <FieldLabel>Channels</FieldLabel>
        <MultiSelect
          size="sm"
          width="content"
          defaultValue={['web', 'marketplace', 'wholesale']}
          items={CHANNELS}
        >
          <MultiSelectControl />
          <MultiSelectContent>
            {CHANNELS.map((channel) => (
              <MultiSelectItem key={channel.value} value={channel.value}>
                {channel.label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </Field>
    </Stack>
  );
}
