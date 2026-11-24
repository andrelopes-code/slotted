import { Badge } from '@slotted/react/badge';
import { Button } from '@slotted/react/button';
import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

const ALIGNS = ['start', 'center', 'end', 'stretch'] as const;

export default function InlineAlign() {
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
            <Inline align={align}>
              <Text size="3xl" weight="semibold">
                14
              </Text>
              <Badge tone="warning">Late pickups</Badge>
              <Button tone="secondary" variant="outline">
                Review
              </Button>
            </Inline>
          </CardBody>
        </Card>
      ))}
    </Stack>
  );
}
