import { Field, FieldLabel } from '@slotted/react/field';
import { Grid } from '@slotted/react/grid';
import { TextField } from '@slotted/react/text-field';

export default function FieldNarrow() {
  return (
    <Grid columns={2} minItemWidth="xs" gap={4}>
      <Field labelPlacement="side">
        <FieldLabel>City</FieldLabel>
        <TextField defaultValue="Seattle" />
      </Field>
      <Field labelPlacement="side">
        <FieldLabel>Postal code</FieldLabel>
        <TextField defaultValue="98104" />
      </Field>
    </Grid>
  );
}
