import { Card, CardBody, CardFooter, CardHeader } from '@slotted/react/card';
import { Divider } from '@slotted/react/divider';
import { Heading, Text } from '@slotted/react/typography';

export default function CardDividers() {
  return (
    <Card>
      <CardHeader>
        <Heading level={2} size="md">
          Rotterdam warehouse
        </Heading>
        <Text size="sm" tone="muted">
          Pallet capacity
        </Text>
      </CardHeader>
      <Divider decorative />
      <CardBody>
        <Text>8,420 of 10,000 pallet positions are in use.</Text>
      </CardBody>
      <Divider decorative inset />
      <CardFooter>
        <Text size="sm" tone="muted">
          Counted on 24 November at 06:00.
        </Text>
      </CardFooter>
    </Card>
  );
}
