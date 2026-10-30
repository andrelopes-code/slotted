import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';

export default function ButtonLoading() {
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);

  const sync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };
  const send = () => {
    setSending(true);
    setTimeout(() => setSending(false), 2000);
  };

  return (
    <Inline gap={2}>
      <Button
        loading={syncing}
        messages={{ loading: 'Syncing' }}
        onClick={sync}
        start={<Glyph name="rotate-ccw" />}
        tone="secondary"
        variant="outline"
      >
        Sync inventory
      </Button>
      <Button loading={sending} loadingDelay={300} messages={{ loading: 'Sending' }} onClick={send}>
        Send invoice
      </Button>
    </Inline>
  );
}
