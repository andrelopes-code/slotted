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

const VARIANTS = [
  { variant: 'outline', label: 'Sales channels' },
  { variant: 'subtle', label: 'Promotion channels' },
  { variant: 'plain', label: 'Report channels' },
] as const;

export default function MultiSelectVariants() {
  return (
    <Stack gap={5}>
      {VARIANTS.map(({ variant, label }) => (
        <Field key={variant}>
          <FieldLabel>{label}</FieldLabel>
          <MultiSelect variant={variant} defaultValue={['web', 'wholesale']} items={CHANNELS}>
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
      ))}
    </Stack>
  );
}
