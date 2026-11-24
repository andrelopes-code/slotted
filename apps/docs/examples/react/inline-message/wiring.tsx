import { useId } from 'react';

import { InlineMessage } from '@slotted/react/inline-message';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

export default function InlineMessageWiring() {
  const messageId = useId();

  return (
    <Stack gap={2}>
      <TextField aria-errormessage={messageId} aria-label="EIN" defaultValue="12-345678" invalid />
      <InlineMessage id={messageId} tone="danger">
        The EIN has 8 digits and needs 9.
      </InlineMessage>
    </Stack>
  );
}
