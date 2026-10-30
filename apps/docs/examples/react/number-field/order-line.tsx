import { useState } from 'react';
import { Grid } from '@slotted/react/grid';
import { Inline } from '@slotted/react/inline';
import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const USD = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });

const LINES = [
  { id: 'cabrales', product: 'Queso Cabrales', price: 14, stock: 22 },
  { id: 'hokkien', product: 'Singaporean Hokkien Fried Mee', price: 9.8, stock: 26 },
  { id: 'mozzarella', product: 'Mozzarella di Giovanni', price: 34.8, stock: 14 },
];

export default function NumberFieldOrderLine() {
  const [quantities, setQuantities] = useState<Record<string, number | null>>({
    cabrales: 12,
    hokkien: 10,
    mozzarella: 5,
  });

  const total = LINES.reduce((sum, line) => sum + line.price * (quantities[line.id] ?? 0), 0);

  return (
    <Stack gap={5}>
      <Stack gap={4}>
        {LINES.map((line) => (
          <Grid key={line.id} columns={3} gap={4} minItemWidth="xs">
            <Stack gap={1}>
              <Text weight="medium">{line.product}</Text>
              <Text size="sm" tone="muted">
                {USD.format(line.price)} each · {line.stock} in stock
              </Text>
            </Stack>
            <Stack justify="center">
              <NumberField
                aria-label={`Quantity of ${line.product}`}
                max={line.stock}
                min={0}
                onValueChange={(next) =>
                  setQuantities((current) => ({ ...current, [line.id]: next }))
                }
                size="sm"
                stepper="split"
                value={quantities[line.id] ?? null}
              />
            </Stack>
            <Stack justify="center">
              <Text align="end" numeric="tabular">
                {USD.format(line.price * (quantities[line.id] ?? 0))}
              </Text>
            </Stack>
          </Grid>
        ))}
      </Stack>
      <Inline gap={4} justify="between">
        <Text weight="semibold">Order total</Text>
        <Text numeric="tabular" weight="semibold">
          {USD.format(total)}
        </Text>
      </Inline>
    </Stack>
  );
}
