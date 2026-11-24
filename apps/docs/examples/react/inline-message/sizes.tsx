import { InlineMessage } from '@slotted/react/inline-message';
import { Stack } from '@slotted/react/stack';

export default function InlineMessageSizes() {
  return (
    <Stack gap={3}>
      <InlineMessage size="sm" tone="danger">
        The reorder point must be a whole number.
      </InlineMessage>
      <InlineMessage size="md" tone="danger">
        The reorder point must be lower than the stock ceiling.
      </InlineMessage>
    </Stack>
  );
}
