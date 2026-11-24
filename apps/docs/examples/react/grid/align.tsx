import { Card, CardBody } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const ALIGNS = ['start', 'center', 'end', 'stretch'] as const;

const SHIPMENTS = [
  'Ships today.',
  'Waits for the carrier pickup window on Thursday afternoon.',
  'Held until payment clears and the customs check for the destination country finishes.',
] as const;

export default function GridAlign() {
  return (
    <Stack gap={6}>
      {ALIGNS.map((align) => (
        <Stack key={align} gap={3}>
          <Text size="sm" tone="muted">{`align: ${align}`}</Text>

          <Grid align={align} columns={3} gap={4} minItemWidth="xs">
            {SHIPMENTS.map((shipment) => (
              <Card key={shipment}>
                <CardBody>
                  <Text>{shipment}</Text>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}
