import { Field, FieldLabel } from '@slotted/react/field';
import { Grid } from '@slotted/react/grid';
import { NumberField, NumberFieldDefaultsProvider } from '@slotted/react/number-field';

export default function NumberFieldDefaults() {
  return (
    <NumberFieldDefaultsProvider size="sm" stepper="split" variant="subtle">
      <Grid gap={3} minItemWidth="xs">
        <Field>
          <FieldLabel>Cases</FieldLabel>
          <NumberField defaultValue={6} min={0} />
        </Field>
        <Field>
          <FieldLabel>Loose units</FieldLabel>
          <NumberField defaultValue={11} min={0} />
        </Field>
        <Field>
          <FieldLabel>Pallets</FieldLabel>
          <NumberField defaultValue={1} min={0} stepper="stacked" />
        </Field>
      </Grid>
    </NumberFieldDefaultsProvider>
  );
}
