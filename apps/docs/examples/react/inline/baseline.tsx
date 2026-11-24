import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

const ALIGNS = ['center', 'baseline'] as const;

export default function InlineBaseline() {
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
            <Inline align={align} gap={3}>
              <Text tone="muted">Open invoices</Text>
              <Text numeric="tabular" size="3xl" weight="semibold">
                $48,200
              </Text>
              <Text size="sm" tone="muted">
                across 14 customers
              </Text>
            </Inline>
          </CardBody>
        </Card>
      ))}
    </Stack>
  );
}
