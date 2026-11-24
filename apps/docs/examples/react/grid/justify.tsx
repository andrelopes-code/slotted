import { Card, CardBody } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const JUSTIFIES = ['start', 'center', 'end', 'stretch'] as const;

const ACTIONS = ['Ship', 'Hold for review', 'Return to supplier'] as const;

export default function GridJustify() {
  return (
    <Stack gap={6}>
      {JUSTIFIES.map((justify) => (
        <Stack key={justify} gap={3}>
          <Text size="sm" tone="muted">{`justify: ${justify}`}</Text>

          <Grid columns={3} gap={4} justify={justify} minItemWidth="xs">
            {ACTIONS.map((action) => (
              <Card key={action}>
                <CardBody>
                  <Text>{action}</Text>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}
