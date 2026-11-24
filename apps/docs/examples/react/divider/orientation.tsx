import { Divider } from '@slotted/react/divider';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function DividerOrientation() {
  return (
    <Stack gap={6}>
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          horizontal
        </Text>
        <Text>42 open orders</Text>
        <Divider orientation="horizontal" />
        <Text>17 shipped today</Text>
      </Stack>
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          vertical
        </Text>
        <Inline gap={4}>
          <Text>42 open orders</Text>
          <Divider orientation="vertical" />
          <Text>17 shipped today</Text>
        </Inline>
      </Stack>
    </Stack>
  );
}
