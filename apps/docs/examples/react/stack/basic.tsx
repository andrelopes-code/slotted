import { Badge } from '@slotted/react/badge';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function StackBasic() {
  return (
    <Stack>
      <Heading level={2} size="md">
        Order SO-10482
      </Heading>
      <Text tone="muted">Placed by Maria Chen on March 4 for the Harbor Street store.</Text>
      <Inline gap={2}>
        <Badge tone="success">Shipped</Badge>
        <Badge tone="info">Wholesale</Badge>
      </Inline>
      <Text>Estimated delivery on March 9.</Text>
    </Stack>
  );
}
