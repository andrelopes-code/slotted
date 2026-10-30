import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import {
  Tooltip,
  TooltipArrow,
  type TooltipChangeRequest,
  TooltipContent,
  TooltipLayer,
  TooltipTrigger,
} from '@slotted/react/tooltip';
import { Text } from '@slotted/react/typography';

export default function TooltipKeyboard() {
  const [last, setLast] = useState('Tab to a button, then press Escape or Enter.');

  const report = (open: boolean, request: TooltipChangeRequest) =>
    setLast(`${open ? 'Opened' : 'Closed'} by ${request.reason}.`);

  return (
    <Stack gap={3}>
      <Inline gap={3} align="center">
        <Tooltip onOpenChange={report}>
          <TooltipTrigger
            render={(props) => (
              <Button {...props} variant="outline">
                Approve return
              </Button>
            )}
          />
          <TooltipLayer>
            <TooltipContent>Refunds $86.00 to Verde Kitchen and restocks 2 units.</TooltipContent>
            <TooltipArrow />
          </TooltipLayer>
        </Tooltip>
        <Tooltip onOpenChange={report}>
          <TooltipTrigger
            render={(props) => (
              <Button {...props} variant="outline">
                Reject return
              </Button>
            )}
          />
          <TooltipLayer>
            <TooltipContent>Ships the parcel back to the customer at their cost.</TooltipContent>
            <TooltipArrow />
          </TooltipLayer>
        </Tooltip>
      </Inline>
      <Text size="sm" tone="muted">
        {last}
      </Text>
    </Stack>
  );
}
