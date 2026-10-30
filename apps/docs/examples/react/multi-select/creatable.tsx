import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';

const SUGGESTED: MultiSelectOption[] = [
  { value: 'chai', label: 'chai' },
  { value: 'black tea', label: 'black tea' },
  { value: 'spiced', label: 'spiced' },
  { value: 'loose leaf', label: 'loose leaf' },
  { value: 'caffeinated', label: 'caffeinated' },
  { value: 'gift', label: 'gift' },
];

export default function MultiSelectCreatable() {
  return (
    <Field>
      <FieldLabel>Search keywords</FieldLabel>
      <MultiSelect creatable defaultValue={['chai', 'black tea']} items={SUGGESTED}>
        <MultiSelectControl placeholder="Add a keyword" />
        <MultiSelectContent>
          {SUGGESTED.map((keyword) => (
            <MultiSelectItem key={keyword.value} value={keyword.value}>
              {keyword.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
      <FieldDescription>
        Type a keyword and press Enter or a comma. Shoppers find Chai tea, 24 bags by these words.
      </FieldDescription>
    </Field>
  );
}
