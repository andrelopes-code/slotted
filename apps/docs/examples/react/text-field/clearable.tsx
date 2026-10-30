import { Glyph, Icon } from '@slotted/react/icon';
import { TextField } from '@slotted/react/text-field';

export default function TextFieldClearable() {
  return (
    <TextField
      aria-label="Search invoices"
      clearable
      defaultValue="invoice 2026"
      enterKeyHint="search"
      start={
        <Icon>
          <Glyph name="search" />
        </Icon>
      }
      type="search"
    />
  );
}
