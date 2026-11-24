import { Badge } from '@slotted/react/badge';
import { Card, CardBody } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

const BAYS = [
  { name: 'Bay 1', status: 'Full', tone: 'success' },
  { name: 'Bay 2', status: 'Half', tone: 'info' },
  { name: 'Bay 3', status: 'Low', tone: 'warning' },
  { name: 'Bay 4', status: 'Empty', tone: 'danger' },
] as const;

const ZONES = ['Zone A', 'Zone B'] as const;

export default function GridOwnWidth() {
  return (
    <Stack gap={6}>
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          Across the whole preview
        </Text>

        <Grid columns={4} gap={4} justify="start" minItemWidth="xs">
          {BAYS.map((bay) => (
            <Badge key={bay.name} tone={bay.tone}>{`${bay.name}: ${bay.status}`}</Badge>
          ))}
        </Grid>
      </Stack>

      <Stack gap={3}>
        <Text size="sm" tone="muted">
          The same grid inside two half-width cards
        </Text>

        <Grid columns={2} gap={6}>
          {ZONES.map((zone) => (
            <Card key={zone}>
              <CardBody>
                <Stack gap={3}>
                  <Heading level={2} size="md">
                    {zone}
                  </Heading>
                  <Grid columns={4} gap={4} justify="start" minItemWidth="xs">
                    {BAYS.map((bay) => (
                      <Badge key={bay.name} tone={bay.tone}>{`${bay.name}: ${bay.status}`}</Badge>
                    ))}
                  </Grid>
                </Stack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </Stack>
    </Stack>
  );
}
