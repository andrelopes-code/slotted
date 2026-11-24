import { useState } from 'react';

import { Alert, AlertContent, AlertDescription, AlertTitle } from '@slotted/react/alert';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';

export default function AlertControlled() {
  const [open, setOpen] = useState(true);

  return (
    <Stack gap={4}>
      <Inline>
        <Button disabled={open} onClick={() => setOpen(true)} variant="outline">
          Show import summary
        </Button>
      </Inline>
      <Alert dismissible onOpenChange={setOpen} open={open} tone="success">
        <AlertContent>
          <AlertTitle>Import finished</AlertTitle>
          <AlertDescription>412 of 415 rows were added to the catalog.</AlertDescription>
        </AlertContent>
      </Alert>
    </Stack>
  );
}
