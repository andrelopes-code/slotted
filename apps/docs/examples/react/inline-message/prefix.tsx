import { InlineMessage } from '@slotted/react/inline-message';
import { Stack } from '@slotted/react/stack';

export default function InlineMessagePrefix() {
  return (
    <Stack gap={2}>
      <InlineMessage tone="danger">Enter a valid tax ID.</InlineMessage>
      <InlineMessage prefix="Overdue:" tone="danger">
        Invoice 4822 was due on March 3.
      </InlineMessage>
      <InlineMessage prefix="" tone="danger">
        Error: the tax ID needs 9 digits.
      </InlineMessage>
    </Stack>
  );
}
