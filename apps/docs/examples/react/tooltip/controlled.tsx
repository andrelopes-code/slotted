import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipLayer,
  TooltipTrigger,
} from '@slotted/react/tooltip';
import { Text } from '@slotted/react/typography';

export default function TooltipControlled() {
  const [open, setOpen] = useState(false);

  return (
    <Stack gap={3}>
      <Inline gap={3} align="center">
        <Tooltip open={open} onOpenChange={setOpen}>
          <TooltipTrigger
            render={(props) => (
              <Button {...props} variant="outline">
                Same-day dispatch
              </Button>
            )}
          />
          <TooltipLayer>
            <TooltipContent>
              Orders placed before 2:00 PM Pacific leave Reno the same day.
            </TooltipContent>
            <TooltipArrow />
          </TooltipLayer>
        </Tooltip>
        <Button variant="ghost" onClick={() => setOpen(true)}>
          Show the cutoff
        </Button>
      </Inline>
      <Text size="sm" tone="muted">
        {open ? 'The cutoff hint is open.' : 'The cutoff hint is closed.'}
      </Text>
    </Stack>
  );
}
