import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';

const CARRIERS: MultiSelectOption[] = [
  { value: 'ups', label: 'UPS Ground' },
  { value: 'fedex', label: 'FedEx Ground' },
  { value: 'usps', label: 'USPS Priority Mail' },
  { value: 'dhl', label: 'DHL Express' },
  { value: 'ontrac', label: 'OnTrac' },
];

export default function MultiSelectKeyboard() {
  return (
    <Field>
      <FieldLabel>Carrier priority</FieldLabel>
      <MultiSelect reorderable defaultValue={['usps', 'ups', 'fedex']} items={CARRIERS}>
        <MultiSelectControl placeholder="Add a carrier" />
        <MultiSelectContent>
          {CARRIERS.map((carrier) => (
            <MultiSelectItem key={carrier.value} value={carrier.value}>
              {carrier.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
      <FieldDescription>
        Rates are requested from the first carrier, then the next. Alt with an arrow moves the
        focused carrier.
      </FieldDescription>
    </Field>
  );
}
