import { Field, FieldLabel } from '@slotted/react/field';
import { Glyph, Icon } from '@slotted/react/icon';
import { Kbd } from '@slotted/react/kbd';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function TextFieldAdornments() {
  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Unit price</FieldLabel>
        <TextField defaultValue="24.90" end="USD" inputMode="decimal" start="$" />
      </Field>
      <Field>
        <FieldLabel>Shipping weight</FieldLabel>
        <TextField defaultValue="1.25" end="kg" inputMode="decimal" />
      </Field>
      <Field>
        <FieldLabel>Storefront address</FieldLabel>
        <TextField defaultValue="shop.northwind.com" start="https://" />
      </Field>
      <TextField
        aria-label="Search orders"
        end={<Kbd>/</Kbd>}
        placeholder="Search orders"
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
