import { Field, FieldLabel } from '@slotted/react/field';
import { Grid } from '@slotted/react/grid';
import { NumberField, NumberFieldScrub } from '@slotted/react/number-field';

export default function NumberFieldScrubExample() {
  return (
    <Grid columns={2} gap={4}>
      <Field>
        <FieldLabel>Label width</FieldLabel>
        <NumberField
          defaultValue={100}
          end="mm"
          max={210}
          min={20}
          start={<NumberFieldScrub>W</NumberFieldScrub>}
        />
      </Field>
      <Field>
        <FieldLabel>Label height</FieldLabel>
        <NumberField
          defaultValue={150}
          end="mm"
          max={297}
          min={20}
          start={<NumberFieldScrub sensitivity={4}>H</NumberFieldScrub>}
        />
      </Field>
    </Grid>
  );
}
