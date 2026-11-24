import { AspectRatio } from '@slotted/react/aspect-ratio';
import { Card, CardBody } from '@slotted/react/card';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function AspectRatioGrowth() {
  return (
    <Stack gap={4}>
      <AspectRatio ratio="video">
        <Card>
          <CardBody>
            <Text>Pickup window: 08:00 to 10:00.</Text>
          </CardBody>
        </Card>
      </AspectRatio>
      <AspectRatio ratio="video">
        <Card>
          <CardBody>
            <Text>
              Harbor Line moved the pickup for orders 20418 to 20431 from the morning window to the
              afternoon window because the vessel from Singapore docked six hours late. The
              Rotterdam warehouse holds the pallets on dock 4 until the carrier confirms the new
              slot. Customers with a delivery promise before Thursday receive an email with the new
              date, and the support team sees the same date on the order. Orders paid by transfer
              are released after the payment clears.
            </Text>
          </CardBody>
        </Card>
      </AspectRatio>
    </Stack>
  );
}
