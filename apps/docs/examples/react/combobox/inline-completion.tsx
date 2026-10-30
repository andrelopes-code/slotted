import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';

const TIME_ZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function ComboboxInlineCompletion() {
  return (
    <Field>
      <FieldLabel>Time zone</FieldLabel>
      <Combobox autocomplete="both">
        <ComboboxInput placeholder="Type “eu” or “am”" />
        <ComboboxContent>
          {TIME_ZONES.map((zone) => (
            <ComboboxItem key={zone} value={zone}>
              {zone}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
