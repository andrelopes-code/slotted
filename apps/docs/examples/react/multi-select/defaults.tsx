import { Field, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectDefaultsProvider,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';
import { Stack } from '@slotted/react/stack';

const OWNERS: MultiSelectOption[] = [
  { value: 'avery', label: 'Avery Collins' },
  { value: 'kenji', label: 'Kenji Watanabe' },
  { value: 'lucia', label: 'Lucía Fernández' },
  { value: 'omar', label: 'Omar Haddad' },
];

const SEGMENTS: MultiSelectOption[] = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'retail', label: 'Retail' },
];

export default function MultiSelectDefaults() {
  return (
    <MultiSelectDefaultsProvider size="sm" variant="subtle" overflow="collapse">
      <Stack gap={4}>
        <Field>
          <FieldLabel>Account owners</FieldLabel>
          <MultiSelect defaultValue={['lucia', 'kenji']} items={OWNERS}>
            <MultiSelectControl placeholder="Any owner" />
            <MultiSelectContent>
              {OWNERS.map((owner) => (
                <MultiSelectItem key={owner.value} value={owner.value}>
                  {owner.label}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </Field>
        <Field>
          <FieldLabel>Segments</FieldLabel>
          <MultiSelect defaultValue={['wholesale']} items={SEGMENTS}>
            <MultiSelectControl placeholder="Any segment" />
            <MultiSelectContent>
              {SEGMENTS.map((segment) => (
                <MultiSelectItem key={segment.value} value={segment.value}>
                  {segment.label}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </Field>
      </Stack>
    </MultiSelectDefaultsProvider>
  );
}
