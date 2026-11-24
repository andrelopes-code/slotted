import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

const SECTIONS = [
  { title: 'Payment method', value: 'Visa ending 4242' },
  { title: 'Billing address', value: '200 Harbor Street, Portland' },
  { title: 'Shipping method', value: 'Priority shipping, 2 days' },
] as const;

export default function StackNested() {
  return (
    <Card>
      <CardHeader>
        <Heading level={2} size="md">
          Order SO-10482
        </Heading>
      </CardHeader>
      <CardBody>
        <Stack gap={8}>
          {SECTIONS.map((section) => (
            <Stack key={section.title} gap={2}>
              <Text weight="semibold">{section.title}</Text>
              <Text tone="muted">{section.value}</Text>
            </Stack>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
}
