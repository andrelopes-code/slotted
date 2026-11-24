import { InlineMessage } from '@slotted/react/inline-message';
import { Stack } from '@slotted/react/stack';

export default function InlineMessageStates() {
  return (
    <Stack gap={2}>
      <InlineMessage loading>Checking the carrier rates…</InlineMessage>
      <InlineMessage disabled tone="danger">
        The address cannot be edited while the order ships.
      </InlineMessage>
      <InlineMessage disabled loading>
        Syncing stock counts…
      </InlineMessage>
    </Stack>
  );
}
