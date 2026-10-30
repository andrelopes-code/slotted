import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
} from '@slotted/react/multi-select';

const CITIES = [
  { value: 'cdz', label: 'Cádiz, Spain' },
  { value: 'dus', label: 'Düsseldorf, Germany' },
  { value: 'krk', label: 'Kraków, Poland' },
  { value: 'mmx', label: 'Malmö, Sweden' },
  { value: 'yul', label: 'Montréal, Canada' },
  { value: 'gru', label: 'São Paulo, Brazil' },
  { value: 'zrh', label: 'Zürich, Switzerland' },
  { value: 'aar', label: 'Aarhus, Denmark' },
];

export default function MultiSelectFiltering() {
  return (
    <Field>
      <FieldLabel>Distributor cities</FieldLabel>
      <MultiSelect>
        <MultiSelectControl placeholder="Search cities" />
        <MultiSelectContent>
          {CITIES.map((city) => (
            <MultiSelectItem key={city.value} value={city.value}>
              {city.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
      <FieldDescription>Type “zur” or “malmo”: accents and case are ignored.</FieldDescription>
    </Field>
  );
}
