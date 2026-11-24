import { Field, FieldLabel } from '@slotted/react/field';
import { Grid } from '@slotted/react/grid';
import { TextField } from '@slotted/react/text-field';

export default function GridSpan() {
  return (
    <Grid columns={2} gap={6} minItemWidth="sm">
      <Field style={{ gridColumn: '1 / -1' }}>
        <FieldLabel>Company</FieldLabel>
        <TextField defaultValue="Northwind Traders" />
      </Field>

      <Field>
        <FieldLabel>Contact</FieldLabel>
        <TextField defaultValue="Priya Raman" />
      </Field>

      <Field>
        <FieldLabel>Phone</FieldLabel>
        <TextField defaultValue="+31 10 555 0142" />
      </Field>

      <Field>
        <FieldLabel>City</FieldLabel>
        <TextField defaultValue="Rotterdam" />
      </Field>

      <Field>
        <FieldLabel>Postal code</FieldLabel>
        <TextField defaultValue="3011 AB" />
      </Field>
    </Grid>
  );
}
