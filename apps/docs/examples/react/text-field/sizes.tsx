import { Glyph, Icon } from '@slotted/react/icon';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function TextFieldSizes() {
  return (
    <Stack gap={4}>
      <TextField
        aria-label="Filter order lines"
        placeholder="Filter order lines"
        size="sm"
        start={
          <Icon>
            <Glyph name="search" />
          </Icon>
        }
        type="search"
      />
      <TextField
        aria-label="Search customers"
        placeholder="Search customers"
        size="md"
        start={
          <Icon>
            <Glyph name="search" />
          </Icon>
        }
        type="search"
      />
      <TextField
        aria-label="Search the catalog"
        placeholder="Search the catalog"
        size="lg"
        start={
          <Icon>
            <Glyph name="search" />
          </Icon>
        }
        type="search"
      />
    </Stack>
  );
}
