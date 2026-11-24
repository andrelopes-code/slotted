import { Badge } from '@slotted/react/badge';
import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Heading } from '@slotted/react/typography';

const JUSTIFIES = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;

export default function InlineJustify() {
  return (
    <Stack gap={4}>
      {JUSTIFIES.map((justify) => (
        <Card key={justify}>
          <CardHeader>
            <Heading level={2} size="sm">
              justify {justify}
            </Heading>
          </CardHeader>
          <CardBody>
            <Inline justify={justify}>
              <Badge tone="info">Packed</Badge>
              <Badge tone="warning">Shipped</Badge>
              <Badge tone="success">Delivered</Badge>
            </Inline>
          </CardBody>
        </Card>
      ))}
    </Stack>
  );
}
