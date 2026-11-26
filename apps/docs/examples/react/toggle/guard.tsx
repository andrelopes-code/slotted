import { useState } from 'react';

import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Toggle } from '@slotted/react/toggle';
import { Text } from '@slotted/react/typography';

export default function ToggleGuard() {
  const [notice, setNotice] = useState('Locking freezes the entries of March 2026.');

  return (
    <Stack gap={2}>
      <Inline>
        <Toggle
          icon={<Glyph name="lock" />}
          onPressedChange={(pressed, request) => {
            if (pressed) {
              setNotice('March 2026 is locked.');
              return;
            }
            request.cancel();
            setNotice('A locked period is reopened by the finance approver.');
          }}
        >
          Lock period
        </Toggle>
      </Inline>
      <Text size="sm" tone="muted">
        {notice}
      </Text>
    </Stack>
  );
}
