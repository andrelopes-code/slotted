import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  type ComboboxOpenOn,
} from '@slotted/react/combobox';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';

const MODES: { openOn: ComboboxOpenOn; label: string; hint: string }[] = [
  { openOn: 'input', label: 'Opens on typing', hint: 'Typing or a press on the field opens it.' },
  { openOn: 'focus', label: 'Opens on focus', hint: 'Every focus opens it, Tab included.' },
  {
    openOn: 'manual',
    label: 'Opens on request',
    hint: 'Only the button and the arrow keys open it.',
  },
];

const CHANNELS = ['Online store', 'Wholesale portal', 'Marketplace', 'Retail partners'];

export default function ComboboxOpening() {
  return (
    <Stack gap={5}>
      {MODES.map((mode) => (
        <Field key={mode.openOn}>
          <FieldLabel>{mode.label}</FieldLabel>
          <Combobox openOn={mode.openOn}>
            <ComboboxInput placeholder="Sales channel" />
            <ComboboxContent>
              {CHANNELS.map((channel) => (
                <ComboboxItem key={channel} value={channel}>
                  {channel}
                </ComboboxItem>
              ))}
            </ComboboxContent>
          </Combobox>
          <FieldDescription>{mode.hint}</FieldDescription>
        </Field>
      ))}
    </Stack>
  );
}
