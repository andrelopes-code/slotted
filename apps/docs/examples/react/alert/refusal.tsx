import { useState } from 'react';

import { Alert, AlertContent, AlertDescription, AlertTitle } from '@slotted/react/alert';
import { Stack } from '@slotted/react/stack';
import { Switch } from '@slotted/react/switch';

export default function AlertRefusal() {
  const [reviewed, setReviewed] = useState(false);

  return (
    <Stack gap={4}>
      <Switch checked={reviewed} onCheckedChange={setReviewed}>
        I reviewed the 12 price changes
      </Switch>
      <Alert
        dismissible
        onOpenChange={(_, request) => {
          if (!reviewed) request.cancel();
        }}
        tone="warning"
      >
        <AlertContent>
          <AlertTitle>12 price changes are waiting for approval</AlertTitle>
          <AlertDescription>The message stays until the changes are reviewed.</AlertDescription>
        </AlertContent>
      </Alert>
    </Stack>
  );
}
