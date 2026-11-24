import { Divider } from '@slotted/react/divider';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function DividerAlign() {
  return (
    <Stack gap={3}>
      <Divider align="start" label="Today" />
      <Text size="sm">3 shipments left the Rotterdam warehouse.</Text>
      <Divider align="center" label="Yesterday" />
      <Text size="sm">5 shipments left, 1 was returned.</Text>
      <Divider align="end" label="Earlier this week" />
      <Text size="sm">11 shipments left, all delivered.</Text>
    </Stack>
  );
}
