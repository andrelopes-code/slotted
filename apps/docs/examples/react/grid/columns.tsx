import { Card, CardBody } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

const COUNTS = [2, 3, 4] as const;

const METRICS = [
  { label: 'Revenue', value: '$48,200' },
  { label: 'Refunds', value: '$1,940' },
  { label: 'Disputes', value: '7' },
  { label: 'Payouts', value: '$44,310' },
] as const;

export default function GridColumns() {
  return (
    <Stack gap={6}>
      {COUNTS.map((count) => (
        <Stack key={count} gap={3}>
          <Text size="sm" tone="muted">{`columns: ${count}`}</Text>

          <Grid columns={count} gap={4} minItemWidth="xs">
            {METRICS.map((metric) => (
              <Card key={metric.label}>
                <CardBody>
                  <Stack gap={1}>
                    <Text size="sm" tone="muted">
                      {metric.label}
                    </Text>
                    <Heading level={2} size="md">
                      {metric.value}
                    </Heading>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}
