import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from '@slotted/react/popover';
import { Text } from '@slotted/react/typography';

export default function PopoverDismissal() {
  const [reason, setReason] = useState('not closed yet');

  return (
    <Inline align="center" gap={3}>
      <Popover
        onOpenChange={(open, request) => {
          if (!open) setReason(request.reason);
        }}
      >
        <PopoverTrigger
          render={(props) => (
            <Button {...props} tone="secondary" variant="outline">
              Delivery note
            </Button>
          )}
        />
        <PopoverLayer>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Order 10249 delivery note</PopoverTitle>
              <PopoverClose />
            </PopoverHeader>
            <PopoverBody>
              Leave at the loading dock behind Toms Spezialitäten. The gate closes at 6:00 PM.
            </PopoverBody>
          </PopoverContent>
          <PopoverArrow />
        </PopoverLayer>
      </Popover>
      <Text size="sm" tone="muted">
        Last closed by: {reason}
      </Text>
    </Inline>
  );
}
