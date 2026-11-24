import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { InlineMessage } from '@slotted/react/inline-message';
import { Stack } from '@slotted/react/stack';

type Status = 'failed' | 'idle' | 'saved';

export default function InlineMessageLive() {
  const [status, setStatus] = useState<Status>('idle');

  return (
    <Stack gap={4}>
      <Inline gap={2}>
        <Button onClick={() => setStatus('saved')} variant="outline">
          Save prices
        </Button>
        <Button onClick={() => setStatus('failed')} variant="outline">
          Lose connection
        </Button>
      </Inline>
      <InlineMessage live="polite" reserve tone="success">
        {status === 'saved' ? 'Changes to 214 products are live.' : ''}
      </InlineMessage>
      <InlineMessage live="assertive" reserve tone="danger">
        {status === 'failed' ? 'Price changes are not being saved.' : ''}
      </InlineMessage>
    </Stack>
  );
}
