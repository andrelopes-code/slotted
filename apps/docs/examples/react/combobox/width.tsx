import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';

const ZONES = [
  { id: 'pacific', label: '(UTC−08:00) Pacific Time — Los Angeles, Vancouver' },
  { id: 'mountain', label: '(UTC−07:00) Mountain Time — Denver, Calgary' },
  { id: 'central', label: '(UTC−06:00) Central Time — Chicago, Mexico City' },
  { id: 'eastern', label: '(UTC−05:00) Eastern Time — New York, Toronto' },
  { id: 'london', label: '(UTC+00:00) Greenwich Mean Time — London, Lisbon' },
];

export default function ComboboxPopupWidth() {
  return (
    <Field>
      <FieldLabel>Report time zone</FieldLabel>
      <Combobox fullWidth={false} width="content">
        <ComboboxInput placeholder="Search zones" />
        <ComboboxContent>
          {ZONES.map((zone) => (
            <ComboboxItem key={zone.id} value={zone.id}>
              {zone.label}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
