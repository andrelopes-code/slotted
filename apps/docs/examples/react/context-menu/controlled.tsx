import { useState } from 'react';
import { ContextMenu, ContextMenuTrigger } from '@slotted/react/context-menu';
import { MenuContent, MenuItem } from '@slotted/react/menu';
import type { MenuChangeRequest } from '@slotted/react/menu';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function ContextMenuControlled() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState('Closed');

  function handleOpenChange(next: boolean, request: MenuChangeRequest) {
    setOpen(next);
    setLast(`${next ? 'Opened' : 'Closed'} by ${request.reason}`);
  }

  return (
    <Stack gap={3}>
      <ContextMenu onOpenChange={handleOpenChange} open={open}>
        <ContextMenuTrigger tabIndex={0}>
          <Stack gap={1}>
            <Heading level={2} size="md">
              Purchase order PO-5521
            </Heading>
            <Text size="sm" tone="muted">
              Right-click, press Shift+F10, press Escape or click elsewhere.
            </Text>
          </Stack>
        </ContextMenuTrigger>
        <MenuContent>
          <MenuItem>Approve</MenuItem>
          <MenuItem>Request changes</MenuItem>
          <MenuItem>Send to supplier</MenuItem>
        </MenuContent>
      </ContextMenu>
      <Text size="sm" tone="muted">
        {last}
      </Text>
    </Stack>
  );
}
