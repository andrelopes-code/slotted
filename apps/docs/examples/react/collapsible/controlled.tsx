import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function CollapsibleControlled() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('none yet');

  return (
    <Stack gap={3}>
      <Inline gap={2}>
        <Button onClick={() => setOpen(true)} size="sm" variant="outline">
          Show pick list
        </Button>
        <Button onClick={() => setOpen(false)} size="sm" variant="outline">
          Hide pick list
        </Button>
      </Inline>

      <Collapsible
        onOpenChange={(next, request) => {
          setOpen(next);
          setReason(request.reason);
        }}
        open={open}
        variant="framed"
      >
        <CollapsibleHeader>
          <CollapsibleTrigger>Pick list for wave 12</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>42 lines across 9 orders, starting at aisle B.</CollapsiblePanel>
      </Collapsible>

      <Text size="sm" tone="muted">
        Reason of the last request from the trigger: {reason}.
      </Text>
    </Stack>
  );
}
