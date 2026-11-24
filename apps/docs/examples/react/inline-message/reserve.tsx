import { Inline } from '@slotted/react/inline';
import { InlineMessage } from '@slotted/react/inline-message';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function InlineMessageReserve() {
  return (
    <Inline gap={4}>
      <Stack gap={2}>
        <TextField aria-label="Units, Rotterdam" defaultValue="120" />
        <InlineMessage reserve tone="danger" />
        <TextField aria-label="Reorder point, Rotterdam" defaultValue="40" />
      </Stack>
      <Stack gap={2}>
        <TextField aria-label="Units, Antwerp" defaultValue="900" />
        <InlineMessage reserve tone="danger">
          Order at most 500 units at once.
        </InlineMessage>
        <TextField aria-label="Reorder point, Antwerp" defaultValue="60" />
      </Stack>
    </Inline>
  );
}
