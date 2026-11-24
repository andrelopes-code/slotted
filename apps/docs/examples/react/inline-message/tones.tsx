import { InlineMessage } from '@slotted/react/inline-message';
import { Stack } from '@slotted/react/stack';

export default function InlineMessageTones() {
  return (
    <Stack gap={2}>
      <InlineMessage tone="secondary">Use the SKU printed on the shelf label.</InlineMessage>
      <InlineMessage tone="accent">Prices are shown in euros.</InlineMessage>
      <InlineMessage tone="info">Carrier rates were updated on Monday.</InlineMessage>
      <InlineMessage tone="success">Pickup scheduled for 09:30.</InlineMessage>
      <InlineMessage tone="warning">Only 4 units are left at this location.</InlineMessage>
      <InlineMessage tone="danger">This SKU is already registered.</InlineMessage>
    </Stack>
  );
}
