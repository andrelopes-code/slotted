import { useState } from 'react';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@slotted/react/hover-card';
import type { HoverCardChangeRequest } from '@slotted/react/hover-card';
import {
  PopoverBody,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '@slotted/react/popover';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function HoverCardControlled() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('none');

  function handleOpenChange(next: boolean, request: HoverCardChangeRequest) {
    setOpen(next);
    setReason(request.reason);
  }

  return (
    <Stack gap={3}>
      <Text>
        Stock for order 10251 ships from the{' '}
        <HoverCard open={open} onOpenChange={handleOpenChange}>
          <HoverCardTrigger href="/warehouses/seattle">Seattle warehouse</HoverCardTrigger>
          <HoverCardContent>
            <PopoverHeader>
              <PopoverTitle>Seattle warehouse</PopoverTitle>
              <PopoverDescription>400 Pine Street, Dock 3</PopoverDescription>
            </PopoverHeader>
            <PopoverBody>
              <Text size="sm">Pickups close at 4:30 PM, Monday to Friday.</Text>
            </PopoverBody>
          </HoverCardContent>
        </HoverCard>
        .
      </Text>
      <Text size="sm" tone="muted">
        Card {open ? 'open' : 'closed'}. Last request: {reason}.
      </Text>
    </Stack>
  );
}
