import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { InlineMessage } from '@slotted/react/inline-message';
import { Stack } from '@slotted/react/stack';

type Check = 'checking' | 'done' | 'idle';

const SENTENCES: Record<Check, string> = {
  checking: 'Checking stock in Rotterdam…',
  done: '142 units in stock in Rotterdam.',
  idle: '',
};

export default function InlineMessagePending() {
  const [check, setCheck] = useState<Check>('idle');

  function handleCheck() {
    setCheck('checking');
    setTimeout(() => setCheck('done'), 1800);
  }

  return (
    <Stack gap={3}>
      <Inline gap={2}>
        <Button disabled={check === 'checking'} onClick={handleCheck} variant="outline">
          Check stock in Rotterdam
        </Button>
      </Inline>
      <InlineMessage
        live="polite"
        loading={check === 'checking'}
        reserve
        tone={check === 'done' ? 'success' : 'secondary'}
      >
        {SENTENCES[check]}
      </InlineMessage>
    </Stack>
  );
}
