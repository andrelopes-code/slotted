import { Card, CardBody } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const GAPS = [0, 2, 6, 12] as const;

const ORDERS = ['SO-10482', 'SO-10483', 'SO-10484'] as const;

export default function GridGap() {
  return (
    <Stack gap={6}>
      {GAPS.map((gap) => (
        <Stack key={gap} gap={3}>
          <Text size="sm" tone="muted">{`gap: ${gap}`}</Text>

          <Grid columns={3} gap={gap} minItemWidth="xs">
            {ORDERS.map((order) => (
              <Card key={order}>
                <CardBody>
                  <Text numeric="tabular">{order}</Text>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}
