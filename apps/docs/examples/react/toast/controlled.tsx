import { useState } from 'react';
import { Stack } from '@slotted/react/stack';
import { Button } from '@slotted/react/button';
import { ToastRegion, type ToastContentValue, type ToastMessage } from '@slotted/react/toast';
import { Text } from '@slotted/react/typography';

const FIRST: ToastMessage<ToastContentValue> = {
  id: 'import-118',
  duration: 0,
  priority: 'polite',
  announcement: 'Import 118 finished',
  loading: false,
  action: false,
  data: { title: 'Import 118 finished', tone: 'success' },
  status: 'visible',
  revision: 0,
};

export default function ToastControlled() {
  const [toasts, setToasts] = useState<readonly ToastMessage<ToastContentValue>[]>([FIRST]);

  return (
    <Stack align="start" gap={3}>
      <div style={{ blockSize: '9rem', inlineSize: '100%', position: 'relative' }}>
        <ToastRegion attach="inline" onToastsChange={(next) => setToasts(next)} toasts={toasts} />
      </div>
      <Button disabled={toasts.length > 0} variant="outline" onClick={() => setToasts([FIRST])}>
        Show again
      </Button>
      <Text size="sm" tone="muted">
        Messages in the queue: {toasts.length}
      </Text>
    </Stack>
  );
}
