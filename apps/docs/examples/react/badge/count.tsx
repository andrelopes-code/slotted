import { Badge } from '@slotted/react/badge';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function BadgeCount() {
  return (
    <Stack gap={3}>
      <Inline align="center" gap={3}>
        <Badge count={4} tone="info" />
        <Text>Open orders</Text>
      </Inline>
      <Inline align="center" gap={3}>
        <Badge count={128} tone="warning" />
        <Text>Backorders, above the default ceiling of 99</Text>
      </Inline>
      <Inline align="center" gap={3}>
        <Badge count={1204} max={999} tone="warning" />
        <Text>Pallets in transit, ceiling of 999</Text>
      </Inline>
      <Inline align="center" gap={3}>
        <Badge count={1234567} locale="de-DE" max={false} tone="success" />
        <Text>Units shipped, no ceiling, de-DE digits</Text>
      </Inline>
      <Inline align="center" gap={3}>
        <Badge count={0} showZero tone="secondary" />
        <Text>Open returns, zero shown</Text>
      </Inline>
    </Stack>
  );
}
