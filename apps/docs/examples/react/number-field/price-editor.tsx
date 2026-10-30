import { useState } from 'react';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Grid } from '@slotted/react/grid';
import { NumberField } from '@slotted/react/number-field';

const CURRENCY = { currency: 'USD', style: 'currency' } as const;

export default function NumberFieldPriceEditor() {
  const [cost, setCost] = useState<number | null>(175);
  const [markup, setMarkup] = useState<number | null>(0.5);

  const price =
    cost === null || markup === null ? null : Math.round(cost * (1 + markup) * 100) / 100;

  return (
    <Grid gap={4} minItemWidth="xs">
      <Field required>
        <FieldLabel>Unit cost</FieldLabel>
        <NumberField format={CURRENCY} min={0} onValueChange={setCost} step={0.5} value={cost} />
      </Field>
      <Field required>
        <FieldLabel>Markup</FieldLabel>
        <NumberField
          format={{ style: 'percent' }}
          largeStep={0.1}
          max={3}
          min={0}
          onValueChange={setMarkup}
          step={0.01}
          value={markup}
        />
      </Field>
      <Field readOnly>
        <FieldLabel>List price</FieldLabel>
        <NumberField format={CURRENCY} stepper="none" value={price} />
        <FieldDescription>Unit cost plus markup.</FieldDescription>
      </Field>
    </Grid>
  );
}
