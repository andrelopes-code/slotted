import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Stack } from '@slotted/react/stack';
import { createToaster, ToastRegion } from '@slotted/react/toast';
import { Text } from '@slotted/react/typography';

/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastDismissal() {
  const [reason, setReason] = useState('none yet');

  return (
    <Stack align="start" gap={3}>
      <ToastRegion
        onToastsChange={(_toasts, request) => {
          if (request.reason !== 'programmatic') setReason(request.reason);
        }}
        toaster={toaster}
      />
      <Button onClick={() => toaster.show({ title: 'Draft saved', progress: true })}>
        Save draft
      </Button>
      <Text role="status" size="sm" tone="muted">
        Last departure: {reason}
      </Text>
    </Stack>
  );
}
