import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { Divider } from '@slotted/react/divider';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function DividerDecorative() {
  return (
    <Stack gap={4}>
      {[false, true].map((decorative) => (
        <Card key={String(decorative)}>
          <CardHeader>
            <Heading level={2} size="sm">
              {decorative ? 'decorative' : 'Announced'}
            </Heading>
          </CardHeader>
          <CardBody>
            <Stack gap={3}>
              <Text>Order 20418 was packed.</Text>
              <Divider decorative={decorative} />
              <Text>Order 20418 was handed to the carrier.</Text>
              <Divider decorative={decorative} label="Delivery" />
              <Text>Order 20418 is due on Thursday.</Text>
            </Stack>
          </CardBody>
        </Card>
      ))}
    </Stack>
  );
}
