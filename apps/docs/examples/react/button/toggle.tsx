import { useState } from 'react';

import { IconButton, ToggleButton } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function ButtonToggle() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <Stack gap={2}>
      <Inline align="center" gap={2}>
        <ToggleButton onPressedChange={(pressed) => setAutoRefresh(pressed)} pressed={autoRefresh}>
          Auto-refresh
        </ToggleButton>
        <ToggleButton defaultPressed start={<Glyph name="pin" />}>
          Pin to dashboard
        </ToggleButton>
        <IconButton aria-label="Mark as priority" defaultPressed={false}>
          <Glyph name="star" />
        </IconButton>
      </Inline>
      <Text size="sm" tone="muted">
        {autoRefresh ? 'Balances refresh every 30 seconds.' : 'Balances refresh on demand.'}
      </Text>
    </Stack>
  );
}
