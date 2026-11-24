import { Badge } from '@slotted/react/badge';
import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { Stack } from '@slotted/react/stack';
import { Heading } from '@slotted/react/typography';

const ALIGNS = ['start', 'center', 'end', 'stretch'] as const;

export default function StackAlign() {
  return (
    <Stack gap={4}>
      {ALIGNS.map((align) => (
        <Card key={align}>
          <CardHeader>
            <Heading level={2} size="sm">
              align {align}
            </Heading>
          </CardHeader>
          <CardBody>
            <Stack align={align} gap={2}>
              <Badge tone="info">Wholesale</Badge>
              <Badge tone="warning">Priority shipping</Badge>
              <Badge tone="secondary">Fragile</Badge>
            </Stack>
          </CardBody>
        </Card>
      ))}
    </Stack>
  );
}
