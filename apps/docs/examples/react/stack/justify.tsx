import { Badge } from '@slotted/react/badge';
import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import { Stack } from '@slotted/react/stack';
import { Heading } from '@slotted/react/typography';

const JUSTIFIES = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;

export default function StackJustify() {
  return (
    <Grid columns={3} gap={4} minItemWidth="xs">
      {JUSTIFIES.map((justify) => (
        <Card key={justify}>
          <CardHeader>
            <Heading level={2} size="sm">
              justify {justify}
            </Heading>
          </CardHeader>
          <CardBody>
            <Stack align="start" gap={2} justify={justify} style={{ blockSize: '12rem' }}>
              <Badge tone="info">Packed</Badge>
              <Badge tone="warning">Shipped</Badge>
              <Badge tone="success">Delivered</Badge>
            </Stack>
          </CardBody>
        </Card>
      ))}
    </Grid>
  );
}
