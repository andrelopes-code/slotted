import { useState } from 'react';

import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Toggle } from '@slotted/react/toggle';
import type { TogglePressedReason } from '@slotted/react/toggle';
import { Text } from '@slotted/react/typography';

export default function ToggleReason() {
  const [reason, setReason] = useState<TogglePressedReason | null>(null);

  return (
    <Stack gap={2}>
      <Inline>
        <Toggle
          icon={<Glyph name="rotate-cw" />}
          onPressedChange={(_pressed, request) => setReason(request.reason)}
        >
          Auto-refresh
        </Toggle>
      </Inline>
      <Text size="sm" tone="muted">
        {reason === null ? 'No change yet.' : `Last change: ${reason}.`}
      </Text>
    </Stack>
  );
}
