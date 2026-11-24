import { Badge } from '@slotted/react/badge';
import { Card, CardBody } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

const WAREHOUSES = [
  { name: 'Rotterdam', units: '12,480 units on hand', status: 'Healthy', tone: 'success' },
  { name: 'Chicago', units: '8,215 units on hand', status: 'Low stock', tone: 'warning' },
  { name: 'Singapore', units: '3,902 units on hand', status: 'Delayed', tone: 'danger' },
  { name: 'Lisbon', units: '6,730 units on hand', status: 'Healthy', tone: 'success' },
  { name: 'Osaka', units: '5,118 units on hand', status: 'Audit due', tone: 'info' },
  { name: 'Denver', units: '2,044 units on hand', status: 'Opening soon', tone: 'secondary' },
] as const;

export default function GridBasic() {
  return (
    <Grid>
      {WAREHOUSES.map((warehouse) => (
        <Card key={warehouse.name}>
          <CardBody>
            <Stack gap={3}>
              <Heading level={2} size="md">
                {warehouse.name}
              </Heading>
              <Text size="sm" tone="muted">
                {warehouse.units}
              </Text>
              <Inline>
                <Badge tone={warehouse.tone}>{warehouse.status}</Badge>
              </Inline>
            </Stack>
          </CardBody>
        </Card>
      ))}
    </Grid>
  );
}
