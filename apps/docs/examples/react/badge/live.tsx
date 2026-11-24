import { useState } from 'react';
import { Badge } from '@slotted/react/badge';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function BadgeLive() {
  const [queued, setQueued] = useState(3);
  const [failed, setFailed] = useState(1);

  return (
    <Stack gap={4}>
      <Inline align="center" gap={3}>
        <Button onClick={() => setQueued(queued + 1)} size="sm" variant="outline">
          Queue order
        </Button>
        <Text>Queued</Text>
        <Badge count={queued} live="polite" tone="info" />
      </Inline>
      <Inline align="center" gap={3}>
        <Button onClick={() => setFailed(failed + 1)} size="sm" variant="outline">
          Fail payment
        </Button>
        <Text>Failed</Text>
        <Badge count={failed} live="assertive" tone="danger" />
      </Inline>
    </Stack>
  );
}
