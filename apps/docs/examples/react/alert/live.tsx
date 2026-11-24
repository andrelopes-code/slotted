import { useState } from 'react';

import { Alert, AlertContent, AlertDescription, AlertTitle } from '@slotted/react/alert';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';

type Status = 'failed' | 'idle' | 'saved';

export default function AlertLive() {
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
      {status === 'saved' && (
        <Alert live="polite" tone="success">
          <AlertContent>
            <AlertTitle>Prices saved</AlertTitle>
            <AlertDescription>Changes to 214 products are live.</AlertDescription>
          </AlertContent>
        </Alert>
      )}
      {status === 'failed' && (
        <Alert live="assertive" tone="danger">
          <AlertContent>
            <AlertTitle>Connection lost</AlertTitle>
            <AlertDescription>Price changes are not being saved.</AlertDescription>
          </AlertContent>
        </Alert>
      )}
    </Stack>
  );
}
